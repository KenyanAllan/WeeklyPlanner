export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayInfo {
  key: DayOfWeek;
  short: string;
  label: string;
  full: string;
}

export const DAYS_OF_WEEK: DayInfo[] = [
  { key: 'monday', short: 'Mon', label: 'Monday', full: 'Monday' },
  { key: 'tuesday', short: 'Tue', label: 'Tuesday', full: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday', full: 'Wednesday' },
  { key: 'thursday', short: 'Thu', label: 'Thursday', full: 'Thursday' },
  { key: 'friday', short: 'Fri', label: 'Friday', full: 'Friday' },
  { key: 'saturday', short: 'Sat', label: 'Saturday', full: 'Saturday' },
  { key: 'sunday', short: 'Sun', label: 'Sunday', full: 'Sunday' },
];

export interface PlannerEvent {
  id: string;
  seriesId?: string; // ID shared by repeating blocks in a series
  title: string;
  day: DayOfWeek;
  startMinutes: number; // 0 to 1439 (minutes from midnight)
  durationMinutes: number; // 15 to 1440
  color: string; // Hex color string
  description?: string;
}

export interface PositionedEvent extends PlannerEvent {
  column: number;
  totalColumns: number;
}

export interface Schedule {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  events: PlannerEvent[];
}

export type UpdateScope = 'single' | 'series';
export type DeleteScope = 'single' | 'series';

export interface ActiveDragAction {
  type: 'create' | 'move' | 'resize-top' | 'resize-bottom';
  event?: PlannerEvent;
  initialDay: DayOfWeek;
  currentDay: DayOfWeek;
  initialStartMinutes: number;
  currentStartMinutes: number;
  initialDurationMinutes: number;
  currentDurationMinutes: number;
}

