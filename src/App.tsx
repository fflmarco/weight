/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ProfileSidebar } from './components/ProfileSidebar';
import { MetricCards } from './components/MetricCards';
import { WeightChart } from './components/WeightChart';
import { WeeklyDeltaChart } from './components/WeeklyDeltaChart';
import { HistoryTable } from './components/HistoryTable';
import { FamilyOverview } from './components/FamilyOverview';
import { LogWeightModal } from './components/LogWeightModal';
import { ProfileModal } from './components/ProfileModal';
import { DataBackupModal } from './components/DataBackupModal';
import { FamilyMemberProfile, WeightEntry, WeightUnit, WeightStats } from './types';
import { INITIAL_PROFILES, INITIAL_ENTRIES } from './data/seedData';
import { calculateStats, formatWeight } from './utils/calculations';
import { ModernScale } from './components/ModernScale';
import { AvatarIcon } from './components/AvatarIcon';
import { Flame, Pencil } from 'lucide-react';
import {
  subscribeToProfiles,
  subscribeToEntries,
  saveProfileToFirestore,
  deleteProfileFromFirestore,
  saveEntryToFirestore,
  deleteEntryFromFirestore,
  seedInitialCloudData,
  replaceAllFirestoreData,
  isFirebaseConfigured,
} from './lib/firebase';

const STORAGE_KEY_PROFILES = 'fwt_profiles_v2';
const STORAGE_KEY_ENTRIES = 'fwt_entries_v2';
const STORAGE_KEY_UNIT = 'fwt_unit_v2';
const STORAGE_KEY_ACTIVE_PROFILE = 'fwt_active_profile_v2';
const STORAGE_KEY_THEME = 'fwt_theme_v1';

export default function App() {
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // Ignore
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Profiles state
  const [profiles, setProfiles] = useState<FamilyMemberProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROFILES;
  });

  // Entries state
  const [entries, setEntries] = useState<WeightEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_ENTRIES;
  });

  // Active profile ID
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
      if (saved && profiles.some((p) => p.id === saved)) return saved;
    } catch {
      // Fallback
    }
    return profiles[0]?.id || INITIAL_PROFILES[0]?.id || 'USR_1779760598710';
  });

  // Global Unit preference (lbs or kg)
  const [globalUnit, setGlobalUnit] = useState<WeightUnit>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNIT) as WeightUnit;
      if (saved === 'lbs' || saved === 'kg') return saved;
    } catch {
      // Fallback
    }
    return 'kg';
  });

  // Active View (Individual vs Family snapshot)
  const [activeView, setActiveView] = useState<'individual' | 'family'>('individual');

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyMemberProfile | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch {
      // Ignore
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch {
      // Ignore
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, activeProfileId);
    } catch {
      // Ignore
    }
  }, [activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIT, globalUnit);
    } catch {
      // Ignore
    }
  }, [globalUnit]);

  // Firebase Firestore Realtime synchronization
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');

    // Attempt to seed initial sample data if cloud database is empty
    seedInitialCloudData(INITIAL_PROFILES, INITIAL_ENTRIES).catch((err) => {
      console.warn('Initial cloud seed check:', err);
    });

    const unsubProfiles = subscribeToProfiles(
      (cloudProfiles) => {
        if (cloudProfiles && cloudProfiles.length > 0) {
          setProfiles(cloudProfiles);
        }
        setSyncStatus('connected');
      },
      (err) => {
        console.error('Failed to sync profiles from Firestore:', err);
        setSyncStatus('offline');
      }
    );

    const unsubEntries = subscribeToEntries(
      (cloudEntries) => {
        if (cloudEntries) {
          setEntries(cloudEntries);
        }
        setSyncStatus('connected');
      },
      (err) => {
        console.error('Failed to sync entries from Firestore:', err);
        setSyncStatus('offline');
      }
    );

    return () => {
      unsubProfiles();
      unsubEntries();
    };
  }, []);

  // Ensure active profile exists
  useEffect(() => {
    if (!profiles.some((p) => p.id === activeProfileId) && profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, activeProfileId]);

  // Compute stats for all members
  const memberStats = useMemo(() => {
    const statsMap: Record<string, WeightStats> = {};
    profiles.forEach((prof) => {
      const profEntries = entries.filter((e) => e.profileId === prof.id);
      statsMap[prof.id] = calculateStats(prof, profEntries);
    });
    return statsMap;
  }, [profiles, entries]);

  // Active profile & entries
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const activeEntries = useMemo(() => {
    if (!activeProfile) return [];
    return entries.filter((e) => e.profileId === activeProfile.id);
  }, [entries, activeProfile]);

  const activeStats = activeProfile ? memberStats[activeProfile.id] : undefined;

  // Handlers for logging entries
  const handleOpenNewLog = () => {
    setEditingEntry(null);
    setIsLogModalOpen(true);
  };

  const handleEditEntry = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setIsLogModalOpen(true);
  };

  const handleSaveEntry = async (entryData: Partial<WeightEntry>, isEdit: boolean) => {
    const targetId = entryData.id || `entry-${Date.now()}`;
    const fullEntry: WeightEntry = isEdit
      ? { ...(entries.find((e) => e.id === targetId) || {}), ...entryData } as WeightEntry
      : { ...entryData, id: targetId } as WeightEntry;

    // Optimistic local update
    if (isEdit) {
      setEntries((prev) =>
        prev.map((e) => (e.id === targetId ? fullEntry : e))
      );
    } else {
      setEntries((prev) => [fullEntry, ...prev]);
    }

    // Save to Cloud Firestore
    try {
      setSyncStatus('syncing');
      await saveEntryToFirestore(fullEntry);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to persist entry to Firestore:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    // Optimistic local update
    setEntries((prev) => prev.filter((e) => e.id !== entryId));

    // Delete from Cloud Firestore
    try {
      setSyncStatus('syncing');
      await deleteEntryFromFirestore(entryId);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to delete entry from Firestore:', err);
    }
  };

  // Handlers for Profiles
  const handleAddNewProfile = () => {
    setEditingProfile(null);
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = (profile: FamilyMemberProfile) => {
    setEditingProfile(profile);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (
    profileData: FamilyMemberProfile, 
    isNew: boolean,
    logEntry?: { weightLbs: number; date: string }
  ) => {
    // Optimistic local update
    if (isNew) {
      setProfiles((prev) => [...prev, profileData]);
      setActiveProfileId(profileData.id);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileData.id ? profileData : p))
      );
    }

    let newEntry: WeightEntry | undefined;
    if (logEntry) {
      newEntry = {
        id: `entry-${Date.now()}`,
        profileId: profileData.id,
        date: logEntry.date,
        weightLbs: logEntry.weightLbs,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [newEntry!, ...prev]);
    }

    // Save to Cloud Firestore
    try {
      setSyncStatus('syncing');
      await saveProfileToFirestore(profileData);
      if (newEntry) {
        await saveEntryToFirestore(newEntry);
      }
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to save profile to Firestore:', err);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    // Optimistic local update
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    setEntries((prev) => prev.filter((e) => e.profileId !== profileId));

    // Delete from Cloud Firestore
    try {
      setSyncStatus('syncing');
      await deleteProfileFromFirestore(profileId);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to delete profile from Firestore:', err);
    }
  };

  // Unit toggle
  const handleToggleUnit = () => {
    setGlobalUnit((prev) => (prev === 'lbs' ? 'kg' : 'lbs'));
  };

  // Import & Reset Data
  const handleImportData = async (newProfiles: FamilyMemberProfile[], newEntries: WeightEntry[]) => {
    setProfiles(newProfiles);
    setEntries(newEntries);
    if (newProfiles.length > 0) {
      setActiveProfileId(newProfiles[0].id);
    }

    try {
      setSyncStatus('syncing');
      await replaceAllFirestoreData(newProfiles, newEntries);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to import data to Firestore:', err);
    }
  };

  const handleResetData = async () => {
    setProfiles(INITIAL_PROFILES);
    setEntries(INITIAL_ENTRIES);
    setActiveProfileId(INITIAL_PROFILES[0].id);

    try {
      setSyncStatus('syncing');
      await replaceAllFirestoreData(INITIAL_PROFILES, INITIAL_ENTRIES);
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to reset Firestore data:', err);
    }
  };

  const handleForceSyncToCloud = async () => {
    setSyncStatus('syncing');
    await replaceAllFirestoreData(profiles, entries);
    setSyncStatus('connected');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-200">
      
      {/* App Header */}
      <Navbar
        activeView={activeView}
        globalUnit={globalUnit}
        onToggleUnit={handleToggleUnit}
        onOpenLogModal={handleOpenNewLog}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        activeMemberName={activeProfile?.name}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        syncStatus={syncStatus}
      />

      {/* Main Container with Sidebar and Content */}
      <div className="flex-1 flex w-full">
        {/* Profiles Sidebar */}
        <ProfileSidebar
          profiles={profiles}
          activeProfileId={activeProfileId}
          activeView={activeView}
          onSelectProfile={(id) => {
            setActiveProfileId(id);
            setActiveView('individual');
          }}
          onSelectFamilyView={() => setActiveView('family')}
          onAddProfile={handleAddNewProfile}
          onEditProfile={handleEditProfile}
          memberStats={memberStats}
          unit={globalUnit}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenLogModal={handleOpenNewLog}
        />

        {/* Dashboard Main Content Area */}
        <main className="flex-1 min-w-0 md:w-[94%] w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6">
          <div className="w-full max-w-[2100px] mx-auto space-y-6">
            {activeView === 'individual' ? (
              /* Individual Member Dashboard */
              activeProfile && activeStats ? (
                <div className="space-y-6">
                  {/* 0. Active Member Status Banner */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <AvatarIcon
                          iconName={activeProfile.avatarIcon}
                          colorClass={activeProfile.avatarColor}
                          className="w-12 h-12 sm:w-14 sm:h-14"
                          size={24}
                        />
                        {activeStats.streakDays > 0 && (
                          <span
                            title={`${activeStats.streakDays} day logging streak`}
                            className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center gap-0.5 shadow-2xs"
                          >
                            <Flame className="w-2.5 h-2.5 fill-white" />
                            {activeStats.streakDays}d
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {activeProfile.name}
                          </h1>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {activeProfile.relationship || 'Member'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          {activeProfile.heightCm && (
                            <span>
                              Height: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeProfile.heightCm} cm</strong>
                            </span>
                          )}
                          <span>
                            Started: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{formatWeight(activeProfile.startingWeightLbs, globalUnit)}</strong>
                          </span>
                          <span>
                            Entries: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeStats.entriesCount} logs</strong>
                          </span>
                          {activeStats.lastWeighedDate && (
                            <span>
                              Last weighed: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeStats.lastWeighedDate}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                      <button
                        onClick={() => handleEditProfile(activeProfile)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={handleOpenNewLog}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <ModernScale className="w-3.5 h-3.5" />
                        <span>Log Weight</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 1. Key Metrics Cards */}
                  <MetricCards
                    profile={activeProfile}
                    stats={activeStats}
                    unit={globalUnit}
                    onSaveEntry={handleSaveEntry}
                    onOpenLogModal={handleOpenNewLog}
                    onEditProfile={() => handleEditProfile(activeProfile)}
                  />

                  {/* 2. Interactive Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
                    {/* Primary Trajectory Area Chart (2 cols on lg) */}
                    <div className="lg:col-span-2 h-full">
                      <WeightChart
                        profile={activeProfile}
                        entries={activeEntries}
                        unit={globalUnit}
                        theme={theme}
                      />
                    </div>

                    {/* Secondary Delta Momentum Chart (1 col on lg) */}
                    <div className="lg:col-span-1 h-full">
                      <WeeklyDeltaChart
                        profile={activeProfile}
                        entries={activeEntries}
                        unit={globalUnit}
                        theme={theme}
                      />
                    </div>
                  </div>

                  {/* 3. Filterable Log Activity History Table */}
                  <HistoryTable
                    profile={activeProfile}
                    entries={activeEntries}
                    unit={globalUnit}
                    onEditEntry={handleEditEntry}
                    onDeleteEntry={handleDeleteEntry}
                    onAddNew={handleOpenNewLog}
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-200">
                  <ModernScale className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No profile selected</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Add your first family member to start tracking</p>
                  <button
                    onClick={handleAddNewProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>
              )
            ) : (
              /* Family Combined Overview & Comparative Charts */
              <FamilyOverview
                profiles={profiles}
                entries={entries}
                memberStats={memberStats}
                unit={globalUnit}
                onSelectProfile={(id) => {
                  setActiveProfileId(id);
                  setActiveView('individual');
                }}
                onAddMember={handleAddNewProfile}
                onOpenLogModal={handleOpenNewLog}
                theme={theme}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 sm:px-6 lg:px-8 xl:px-10 text-xs text-slate-400 dark:text-slate-500 mt-auto transition-colors duration-200">
        <div className="w-full max-w-[2100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <ModernScale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Family Tracker</span>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Backup & Reset
          </button>
        </div>
      </footer>

      {/* Modals */}
      <LogWeightModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        profiles={profiles}
        entries={entries}
        activeProfileId={activeProfileId}
        initialEntry={editingEntry}
        unit={globalUnit}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        editingProfile={editingProfile}
        currentWeightLbs={editingProfile ? memberStats[editingProfile.id]?.currentWeightLbs : undefined}
        unit={globalUnit}
        totalProfilesCount={profiles.length}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        profiles={profiles}
        entries={entries}
        unit={globalUnit}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onForceSyncToCloud={handleForceSyncToCloud}
        syncStatus={syncStatus}
      />

    </div>
  );
}
