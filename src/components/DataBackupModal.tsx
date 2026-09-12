import React, { useRef, useState } from 'react';
import { 
  X, Download, Upload, RefreshCw, FileText, 
  Database, ShieldCheck, Check, Cloud, CheckCircle2 
} from 'lucide-react';
import { FamilyMemberProfile, WeightEntry, WeightUnit } from '../types';
import { convertWeight } from '../utils/calculations';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: FamilyMemberProfile[];
  entries: WeightEntry[];
  unit: WeightUnit;
  onImportData: (profiles: FamilyMemberProfile[], entries: WeightEntry[]) => void;
  onResetData: () => void;
  onForceSyncToCloud?: () => Promise<void>;
  syncStatus?: 'connected' | 'syncing' | 'offline';
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  profiles,
  entries,
  unit,
  onImportData,
  onResetData,
  onForceSyncToCloud,
  syncStatus = 'connected',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleCloudSync = async () => {
    if (!onForceSyncToCloud) return;
    try {
      setIsSyncingCloud(true);
      await onForceSyncToCloud();
      setSyncSuccessMessage('Synced to Firebase Firestore successfully!');
      setTimeout(() => setSyncSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to sync to Firebase Cloud.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profiles,
      entries,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_weight_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Profile Name', 'Date', 'Time', 'TimeOfDay', `Weight (${unit})`, 'Notes', 'Mood'];
    const profileMap = new Map<string, FamilyMemberProfile>(profiles.map((p) => [p.id, p]));

    const rows = entries.map((e) => {
      const prof = profileMap.get(e.profileId);
      const displayWeight = convertWeight(e.weightLbs, unit);
      return [
        `"${prof?.name || 'Unknown'}"`,
        `"${e.date}"`,
        `"${e.time || ''}"`,
        `"${e.timeOfDay || ''}"`,
        displayWeight.toFixed(1),
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${e.mood || ''}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_weight_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.profiles) && Array.isArray(parsed.entries)) {
          onImportData(parsed.profiles, parsed.entries);
          alert(`Successfully restored ${parsed.profiles.length} profiles and ${parsed.entries.length} weight records!`);
          onClose();
        } else {
          alert('Invalid backup file format. Expected "profiles" and "entries" arrays.');
        }
      } catch (err) {
        alert('Failed to parse backup file. Please ensure it is a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="modal-backup-management"
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors duration-200"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Backup & Data
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Firebase Cloud Sync Status Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Firebase Firestore
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                      Live Cloud Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-saved across family profiles and weight logs
                  </p>
                </div>
              </div>
            </div>

            {onForceSyncToCloud && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  {syncSuccessMessage || (isSyncingCloud ? 'Syncing data to cloud...' : 'Sync current local state to cloud')}
                </span>
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncingCloud}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Export section */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
              Export
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
              Import
            </span>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Import JSON</span>
            </button>
          </div>

          {/* Reset section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">Reset</span>
            <button
              onClick={() => {
                if (window.confirm('Reset data to sample?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
