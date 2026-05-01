// src/components/CorrelationOverTime/eventCatalog.ts
// Event categories the user can overlay as vertical markers on the card.
// KQL is intentionally aligned with pages/Events.tsx so the card and the
// Events page show the same alarm set for a given (serial, time-range).

import type { EventDef } from './types';

// ----------------------------------------------------------------------------
// KQL helpers (mirror Events.tsx)
// ----------------------------------------------------------------------------

function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

function toLocalKqlDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.0000`
  );
}

/** Maximum events we ever fetch for the card (UI is small — keep light). */
export const CORRELATION_EVENT_LIMIT = 2000;

/** Build KQL for one event category in the card. */
export function buildEventQuery(
  serial: string,
  start: Date,
  end: Date,
  outputFilter: '1' | '0' | 'all',
  limit: number = CORRELATION_EVENT_LIMIT,
): string {
  const s = escapeKqlString(serial);
  const startLocal = toLocalKqlDatetime(start);
  const endLocal = toLocalKqlDatetime(end);
  const outputClause = outputFilter === 'all' ? '' : `| where value == ${outputFilter}`;
  return `
    let s = '${s}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Alarms
    | where comms_serial contains s
    | where localtime between (start .. finish)
    ${outputClause}
    | sort by localtime asc
    | project localtime, name, value
    | take ${limit}
  `.trim();
}

// ----------------------------------------------------------------------------
// Catalog
// ----------------------------------------------------------------------------

/**
 * Three categories cover the three Events.tsx output filters and give the user
 * meaningful, non-overlapping marker buckets. Glyphs are drawn at the top of
 * the plot area; vertical line uses `color` at low opacity.
 */
export const EVENT_CATALOG: EventDef[] = [
  {
    id: 'alarms_active',
    label: 'Active alarms',
    color: '#ef4444', // red — matches statusCritical
    outputFilter: '1',
    glyph: '▲',
  },
  {
    id: 'alarms_cleared',
    label: 'Cleared alarms',
    color: '#10b981', // green — matches statusHealthy
    outputFilter: '0',
    glyph: '▼',
  },
  {
    id: 'alarms_all',
    label: 'All alarm transitions',
    color: '#f59e0b', // amber — neutral attention
    outputFilter: 'all',
    glyph: '◆',
  },
];

export const EVENT_BY_ID: Record<string, EventDef> =
  EVENT_CATALOG.reduce<Record<string, EventDef>>((acc, e) => {
    acc[e.id] = e;
    return acc;
  }, {});

/** Default: only "Active alarms" preselected to keep the card legible. */
export const DEFAULT_EVENT_IDS: string[] = ['alarms_active'];
