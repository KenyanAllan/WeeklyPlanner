import React, { useMemo } from 'react';
import { Layers, Pencil, Trash2, Copy, Check } from 'lucide-react';
import type { PositionedEvent } from '../types/schedule';
import { hexToRgba, getContrastTextColor } from '../constants/colors';
import { formatTimeRange, formatDuration } from '../utils/time';
import { useSchedule } from '../context/ScheduleContext';

interface EventBlockProps {
  event: PositionedEvent;
  hourHeight: number;
  onStartMove: (e: React.MouseEvent, event: PositionedEvent) => void;
  onStartResizeTop: (e: React.MouseEvent, event: PositionedEvent) => void;
  onStartResizeBottom: (e: React.MouseEvent, event: PositionedEvent) => void;
}

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  hourHeight,
  onStartMove,
  onStartResizeTop,
  onStartResizeBottom,
}) => {
  const {
    openEditModal,
    deleteEvent,
    addEvents,
    theme,
    activeSchedule,
    selectedEventIds,
    toggleSelectEvent,
  } = useSchedule();

  const isSelected = selectedEventIds.includes(event.id);

  const topPx = (event.startMinutes / 60) * hourHeight;
  const heightPx = Math.max(18, (event.durationMinutes / 60) * hourHeight);

  // Column width calculations for side-by-side overlaps
  const columnWidthPercent = 100 / event.totalColumns;
  const leftPercent = event.column * columnWidthPercent;

  // Compute total weekly duration for events sharing the same series or title
  const { totalWeeklyMins, occurrencesCount } = useMemo(() => {
    const cleanTitle = event.title.trim().toLowerCase();
    const matchingEvents = activeSchedule.events.filter(e => {
      if (event.seriesId && e.seriesId === event.seriesId) return true;
      return e.title.trim().toLowerCase() === cleanTitle;
    });

    const totalMins = matchingEvents.reduce((sum, e) => sum + e.durationMinutes, 0);
    return {
      totalWeeklyMins: totalMins,
      occurrencesCount: matchingEvents.length,
    };
  }, [event, activeSchedule.events]);

  const isDark = theme === 'dark';
  const bgRgba = hexToRgba(event.color, isDark ? 0.28 : 0.16);
  const borderRgba = hexToRgba(event.color, isDark ? 0.65 : 0.5);
  const pillContrastColor = getContrastTextColor(event.color);

  const isCompact = heightPx < 42;
  const isTiny = heightPx < 28;

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    addEvents(
      {
        title: `${event.title} (Copy)`,
        startMinutes: Math.min(1440 - event.durationMinutes, event.startMinutes + 30),
        durationMinutes: event.durationMinutes,
        color: event.color,
        description: event.description,
      },
      [event.day]
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEvent(event.id, 'single');
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditModal(event);
  };

  return (
    <div
      onMouseDown={e => {
        if (e.button === 0) {
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            e.stopPropagation();
            toggleSelectEvent(event.id);
            return;
          }
          onStartMove(e, event);
        }
      }}
      title={`${event.title}\nTime: ${formatTimeRange(event.startMinutes, event.durationMinutes)} (${formatDuration(event.durationMinutes)})\nWeekly Total: ${formatDuration(totalWeeklyMins)} across ${occurrencesCount} ${occurrencesCount === 1 ? 'day' : 'days'}\n💡 Shift+Click to select multiple`}
      className={`group absolute z-10 flex cursor-grab select-none flex-col overflow-hidden rounded-lg border border-l-4 shadow-xs transition-all duration-150 active:cursor-grabbing ${
        isSelected
          ? 'z-30 ring-2 ring-indigo-500 ring-offset-1 shadow-lg dark:ring-offset-slate-900'
          : 'hover:z-20 hover:shadow-md'
      }`}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${columnWidthPercent}% - 4px)`,
        backgroundColor: bgRgba,
        borderColor: isSelected ? '#6366f1' : borderRgba,
        borderLeftColor: event.color,
        borderLeftWidth: '4px',
      }}
    >
      {/* Top resize handle */}
      <div
        onMouseDown={e => {
          e.stopPropagation();
          onStartResizeTop(e, event);
        }}
        className="absolute inset-x-0 top-0 h-2 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10"
        title="Drag to resize start time"
      />

      {/* Block Content */}
      <div className="flex h-full flex-col justify-between p-1.5 leading-tight">
        <div>
          {/* Header row: title and series indicator */}
          <div className="flex items-start justify-between gap-1">
            <span
              className={`truncate font-semibold tracking-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              } ${isTiny ? 'text-[11px]' : 'text-xs'}`}
            >
              {event.title}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {isSelected && (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}

              {event.seriesId && (
                <span
                  className="text-slate-500 opacity-80"
                  title="Part of a repeating series"
                >
                  <Layers className="h-3 w-3" />
                </span>
              )}
            </div>
          </div>

          {/* Time & Duration badge (if height allows) */}
          {!isTiny && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">
                {formatTimeRange(event.startMinutes, event.durationMinutes)}
              </span>
              <span
                className="rounded px-1 py-0.2 text-[9px] font-semibold"
                style={{
                  backgroundColor: event.color,
                  color: pillContrastColor,
                }}
              >
                {formatDuration(event.durationMinutes)}
              </span>
              {occurrencesCount > 1 && (
                <span
                  className="rounded border border-slate-300/80 bg-white/70 px-1 py-0.2 text-[9px] font-bold text-slate-800 shadow-2xs dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200"
                  title={`Weekly total: ${formatDuration(totalWeeklyMins)} across ${occurrencesCount} days`}
                >
                  Σ {formatDuration(totalWeeklyMins)}/wk
                </span>
              )}
            </div>
          )}

          {/* Description preview (if larger block) */}
          {!isCompact && event.description && (
            <p className="mt-1 line-clamp-2 text-[10px] text-slate-500 dark:text-slate-400">
              {event.description}
            </p>
          )}
        </div>

        {/* Hover action bar */}
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleDuplicate}
            className="rounded p-0.5 text-slate-600 hover:bg-black/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            title="Duplicate block"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={handleEdit}
            className="rounded p-0.5 text-slate-600 hover:bg-black/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            title="Edit block"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded p-0.5 text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Delete block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        onMouseDown={e => {
          e.stopPropagation();
          onStartResizeBottom(e, event);
        }}
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10"
        title="Drag to resize end time"
      />
    </div>
  );
};
