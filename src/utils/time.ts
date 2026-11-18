/**
 * Snaps minutes to nearest 15-minute boundary, clamped between min and max (default 0 to 1440).
 */
export function snapTo15(minutes: number, min = 0, max = 1440): number {
  const snapped = Math.round(minutes / 15) * 15;
  return Math.max(min, Math.min(max, snapped));
}

/**
 * Formats minutes from midnight to 12-hour time string (e.g., 540 -> "9:00 AM", 750 -> "12:30 PM").
 */
export function formatMinutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minsStr} ${period}`;
}

/**
 * Formats minutes from midnight to "HH:mm" 24h format for HTML time inputs.
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Converts "HH:mm" time input string to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats duration in minutes into a friendly string (e.g. 45m, 1h, 1h 30m, 2h).
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Returns formatted time range, e.g. "9:00 AM – 10:30 AM"
 */
export function formatTimeRange(startMinutes: number, durationMinutes: number): string {
  const start = formatMinutesToTime(startMinutes);
  const end = formatMinutesToTime(startMinutes + durationMinutes);
  return `${start} – ${end}`;
}

