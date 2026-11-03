import { format, parseISO, isValid, isSameDay, isWithinInterval, startOfDay, endOfDay, compareAsc } from 'date-fns';

/**
 * Normalizes any timestamp/date input (Firestore Timestamp, JS Date, ISO string) into a JS Date
 */
export function toDate(val) {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate(); // Firestore Timestamp
  }
  if (val.seconds) {
    return new Date(val.seconds * 1000);
  }
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseISO(val);
    if (isValid(parsed)) return parsed;
    const direct = new Date(val);
    if (isValid(direct)) return direct;
  }
  return null;
}

/**
 * Format date for display: "12 Oct 2026"
 */
export function formatDate(val, formatStr = 'dd MMM yyyy') {
  const d = toDate(val);
  if (!d) return 'N/A';
  return format(d, formatStr);
}

/**
 * Format time for display: "10:30 AM"
 */
export function formatTime(val, formatStr = 'hh:mm a') {
  const d = toDate(val);
  if (!d) return 'N/A';
  return format(d, formatStr);
}

/**
 * Format date and time: "12 Oct 2026, 10:30 AM"
 */
export function formatDateTime(val) {
  const d = toDate(val);
  if (!d) return 'N/A';
  return format(d, 'dd MMM yyyy, hh:mm a');
}

/**
 * Format for HTML datetime-local input: "YYYY-MM-DDTHH:mm"
 */
export function toDateTimeLocalValue(val) {
  const d = toDate(val) || new Date();
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format for HTML date input: "YYYY-MM-DD"
 */
export function toDateInputValue(val) {
  const d = toDate(val) || new Date();
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format for HTML time input: "HH:mm"
 */
export function toTimeInputValue(val) {
  const d = toDate(val) || new Date();
  return format(d, 'HH:mm');
}

/**
 * Combines date string "YYYY-MM-DD" and time string "HH:mm" into a Date object
 */
export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() ? timeStr : '12:00';
  const combined = new Date(`${dateStr}T${time}:00`);
  return isValid(combined) ? combined : null;
}

/**
 * Checks if a given timestamp falls on targetDate (YYYY-MM-DD or Date)
 */
export function isDateOnDay(timestamp, targetDate) {
  const t = toDate(timestamp);
  const target = toDate(targetDate);
  if (!t || !target) return false;
  return isSameDay(t, target);
}

export { isWithinInterval, startOfDay, endOfDay, compareAsc };
