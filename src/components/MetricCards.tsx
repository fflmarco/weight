import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingDown, TrendingUp, Plus, Activity, 
  Flame, Calendar, HeartPulse, ChevronRight, Check,
  Target, Sparkles, Info, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FamilyMemberProfile, WeightStats, WeightUnit, WeightEntry } from '../types';
import { convertWeight, kgToLbs, formatDateToMMDDYYYY } from '../utils/calculations';
import { ModernScale } from './ModernScale';

interface MetricCardsProps {
  profile: FamilyMemberProfile;
  stats: WeightStats;
  unit: WeightUnit;
  onSaveEntry: (entryData: Partial<WeightEntry>, isEdit: boolean) => void;
  onOpenLogModal?: () => void;
  onEditProfile?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ 
  profile, 
  stats, 
  unit, 
  onSaveEntry,
  onOpenLogModal,
  onEditProfile 
}) => {
  const current = convertWeight(stats.currentWeightLbs, unit);
  const changeVsLastLog = convertWeight(stats.changeVsLastLogLbs, unit);
  const minWeight = convertWeight(stats.minWeightLbs, unit);

  // In-card quick record log state
  const [cardWeight, setCardWeight] = useState<string>('');
  const [cardDate, setCardDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // BMI info popover state
  const [showBmiInfo, setShowBmiInfo] = useState<boolean>(false);
  const bmiInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bmiInfoRef.current && !bmiInfoRef.current.contains(event.target as Node)) {
        setShowBmiInfo(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBmiInfo(false);
      }
    };
    if (showBmiInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBmiInfo]);

  // Sync weight text box with current member's weight and selected unit
  useEffect(() => {
    const currDisp = convertWeight(stats.currentWeightLbs, unit);
    setCardWeight(unit === 'kg' ? Number(currDisp.toFixed(2)).toString() : currDisp.toFixed(1));
  }, [profile.id, stats.currentWeightLbs, unit]);

  // Reset calendar date to current date whenever active profile switches
  useEffect(() => {
    setCardDate(new Date().toISOString().split('T')[0]);
  }, [profile.id]);

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cardWeight);
    if (isNaN(val) || val <= 0) return;

    const weightLbs = unit === 'kg' ? kgToLbs(val) : val;
    const chosenDate = cardDate || new Date().toISOString().split('T')[0];

    onSaveEntry({
      id: `entry-${Date.now()}`,
      profileId: profile.id,
      date: chosenDate,
      weightLbs: Number(weightLbs.toFixed(2)),
      createdAt: new Date().toISOString(),
    }, false);

    setIsSavedRecently(true);
    try {
      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2000);
  };

  // WHO Asian BMI Category Styling & Thresholds
  const getAsianBmiBadge = (category: string | null, bmi: number | null) => {
    if (!category || bmi === null) {
      return { 
        label: 'Set Height', 
        bg: 'bg-slate-100 dark:bg-slate-800', 
        text: 'text-slate-600 dark:text-slate-400', 
        border: 'border-slate-200 dark:border-slate-700' 
      };
    }
    switch (category) {
      case 'Normal':
        return { 
          label: 'Normal', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/60', 
          text: 'text-emerald-700 dark:text-emerald-300', 
          border: 'border-emerald-200 dark:border-emerald-800' 
        };
      case 'Underweight':
        return { 
          label: 'Underweight', 
          bg: 'bg-amber-50 dark:bg-amber-950/60', 
          text: 'text-amber-700 dark:text-amber-300', 
          border: 'border-amber-200 dark:border-amber-800' 
        };
      case 'Overweight':
        return { 
          label: 'Overweight', 
          bg: 'bg-orange-50 dark:bg-orange-950/60', 
          text: 'text-orange-700 dark:text-orange-300', 
          border: 'border-orange-200 dark:border-orange-800' 
        };
      case 'Obese':
        return { 
          label: 'Obese', 
          bg: 'bg-rose-50 dark:bg-rose-950/60', 
          text: 'text-rose-700 dark:text-rose-300', 
          border: 'border-rose-200 dark:border-rose-800' 
        };
      default:
        return { 
          label: category, 
          bg: 'bg-slate-100 dark:bg-slate-800', 
          text: 'text-slate-700 dark:text-slate-300', 
          border: 'border-slate-200 dark:border-slate-700' 
        };
    }
  };

  const asianBmi = getAsianBmiBadge(stats.bmiCategory, stats.bmi);

  const BMI_BRACKETS = [
    { 
      label: 'Underweight', 
      range: '< 18.5', 
      categoryKey: 'Underweight', 
      dotColor: 'bg-amber-400',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
    },
    { 
      label: 'Normal (Target)', 
      range: '18.5 – 22.9', 
      categoryKey: 'Normal', 
      dotColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
    },
    { 
      label: 'Overweight', 
      range: '23.0 – 24.9', 
      categoryKey: 'Overweight', 
      dotColor: 'bg-orange-400',
      badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800' 
    },
    { 
      label: 'Obese', 
      range: '≥ 25.0', 
      categoryKey: 'Obese', 
      dotColor: 'bg-rose-500',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
    },
  ];

  // Format last weighed date (MM-DD-YYYY)
  const lastWeighedDisplay = React.useMemo(() => {
    if (!stats.lastWeighedDate) return 'No entries yet';
    const formatted = formatDateToMMDDYYYY(stats.lastWeighedDate);
    const todayStr = new Date().toISOString().split('T')[0];
    if (stats.lastWeighedDate === todayStr) return `Today (${formatted})`;
    return `Last: ${formatted}`;
  }, [stats.lastWeighedDate]);

  // Healthy weight range display for Asian BMI
  const healthyRangeText = React.useMemo(() => {
    if (!stats.healthyWeightRangeLbs) return null;
    const minVal = convertWeight(stats.healthyWeightRangeLbs.min, unit);
    const maxVal = convertWeight(stats.healthyWeightRangeLbs.max, unit);
    return `${minVal.toFixed(1)} – ${maxVal.toFixed(1)} ${unit}`;
  }, [stats.healthyWeightRangeLbs, unit]);

  // Motivation text and required change to reach target guideline weight range
  const motivationGoal = React.useMemo(() => {
    if (!stats.healthyWeightRangeLbs || !profile.heightCm) {
      return {
        label: 'Target Range',
        detail: 'Add height to see guideline range',
        motto: 'Keep it up! ✨',
        colorClass: 'text-slate-600 dark:text-slate-300',
        isNormal: false,
      };
    }

    const { min, max } = stats.healthyWeightRangeLbs;
    const currentWeight = stats.currentWeightLbs;

    // Above standard range: distance to upper bound (BMI 22.9)
    if (currentWeight > max) {
      const diffLbs = currentWeight - max;
      const diffConverted = convertWeight(diffLbs, unit);
      const diffStr = unit === 'kg' ? Number(diffConverted.toFixed(2)) : diffConverted.toFixed(1);
      return {
        label: `-${diffStr} ${unit} to target range`,
        detail: `${diffStr} ${unit} to reach standard guideline range`,
        motto: "You've got this! 💪",
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        isNormal: false,
      };
    }

    // Below standard range: distance to lower bound (BMI 18.5)
    if (currentWeight < min) {
      const diffLbs = min - currentWeight;
      const diffConverted = convertWeight(diffLbs, unit);
      const diffStr = unit === 'kg' ? Number(diffConverted.toFixed(2)) : diffConverted.toFixed(1);
      return {
        label: `+${diffStr} ${unit} to target range`,
        detail: `${diffStr} ${unit} to reach standard guideline range`,
        motto: 'Stay strong! 🥑',
        colorClass: 'text-amber-600 dark:text-amber-400',
        isNormal: false,
      };
    }

    // Within standard guideline weight range
    return {
      label: 'Within target range',
      detail: 'Weight is within standard guideline range',
      motto: 'Keep it up! 🌟',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      isNormal: true,
    };
  }, [stats.healthyWeightRangeLbs, stats.currentWeightLbs, profile.heightCm, unit]);

  return (
    <div id="metrics-overview-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      
      {/* 1st Card: Quick Log */}
      <div 
        id="card-log-new-weight" 
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Log Weight
            </span>
            <div className="flex items-center gap-1.5">
              {stats.streakDays > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {stats.streakDays}d
                </span>
              )}
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <ModernScale className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveRecord} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                id="card-input-weight"
                type="number"
                step="0.1"
                min="1"
                required
                value={cardWeight}
                onChange={(e) => setCardWeight(e.target.value)}
                placeholder={`${current.toFixed(1)} ${unit}`}
                title={`Weight (${unit})`}
                aria-label={`Weight in ${unit}`}
                className="w-full px-2.5 py-1.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition-all"
              />

              <input
                id="card-input-date"
                type="date"
                required
                value={cardDate}
                onChange={(e) => setCardDate(e.target.value)}
                title="Date"
                aria-label="Weigh-in date"
                className="w-full px-2 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>

            <button
              id="btn-card-save-record"
              type="submit"
              className={`w-full py-1.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                isSavedRecently
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSavedRecently ? 'Saved' : 'Save'}</span>
            </button>
          </form>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px]">{lastWeighedDisplay}</span>
          <span className="text-[11px]">{stats.entriesCount} logged</span>
        </div>
      </div>

      {/* 2nd Card: Current Weight */}
      <div 
        id="card-current-weight" 
        className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <ModernScale className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1 mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {unit === 'kg' ? Number(current.toFixed(2)) : current.toFixed(1)}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400">{unit}</span>
            </div>

            {/* Change badge */}
            <span
              id="badge-change-vs-last-log"
              title="Change vs last log"
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                changeVsLastLog < 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : changeVsLastLog > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {changeVsLastLog < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : changeVsLastLog > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : null}
              <span>
                {changeVsLastLog > 0 ? '+' : ''}{unit === 'kg' ? Number(changeVsLastLog.toFixed(2)) : changeVsLastLog.toFixed(1)} {unit}
              </span>
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span>Range: </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {unit === 'kg' ? Number(minWeight.toFixed(2)) : minWeight.toFixed(1)} – {unit === 'kg' ? Number(convertWeight(stats.maxWeightLbs, unit).toFixed(2)) : convertWeight(stats.maxWeightLbs, unit).toFixed(1)} {unit}
            </span>
          </div>
        </div>

        <div 
          id="footer-card-health-motivation"
          title={motivationGoal.detail}
          className="text-xs pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
        >
          <span className="text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1.5 min-w-0">
            {motivationGoal.isNormal ? (
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
            <span className="truncate">{motivationGoal.label}</span>
          </span>
          <span className={`font-semibold shrink-0 text-[11px] sm:text-xs ${motivationGoal.colorClass}`}>
            {motivationGoal.motto}
          </span>
        </div>
      </div>

      {/* 3rd Card: BMI */}
      <div 
        id="card-asian-bmi" 
        className="relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <div className="flex items-center gap-1.5" ref={bmiInfoRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                BMI
              </span>
              <button
                type="button"
                id="btn-bmi-info"
                onClick={() => setShowBmiInfo((prev) => !prev)}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="View BMI brackets"
                title="View BMI brackets"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {/* BMI Brackets Popover */}
              {showBmiInfo && (
                <div 
                  id="popover-bmi-brackets"
                  className="absolute left-3 right-3 sm:left-4 sm:right-auto top-12 sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3.5 z-40 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        BMI Brackets
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        WHO Asian Population Criteria
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-close-bmi-popover"
                      onClick={() => setShowBmiInfo(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {BMI_BRACKETS.map((bracket) => {
                      const isCurrent = stats.bmiCategory === bracket.categoryKey;
                      return (
                        <div
                          key={bracket.label}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                            isCurrent
                              ? `${bracket.badgeClass} font-semibold ring-1 ring-emerald-500/40`
                              : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${bracket.dotColor}`} />
                            <span>{bracket.label}</span>
                            {isCurrent && (
                              <span className="text-[9.5px] px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            {bracket.range}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {stats.bmi !== null && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Your BMI: <strong className="text-slate-900 dark:text-white font-bold">{stats.bmi.toFixed(1)}</strong></span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{stats.bmiCategory || 'Normal'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-800 flex items-center justify-center text-violet-700 dark:text-violet-300">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1 mb-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {stats.bmi ? stats.bmi.toFixed(1) : '--'}
            </span>

            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${asianBmi.bg} ${asianBmi.text} ${asianBmi.border}`}>
              {asianBmi.label}
            </span>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
            <span>Target: </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {healthyRangeText || '18.5 – 22.9'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          {profile.heightCm ? (
            <span>Height: {profile.heightCm} cm</span>
          ) : (
            <button
              type="button"
              onClick={onEditProfile}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Add height</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
