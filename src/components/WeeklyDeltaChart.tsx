import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid,
} from 'recharts';
import { WeightEntry, FamilyMemberProfile, WeightUnit } from '../types';
import { convertWeight } from '../utils/calculations';
import { BarChart3, Info } from 'lucide-react';

interface WeeklyDeltaChartProps {
  profile: FamilyMemberProfile;
  entries: WeightEntry[];
  unit: WeightUnit;
  theme?: 'light' | 'dark';
}

export const WeeklyDeltaChart: React.FC<WeeklyDeltaChartProps> = ({
  profile,
  entries,
  unit,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#f1f5f9';
  const axisStroke = isDark ? '#475569' : '#cbd5e1';
  const tickFill = isDark ? '#94a3b8' : '#64748b';
  const refLineStroke = isDark ? '#64748b' : '#94a3b8';
  // Aggregate entries into weekly intervals and compute change from previous week
  const weeklyData = useMemo(() => {
    if (entries.length < 2) return [];

    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by week (using year-week or 7-day intervals)
    const result: { weekLabel: string; delta: number; rawDelta: number; endWeight: number }[] = [];
    
    // We can compute deltas between successive consecutive weigh-ins or weekly buckets
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevVal = convertWeight(prev.weightLbs, unit);
      const currVal = convertWeight(curr.weightLbs, unit);
      const delta = Number((currVal - prevVal).toFixed(1));

      const dateStr = new Date(curr.date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      result.push({
        weekLabel: dateStr,
        delta,
        rawDelta: delta,
        endWeight: currVal,
      });
    }

    // Return the last 8-10 intervals for clean bar spacing
    return result.slice(-10);
  }, [entries, unit]);

  return (
    <div id="weekly-delta-chart-card" className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Weekly
        </h3>
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <BarChart3 className="w-4 h-4" />
        </div>
      </div>

      <div className="w-full flex-1 h-80 min-h-[340px] xl:min-h-[380px]">
        {weeklyData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Info className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Need at least 2 logs</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={{ stroke: axisStroke }}
                tick={{ fill: tickFill, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: axisStroke }}
                tick={{ fill: tickFill, fontSize: 11 }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
              />
              <ReferenceLine y={0} stroke={refLineStroke} strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs shadow-lg border border-slate-200 dark:border-slate-800 min-w-[130px]">
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold border-b border-slate-200/80 dark:border-slate-800 pb-1">{data.weekLabel}</div>
                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Change:</span>
                          <span
                            className={`font-bold ${
                              data.delta < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {data.delta > 0 ? `+${data.delta}` : data.delta} {unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                          <span>Weight:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{data.endWeight} {unit}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="delta" radius={[4, 4, 4, 4]}>
                {weeklyData.map((entry, index) => {
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.delta <= 0 ? '#10b981' : '#f59e0b'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Decrease</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span>Increase</span>
        </span>
      </div>
    </div>
  );
};
