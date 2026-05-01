// Smoke tests for the CorrelationOverTime card foundation.
// Run with: npx tsx src/components/CorrelationOverTime/__smoke__.ts
//
// Pure-logic only — no network, no React.
//
// v2 covers the dynamic-event redesign: event picker is now driven by
// runtime-discovered names (each with its own deterministic color) and
// pin snapshots can be exported to CSV.

import { SIGNAL_CATALOG, SIGNAL_BY_ID, DEFAULT_SIGNAL_IDS } from './signalCatalog';
import {
  buildEventQuery,
  colorForEventName,
  EVENT_NAME_PALETTE,
} from './eventCatalog';
import {
  buildOverlapMarkers,
  computeXDomain,
  formatXTick,
  paddedYDomain,
} from './chartUtils';
import {
  clearOutOfRangePins,
  nearestEventsAt,
  nearestPointAt,
  readoutAt,
  togglePin,
  toleranceFromSpan,
} from './interactionUtils';
import { buildPinsCsv, buildPinsCsvFilename } from './csvUtils';
import type { EventInstance, SignalSeries } from './types';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error('  ✗', msg);
    failures++;
  } else {
    console.log('  ✓', msg);
  }
}

// ---------------------------------------------------------------------------
console.log('\n[signalCatalog]');
assert(SIGNAL_CATALOG.length >= 10, 'catalog has >= 10 signals');
assert(
  new Set(SIGNAL_CATALOG.map(s => s.id)).size === SIGNAL_CATALOG.length,
  'all signal ids are unique',
);
assert(
  SIGNAL_CATALOG.every(s => typeof s.color === 'string' && s.color.startsWith('#')),
  'every signal has a hex color',
);
assert(
  new Set(SIGNAL_CATALOG.map(s => `${s.color}|${s.dash ?? ''}`)).size === SIGNAL_CATALOG.length,
  'every signal has a unique (color, dash) signature',
);
assert(
  DEFAULT_SIGNAL_IDS.every(id => SIGNAL_BY_ID[id]),
  'default signal ids all resolve in SIGNAL_BY_ID',
);
{
  const sample = SIGNAL_BY_ID['pv1_v'];
  assert(sample !== undefined, 'pv1_v exists in catalog');
  if (sample) {
    const kql = sample.buildQuery(
      'ABC123',
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-01T06:00:00Z'),
    );
    assert(typeof kql === 'string' && kql.length > 0, 'pv1_v.buildQuery returns non-empty KQL');
  }
}

// ---------------------------------------------------------------------------
console.log('\n[eventCatalog: dynamic name model]');
{
  // Default filter is now '1' (active only) — keeps row counts manageable on 7d ranges.
  const eqDefault = buildEventQuery(
    'ABC123',
    new Date('2026-01-01T00:00:00'),
    new Date('2026-01-01T01:00:00'),
  );
  assert(eqDefault.includes('Alarms'), 'event KQL targets Alarms table');
  assert(eqDefault.includes('comms_serial contains s'), 'event KQL filters via comms_serial (Events.tsx parity)');
  assert(eqDefault.includes('between (start .. finish)'), 'event KQL applies the time-range filter');
  assert(eqDefault.includes('project localtime, name, value'), 'event KQL projects value (not value_double)');
  assert(eqDefault.includes('| where value == 1'), 'default outputFilter is 1 (active only)');
  assert(eqDefault.includes("let s = 'ABC123';"), 'serial bound as KQL local');

  // outputFilter='all' omits the where clause.
  const eqAll = buildEventQuery(
    'ABC123',
    new Date('2026-01-01T00:00:00'),
    new Date('2026-01-01T01:00:00'),
    undefined,
    'all',
  );
  assert(!eqAll.includes('| where value =='), "outputFilter='all' omits the value filter clause");

  // outputFilter='0' = cleared only.
  const eqCleared = buildEventQuery(
    'ABC123',
    new Date('2026-01-01T00:00:00'),
    new Date('2026-01-01T01:00:00'),
    undefined,
    '0',
  );
  assert(eqCleared.includes('| where value == 0'), "outputFilter='0' filters cleared transitions");

  // Determinism: same name → same color, every time.
  const a = colorForEventName('AC_VOLT_HIGH');
  const b = colorForEventName('AC_VOLT_HIGH');
  assert(a === b, 'colorForEventName is deterministic');
  assert(EVENT_NAME_PALETTE.includes(a as typeof EVENT_NAME_PALETTE[number]), 'name color comes from palette');
  assert(
    colorForEventName('AC_VOLT_HIGH') === colorForEventName('  AC_VOLT_HIGH  '),
    'colorForEventName trims whitespace',
  );
  const names = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8'];
  const colors = new Set(names.map(colorForEventName));
  assert(colors.size >= 3, 'palette spreads across multiple buckets for varied names');
}

// ---------------------------------------------------------------------------
console.log('\n[chartUtils.paddedYDomain]');
{
  const [lo, hi] = paddedYDomain(0, 100);
  assert(lo < 0 && hi > 100, 'pads above and below the range');
  const flat = paddedYDomain(50, 50);
  assert(flat[0] < 50 && flat[1] > 50, 'flat series gets a non-zero domain');
  const fallback = paddedYDomain(undefined, undefined);
  assert(fallback[0] === 0 && fallback[1] === 1, 'undefined inputs fall back to [0,1]');
}

console.log('\n[chartUtils.computeXDomain]');
{
  const start = new Date('2026-01-01T00:00:00Z');
  const end = new Date('2026-01-01T06:00:00Z');
  const [lo, hi] = computeXDomain(start, end, [], []);
  assert(lo === start.getTime() && hi === end.getTime(), 'explicit time range wins');
  const series: SignalSeries[] = [
    { id: 'a', label: 'a', unit: '', color: '#000', points: [{ t: 100, v: 1 }, { t: 500, v: 2 }] },
  ];
  const [lo2, hi2] = computeXDomain(null, null, series, []);
  assert(lo2 === 100 && hi2 === 500, 'falls back to data min/max when no range given');
}

console.log('\n[chartUtils.formatXTick]');
{
  const t = new Date('2026-01-01T13:45:00').getTime();
  const short = formatXTick(t, 1 * 3600_000);
  assert(/\d{1,2}:\d{2}/.test(short), 'sub-6h tick is HH:MM');
  const mid = formatXTick(t, 24 * 3600_000);
  assert(mid.includes('/'), 'sub-3d tick contains M/D');
  const long = formatXTick(t, 14 * 24 * 3600_000);
  assert(/\d+\/\d+/.test(long) && !long.includes(':'), 'long-range tick is date-only');
}

// ---------------------------------------------------------------------------
console.log('\n[chartUtils.buildOverlapMarkers]');
{
  const series: SignalSeries[] = [
    { id: 's1', label: 'S1', unit: '', color: '#0f0', points: [{ t: 1000, v: 1 }] },
    { id: 's2', label: 'S2', unit: '', color: '#00f', points: [{ t: 1001, v: 2 }] },
    { id: 's3', label: 'S3', unit: '', color: '#f00', points: [{ t: 9000, v: 3 }] },
  ];
  const markers = buildOverlapMarkers(series, [], [0, 10000], 50);
  assert(markers.length === 1, 'two series in same bin produce one overlap marker');
  assert(markers[0].count === 2, 'marker count reflects 2 entities');

  // Event in s3's bin — overlap fires because categoryId for an event is now
  // its name (distinct from any series id).
  const events: EventInstance[] = [
    {
      id: 'e1',
      categoryId: 'AC_VOLT_HIGH',
      categoryLabel: 'AC_VOLT_HIGH',
      color: '#f0f',
      t: 9050,
      title: 'AC_VOLT_HIGH',
    },
  ];
  const markers2 = buildOverlapMarkers(series, events, [0, 10000], 50);
  assert(markers2.length === 2, 'event aligned with a sole series creates a second overlap');
}

// ---------------------------------------------------------------------------
console.log('\n[interactionUtils.nearestPointAt]');
{
  const pts = [
    { t: 100, v: 1 }, { t: 200, v: 2 }, { t: 300, v: 3 }, { t: 400, v: 4 },
  ];
  assert(nearestPointAt(pts, 205, 50)?.t === 200, 'finds nearest within tolerance');
  assert(nearestPointAt(pts, 1000, 50) === undefined, 'returns undefined when too far');
  assert(nearestPointAt([], 100, 50) === undefined, 'empty input -> undefined');
}

console.log('\n[interactionUtils.nearestEventsAt]');
{
  const ev: EventInstance[] = [
    { id: 'a', categoryId: 'X', categoryLabel: 'X', color: '#000', t: 100, title: 'X' },
    { id: 'b', categoryId: 'X', categoryLabel: 'X', color: '#000', t: 110, title: 'X' },
    { id: 'c', categoryId: 'X', categoryLabel: 'X', color: '#000', t: 500, title: 'X' },
  ];
  assert(nearestEventsAt(ev, 105, 10).length === 2, 'returns events within ±tolerance');
  assert(nearestEventsAt(ev, 105, 1).length === 0, 'tight tolerance excludes all');
}

console.log('\n[interactionUtils.togglePin]');
{
  let pins: number[] = [];
  pins = togglePin(pins, 100, 5, 3);
  assert(pins.length === 1 && pins[0] === 100, 'add first pin');
  pins = togglePin(pins, 200, 5, 3);
  pins = togglePin(pins, 300, 5, 3);
  assert(pins.length === 3, 'three pins held');
  pins = togglePin(pins, 400, 5, 3);
  assert(pins.length === 3 && pins[0] === 200, 'fourth pin drops oldest (FIFO)');
  pins = togglePin(pins, 202, 5, 3);
  assert(pins.length === 2 && !pins.some(p => Math.abs(p - 200) <= 5), 'click within tolerance removes existing pin');
}

console.log('\n[interactionUtils.clearOutOfRangePins]');
{
  const kept = clearOutOfRangePins([50, 150, 250, 999], [100, 300]);
  assert(kept.length === 2 && kept[0] === 150 && kept[1] === 250, 'pins outside [lo,hi] are dropped');
}

console.log('\n[interactionUtils.readoutAt + toleranceFromSpan]');
{
  const series: SignalSeries[] = [
    { id: 'a', label: 'A', unit: 'V', color: '#000', points: [{ t: 100, v: 10 }, { t: 200, v: 20 }] },
    { id: 'b', label: 'B', unit: 'A', color: '#111', points: [] },
  ];
  const tol = toleranceFromSpan(1000, 200);
  const r = readoutAt(series, 102, tol);
  assert(r.length === 2, 'one readout per series');
  assert(r[0].value === 10, 'series A reads nearest sample');
  assert(r[1].value === undefined, 'empty series returns undefined value');
}

// ---------------------------------------------------------------------------
console.log('\n[csvUtils.buildPinsCsv]');
{
  const series: SignalSeries[] = [
    { id: 'pv1_v', label: 'PV1 Voltage', unit: 'V', color: '#10b981',
      points: [{ t: 1000, v: 380.5 }, { t: 2000, v: 382.1 }, { t: 3000, v: 0 }] },
    { id: 'gridv', label: 'Grid V L1', unit: 'V', color: '#f59e0b',
      points: [{ t: 1000, v: 119.2 }, { t: 2000, v: 119.8 }, { t: 3000, v: 119.9 }] },
  ];
  const events: EventInstance[] = [
    { id: 'e1', categoryId: 'AC_VOLT_HIGH', categoryLabel: 'AC_VOLT_HIGH',
      color: '#ef4444', t: 1995, title: 'AC_VOLT_HIGH', value: 1, description: 'active' },
  ];
  const csv = buildPinsCsv({
    pins: [1000, 2000],
    series,
    events,
    tolerance: 50,
    serial: 'ABC123',
  });
  const lines = csv.trim().split(/\r?\n/);
  assert(lines[0].startsWith('pin_index,iso_timestamp,'), 'header row present');
  // Pin 1: 2 signal rows + 0 event rows. Pin 2: 2 signal rows + 1 event row.
  assert(lines.length === 1 + 2 + 2 + 1, `expected 6 data rows, got ${lines.length - 1}`);
  // First signal row at pin 1
  const pin1Row = lines[1].split(',');
  assert(pin1Row[0] === '1', 'pin_index is 1 for first pin');
  assert(pin1Row[3] === 'ABC123', 'serial column populated');
  assert(pin1Row[4] === 'signal', 'type=signal for signal rows');
  assert(pin1Row[5] === 'PV1 Voltage', 'name column has the signal label');
  assert(pin1Row[7] === 'V', 'unit column is V');
  // Event row should appear at pin 2 (last data line)
  const eventRow = lines[lines.length - 1].split(',');
  assert(eventRow[0] === '2', 'event row belongs to pin 2');
  assert(eventRow[4] === 'event', 'type=event for event rows');
  assert(eventRow[5] === 'AC_VOLT_HIGH', 'event name preserved');
  assert(eventRow[6] === '1', 'event value (1=active) preserved');
  assert(eventRow[8] === 'active', 'event detail = active');

  // Quoting: a name with a comma should round-trip safely.
  const seriesCommas: SignalSeries[] = [{
    id: 'x', label: 'Weird, name', unit: 'V', color: '#000',
    points: [{ t: 1000, v: 1 }],
  }];
  const csv2 = buildPinsCsv({
    pins: [1000], series: seriesCommas, events: [], tolerance: 50,
  });
  assert(csv2.includes('"Weird, name"'), 'comma-containing label is quoted');

  // No serial: column is empty but row still emitted.
  const csv3 = buildPinsCsv({
    pins: [1000], series, events: [], tolerance: 50,
  });
  const cells = csv3.trim().split(/\r?\n/)[1].split(',');
  assert(cells[3] === '', 'serial empty when not provided');
}

console.log('\n[csvUtils.buildPinsCsvFilename]');
{
  const f1 = buildPinsCsvFilename('ABC/123');
  assert(/^correlation_pins_ABC_123_/.test(f1), 'serial sanitized for filesystem');
  assert(f1.endsWith('.csv'), 'filename ends with .csv');
  const f2 = buildPinsCsvFilename(null);
  assert(f2.startsWith('correlation_pins_unknown_'), 'null serial -> "unknown"');
}

// ---------------------------------------------------------------------------
console.log('\n[integration: pin lifecycle on range change]');
{
  const pinsBefore = [
    new Date('2026-01-01T00:30:00').getTime(),
    new Date('2026-01-01T01:30:00').getTime(),
    new Date('2026-01-01T05:00:00').getTime(),
  ];
  const newDomain: [number, number] = [
    new Date('2026-01-01T01:00:00').getTime(),
    new Date('2026-01-01T02:00:00').getTime(),
  ];
  const after = clearOutOfRangePins(pinsBefore, newDomain);
  assert(after.length === 1, 'only the 01:30 pin survives the range narrowing');
  assert(after[0] === pinsBefore[1], 'surviving pin identity preserved');
}

console.log('\n[integration: tolerance scales with span]');
{
  const shortSpanTol = toleranceFromSpan(60_000);
  const longSpanTol = toleranceFromSpan(7 * 24 * 3600_000);
  assert(longSpanTol > shortSpanTol * 100, 'tolerance grows with span');
  assert(toleranceFromSpan(0) >= 1, 'zero/invalid span yields safe minimum');
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failure${failures === 1 ? '' : 's'})`);
if (failures > 0) throw new Error(`Smoke test failed with ${failures} failures`);
