import React from 'react';
import { Menu, Plus, DownloadCloud, Sun, Moon, Cloud, CloudCheck, RefreshCw } from 'lucide-react';
import { WeightUnit } from '../types';
import { ModernScale } from './ModernScale';

interface NavbarProps {
  activeView: 'individual' | 'family';
  globalUnit: WeightUnit;
  onToggleUnit: () => void;
  onOpenLogModal: () => void;
  onOpenBackupModal: () => void;
  onToggleMobileSidebar: () => void;
  activeMemberName?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  syncStatus?: 'connected' | 'syncing' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  globalUnit,
  onToggleUnit,
  onOpenLogModal,
  onOpenBackupModal,
  onToggleMobileSidebar,
  activeMemberName,
  theme,
  onToggleTheme,
  syncStatus = 'connected',
}) => {
  return (
    <header id="app-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full max-w-[2100px] mx-auto flex items-center justify-between h-14 sm:h-16">
          
          {/* Left: Mobile menu toggle & Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-mobile-sidebar-toggle"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Open profiles sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 dark:bg-emerald-950/70 border border-emerald-500 dark:border-emerald-700/50 flex items-center justify-center text-white shadow-xs shadow-emerald-600/20">
                <ModernScale className="w-4.5 h-4.5 text-white dark:text-emerald-400" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight hidden xs:inline-block">
                Family Weight
              </span>
            </div>
          </div>

          {/* Center: Current Active View Badge & Firebase Cloud Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {activeView === 'family' ? 'Family' : activeMemberName || 'Personal'}
              </span>
            </div>

            {/* Firebase Cloud status indicator */}
            <div 
              id="firebase-cloud-status-badge"
              title={syncStatus === 'syncing' ? 'Syncing to Firebase Firestore...' : 'Live sync with Firebase Firestore'}
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Syncing</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Firebase Cloud</span>
                </>
              )}
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark/Light Theme Toggle Button */}
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Unit Toggle Button */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                id="unit-toggle-lbs"
                type="button"
                onClick={() => globalUnit !== 'lbs' && onToggleUnit()}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  globalUnit === 'lbs'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                lbs
              </button>
              <button
                id="unit-toggle-kg"
                type="button"
                onClick={() => globalUnit !== 'kg' && onToggleUnit()}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  globalUnit === 'kg'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                kg
              </button>
            </div>

            {/* Backup / Export Icon Button */}
            <button
              id="btn-backup-data"
              onClick={onOpenBackupModal}
              title="Backup & Export"
              className="hidden sm:inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
            </button>

            {/* Quick Log CTA */}
            <button
              id="btn-quick-log-weight"
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

