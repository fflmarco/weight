import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FamilyMemberProfile, WeightEntry } from '../types';

let app;
export let db: Firestore | null = null;
export let isFirebaseConfigured = false;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  isFirebaseConfigured = true;
} catch (err) {
  console.warn('Firebase initialization failed, running in local-only mode:', err);
  isFirebaseConfigured = false;
}

/**
 * Remove undefined properties before passing to Firestore to avoid errors
 */
function sanitizeDoc<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export const PROFILES_COLLECTION = 'profiles';
export const ENTRIES_COLLECTION = 'entries';

/**
 * Subscribe in real-time to profiles in Firestore
 */
export function subscribeToProfiles(
  onData: (profiles: FamilyMemberProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const colRef = collection(db, PROFILES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const profiles: FamilyMemberProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        profiles.push({
          id: docSnap.id,
          name: data.name || '',
          relationship: data.relationship,
          avatarColor: data.avatarColor || 'bg-emerald-600',
          avatarIcon: data.avatarIcon || 'User',
          preferredUnit: data.preferredUnit || 'lbs',
          heightCm: data.heightCm,
          startingWeightLbs: Number(data.startingWeightLbs ?? 150),
          dateOfBirth: data.dateOfBirth,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort by creation time
      profiles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(profiles);
    },
    (err) => {
      console.error('Firestore profiles subscribe error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe in real-time to weight entries in Firestore
 */
export function subscribeToEntries(
  onData: (entries: WeightEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }

  const colRef = collection(db, ENTRIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const entries: WeightEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          profileId: data.profileId,
          date: data.date,
          time: data.time,
          timeOfDay: data.timeOfDay,
          weightLbs: Number(data.weightLbs),
          bodyFatPercentage: data.bodyFatPercentage !== undefined ? Number(data.bodyFatPercentage) : undefined,
          notes: data.notes,
          tags: Array.isArray(data.tags) ? data.tags : undefined,
          mood: data.mood,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      // Sort entries descending by date & creation time
      entries.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      onData(entries);
    },
    (err) => {
      console.error('Firestore entries subscribe error:', err);
      onError?.(err);
    }
  );
}

/**
 * Save or update a profile in Firestore
 */
export async function saveProfileToFirestore(profile: FamilyMemberProfile): Promise<void> {
  if (!db) return;
  const docRef = doc(db, PROFILES_COLLECTION, profile.id);
  await setDoc(docRef, sanitizeDoc(profile), { merge: true });
}

/**
 * Delete a profile and optionally its associated entries from Firestore
 */
export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, PROFILES_COLLECTION, profileId);
  await deleteDoc(docRef);

  // Also remove entries belonging to this profile
  try {
    const entriesSnap = await getDocs(collection(db, ENTRIES_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    entriesSnap.forEach((entryDoc) => {
      if (entryDoc.data().profileId === profileId) {
        batch.delete(entryDoc.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error('Error deleting profile entries:', err);
  }
}

/**
 * Save or update a weight entry in Firestore
 */
export async function saveEntryToFirestore(entry: WeightEntry): Promise<void> {
  if (!db) return;
  const docRef = doc(db, ENTRIES_COLLECTION, entry.id);
  await setDoc(docRef, sanitizeDoc(entry), { merge: true });
}

/**
 * Delete a single weight entry from Firestore
 */
export async function deleteEntryFromFirestore(entryId: string): Promise<void> {
  if (!db) return;
  const docRef = doc(db, ENTRIES_COLLECTION, entryId);
  await deleteDoc(docRef);
}

/**
 * Initial seed if cloud database has 0 profiles
 */
export async function seedInitialCloudData(
  initialProfiles: FamilyMemberProfile[],
  initialEntries: WeightEntry[]
): Promise<boolean> {
  if (!db) return false;
  try {
    const snap = await getDocs(collection(db, PROFILES_COLLECTION));
    if (snap.size > 0) {
      return false; // Database already populated
    }

    const batch = writeBatch(db);
    for (const prof of initialProfiles) {
      const pRef = doc(db, PROFILES_COLLECTION, prof.id);
      batch.set(pRef, sanitizeDoc(prof));
    }

    for (const ent of initialEntries) {
      const eRef = doc(db, ENTRIES_COLLECTION, ent.id);
      batch.set(eRef, sanitizeDoc(ent));
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
    return false;
  }
}

/**
 * Overwrite or import batch data into Firestore
 */
export async function replaceAllFirestoreData(
  profiles: FamilyMemberProfile[],
  entries: WeightEntry[]
): Promise<void> {
  if (!db) return;

  // Fetch and delete existing docs in batches
  const existingProfiles = await getDocs(collection(db, PROFILES_COLLECTION));
  const existingEntries = await getDocs(collection(db, ENTRIES_COLLECTION));

  const deleteBatch = writeBatch(db);
  existingProfiles.forEach((d) => deleteBatch.delete(d.ref));
  existingEntries.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  // Write new docs
  // Batch limit in Firestore is 500 operations
  const chunkSize = 400;
  const allDocs = [
    ...profiles.map((p) => ({ col: PROFILES_COLLECTION, id: p.id, data: sanitizeDoc(p) })),
    ...entries.map((e) => ({ col: ENTRIES_COLLECTION, id: e.id, data: sanitizeDoc(e) })),
  ];

  for (let i = 0; i < allDocs.length; i += chunkSize) {
    const chunk = allDocs.slice(i, i + chunkSize);
    const writeChunkBatch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, item.col, item.id);
      writeChunkBatch.set(ref, item.data);
    });
    await writeChunkBatch.commit();
  }
}
