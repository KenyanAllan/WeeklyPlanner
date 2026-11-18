import React, { useMemo } from 'react';
import { X, PieChart } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { formatDuration } from '../utils/time';
import { DAYS_OF_WEEK } from '../types/schedule';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventStat {
  title: string;
  color: string;
  totalMinutes: number;
  occurrences: number;
  days: string[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { activeSchedule } = useSchedule();

  // Aggregate stats by event title
  const { stats, totalMinutes, busiestDay } = useMemo(() => {
    const map = new Map<string, EventStat>();
    let totalMins = 0;

    const dayMinutesMap = new Map<string, number>();
    for (const d of DAYS_OF_WEEK) {
      dayMinutesMap.set(d.key, 0);
    }

    for (const ev of activeSchedule.events) {
      const key = ev.title.trim().toLowerCase();
      totalMins += ev.durationMinutes;

      // Track day minutes
      dayMinutesMap.set(
        ev.day,
        (dayMinutesMap.get(ev.day) || 0) + ev.durationMinutes
      );

      const dayShort = DAYS_OF_WEEK.find(d => d.key === ev.day)?.short || ev.day;

      if (!map.has(key)) {
        map.set(key, {
          title: ev.title.trim() || 'Untitled',
          color: ev.color,
          totalMinutes: ev.durationMinutes,
          occurrences: 1,
          days: [dayShort],
        });
      } else {
        const existing = map.get(key)!;
        existing.totalMinutes += ev.durationMinutes;
        existing.occurrences += 1;
        if (!existing.days.includes(dayShort)) {
          existing.days.push(dayShort);
        }
      }
    }

    // Find busiest day
    let maxDayKey = 'monday';
    let maxMins = 0;
    dayMinutesMap.forEach((mins, dayKey) => {
      if (mins > maxMins) {
        maxMins = mins;
        maxDayKey = dayKey;
      }
    });

    const busiestDayName =
      DAYS_OF_WEEK.find(d => d.key === maxDayKey)?.label || 'Monday';

    const sortedStats = Array.from(map.values()).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );

    return {
      stats: sortedStats,
      totalMinutes: totalMins,
      busiestDay: {
        name: busiestDayName,
        minutes: maxMins,
      },
    };
  }, [activeSchedule.events]);

  if (!isOpen) return null;

  const totalWeekMinutes = 168 * 60; // 10,080 minutes in 7 days
  const plannedPercent = Math.min(
    100,
    Math.round((totalMinutes / totalWeekMinutes) * 100)
  );
  const freeMinutes = Math.max(0, totalWeekMinutes - totalMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Weekly Routine Breakdown
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeSchedule.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Planned Time
              </span>
              <span className="mt-1 block text-base font-bold text-indigo-600 dark:text-indigo-400">
                {formatDuration(totalMinutes)}
              </span>
              <span className="text-[10px] text-slate-500">
                {plannedPercent}% of week
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Free Time
              </span>
              <span className="mt-1 block text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatDuration(freeMinutes)}
              </span>
              <span className="text-[10px] text-slate-500">
                {100 - plannedPercent}% of week
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-center dark:border-slate-800 dark:bg-slate-850">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Busiest Day
              </span>
              <span className="mt-1 block truncate text-base font-bold text-slate-900 dark:text-white">
                {busiestDay.name}
              </span>
              <span className="text-[10px] text-slate-500">
                {formatDuration(busiestDay.minutes)}
              </span>
            </div>
          </div>

          {/* Planned vs Free Bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Weekly Capacity Allocation</span>
              <span>168 Hours Total</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 dark:bg-slate-800">
              <div
                style={{ width: `${plannedPercent}%` }}
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                title={`Planned: ${formatDuration(totalMinutes)} (${plannedPercent}%)`}
              />
            </div>
          </div>

          {/* Event Breakdown List */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Activities & Commitments ({stats.length})
            </h3>

            {stats.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No events planned yet. Add time blocks to see breakdown.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.map(item => {
                  const shareOfPlanned = totalMinutes > 0
                    ? Math.round((item.totalMinutes / totalMinutes) * 100)
                    : 0;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/50"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.occurrences} {item.occurrences === 1 ? 'session' : 'sessions'} • {item.days.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatDuration(item.totalMinutes)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {shareOfPlanned}% of planned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 px-6 py-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
