import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Palette,
  AlignLeft,
  Trash2,
  Unlink,
  Layers,
  Check,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import type { DayOfWeek, PlannerEvent } from '../types/schedule';
import { DAYS_OF_WEEK } from '../types/schedule';
import { PRESET_COLORS, DEFAULT_EVENT_COLOR } from '../constants/colors';
import {
  minutesToTimeString,
  timeStringToMinutes,
  formatDuration,
  snapTo15,
} from '../utils/time';

export const EventModal: React.FC = () => {
  const {
    modalState,
    closeModal,
    addEvents,
    updateEvent,
    deleteEvent,
    unlinkEvent,
    activeSchedule,
  } = useSchedule();

  const { isOpen, mode, event, initialDay, initialStartMinutes, initialDurationMinutes } =
    modalState;

  // Form states
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['monday']);
  const [startMinutes, setStartMinutes] = useState(9 * 60);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [color, setColor] = useState(DEFAULT_EVENT_COLOR);
  const [description, setDescription] = useState('');
  const [seriesPrompt, setSeriesPrompt] = useState<'none' | 'update' | 'delete'>('none');

  // Find all sibling events in the same series when editing
  const seriesEvents = useMemo(() => {
    if (!event?.seriesId) return [];
    return activeSchedule.events.filter(e => e.seriesId === event.seriesId);
  }, [event, activeSchedule.events]);

  const seriesDayKeys = useMemo(() => {
    return seriesEvents.map(e => e.day);
  }, [seriesEvents]);

  // Check if the user modified the day selection
  const daysChanged = useMemo(() => {
    if (!event) return false;
    const initialDays = event.seriesId && seriesEvents.length > 0
      ? seriesEvents.map(e => e.day)
      : [event.day];
    if (initialDays.length !== selectedDays.length) return true;
    return initialDays.some(d => !selectedDays.includes(d));
  }, [event, seriesEvents, selectedDays]);

  // Calculate total weekly duration for this event
  const weeklyTotalMinutes = useMemo(() => {
    return durationMinutes * selectedDays.length;
  }, [durationMinutes, selectedDays.length]);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) {
      setSeriesPrompt('none');
      return;
    }

    if (mode === 'edit' && event) {
      setTitle(event.title);
      // Initialize with all days currently in the series (or single day)
      const currentDays = event.seriesId
        ? activeSchedule.events.filter(e => e.seriesId === event.seriesId).map(e => e.day)
        : [event.day];
      setSelectedDays(currentDays.length > 0 ? currentDays : [event.day]);
      setStartMinutes(event.startMinutes);
      setDurationMinutes(event.durationMinutes);
      setColor(event.color || DEFAULT_EVENT_COLOR);
      setDescription(event.description || '');
    } else {
      // Create mode
      setTitle('');
      setSelectedDays([initialDay ?? 'monday']);
      setStartMinutes(snapTo15(initialStartMinutes ?? 9 * 60));
      setDurationMinutes(Math.max(15, snapTo15(initialDurationMinutes ?? 60)));
      setColor(DEFAULT_EVENT_COLOR);
      setDescription('');
    }
  }, [isOpen, mode, event, initialDay, initialStartMinutes, initialDurationMinutes, activeSchedule.events]);

  if (!isOpen) return null;

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter(d => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const handleSelectPresetDays = (preset: 'weekdays' | 'weekend' | 'all') => {
    if (preset === 'weekdays') {
      setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    } else if (preset === 'weekend') {
      setSelectedDays(['saturday', 'sunday']);
    } else {
      setSelectedDays([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = snapTo15(timeStringToMinutes(e.target.value));
    setStartMinutes(mins);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endMins = snapTo15(timeStringToMinutes(e.target.value));
    const newDuration = endMins - startMinutes;
    if (newDuration > 0) {
      setDurationMinutes(newDuration);
    } else {
      // Wrap around or minimum 15 mins
      setDurationMinutes(15);
    }
  };

  const handleSave = (scope: 'single' | 'series' = 'series') => {
    const cleanTitle = title.trim() || 'Untitled Block';

    if (mode === 'create') {
      addEvents(
        {
          title: cleanTitle,
          startMinutes,
          durationMinutes,
          color,
          description: description.trim() || undefined,
        },
        selectedDays
      );
      closeModal();
    } else if (mode === 'edit' && event) {
      const updated: PlannerEvent = {
        ...event,
        title: cleanTitle,
        startMinutes,
        durationMinutes,
        color,
        description: description.trim() || undefined,
      };

      updateEvent(updated, selectedDays, scope);
      closeModal();
    }
  };

  const handleSaveClick = () => {
    // If the user changed the days or it's not a repeating series, save directly
    if (daysChanged || !event?.seriesId || seriesEvents.length <= 1) {
      handleSave('series');
    } else {
      // Days didn't change, but time/title/color did for an existing series
      setSeriesPrompt('update');
    }
  };

  const handleDeleteClick = () => {
    if (!event) return;
    if (event.seriesId && seriesEvents.length > 1) {
      setSeriesPrompt('delete');
    } else {
      deleteEvent(event.id, 'single');
      closeModal();
    }
  };

  const handleUnlink = () => {
    if (event) {
      unlinkEvent(event.id);
      closeModal();
    }
  };

  const endTimeMinutes = Math.min(1440, startMinutes + durationMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className="h-3.5 w-3.5 rounded-full ring-2 ring-white/50"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {mode === 'create' ? 'Create Time Block' : 'Edit Time Block'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Linked Series Banner (if editing repeating series) */}
          {mode === 'edit' && event?.seriesId && seriesEvents.length > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Repeating block on{' '}
                  <strong className="font-semibold">
                    {seriesDayKeys
                      .map(d => DAYS_OF_WEEK.find(x => x.key === d)?.short)
                      .join(', ')}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleUnlink}
                className="flex items-center gap-1 rounded-md bg-white px-2 py-1 font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Detach this day so edits won't affect other days"
              >
                <Unlink className="h-3 w-3" />
                <span>Unlink Day</span>
              </button>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Block Label / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Workout, Deep Work, Team Sync..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-750 dark:bg-slate-800/80 dark:text-white"
            />
          </div>

          {/* Day selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Apply to Days</span>
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectPresetDays('weekdays')}
                  className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetDays('weekend')}
                  className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Weekend
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetDays('all')}
                  className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  All Days
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 font-semibold text-white shadow-sm shadow-indigo-600/30'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{day.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Duration */}
          <div>
            <label className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Time Interval</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Duration: {formatDuration(durationMinutes)}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-[11px] text-slate-500">Start Time</span>
                <input
                  type="time"
                  step="900" // 15-minute step
                  value={minutesToTimeString(startMinutes)}
                  onChange={handleStartTimeChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <span className="mb-1 block text-[11px] text-slate-500">End Time</span>
                <input
                  type="time"
                  step="900"
                  value={minutesToTimeString(endTimeMinutes)}
                  onChange={handleEndTimeChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Weekly Total Commitment Card */}
          <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900/40 dark:bg-indigo-950/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Total This Week
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatDuration(durationMinutes)} × {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} ({selectedDays.map(d => DAYS_OF_WEEK.find(x => x.key === d)?.short).join(', ')})
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {formatDuration(weeklyTotalMinutes)}
              </span>
              <span className="block text-[10px] text-slate-400">weekly sum</span>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Palette className="h-3.5 w-3.5 text-slate-400" />
                <span>Color Theme</span>
              </label>

              {/* Custom Hex Picker */}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <span>Custom:</span>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="h-4 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map(c => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className="group relative flex h-8 items-center justify-center rounded-xl shadow-xs transition hover:scale-105"
                    title={c.name}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Notes or Details (optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add goals, links, or notes for this block..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-750 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Series Confirmation Prompt (if updating or deleting a linked series) */}
        {seriesPrompt === 'update' && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
            <p className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
              This block is part of a recurring series. How would you like to save changes?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSeriesPrompt('none')}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-750"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSave('single')}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Only This Day
              </button>
              <button
                type="button"
                onClick={() => handleSave('series')}
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700"
              >
                All Linked Days ({seriesEvents.length})
              </button>
            </div>
          </div>
        )}

        {seriesPrompt === 'delete' && (
          <div className="border-t border-slate-200 bg-red-50/60 p-4 dark:border-slate-800 dark:bg-red-950/20">
            <p className="mb-3 text-xs font-semibold text-red-800 dark:text-red-300">
              Delete recurring event. Which occurrences would you like to remove?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSeriesPrompt('none')}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (event) deleteEvent(event.id, 'single');
                  closeModal();
                }}
                className="rounded-xl border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-800 dark:text-red-400"
              >
                Only This Day
              </button>
              <button
                type="button"
                onClick={() => {
                  if (event) deleteEvent(event.id, 'series');
                  closeModal();
                }}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
              >
                All Days in Series
              </button>
            </div>
          </div>
        )}

        {/* Default Footer Buttons */}
        {seriesPrompt === 'none' && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                {mode === 'create' ? 'Create Block' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
