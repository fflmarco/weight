import React, { useState, useEffect } from 'react';
import { 
  X, Check, Trash2, User, UserPlus, 
  Sparkles, Ruler 
} from 'lucide-react';
import { FamilyMemberProfile, WeightUnit } from '../types';
import { AVAILABLE_COLORS, AVAILABLE_ICONS, AvatarIcon } from './AvatarIcon';
import { convertWeight, kgToLbs, lbsToKg } from '../utils/calculations';
import { ModernScale } from './ModernScale';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    profile: FamilyMemberProfile, 
    isNew: boolean, 
    logEntry?: { weightLbs: number; date: string }
  ) => void;
  onDelete?: (profileId: string) => void;
  editingProfile?: FamilyMemberProfile | null;
  currentWeightLbs?: number;
  unit: WeightUnit;
  totalProfilesCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProfile,
  currentWeightLbs,
  unit,
  totalProfilesCount,
}) => {
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-emerald-600');
  const [avatarIcon, setAvatarIcon] = useState('User');
  const [startingWeightStr, setStartingWeightStr] = useState('180');
  const [heightCmStr, setHeightCmStr] = useState('175');
  const [currentWeightStr, setCurrentWeightStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [recordLogEntry, setRecordLogEntry] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setCurrentDateStr(today);

      if (editingProfile) {
        setName(editingProfile.name);
        setAvatarColor(editingProfile.avatarColor);
        setAvatarIcon(editingProfile.avatarIcon);
        const startDisp = convertWeight(editingProfile.startingWeightLbs, unit);
        setStartingWeightStr(Number(startDisp.toFixed(2)).toString());
        setHeightCmStr(editingProfile.heightCm ? String(editingProfile.heightCm) : '175');

        const currDisp = currentWeightLbs !== undefined 
          ? convertWeight(currentWeightLbs, unit) 
          : startDisp;
        setCurrentWeightStr(Number(currDisp.toFixed(2)).toString());
        setRecordLogEntry(false);
      } else {
        setName('');
        setAvatarColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)].bgClass);
        setAvatarIcon('Heart');
        const defaultWeight = unit === 'lbs' ? '180' : '82';
        setStartingWeightStr(defaultWeight);
        setCurrentWeightStr(defaultWeight);
        setHeightCmStr('175');
        setRecordLogEntry(true);
      }
    }
  }, [isOpen, editingProfile, currentWeightLbs, unit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a name for this profile');
      return;
    }

    const startVal = parseFloat(startingWeightStr);
    const heightVal = parseFloat(heightCmStr);

    if (isNaN(startVal) || startVal <= 0) {
      alert('Please enter a valid starting weight');
      return;
    }

    const startingWeightLbs = unit === 'kg' ? kgToLbs(startVal) : startVal;

    const profileData: FamilyMemberProfile = {
      id: editingProfile ? editingProfile.id : `prof-${Date.now()}`,
      name: name.trim(),
      avatarColor,
      avatarIcon,
      preferredUnit: unit,
      heightCm: !isNaN(heightVal) && heightVal > 0 ? heightVal : undefined,
      startingWeightLbs: Number(startingWeightLbs.toFixed(4)),
      createdAt: editingProfile ? editingProfile.createdAt : new Date().toISOString(),
    };

    let logEntry: { weightLbs: number; date: string } | undefined;
    if (recordLogEntry) {
      const currVal = parseFloat(currentWeightStr);
      if (!isNaN(currVal) && currVal > 0) {
        const currLbs = unit === 'kg' ? kgToLbs(currVal) : currVal;
        logEntry = {
          weightLbs: Number(currLbs.toFixed(4)),
          date: currentDateStr || new Date().toISOString().split('T')[0],
        };
      }
    }

    onSave(profileData, !editingProfile, logEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="modal-profile-management"
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto transition-colors duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              {editingProfile ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              {editingProfile ? 'Edit Member' : 'New Member'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Preview & Name Input */}
          <div className="flex items-center gap-3">
            <AvatarIcon
              iconName={avatarIcon}
              colorClass={avatarColor}
              className="w-12 h-12"
              size={20}
            />
            <div className="grow">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Name
              </label>
              <input
                id="input-profile-name"
                type="text"
                required
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setAvatarColor(c.bgClass)}
                  className={`w-6 h-6 rounded-full ${c.bgClass} flex items-center justify-center transition-transform cursor-pointer ${
                    avatarColor === c.bgClass ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                >
                  {avatarColor === c.bgClass && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Icon Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {AVAILABLE_ICONS.map((i) => {
                const IconComp = i.icon;
                const isSelected = avatarIcon.toLowerCase() === i.name.toLowerCase();
                return (
                  <button
                    key={i.name}
                    type="button"
                    onClick={() => setAvatarIcon(i.name)}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="text-[9px] truncate max-w-[36px]">{i.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baseline Weight & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-starting-weight" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Starting Weight ({unit})
              </label>
              <input
                id="input-starting-weight"
                type="number"
                step="0.01"
                min="1"
                required
                value={startingWeightStr}
                onChange={(e) => setStartingWeightStr(e.target.value)}
                placeholder="50.25"
                className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="input-height-cm" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Height (cm, for Asian BMI)
              </label>
              <input
                id="input-height-cm"
                type="number"
                step="1"
                placeholder="175"
                value={heightCmStr}
                onChange={(e) => setHeightCmStr(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Profile Record Log: Current Weight & Current Date */}
          <div id="section-profile-record-log" className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ModernScale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Profile Record Log
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                <input
                  id="checkbox-record-log-entry"
                  type="checkbox"
                  checked={recordLogEntry}
                  onChange={(e) => setRecordLogEntry(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="font-medium">Log entry</span>
              </label>
            </div>

            {recordLogEntry && (
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label htmlFor="input-profile-current-weight" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Current Weight ({unit})
                  </label>
                  <input
                    id="input-profile-current-weight"
                    type="number"
                    step="0.01"
                    min="1"
                    required={recordLogEntry}
                    value={currentWeightStr}
                    onChange={(e) => setCurrentWeightStr(e.target.value)}
                    placeholder={startingWeightStr || '50.25'}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-profile-current-date" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Current Date
                    </label>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                      Default: Today
                    </span>
                  </div>
                  <input
                    id="input-profile-current-date"
                    type="date"
                    required={recordLogEntry}
                    value={currentDateStr}
                    onChange={(e) => setCurrentDateStr(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Records this weigh-in with current date directly into the member's log history.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {editingProfile && totalProfilesCount > 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete profile "${editingProfile.name}"?`)) {
                    onDelete?.(editingProfile.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-submit-profile"
                type="submit"
                className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white px-4 py-2 text-xs font-medium rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingProfile ? 'Save' : 'Add'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
