import type { Schedule, PlannerEvent, DayOfWeek } from '../types/schedule';

export const STORAGE_KEY_SCHEDULES = 'weekly_planner_schedules_v1';
export const STORAGE_KEY_ACTIVE_ID = 'weekly_planner_active_id_v1';
export const STORAGE_KEY_THEME = 'weekly_planner_theme_v1';

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Generate recurring events across multiple days
function createRecurringEvents(
  title: string,
  days: DayOfWeek[],
  startMinutes: number,
  durationMinutes: number,
  color: string,
  description?: string
): PlannerEvent[] {
  const seriesId = generateId();
  return days.map(day => ({
    id: generateId(),
    seriesId,
    title,
    day,
    startMinutes,
    durationMinutes,
    color,
    description,
  }));
}

export function getDefaultStarterSchedule(): Schedule {
  const now = Date.now();
  const scheduleId = 'default-ideal-week';

  const events: PlannerEvent[] = [
    // Morning Routine (Mon-Fri 7:00 AM - 8:00 AM)
    ...createRecurringEvents(
      'Morning Routine & Coffee',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      7 * 60,
      60,
      '#f59e0b',
      'Hydrate, stretch, espresso, and review daily priorities'
    ),

    // Deep Work Morning Block (Mon-Fri 9:00 AM - 12:00 PM)
    ...createRecurringEvents(
      'Deep Work Focus',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      9 * 60,
      180,
      '#0284c7',
      'High-leverage coding, architecture, uninterrupted block'
    ),

    // Lunch & Walk (Mon-Sun 12:00 PM - 1:00 PM)
    ...createRecurringEvents(
      'Healthy Lunch & Walk',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      12 * 60,
      60,
      '#10b981',
      'Step away from screens, fresh air'
    ),

    // Afternoon Sprint & Syncs (Mon-Fri 1:30 PM - 4:30 PM)
    ...createRecurringEvents(
      'Project Sprint & Collaboration',
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      13 * 60 + 30,
      180,
      '#6366f1',
      'Team reviews, syncs, feature execution'
    ),

    // Gym & Fitness (Mon, Wed, Fri 5:00 PM - 6:30 PM)
    ...createRecurringEvents(
      'Gym & Strength Training',
      ['monday', 'wednesday', 'friday'],
      17 * 60,
      90,
      '#f43f5e',
      'Warmup, heavy lifts, core, sauna'
    ),

    // Yoga & Recovery (Tue, Thu 5:15 PM - 6:15 PM)
    ...createRecurringEvents(
      'Mobility & Yoga',
      ['tuesday', 'thursday'],
      17 * 60 + 15,
      60,
      '#0d9488',
      'Flexibility and breathing session'
    ),

    // Reading & Relaxation (Mon, Wed, Sun 8:30 PM - 10:00 PM)
    ...createRecurringEvents(
      'Reading & Unwind',
      ['monday', 'wednesday', 'sunday'],
      20 * 60 + 30,
      90,
      '#8b5cf6',
      'Fiction, non-fiction, no blue light screens'
    ),

    // Weekend Hike / Adventure (Saturday 9:00 AM - 1:00 PM)
    {
      id: generateId(),
      title: 'Trail Hike & Nature',
      day: 'saturday',
      startMinutes: 9 * 60,
      durationMinutes: 240,
      color: '#ea580c',
      description: 'Outdoor trail run or hike with friends',
    },

    // Sunday Weekly Review & Reset (Sunday 5:00 PM - 6:30 PM)
    {
      id: generateId(),
      title: 'Weekly Review & Goal Setting',
      day: 'sunday',
      startMinutes: 17 * 60,
      durationMinutes: 90,
      color: '#06b6d4',
      description: 'Review progress, map priorities for upcoming week',
    },
  ];

  return {
    id: scheduleId,
    name: 'Ideal Weekly Routine',
    createdAt: now,
    updatedAt: now,
    events,
  };
}

export function loadSchedulesFromStorage(): { schedules: Schedule[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULES);
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);

    if (raw) {
      const parsed = JSON.parse(raw) as Schedule[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validActiveId = parsed.some(s => s.id === activeId) ? (activeId as string) : parsed[0].id;
        return { schedules: parsed, activeId: validActiveId };
      }
    }
  } catch (err) {
    console.error('Failed to load schedules from localStorage', err);
  }

  const defaultSchedule = getDefaultStarterSchedule();
  return {
    schedules: [defaultSchedule],
    activeId: defaultSchedule.id,
  };
}

export function saveSchedulesToStorage(schedules: Schedule[], activeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeId);
  } catch (err) {
    console.error('Failed to save schedules to localStorage', err);
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'dark'; // Defaulting to dark as requested by user ("Yes the website needs a dark mode")
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // ignore
  }
}

export function exportScheduleAsJson(schedule: Schedule): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schedule, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${schedule.name.toLowerCase().replace(/\s+/g, '_')}_schedule.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
