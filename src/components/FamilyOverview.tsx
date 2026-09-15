import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { FamilyMemberProfile, WeightEntry, WeightUnit, WeightStats } from '../types';
import { AvatarIcon } from './AvatarIcon';
import { convertWeight, formatDateToMMDDYYYY } from '../utils/calculations';
import { Flame } from 'lucide-react';

interface FamilyOverviewProps {
  profiles: FamilyMemberProfile[];
  entries: WeightEntry[];
  memberStats: Record<string, WeightStats>;
  unit: WeightUnit;
  onSelectProfile: (id: string) => void;
  onAddMember: () => void;
  onOpenLogModal: () => void;
  theme?: 'light' | 'dark';
}

const LINE_COLORS = ['#10b981', '#f43f5e', '#0284c7', '#f59e0b', '#8b5cf6', '#14b8a6'];

export const FamilyOverview: React.FC<FamilyOverviewProps> = ({
  profiles,
  entries,
  memberStats,
  unit,
  onSelectProfile,
  onAddMember,
  onOpenLogModal,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#f1f5f9';
  const axisStroke = isDark ? '#475569' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  // Aggregate family stats
  const aggregateStats = useMemo(() => {
    let totalLbsLost = 0;
    let totalEntries = entries.length;
    let maxStreak = 0;

    profiles.forEach((p) => {
      const s = memberStats[p.id];
      if (s) {
        if (s.totalChangeLbs < 0) {
          totalLbsLost += Math.abs(s.totalChangeLbs);
        }
        if (s.streakDays > maxStreak) {
          maxStreak = s.streakDays;
        }
      }
    });

    return {
      totalConvertedLost: convertWeight(totalLbsLost, unit),
      totalEntries,
      maxStreak,
      memberCount: profiles.length,
    };
  }, [profiles, entries, memberStats, unit]);

  // Build comparative timeline data across members
  // Collect all unique dates from entries, sorted chronologically
  const comparativeChartData = useMemo(() => {
    const datesSet = new Set<string>();
    entries.forEach((e) => datesSet.add(e.date));
    const sortedDates = Array.from(datesSet).sort();

    // Map each date with each member's latest known weight up to that date
    // Or interpolate
    const memberRecentWeights: Record<string, number | null> = {};
    profiles.forEach((p) => {
      memberRecentWeights[p.id] = null;
    });

    // Group entries by date
    const entriesByDate: Record<string, WeightEntry[]> = {};
    entries.forEach((e) => {
      if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
      entriesByDate[e.date].push(e);
    });

    return sortedDates.map((dateStr) => {
      const dayEntries = entriesByDate[dateStr] || [];
      dayEntries.forEach((e) => {
        memberRecentWeights[e.profileId] = convertWeight(e.weightLbs, unit);
      });

      const point: Record<string, any> = {
        date: dateStr,
        displayDate: new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      };

      profiles.forEach((p) => {
        point[p.name] = memberRecentWeights[p.id];
      });

      return point;
    });
  }, [profiles, entries, unit]);

  return (
    <div id="family-snapshot-view" className="space-y-6">
      
      {/* Family Summary Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Family
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogModal}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              + Log
            </button>
            <button
              onClick={onAddMember}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all border border-white/15 cursor-pointer"
            >
              + Member
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/10">
          <div>
            <span className="text-xs text-slate-400">Total Lost</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5">
              {aggregateStats.totalConvertedLost.toFixed(1)} <span className="text-xs font-normal text-slate-300">{unit}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400">Members</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {aggregateStats.memberCount}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400">Logs</span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {aggregateStats.totalEntries}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400">Streak</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">
              {aggregateStats.maxStreak} <span className="text-xs font-normal text-slate-300">d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Profile Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Members
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {profiles.map((p) => {
            const stats = memberStats[p.id];
            const current = stats ? convertWeight(stats.currentWeightLbs, unit) : convertWeight(p.startingWeightLbs, unit);
            const starting = convertWeight(p.startingWeightLbs, unit);
            const delta = stats ? convertWeight(stats.totalChangeLbs, unit) : 0;
            const isLoss = delta < 0;

            return (
              <div
                key={p.id}
                id={`family-card-${p.id}`}
                onClick={() => onSelectProfile(p.id)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <AvatarIcon
                        iconName={p.avatarIcon}
                        colorClass={p.avatarColor}
                        className="w-9 h-9"
                        size={16}
                      />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </h4>
                      </div>
                    </div>

                    {stats && stats.streakDays > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {stats.streakDays}d
                      </span>
                    )}
                  </div>

                  {/* Weights readout */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {unit === 'kg' ? Number(current.toFixed(2)) : current.toFixed(1)} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{unit}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Start: {unit === 'kg' ? Number(starting.toFixed(2)) : starting.toFixed(1)} {unit}
                      </span>
                    </div>
                  </div>

                  {/* BMI & Change context */}
                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>BMI:</span>
                      {stats?.bmi ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {stats.bmi.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">--</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>Change:</span>
                      <span className={`font-semibold ${isLoss ? 'text-emerald-600 dark:text-emerald-400' : delta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {delta > 0 ? `+${unit === 'kg' ? Number(delta.toFixed(2)) : delta.toFixed(1)}` : (unit === 'kg' ? Number(delta.toFixed(2)) : delta.toFixed(1))} {unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    {stats?.lastWeighedDate
                      ? formatDateToMMDDYYYY(stats.lastWeighedDate)
                      : 'No logs'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                    View &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparative Multi-Line Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Comparison
          </h3>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            {unit}
          </span>
        </div>

        <div className="w-full h-80 min-h-[340px] sm:min-h-[380px]">
          {comparativeChartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
              No family records to graph yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: axisStroke }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: axisStroke }}
                  tick={{ fill: tickFill, fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-2.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="font-semibold text-slate-600 dark:text-slate-300 pb-1 mb-1 border-b border-slate-200/80 dark:border-slate-800">
                            {payload[0].payload.date}
                          </div>
                          {payload.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                              <span style={{ color: item.color }} className="font-semibold">
                                {item.name}:
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.value !== undefined && item.value !== null ? `${item.value} ${unit}` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                  iconType="circle"
                />
                {profiles.map((p, idx) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.name}
                    name={p.name}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};
