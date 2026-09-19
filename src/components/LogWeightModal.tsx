import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeightEntry, FamilyMemberProfile, WeightUnit } from '../types';
import { convertWeight, kgToLbs } from '../utils/calculations';
import { ModernScale } from './ModernScale';

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<WeightEntry>, isEdit: boolean) => void;
  profiles: FamilyMemberProfile[];
  entries?: WeightEntry[];
  activeProfileId: string;
  initialEntry?: WeightEntry | null;
  unit: WeightUnit;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profiles,
  entries = [],
  activeProfileId,
  initialEntry,
  unit,
}) => {
  const [profileId, setProfileId] = useState<string>(activeProfileId);
  const [weightValue, setWeightValue] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Helper to compute member's latest recorded weight
  const getLatestWeightDisplay = useCallback((targetId: string): string => {
    const prof = profiles.find((p) => p.id === targetId);
    if (!prof) return unit === 'lbs' ? '160.00' : '70.00';

    const memberEntries = entries.filter((e) => e.profileId === targetId);
    if (memberEntries.length > 0) {
      const sorted = [...memberEntries].sort(
        (a, b) => new Date(b.date + (b.time ? 'T' + b.time : 'T00:00:00')).getTime() -
                  new Date(a.date + (a.time ? 'T' + a.time : 'T00:00:00')).getTime()
      );
      const converted = convertWeight(sorted[0].weightLbs, unit);
      return Number(converted.toFixed(2)).toString();
    }
    const startConverted = convertWeight(prof.startingWeightLbs, unit);
    return Number(startConverted.toFixed(2)).toString();
  }, [profiles, entries, unit]);

  useEffect(() => {
    if (isOpen) {
      if (initialEntry) {
        setProfileId(initialEntry.profileId);
        const displayWeight = convertWeight(initialEntry.weightLbs, unit);
        setWeightValue(Number(displayWeight.toFixed(2)).toString());
        setDate(initialEntry.date);
        setNotes(initialEntry.notes || '');
      } else {
        const currentTargetId = profiles.some((p) => p.id === activeProfileId)
          ? activeProfileId
          : (profiles[0]?.id || '');
        setProfileId(currentTargetId);

        // Pre-fill with current date as default
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setNotes('');

        // Pre-fill with member's current weight
        setWeightValue(getLatestWeightDisplay(currentTargetId));
      }
    }
  }, [isOpen, initialEntry, activeProfileId, unit, profiles, getLatestWeightDisplay]);

  if (!isOpen) return null;

  const targetProfile = profiles.find((p) => p.id === profileId) || profiles[0];

  const handleSelectProfile = (newId: string) => {
    setProfileId(newId);
    if (!initialEntry) {
      setWeightValue(getLatestWeightDisplay(newId));
    }
  };

  const handleAdjustWeight = (delta: number) => {
    const num = parseFloat(weightValue) || 0;
    const updated = Math.max(1, num + delta);
    setWeightValue(Number(updated.toFixed(2)).toString());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(weightValue);
    if (!parsedWeight || isNaN(parsedWeight) || parsedWeight <= 0) {
      return;
    }

    // Convert to canonical lbs
    const weightLbs = unit === 'kg' ? kgToLbs(parsedWeight) : parsedWeight;

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }

    const payload: Partial<WeightEntry> = {
      id: initialEntry ? initialEntry.id : `entry-${Date.now()}`,
      profileId,
      date: date || todayStr,
      weightLbs: Number(weightLbs.toFixed(4)),
      notes: notes.trim() || undefined,
      createdAt: initialEntry ? initialEntry.createdAt : new Date().toISOString(),
    };

    onSave(payload, !!initialEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        id="modal-log-weight"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ModernScale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">
                {initialEntry ? 'Edit Weight Record' : 'Record Weight Log'}
              </h3>
              {targetProfile && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Weigh-in log for {targetProfile.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Member selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Member Profile
            </label>
            <div className="flex flex-wrap gap-1.5">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProfile(p.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    profileId === p.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Current Weight input with text box & quick steppers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-current-weight" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current Weight ({unit})
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Type directly or fine-tune
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <button
                id="btn-adjust-weight-minus"
                type="button"
                onClick={() => handleAdjustWeight(-0.5)}
                title="Decrease 0.5"
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                id="input-current-weight"
                type="number"
                step="0.01"
                min="1"
                required
                autoFocus
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                placeholder="50.25"
                className="grow text-center text-3xl font-bold tracking-tight bg-transparent text-slate-900 dark:text-white focus:outline-hidden py-1"
              />

              <button
                id="btn-adjust-weight-plus"
                type="button"
                onClick={() => handleAdjustWeight(0.5)}
                title="Increase 0.5"
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Current Date with default indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-current-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Current Date
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Default: Today
                </span>
                {date !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    className="text-[11px] font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              id="input-current-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Note (Optional) */}
          <div>
            <label htmlFor="input-entry-notes" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Note (optional)
            </label>
            <input
              id="input-entry-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. morning, workout, fasting"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-weigh-in"
              type="submit"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialEntry ? 'Save Changes' : 'Record Weigh-In'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
