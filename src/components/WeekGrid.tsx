import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import type {
  DayOfWeek,
  PositionedEvent,
  PlannerEvent,
} from '../types/schedule';
import { DAYS_OF_WEEK } from '../types/schedule';
import { computeEventPositions } from '../utils/overlap';
import { snapTo15, formatTimeRange, formatDuration } from '../utils/time';
import { EventBlock } from './EventBlock';

const HOUR_HEIGHT = 56; // Pixels per 60 minutes (14px per 15-minute slot)
const TOTAL_HOURS = 24;
const TOTAL_MINUTES = TOTAL_HOURS * 60;

interface WeekGridProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

type DragType = 'create' | 'move' | 'resize-top' | 'resize-bottom';

interface GroupDragItem {
  event: PlannerEvent;
  initialDay: DayOfWeek;
  initialDayIndex: number;
  initialStartMinutes: number;
  currentDay: DayOfWeek;
  currentStartMinutes: number;
}

interface DragState {
  type: DragType;
  day: DayOfWeek;
  startMinutes: number;
  durationMinutes: number;
  initialY: number;
  initialMinutes: number;
  event?: PlannerEvent;
  hasMoved: boolean;
  isGroupMove?: boolean;
  groupItems?: GroupDragItem[];
  anchorDayIndex?: number;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ scrollContainerRef }) => {
  const {
    activeSchedule,
    moveOrResizeEvent,
    moveEventsGroup,
    selectedEventIds,
    clearSelection,
    openCreateModal,
    openEditModal,
  } = useSchedule();

  const [dragState, setDragState] = useState<DragState | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Track live current time
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayKey: DayOfWeek = useMemo(() => {
    const dayIndex = new Date().getDay();
    const map: DayOfWeek[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return map[dayIndex];
  }, []);

  // Group events by day and compute side-by-side overlaps
  const positionedEventsByDay = useMemo(() => {
    const map = new Map<DayOfWeek, PositionedEvent[]>();
    for (const day of DAYS_OF_WEEK) {
      const dayEvents = activeSchedule.events.filter(e => e.day === day.key);
      map.set(day.key, computeEventPositions(dayEvents));
    }
    return map;
  }, [activeSchedule.events]);

  // Compute total hours planned per day
  const dailyTotalHours = useMemo(() => {
    const map = new Map<DayOfWeek, string>();
    for (const day of DAYS_OF_WEEK) {
      const totalMins = activeSchedule.events
        .filter(e => e.day === day.key)
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      const hours = (totalMins / 60).toFixed(1).replace(/\.0$/, '');
      map.set(day.key, `${hours}h`);
    }
    return map;
  }, [activeSchedule.events]);

  // Convert client Y coordinate to minutes within grid
  const getMinutesFromClientY = useCallback((clientY: number): number => {
    if (!gridContainerRef.current) return 0;
    const rect = gridContainerRef.current.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60;
    return snapTo15(rawMinutes, 0, TOTAL_MINUTES);
  }, []);

  // Detect which day column a client X coordinate is over
  const getDayFromClientX = useCallback((clientX: number): DayOfWeek => {
    if (!gridContainerRef.current) return 'monday';
    const dayElements = gridContainerRef.current.querySelectorAll<HTMLElement>('[data-day-col]');
    for (const el of dayElements) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return el.dataset.dayCol as DayOfWeek;
      }
    }
    return 'monday';
  }, []);

  // Start creating new block via drag-and-draw
  const handleGridMouseDown = (e: React.MouseEvent, day: DayOfWeek) => {
    // Only primary button
    if (e.button !== 0) return;
    // Clear selection if clicking empty space without Shift/Ctrl/Cmd
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && selectedEventIds.length > 0) {
      clearSelection();
    }
    const clickedMinutes = getMinutesFromClientY(e.clientY);

    setDragState({
      type: 'create',
      day,
      startMinutes: clickedMinutes,
      durationMinutes: 15,
      initialY: e.clientY,
      initialMinutes: clickedMinutes,
      hasMoved: false,
    });
  };

  // Start moving an existing block (single or multi-select group)
  const handleStartMove = (e: React.MouseEvent, event: PositionedEvent) => {
    e.stopPropagation();
    const clickedMinutes = getMinutesFromClientY(e.clientY);
    const anchorDayIndex = DAYS_OF_WEEK.findIndex(d => d.key === event.day);

    const isGroup =
      selectedEventIds.includes(event.id) && selectedEventIds.length > 1;

    if (isGroup) {
      const selectedEvents = activeSchedule.events.filter(ev =>
        selectedEventIds.includes(ev.id)
      );

      const groupItems: GroupDragItem[] = selectedEvents.map(ev => ({
        event: ev,
        initialDay: ev.day,
        initialDayIndex: DAYS_OF_WEEK.findIndex(d => d.key === ev.day),
        initialStartMinutes: ev.startMinutes,
        currentDay: ev.day,
        currentStartMinutes: ev.startMinutes,
      }));

      setDragState({
        type: 'move',
        day: event.day,
        startMinutes: event.startMinutes,
        durationMinutes: event.durationMinutes,
        initialY: e.clientY,
        initialMinutes: clickedMinutes,
        event,
        hasMoved: false,
        isGroupMove: true,
        groupItems,
        anchorDayIndex,
      });
    } else {
      setDragState({
        type: 'move',
        day: event.day,
        startMinutes: event.startMinutes,
        durationMinutes: event.durationMinutes,
        initialY: e.clientY,
        initialMinutes: clickedMinutes,
        event,
        hasMoved: false,
        isGroupMove: false,
      });
    }
  };

  // Start resizing top handle
  const handleStartResizeTop = (e: React.MouseEvent, event: PositionedEvent) => {
    e.stopPropagation();
    const clickedMinutes = getMinutesFromClientY(e.clientY);

    setDragState({
      type: 'resize-top',
      day: event.day,
      startMinutes: event.startMinutes,
      durationMinutes: event.durationMinutes,
      initialY: e.clientY,
      initialMinutes: clickedMinutes,
      event,
      hasMoved: false,
    });
  };

  // Start resizing bottom handle
  const handleStartResizeBottom = (e: React.MouseEvent, event: PositionedEvent) => {
    e.stopPropagation();
    const clickedMinutes = getMinutesFromClientY(e.clientY);

    setDragState({
      type: 'resize-bottom',
      day: event.day,
      startMinutes: event.startMinutes,
      durationMinutes: event.durationMinutes,
      initialY: e.clientY,
      initialMinutes: clickedMinutes,
      event,
      hasMoved: false,
    });
  };

  // Global mousemove and mouseup listeners during dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentMinutes = getMinutesFromClientY(e.clientY);
      const hoveredDay = getDayFromClientX(e.clientX);
      const dy = Math.abs(e.clientY - dragState.initialY);
      const hasMoved = dragState.hasMoved || dy > 5;

      if (dragState.type === 'create') {
        const start = Math.min(dragState.initialMinutes, currentMinutes);
        const end = Math.max(dragState.initialMinutes, currentMinutes);
        const duration = Math.max(15, end - start);
        setDragState(prev =>
          prev ? { ...prev, startMinutes: start, durationMinutes: duration, hasMoved } : null
        );
      } else if (dragState.type === 'move' && dragState.event) {
        if (dragState.isGroupMove && dragState.groupItems) {
          const deltaMinutes = currentMinutes - dragState.initialMinutes;
          const currentHoveredDayIndex = DAYS_OF_WEEK.findIndex(d => d.key === hoveredDay);
          const deltaDayIndex =
            dragState.anchorDayIndex !== undefined
              ? currentHoveredDayIndex - dragState.anchorDayIndex
              : 0;

          const updatedGroup = dragState.groupItems.map(item => {
            const targetDayIndex = Math.max(
              0,
              Math.min(6, item.initialDayIndex + deltaDayIndex)
            );
            const targetDay = DAYS_OF_WEEK[targetDayIndex].key;
            const targetStart = snapTo15(
              item.initialStartMinutes + deltaMinutes,
              0,
              TOTAL_MINUTES - item.event.durationMinutes
            );
            return {
              ...item,
              currentDay: targetDay,
              currentStartMinutes: targetStart,
            };
          });

          setDragState(prev =>
            prev
              ? {
                  ...prev,
                  day: hoveredDay,
                  hasMoved,
                  groupItems: updatedGroup,
                }
              : null
          );
        } else {
          const deltaMinutes = currentMinutes - dragState.initialMinutes;
          const newStart = snapTo15(
            dragState.event.startMinutes + deltaMinutes,
            0,
            TOTAL_MINUTES - dragState.event.durationMinutes
          );
          setDragState(prev =>
            prev ? { ...prev, day: hoveredDay, startMinutes: newStart, hasMoved } : null
          );
        }
      } else if (dragState.type === 'resize-top' && dragState.event) {
        const originalEnd = dragState.event.startMinutes + dragState.event.durationMinutes;
        const newStart = Math.min(originalEnd - 15, currentMinutes);
        const newDuration = originalEnd - newStart;
        setDragState(prev =>
          prev
            ? { ...prev, startMinutes: newStart, durationMinutes: newDuration, hasMoved }
            : null
        );
      } else if (dragState.type === 'resize-bottom' && dragState.event) {
        const newDuration = Math.max(15, currentMinutes - dragState.event.startMinutes);
        setDragState(prev =>
          prev ? { ...prev, durationMinutes: newDuration, hasMoved } : null
        );
      }
    };

    const handleMouseUp = () => {
      if (!dragState) return;

      if (dragState.type === 'create') {
        // Open create modal with prefilled time and day
        openCreateModal(dragState.day, dragState.startMinutes, dragState.durationMinutes);
      } else if (
        dragState.type === 'move' &&
        dragState.event &&
        dragState.hasMoved
      ) {
        if (dragState.isGroupMove && dragState.groupItems) {
          const updates = dragState.groupItems.map(item => ({
            id: item.event.id,
            newDay: item.currentDay,
            newStartMinutes: item.currentStartMinutes,
            newDurationMinutes: item.event.durationMinutes,
          }));
          moveEventsGroup(updates);
        } else {
          moveOrResizeEvent(
            dragState.event.id,
            dragState.day,
            dragState.startMinutes,
            dragState.durationMinutes,
            'single'
          );
        }
      } else if (
        (dragState.type === 'resize-top' || dragState.type === 'resize-bottom') &&
        dragState.event &&
        dragState.hasMoved
      ) {
        moveOrResizeEvent(
          dragState.event.id,
          dragState.event.day,
          dragState.startMinutes,
          dragState.durationMinutes,
          'single'
        );
      } else if (!dragState.hasMoved && dragState.event) {
        // Just clicked without dragging -> open edit modal
        openEditModal(dragState.event);
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState,
    getMinutesFromClientY,
    getDayFromClientX,
    moveOrResizeEvent,
    openCreateModal,
    openEditModal,
  ]);

  // Initial scroll to 7:00 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const morningOffset = 7 * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTop = morningOffset;
    }
  }, [scrollContainerRef]);

  // Generate 24 hour labels
  const hourLabels = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => {
      if (i === 0) return '12 AM';
      if (i < 12) return `${i} AM`;
      if (i === 12) return '12 PM';
      return `${i - 12} PM`;
    });
  }, []);

  return (
    <div
      ref={gridContainerRef}
      className="relative flex min-w-[760px] flex-col select-none bg-white transition-colors dark:bg-slate-900"
    >
      {/* Sticky Day Column Headers */}
      <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        {/* Corner Cell for time gutter */}
        <div className="w-16 shrink-0 border-r border-slate-200 px-2 py-3 text-right text-[11px] font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-500">
          GMT
        </div>

        {/* 7 Days Headers */}
        <div className="grid flex-1 grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day.key}
              className="group flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {day.short}
                </span>
                <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
                  {day.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {dailyTotalHours.get(day.key)}
                </span>
                <button
                  onClick={() => openCreateModal(day.key, 9 * 60, 60)}
                  className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-indigo-50 hover:text-indigo-600 group-hover:opacity-100 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400"
                  title={`Add block to ${day.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Body: Time Gutter + 7 Day Columns */}
      <div className="relative flex">
        {/* Time Gutter Column */}
        <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60">
          {hourLabels.map((label, hour) => (
            <div
              key={hour}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="relative flex items-start justify-end pr-2 text-[11px] font-medium text-slate-400 dark:text-slate-500"
            >
              <span className="-translate-y-2.5">{label}</span>
            </div>
          ))}
        </div>

        {/* 7 Day Columns Grid */}
        <div className="grid flex-1 grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
          {DAYS_OF_WEEK.map(day => {
            const dayEvents = positionedEventsByDay.get(day.key) || [];
            const isTargetDay = dragState?.day === day.key;

            return (
              <div
                key={day.key}
                data-day-col={day.key}
                onMouseDown={e => handleGridMouseDown(e, day.key)}
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                className="relative cursor-crosshair transition-colors hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5"
              >
                {/* Hourly Background Guide Lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                  <div
                    key={h}
                    style={{
                      top: `${h * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                    className="pointer-events-none absolute inset-x-0 border-t border-slate-100 dark:border-slate-800/80"
                  >
                    {/* Subtle 30-minute guide dash */}
                    <div
                      style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      className="absolute inset-x-0 border-t border-dashed border-slate-100/60 dark:border-slate-800/40"
                    />
                  </div>
                ))}

                {/* Live Current Time Indicator */}
                {todayKey === day.key && (
                  <div
                    style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    title="Current Time"
                  >
                    <div className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                    <div className="h-0.5 flex-1 bg-rose-500 shadow-xs" />
                  </div>
                )}

                {/* Render Existing Events for this day */}
                {dayEvents.map(event => {
                  // If this event is currently being moved or resized, hide original
                  if (dragState?.event?.id === event.id) {
                    return null;
                  }
                  if (
                    dragState?.isGroupMove &&
                    dragState.groupItems?.some(g => g.event.id === event.id)
                  ) {
                    return null;
                  }

                  return (
                    <EventBlock
                      key={event.id}
                      event={event}
                      hourHeight={HOUR_HEIGHT}
                      onStartMove={handleStartMove}
                      onStartResizeTop={handleStartResizeTop}
                      onStartResizeBottom={handleStartResizeBottom}
                    />
                  );
                })}

                {/* Group Move Ghosts */}
                {dragState?.isGroupMove &&
                  dragState.groupItems
                    ?.filter(g => g.currentDay === day.key)
                    .map(g => (
                      <div
                        key={g.event.id}
                        style={{
                          top: `${(g.currentStartMinutes / 60) * HOUR_HEIGHT}px`,
                          height: `${Math.max(18, (g.event.durationMinutes / 60) * HOUR_HEIGHT)}px`,
                          left: '4px',
                          right: '4px',
                          backgroundColor: `${g.event.color}40`,
                          borderColor: g.event.color,
                        }}
                        className="pointer-events-none absolute z-30 flex flex-col justify-between rounded-lg border-2 border-dashed p-1.5 shadow-lg backdrop-blur-2xs ring-2 ring-indigo-500/60"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-indigo-900 dark:text-white">
                          <span className="truncate">{g.event.title}</span>
                          <span className="rounded bg-indigo-600 px-1 py-0.5 text-[9px] font-semibold text-white">
                            {formatDuration(g.event.durationMinutes)}
                          </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
                          {formatTimeRange(g.currentStartMinutes, g.event.durationMinutes)}
                        </div>
                      </div>
                    ))}

                {/* Single Event Live Drag Ghost Preview (creating, moving, or resizing) */}
                {dragState && !dragState.isGroupMove && isTargetDay && (
                  <div
                    style={{
                      top: `${(dragState.startMinutes / 60) * HOUR_HEIGHT}px`,
                      height: `${Math.max(18, (dragState.durationMinutes / 60) * HOUR_HEIGHT)}px`,
                      left: '4px',
                      right: '4px',
                      backgroundColor:
                        dragState.event?.color
                          ? `${dragState.event.color}40`
                          : 'rgba(99, 102, 241, 0.25)',
                      borderColor: dragState.event?.color || '#6366f1',
                    }}
                    className="pointer-events-none absolute z-30 flex flex-col justify-between rounded-lg border-2 border-dashed p-1.5 shadow-lg backdrop-blur-2xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-indigo-900 dark:text-white">
                      <span className="truncate">
                        {dragState.event ? dragState.event.title : 'New Block'}
                      </span>
                      <span className="rounded bg-indigo-600 px-1 py-0.5 text-[9px] font-semibold text-white">
                        {formatDuration(dragState.durationMinutes)}
                      </span>
                    </div>

                    <div className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
                      {formatTimeRange(dragState.startMinutes, dragState.durationMinutes)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
