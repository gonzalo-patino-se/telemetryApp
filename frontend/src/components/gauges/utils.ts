// src/components/gauges/utils.ts
// Shared utility functions for gauge components

/**
 * Format timestamp from ADX localtime field
 * ADX localtime is already the end user's local time - do NOT convert
 * Just extract and display the date and time portion directly from the ISO string
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '--';
  
  try {
    const isoString = typeof timestamp === 'string' ? timestamp : String(timestamp);
    
    // Extract date and time from ISO string "2025-02-04T15:30:45.123Z"
    // Do NOT use new Date() as it will apply browser timezone conversion
    const dateMatch = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/);
    if (dateMatch) {
      const [, year, month, day, time] = dateMatch;
      // Format as "Feb 04, 2025 15:30:45"
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(month, 10) - 1] || month;
      return `${monthName} ${day}, ${year} ${time}`;
    }
    
    // Fallback: try to extract from other formats like "2025-02-04 15:30:45"
    const fallbackMatch = isoString.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (fallbackMatch) {
      const [, year, month, day, time] = fallbackMatch;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(month, 10) - 1] || month;
      return `${monthName} ${day}, ${year} ${time}`;
    }
    
    return '--';
  } catch {
    return '--';
  }
}

/**
 * Check if timestamp is stale (older than threshold)
 * Not currently used - keeping for potential future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isTimestampStale(_timestamp: string | null, _thresholdMinutes: number = 10): boolean {
  return false; // Disable stale indication for now
}
