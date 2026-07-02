// src/utils/timezone.ts
// ---------------------------------------------------------------------------
// Display-layer timezone formatting helpers.
//
// Timestamps throughout the app are epoch-millisecond instants. These helpers
// render a given instant in one of three modes:
//   * 'utc'     — UTC / GMT
//   * 'browser' — the viewer's local timezone (default browser behaviour)
//   * 'site'    — the customer site's timezone, given as an IANA zone name
//                 (e.g. "America/Los_Angeles") resolved from their ZIP code.
//
// All formatting goes through Intl.DateTimeFormat with an explicit `timeZone`
// so the three modes stay perfectly consistent across axes, tooltips, and
// timestamps.
// ---------------------------------------------------------------------------

export type TimezoneMode = 'utc' | 'browser' | 'site';

/**
 * Resolve the effective IANA timezone string for Intl formatting.
 * Returns `undefined` for 'browser' (Intl then uses the local zone), 'UTC' for
 * UTC, and the provided site zone for 'site' (falling back to UTC if missing).
 */
export function resolveTimeZone(
  mode: TimezoneMode,
  siteTimeZone: string | null,
): string | undefined {
  if (mode === 'utc') return 'UTC';
  if (mode === 'site') return siteTimeZone || 'UTC';
  return undefined; // browser-local
}

/**
 * Offset (in ms) of the given IANA timezone from UTC at a specific instant.
 * Positive east of UTC. DST-aware because it asks Intl for that exact instant.
 */
export function zoneOffsetMs(instant: number, timeZone: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = dtf.formatToParts(new Date(instant));
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    // Intl gives hour 24 for midnight in some engines; normalise.
    const hour = map.hour === 24 ? 0 : map.hour;
    const asUtc = Date.UTC(
      map.year,
      map.month - 1,
      map.day,
      hour,
      map.minute,
      map.second,
    );
    return asUtc - instant;
  } catch {
    // Unknown/invalid IANA zone — treat as UTC (0 offset).
    return 0;
  }
}

/**
 * Amount (in ms) to shift an instant so that a chart/axis which renders in the
 * BROWSER's local timezone will visually display the instant in `timeZone`.
 *
 * Used for Chart.js time axes: our date adapter only formats in local time, so
 * we add this shift to each point. The browser then renders the shifted value
 * with a wall-clock identical to the target timezone — giving clean, correctly
 * spaced ticks without a timezone-aware adapter.
 *
 * Returns 0 when `timeZone` is undefined (browser-local: no shift needed).
 */
export function zoneDisplayShiftMs(
  instant: number,
  timeZone: string | undefined,
): number {
  if (!timeZone) return 0;
  const localOffset = -new Date(instant).getTimezoneOffset() * 60_000;
  const targetOffset = zoneOffsetMs(instant, timeZone);
  return targetOffset - localOffset;
}

/** Short axis-tick label appropriate to the visible span, in the given zone. */
export function formatTickInZone(
  t: number,
  span: number,
  timeZone: string | undefined,
): string {
  const d = new Date(t);
  // < 6h: HH:MM
  if (span <= 6 * 3600_000) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  }
  // < 3d: M/D HH:MM
  if (span <= 3 * 24 * 3600_000) {
    const md = d.toLocaleDateString([], {
      month: 'numeric',
      day: 'numeric',
      timeZone,
    });
    const hm = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
    return `${md} ${hm}`;
  }
  // longer: just date
  return d.toLocaleDateString([], {
    month: 'numeric',
    day: 'numeric',
    timeZone,
  });
}

/** Full timestamp for tooltips/readouts, in the given zone. */
export function formatFullInZone(
  t: number,
  timeZone: string | undefined,
): string {
  return new Date(t).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  });
}

/** A short label describing the active zone, e.g. "UTC", "Local", "PDT". */
export function tzModeLabel(
  mode: TimezoneMode,
  abbreviation: string | null,
): string {
  if (mode === 'utc') return 'UTC';
  if (mode === 'browser') return 'Local';
  return abbreviation || 'Site';
}
