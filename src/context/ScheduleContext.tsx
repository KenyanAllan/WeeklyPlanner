import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  Schedule,
  PlannerEvent,
  DayOfWeek,
  UpdateScope,
  DeleteScope,
} from '../types/schedule';
import {
  loadSchedulesFromStorage,
  saveSchedulesToStorage,
  loadThemePreference,
  saveThemePreference,
  generateId,
  getDefaultStarterSchedule,
  exportScheduleAsJson,
} from '../utils/storage';

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  event?: PlannerEvent;
  initialDay?: DayOfWeek;
  initialStartMinutes?: number;
  initialDurationMinutes?: number;
}

interface ScheduleContextType {
  schedules: Schedule[];
  activeSchedule: Schedule;
  theme: 'light' | 'dark';
  modalState: ModalState;
  toggleTheme: () => void;
  switchSchedule: (id: string) => void;
  createSchedule: (name: string) => void;
  duplicateSchedule: (id: string) => void;
  renameSchedule: (id: string, name: string) => void;
  deleteSchedule: (id: string) => void;
  resetToStarter: () => void;
  exportActiveSchedule: () => void;
  importScheduleFromJson: (jsonString: string) => boolean;

  // Event operations
  addEvents: (
    eventData: {
      title: string;
      startMinutes: number;
      durationMinutes: number;
      color: string;
      description?: string;
    },
    days: DayOfWeek[]
  ) => void;
  updateEvent: (
    updatedEvent: PlannerEvent,
    targetDays?: DayOfWeek[],
    scope?: UpdateScope
  ) => void;
  deleteEvent: (eventId: string, scope: DeleteScope) => void;
  unlinkEvent: (eventId: string) => void;
  moveOrResizeEvent: (
    eventId: string,
    newDay: DayOfWeek,
    newStartMinutes: number,
    newDurationMinutes: number,
    scope?: UpdateScope
  ) => void;

  // Multi-selection operations
  selectedEventIds: string[];
  toggleSelectEvent: (eventId: string) => void;
  clearSelection: () => void;
  batchUpdateColor: (color: string) => void;
  batchDeleteSelected: () => void;
  batchDuplicateSelected: () => void;
  moveEventsGroup: (
    updates: { id: string; newDay: DayOfWeek; newStartMinutes: number; newDurationMinutes: number }[]
  ) => void;

  // Modal helpers
  openCreateModal: (day?: DayOfWeek, startMinutes?: number, durationMinutes?: number) => void;
  openEditModal: (event: PlannerEvent) => void;
  closeModal: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialData] = useState(() => loadSchedulesFromStorage());
  const [schedules, setSchedules] = useState<Schedule[]>(initialData.schedules);
  const [activeId, setActiveId] = useState<string>(initialData.activeId);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });

  // Selected event IDs for multi-selection
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Keep HTML document in sync with theme class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  // Persist schedules on change
  useEffect(() => {
    saveSchedulesToStorage(schedules, activeId);
  }, [schedules, activeId]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeSchedule = useMemo(() => {
    return schedules.find(s => s.id === activeId) || schedules[0];
  }, [schedules, activeId]);

  const switchSchedule = (id: string) => {
    if (schedules.some(s => s.id === id)) {
      setActiveId(id);
    }
  };

  const createSchedule = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSchedule: Schedule = {
      id: generateId(),
      name: trimmed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      events: [],
    };
    setSchedules(prev => [...prev, newSchedule]);
    setActiveId(newSchedule.id);
  };

  const duplicateSchedule = (id: string) => {
    const target = schedules.find(s => s.id === id);
    if (!target) return;
    const cloned: Schedule = {
      ...target,
      id: generateId(),
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      events: target.events.map(ev => ({
        ...ev,
        id: generateId(),
      })),
    };
    setSchedules(prev => [...prev, cloned]);
    setActiveId(cloned.id);
  };

  const renameSchedule = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSchedules(prev =>
      prev.map(s => (s.id === id ? { ...s, name: trimmed, updatedAt: Date.now() } : s))
    );
  };

  const deleteSchedule = (id: string) => {
    if (schedules.length <= 1) return; // Prevent deleting the last schedule
    setSchedules(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  const resetToStarter = () => {
    const starter = getDefaultStarterSchedule();
    setSchedules(prev => [...prev.filter(s => s.id !== starter.id), starter]);
    setActiveId(starter.id);
  };

  const exportActiveSchedule = () => {
    if (activeSchedule) {
      exportScheduleAsJson(activeSchedule);
    }
  };

  const importScheduleFromJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as Schedule;
      if (!parsed.name || !Array.isArray(parsed.events)) {
        return false;
      }
      const importedSchedule: Schedule = {
        id: generateId(),
        name: `${parsed.name} (Imported)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        events: parsed.events.map(ev => ({
          ...ev,
          id: generateId(),
        })),
      };
      setSchedules(prev => [...prev, importedSchedule]);
      setActiveId(importedSchedule.id);
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  };

  // Event actions
  const addEvents = (
    eventData: {
      title: string;
      startMinutes: number;
      durationMinutes: number;
      color: string;
      description?: string;
    },
    days: DayOfWeek[]
  ) => {
    if (days.length === 0) return;

    const seriesId = days.length > 1 ? generateId() : undefined;
    const newEvents: PlannerEvent[] = days.map(day => ({
      id: generateId(),
      seriesId,
      day,
      title: eventData.title,
      startMinutes: eventData.startMinutes,
      durationMinutes: eventData.durationMinutes,
      color: eventData.color,
      description: eventData.description,
    }));

    setSchedules(prev =>
      prev.map(s =>
        s.id === activeId
          ? { ...s, events: [...s.events, ...newEvents], updatedAt: Date.now() }
          : s
      )
    );
  };

  const updateEvent = (
    updatedEvent: PlannerEvent,
    targetDays?: DayOfWeek[],
    scope: UpdateScope = 'series'
  ) => {
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;

        const currentEvent = s.events.find(e => e.id === updatedEvent.id);
        if (!currentEvent) return s;

        let nextEvents = [...s.events];

        // If targetDays is provided, handle multi-day sync / expansion / reduction
        if (targetDays && targetDays.length > 0) {
          if (targetDays.length === 1) {
            const onlyDay = targetDays[0];
            if (currentEvent.seriesId) {
              if (scope === 'single') {
                // Detach just this event to onlyDay
                nextEvents = nextEvents.map(e =>
                  e.id === updatedEvent.id
                    ? {
                        ...updatedEvent,
                        day: onlyDay,
                        seriesId: undefined,
                      }
                    : e
                );
              } else {
                // Remove all other series instances, keep this one on onlyDay
                nextEvents = nextEvents.filter(
                  e => e.seriesId !== currentEvent.seriesId || e.id === updatedEvent.id
                );
                nextEvents = nextEvents.map(e =>
                  e.id === updatedEvent.id
                    ? {
                        ...updatedEvent,
                        day: onlyDay,
                        seriesId: undefined,
                      }
                    : e
                );
              }
            } else {
              // Single event moved to onlyDay
              nextEvents = nextEvents.map(e =>
                e.id === updatedEvent.id
                  ? {
                      ...updatedEvent,
                      day: onlyDay,
                    }
                  : e
              );
            }
          } else {
            // Target days has multiple days (e.g. Mon, Wed, Fri)
            const seriesId = currentEvent.seriesId || generateId();
            const targetDaysSet = new Set(targetDays);

            // Find all days that currently exist for this series
            const existingSeriesEvents = currentEvent.seriesId
              ? nextEvents.filter(e => e.seriesId === currentEvent.seriesId)
              : [currentEvent];
            const existingDays = new Set(existingSeriesEvents.map(e => e.day));

            // Remove events whose day is no longer in targetDays
            if (currentEvent.seriesId) {
              nextEvents = nextEvents.filter(e => {
                if (e.seriesId === currentEvent.seriesId) {
                  return targetDaysSet.has(e.day);
                }
                return true;
              });
            }

            // Update all remaining events for this series
            nextEvents = nextEvents.map(e => {
              if (
                e.id === currentEvent.id ||
                (currentEvent.seriesId && e.seriesId === currentEvent.seriesId)
              ) {
                return {
                  ...e,
                  title: updatedEvent.title,
                  startMinutes: updatedEvent.startMinutes,
                  durationMinutes: updatedEvent.durationMinutes,
                  color: updatedEvent.color,
                  description: updatedEvent.description,
                  seriesId,
                };
              }
              return e;
            });

            // Create new events for newly added days
            for (const day of targetDays) {
              if (!existingDays.has(day)) {
                nextEvents.push({
                  id: generateId(),
                  seriesId,
                  title: updatedEvent.title,
                  day,
                  startMinutes: updatedEvent.startMinutes,
                  durationMinutes: updatedEvent.durationMinutes,
                  color: updatedEvent.color,
                  description: updatedEvent.description,
                });
              }
            }
          }
        } else {
          // Standard update without targetDays change
          if (scope === 'series' && updatedEvent.seriesId) {
            nextEvents = nextEvents.map(ev => {
              if (ev.seriesId === updatedEvent.seriesId) {
                return {
                  ...ev,
                  title: updatedEvent.title,
                  startMinutes: updatedEvent.startMinutes,
                  durationMinutes: updatedEvent.durationMinutes,
                  color: updatedEvent.color,
                  description: updatedEvent.description,
                };
              }
              return ev;
            });
          } else {
            nextEvents = nextEvents.map(ev => {
              if (ev.id === updatedEvent.id) {
                return {
                  ...updatedEvent,
                  seriesId: undefined,
                };
              }
              return ev;
            });
          }
        }

        return { ...s, events: nextEvents, updatedAt: Date.now() };
      })
    );
  };

  const deleteEvent = (eventId: string, scope: DeleteScope) => {
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;

        const target = s.events.find(e => e.id === eventId);
        if (!target) return s;

        let nextEvents: PlannerEvent[];
        if (scope === 'series' && target.seriesId) {
          nextEvents = s.events.filter(e => e.seriesId !== target.seriesId);
        } else {
          nextEvents = s.events.filter(e => e.id !== eventId);
        }

        return { ...s, events: nextEvents, updatedAt: Date.now() };
      })
    );
  };

  const unlinkEvent = (eventId: string) => {
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;
        return {
          ...s,
          events: s.events.map(ev => (ev.id === eventId ? { ...ev, seriesId: undefined } : ev)),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const moveOrResizeEvent = (
    eventId: string,
    newDay: DayOfWeek,
    newStartMinutes: number,
    newDurationMinutes: number,
    scope: UpdateScope = 'single'
  ) => {
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;

        const target = s.events.find(e => e.id === eventId);
        if (!target) return s;

        let nextEvents = [...s.events];

        if (scope === 'series' && target.seriesId) {
          // Update time and duration for all days in the series, but keep their assigned day
          nextEvents = nextEvents.map(ev => {
            if (ev.seriesId === target.seriesId) {
              return {
                ...ev,
                startMinutes: newStartMinutes,
                durationMinutes: newDurationMinutes,
              };
            }
            return ev;
          });
        } else {
          // Update day, start time, duration for just this one event (and detach if moved away)
          nextEvents = nextEvents.map(ev => {
            if (ev.id === eventId) {
              return {
                ...ev,
                day: newDay,
                startMinutes: newStartMinutes,
                durationMinutes: newDurationMinutes,
                // If it belonged to a series and was modified singly, detach it
                seriesId: undefined,
              };
            }
            return ev;
          });
        }

        return { ...s, events: nextEvents, updatedAt: Date.now() };
      })
    );
  };

  const openCreateModal = (day?: DayOfWeek, startMinutes?: number, durationMinutes?: number) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      initialDay: day ?? 'monday',
      initialStartMinutes: startMinutes ?? 9 * 60,
      initialDurationMinutes: durationMinutes ?? 60,
    });
  };

  const openEditModal = (event: PlannerEvent) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      event,
      initialDay: event.day,
      initialStartMinutes: event.startMinutes,
      initialDurationMinutes: event.durationMinutes,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
    });
  };

  // Multi-selection methods
  const toggleSelectEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const clearSelection = () => {
    setSelectedEventIds([]);
  };

  const batchUpdateColor = (color: string) => {
    if (selectedEventIds.length === 0) return;
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;
        const set = new Set(selectedEventIds);
        return {
          ...s,
          events: s.events.map(e => (set.has(e.id) ? { ...e, color } : e)),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const batchDeleteSelected = () => {
    if (selectedEventIds.length === 0) return;
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;
        const set = new Set(selectedEventIds);
        return {
          ...s,
          events: s.events.filter(e => !set.has(e.id)),
          updatedAt: Date.now(),
        };
      })
    );
    setSelectedEventIds([]);
  };

  const batchDuplicateSelected = () => {
    if (selectedEventIds.length === 0) return;
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;
        const set = new Set(selectedEventIds);
        const toDuplicate = s.events.filter(e => set.has(e.id));
        const newClones: PlannerEvent[] = toDuplicate.map(e => ({
          ...e,
          id: generateId(),
          seriesId: undefined,
          title: `${e.title} (Copy)`,
          startMinutes: Math.min(1440 - e.durationMinutes, e.startMinutes + 30),
        }));
        return {
          ...s,
          events: [...s.events, ...newClones],
          updatedAt: Date.now(),
        };
      })
    );
    setSelectedEventIds([]);
  };

  const moveEventsGroup = (
    updates: { id: string; newDay: DayOfWeek; newStartMinutes: number; newDurationMinutes: number }[]
  ) => {
    const updateMap = new Map(updates.map(u => [u.id, u]));
    setSchedules(prev =>
      prev.map(s => {
        if (s.id !== activeId) return s;
        return {
          ...s,
          events: s.events.map(e => {
            const up = updateMap.get(e.id);
            if (up) {
              return {
                ...e,
                day: up.newDay,
                startMinutes: up.newStartMinutes,
                durationMinutes: up.newDurationMinutes,
              };
            }
            return e;
          }),
          updatedAt: Date.now(),
        };
      })
    );
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        activeSchedule,
        theme,
        modalState,
        selectedEventIds,
        toggleTheme,
        switchSchedule,
        createSchedule,
        duplicateSchedule,
        renameSchedule,
        deleteSchedule,
        resetToStarter,
        exportActiveSchedule,
        importScheduleFromJson,
        addEvents,
        updateEvent,
        deleteEvent,
        unlinkEvent,
        moveOrResizeEvent,
        toggleSelectEvent,
        clearSelection,
        batchUpdateColor,
        batchDeleteSelected,
        batchDuplicateSelected,
        moveEventsGroup,
        openCreateModal,
        openEditModal,
        closeModal,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return ctx;
}
