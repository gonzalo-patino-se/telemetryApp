// src/utils/dateHelpers.ts
// Date formatting and parsing utilities
// Centralized date handling for consistency across the app

/**
 * Format date for KQL query - standard YYYY-MM-DD HH:MM:SS.0000 format
 * Used when building datetime parameters for Azure Data Explorer queries
 */
export function formatDateForKql(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.0000`;
}

/**
 * Parse localtime from Azure ADX response
 * Handles multiple formats:
 * - ISO format: "2025-03-06T15:44:33.000Z"
 * - US locale: "3/11/2025, 10:45:01 AM"
 * 
 * Returns timestamp in milliseconds for Chart.js
 */
export function parseAdxLocaltime(localtime: string): number {
  if (!localtime) return 0;

  // Check if it's US locale format: "M/D/YYYY, H:MM:SS AM/PM"
  if (localtime.includes('/') && localtime.includes(',')) {
    const [datePart, timeWithAmPm] = localtime.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);

    // Parse time with AM/PM
    const timeMatch = timeWithAmPm?.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);
      const ampm = timeMatch[4]?.toUpperCase();

      // Convert to 24-hour format
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
    }
    return new Date(year, month - 1, day).getTime();
  }

  // ISO format: "2025-03-06T15:44:33.000Z"
  // Remove Z suffix to prevent UTC interpretation
  const cleaned = localtime.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const [datePart, timePart] = cleaned.split('T');
  if (!datePart) return 0;
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = (timePart || '00:00:00')
    .split(':')
    .map(s => parseFloat(s) || 0);
  
  return new Date(
    year,
    month - 1,
    day,
    Math.floor(hours),
    Math.floor(minutes),
    Math.floor(seconds)
  ).getTime();
}

/**
 * Format timestamp to full locale string for tooltips
 * Accepts either timestamp (number) or Date object
 */
export function formatTooltipDate(input: number | Date): string {
  const date = typeof input === 'number' ? new Date(input) : input;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format date to simple locale string for display
 */
export function formatDisplayDate(date: Date | string | undefined): string {
  if (!date) return '';
  try {
    const dt = typeof date === 'string' ? new Date(date) : date;
    return dt.toLocaleString();
  } catch {
    return '';
  }
}

/**
 * Get date range for last N hours from now
 */
export function getDateRangeLastHours(hours: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Alias for getDateRangeLastHours for convenience
 */
export function getLastHours(hours: number): { start: Date; end: Date } {
  return getDateRangeLastHours(hours);
}

/**
 * Check if date range is valid (end > start, both defined)
 */
export function isValidDateRange(
  start: Date | null | undefined,
  end: Date | null | undefined
): boolean {
  if (!start || !end) return false;
  return end.getTime() > start.getTime();
}
