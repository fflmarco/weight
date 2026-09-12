import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { WeightEntry, FamilyMemberProfile, WeightUnit } from '../types';
import { convertWeight, computeMovingAverage } from '../utils/calculations';
import { Calendar, Filter, Sparkles, TrendingUp, Info } from 'lucide-react';

type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface WeightChartProps {
  profile: FamilyMemberProfile;
  entries: WeightEntry[];
  unit: WeightUnit;
  theme?: 'light' | 'dark';
}

export const WeightChart: React.FC<WeightChartProps> = ({ profile, entries, unit, theme = 'light' }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#f1f5f9';
  const axisStroke = isDark ? '#475569' : '#e2e8f0';
  const tickFill = isDark ? '#94a3b8' : '#64748b';

  // Filter entries based on timeRange
  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sorted.length === 0) return [];
    if (timeRange === 'ALL') return sorted;

    const now = new Date();
    const daysMap: Record<Exclude<TimeRange, 'ALL'>, number> = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };

    const days = daysMap[timeRange];
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const filtered = sorted.filter((e) => new Date(e.date) >= cutoff);
    
    // If fewer than 2 entries in this window, fallback to at least the last 4 entries so chart isn't empty
    if (filtered.length < 2 && sorted.length >= 2) {
      return sorted.slice(-4);
    }
    return filtered;
  }, [entries, timeRange]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    const raw = filteredEntries.map((e, index) => {
      const prev = index > 0 ? filteredEntries[index - 1] : null;
      const currentVal = convertWeight(e.weightLbs, unit);
      const prevVal = prev ? convertWeight(prev.weightLbs, unit) : null;
      const delta = prevVal !== null ? Number((currentVal - prevVal).toFixed(1)) : null;

      return {
        id: e.id,
        date: e.date,
        displayDate: new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        weight: currentVal,
        rawWeightLbs: e.weightLbs,
        delta,
        notes: e.notes,
        mood: e.mood,
        timeOfDay: e.timeOfDay,
      };
    });

    return computeMovingAverage(raw, 5);
  }, [filteredEntries, unit]);

  // Calculate domain min and max
  const { minVal, maxVal } = useMemo(() => {
    if (chartData.length === 0) {
      const startConverted = convertWeight(profile.startingWeightLbs, unit);
      return { minVal: Math.floor(startConverted - 10), maxVal: Math.ceil(startConverted + 10) };
    }

    const weights = chartData.map((d) => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max(2, (max - min) * 0.18);

    return {
      minVal: Math.floor(min - padding),
      maxVal: Math.ceil(max + padding),
    };
  }, [chartData, profile.startingWeightLbs, unit]);

  return (
    <div id="weight-trend-chart-card" className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 h-full flex flex-col justify-between">
      
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Weight
        </h2>

        {/* Timeframe & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Trendline toggle */}
          <button
            id="toggle-moving-average"
            type="button"
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
              showMovingAverage
                ? 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Trend
          </button>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                id={`chart-range-${range.toLowerCase()}`}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full flex-1 h-80 min-h-[340px] xl:min-h-[380px]">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Info className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No logs in this timeframe</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />

              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={{ stroke: axisStroke }}
                tick={{ fill: tickFill, fontSize: 12 }}
                dy={6}
              />

              <YAxis
                domain={[minVal, maxVal]}
                tickLine={false}
                axisLine={{ stroke: axisStroke }}
                tick={{ fill: tickFill, fontSize: 12 }}
                tickFormatter={(val) => `${val}`}
                dx={-4}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-3 shadow-lg border border-slate-200 dark:border-slate-800 text-xs min-w-[160px]">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 border-b border-slate-200/80 dark:border-slate-800 pb-1">
                          <span className="font-semibold">{data.date}</span>
                          {data.timeOfDay && (
                            <span className="capitalize text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium border border-slate-200/60 dark:border-slate-700">
                              {data.timeOfDay}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between mt-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Weight:</span>
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {data.weight} {unit}
                          </span>
                        </div>

                        {data.delta !== null && (
                          <div className="flex items-center justify-between text-[11px] mt-0.5">
                            <span className="text-slate-500 dark:text-slate-400">Change:</span>
                            <span
                              className={`font-semibold ${
                                data.delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : data.delta > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {data.delta > 0 ? `+${data.delta}` : data.delta} {unit}
                            </span>
                          </div>
                        )}

                        {data.movingAvg && showMovingAverage && (
                          <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-300 mt-0.5 font-medium">
                            <span>Trendline:</span>
                            <span>{data.movingAvg} {unit}</span>
                          </div>
                        )}

                        {data.notes && (
                          <div className="mt-2 pt-1 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic">
                            "{data.notes}"
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Weight Area Curve */}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#weightAreaGradient)"
                activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                dot={{ r: 3, fill: '#059669' }}
              />

              {/* Smoothed Trendline */}
              {showMovingAverage && (
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span>Weight</span>
        </div>
        {showMovingAverage && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" />
            <span>Trend</span>
          </div>
        )}
      </div>

    </div>
  );
};
