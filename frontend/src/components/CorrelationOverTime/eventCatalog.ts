// eventCatalog.ts
// Event handling for the Correlation card.
//
// IMPORTANT: this module mirrors the proven KQL from src/pages/Events.tsx
// (buildEventsKql) so the Correlation card returns the same rows the user
// already sees on the Events tab. Differences from the Events tab:
//   - we always use outputFilter='all' (active + cleared transitions)
//   - we cap the row count at a smaller limit to keep the card snappy
//
// We do NOT introduce a separate KQL dialect — every change to the Events
// query should be made here in lockstep with Events.tsx.

// ---------------------------------------------------------------------------
// KQL builder (parity with Events.tsx)
// ---------------------------------------------------------------------------

function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

/** Format a Date as a KQL datetime literal in *local* time (matches Events.tsx). */
function toLocalKqlDatetime(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.0000`;
}

/** Soft cap on rows returned for the card. The Events tab uses 20000. */
const MAX_EVENTS_FETCH = 5000;

/**
 * Server-side filter applied as `| where value == X`. Mirrors Events.tsx.
 * 'all' omits the clause entirely (active + cleared transitions).
 */
export type EventsOutputFilter = '1' | '0' | 'all';

/**
 * Build the exact same KQL the Events tab uses. Returned rows are shaped
 * { localtime, name, value }. The default outputFilter='1' (active alarms
 * only) matches the Events tab's default and is critical for keeping the
 * row count manageable on long ranges (e.g. 7 days).
 */
export function buildEventQuery(
  serial: string,
  from: Date,
  to: Date,
  limit: number = MAX_EVENTS_FETCH,
  outputFilter: EventsOutputFilter = '1',
): string {
  const s = escapeKqlString(serial);
  const startLocal = toLocalKqlDatetime(from);
  const endLocal = toLocalKqlDatetime(to);
  const outputClause =
    outputFilter === 'all' ? '' : `| where value == ${outputFilter}`;
  return `
    let s = '${s}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Alarms
    | where comms_serial contains s
    | where localtime between (start .. finish)
    ${outputClause}
    | sort by localtime desc
    | project localtime, name, value
    | take ${limit}
  `.trim();
}

// ---------------------------------------------------------------------------
// Color palette for event names
// ---------------------------------------------------------------------------

/**
 * 12 visually distinct categorical colors used as scatter-dot colors for
 * event names.
 */
export const EVENT_NAME_PALETTE: readonly string[] = [
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#84cc16', // lime
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#eab308', // yellow
  '#10b981', // emerald
  '#d946ef', // fuchsia
] as const;

/** Stable djb2 hash → palette index. Same name → same color, every time. */
function hashStringToInt(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Returns a deterministic palette color for the given event name. */
export function colorForEventName(name: string): string {
  const key = (name ?? '').trim();
  return EVENT_NAME_PALETTE[hashStringToInt(key) % EVENT_NAME_PALETTE.length];
}
