import React from 'react';
import { 
  Users, Plus, Pencil, Flame, X 
} from 'lucide-react';
import { FamilyMemberProfile, WeightUnit, WeightStats } from '../types';
import { AvatarIcon } from './AvatarIcon';
import { convertWeight } from '../utils/calculations';
import { ModernScale } from './ModernScale';

interface ProfileSidebarProps {
  profiles: FamilyMemberProfile[];
  activeProfileId: string;
  activeView: 'individual' | 'family';
  onSelectProfile: (id: string) => void;
  onSelectFamilyView: () => void;
  onAddProfile: () => void;
  onEditProfile: (profile: FamilyMemberProfile) => void;
  memberStats: Record<string, WeightStats>;
  unit: WeightUnit;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenLogModal: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profiles,
  activeProfileId,
  activeView,
  onSelectProfile,
  onSelectFamilyView,
  onAddProfile,
  onEditProfile,
  memberStats,
  unit,
  isOpenMobile,
  onCloseMobile,
  onOpenLogModal,
}) => {
  // Desktop 6% Compact Sidebar Content
  const desktopContent = (
    <div className="flex flex-col h-full items-center text-center w-full">
      {/* Overview Button */}
      <div className="w-full pb-1 mb-1 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center">
        <button
          id="sidebar-view-family"
          onClick={onSelectFamilyView}
          title="Team & Group Overview"
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeView === 'family'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className={`w-8 h-8 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center mb-1 ${
            activeView === 'family' ? 'bg-slate-800 dark:bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            <Users className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
          <span className="text-[11px] xl:text-xs font-semibold truncate w-full">Overview</span>
        </button>
      </div>

      {/* Add Profile Button */}
      <div className="w-full flex items-center justify-center py-1 mb-1">
        <button
          id="sidebar-btn-add-profile"
          onClick={onAddProfile}
          title="Add new profile"
          className="w-full inline-flex items-center justify-center gap-1 text-[11px] xl:text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 py-1 px-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Profiles Vertical Rail */}
      <div id="sidebar-profiles-scroll" className="w-full flex-1 overflow-y-auto space-y-1.5 pr-0.5 sidebar-scrollbar scrollbar-thin">
        {profiles.map((prof) => {
          const isSelected = activeView === 'individual' && prof.id === activeProfileId;
          const stats = memberStats[prof.id];
          const currentWeight = stats 
            ? convertWeight(stats.currentWeightLbs, unit) 
            : convertWeight(prof.startingWeightLbs, unit);

          return (
            <div
              key={prof.id}
              className={`group relative w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-transparent transition-all ${
                isSelected
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 shadow-2xs ring-1 ring-emerald-300/80 dark:ring-emerald-600/40'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              }`}
            >
              <button
                id={`sidebar-profile-item-${prof.id}`}
                onClick={() => onSelectProfile(prof.id)}
                title={`${prof.name}: ${currentWeight.toFixed(1)} ${unit}`}
                className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer min-w-0"
              >
                <div className="relative shrink-0 mb-1">
                  <AvatarIcon
                    iconName={prof.avatarIcon}
                    colorClass={prof.avatarColor}
                    className="w-8 h-8 xl:w-9 xl:h-9"
                    size={16}
                  />
                  {stats && stats.streakDays > 0 && (
                    <span 
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] shadow-2xs"
                      title={`${stats.streakDays} day streak`}
                    >
                      <Flame className="w-2 h-2 fill-white" />
                    </span>
                  )}
                </div>

                <span className={`text-[11px] xl:text-xs leading-tight truncate w-full px-0.5 ${
                  isSelected ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'
                }`}>
                  {prof.name}
                </span>

                <span className="text-[10px] xl:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                  {unit === 'kg' ? Number(currentWeight.toFixed(2)) : currentWeight.toFixed(1)}
                </span>
              </button>

              {/* Edit Profile button */}
              <button
                id={`sidebar-edit-profile-${prof.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProfile(prof);
                }}
                title={`Edit ${prof.name}'s profile`}
                aria-label={`Edit profile for ${prof.name}`}
                className={`absolute top-1 right-1 p-0.5 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Log Weight CTA */}
      <div className="w-full pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-800">
        <button
          id="sidebar-btn-log-weight"
          onClick={onOpenLogModal}
          title="Log Weight"
          className="w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] xl:text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <ModernScale className="w-4 h-4" />
          <span>Log</span>
        </button>
      </div>
    </div>
  );

  // Mobile Drawer Full Content
  const mobileDrawerContent = (
    <div className="flex flex-col h-full">
      {/* Top View Selector */}
      <div className="space-y-1 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <button
          id="mobile-sidebar-view-family"
          onClick={() => {
            onSelectFamilyView();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeView === 'family'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeView === 'family' ? 'bg-slate-800 dark:bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block font-semibold">Overview</span>
              <span className={`text-[11px] ${activeView === 'family' ? 'text-slate-300' : 'text-slate-400'}`}>
                {profiles.length} {profiles.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>
          {activeView === 'family' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* Profiles Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1.5">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Profiles
        </span>
        <button
          id="mobile-sidebar-btn-add-profile"
          onClick={() => {
            onAddProfile();
            onCloseMobile();
          }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Profiles List */}
      <div id="mobile-sidebar-profiles-scroll" className="flex-1 overflow-y-auto space-y-1 pr-0.5 sidebar-scrollbar scrollbar-thin">
        {profiles.map((prof) => {
          const isSelected = activeView === 'individual' && prof.id === activeProfileId;
          const stats = memberStats[prof.id];
          const currentWeight = stats 
            ? convertWeight(stats.currentWeightLbs, unit) 
            : convertWeight(prof.startingWeightLbs, unit);
          const diff = stats ? convertWeight(stats.totalChangeLbs, unit) : 0;

          return (
            <div
              key={prof.id}
              className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-600/60 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-200/80 dark:hover:border-slate-700'
              }`}
            >
              <button
                id={`mobile-sidebar-profile-item-${prof.id}`}
                onClick={() => {
                  onSelectProfile(prof.id);
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer py-0.5"
              >
                <div className="relative shrink-0">
                  <AvatarIcon
                    iconName={prof.avatarIcon}
                    colorClass={prof.avatarColor}
                    className="w-9 h-9"
                    size={16}
                  />
                  {stats && stats.streakDays > 0 && (
                    <span 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-2xs"
                      title={`${stats.streakDays} day streak`}
                    >
                      <Flame className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className={`text-xs truncate block ${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                    {prof.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {unit === 'kg' ? Number(currentWeight.toFixed(2)) : currentWeight.toFixed(1)} {unit}
                    </span>
                    {diff !== 0 && (
                      <span className={`text-[10px] font-medium ${diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {diff > 0 ? `+${unit === 'kg' ? Number(diff.toFixed(2)) : diff.toFixed(1)}` : (unit === 'kg' ? Number(diff.toFixed(2)) : diff.toFixed(1))}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Edit Profile button */}
              <button
                id={`mobile-sidebar-edit-profile-${prof.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProfile(prof);
                  onCloseMobile();
                }}
                title={`Edit ${prof.name}'s profile`}
                aria-label={`Edit profile for ${prof.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          id="mobile-sidebar-btn-log-weight"
          onClick={() => {
            onOpenLogModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs transition-all cursor-pointer"
        >
          <ModernScale className="w-3.5 h-3.5" />
          <span>Log</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (6% width) */}
      <aside 
        id="desktop-profile-sidebar"
        className="hidden md:flex flex-col w-[6%] min-w-[64px] xl:min-w-[70px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 xl:p-1.5 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] self-start transition-colors duration-200 z-10"
      >
        {desktopContent}
      </aside>

      {/* Mobile Drawer (Backdrop + Slide-out) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          
          {/* Slide-out panel */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl p-4 flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white">
                  <ModernScale className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Profiles</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 min-h-0">
              {mobileDrawerContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
