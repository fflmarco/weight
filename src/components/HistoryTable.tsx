import React, { useState, useMemo } from 'react';
import { 
  WeightEntry, FamilyMemberProfile, WeightUnit 
} from '../types';
import { convertWeight } from '../utils/calculations';
import { Search, Trash2, Edit3, Plus } from 'lucide-react';

interface HistoryTableProps {
  profile: FamilyMemberProfile;
  entries: WeightEntry[];
  unit: WeightUnit;
  onEditEntry: (entry: WeightEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddNew: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  profile,
  entries,
  unit,
  onEditEntry,
  onDeleteEntry,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort descending by date
  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.date + (b.time ? 'T' + b.time : 'T00:00:00')).getTime() -
                new Date(a.date + (a.time ? 'T' + a.time : 'T00:00:00')).getTime()
    );
  }, [entries]);

  // Compute deltas from chronologically prior entry
  const entriesWithDelta = useMemo(() => {
    // Chronological order for calculating deltas
    const chron = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const deltaMap = new Map<string, number | null>();
    for (let i = 0; i < chron.length; i++) {
      if (i === 0) {
        deltaMap.set(chron[i].id, null);
      } else {
        const prev = chron[i - 1];
        const diff = chron[i].weightLbs - prev.weightLbs;
        deltaMap.set(chron[i].id, diff);
      }
    }

    return sortedEntries.map((e) => ({
      ...e,
      deltaLbs: deltaMap.get(e.id) ?? null,
    }));
  }, [entries, sortedEntries]);

  // Filtered entries
  const filtered = useMemo(() => {
    return entriesWithDelta.filter((e) => {
      return (
        searchQuery === '' ||
        e.date.includes(searchQuery) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.timeOfDay && e.timeOfDay.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [entriesWithDelta, searchQuery]);

  return (
    <div id="weigh-in-history-card" className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            History
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            {entries.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-32 sm:w-40 transition-all"
            />
          </div>

          {/* Add log button */}
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider rounded-lg">
              <th className="py-2.5 px-3 rounded-l-lg">Date</th>
              <th className="py-2.5 px-3">Weight</th>
              <th className="py-2.5 px-3">Change</th>
              <th className="py-2.5 px-3">Notes</th>
              <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const weightDisplay = convertWeight(entry.weightLbs, unit);
                const deltaConverted = entry.deltaLbs !== null ? convertWeight(entry.deltaLbs, unit) : null;
                const isLoss = deltaConverted !== null && deltaConverted < 0;
                const isGain = deltaConverted !== null && deltaConverted > 0;

                return (
                  <tr
                    key={entry.id}
                    id={`entry-row-${entry.id}`}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {entry.timeOfDay && (
                          <span className="capitalize text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium border border-slate-200/60 dark:border-slate-700">
                            {entry.timeOfDay}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {Number(weightDisplay.toFixed(2))} {unit}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {deltaConverted !== null ? (
                        <span
                          className={`font-semibold inline-flex items-center gap-0.5 ${
                            isLoss ? 'text-emerald-600 dark:text-emerald-400' : isGain ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {isGain ? '+' : ''}{Number(deltaConverted.toFixed(2))}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {entry.notes ? (
                        <span className="truncate" title={entry.notes}>{entry.notes}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`btn-edit-entry-${entry.id}`}
                          onClick={() => onEditEntry(entry)}
                          className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-entry-${entry.id}`}
                          onClick={() => {
                            if (window.confirm(`Delete this entry?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
