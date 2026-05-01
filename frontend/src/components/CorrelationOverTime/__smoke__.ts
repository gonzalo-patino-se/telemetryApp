// Phase 1 smoke test for CorrelationOverTime foundation.
// Run with: npx tsx src/components/CorrelationOverTime/__smoke__.ts
// (or compile + node). Pure-logic only — no network, no React.

import { SIGNAL_CATALOG, SIGNAL_BY_ID, DEFAULT_SIGNAL_IDS } from './signalCatalog';
import { EVENT_CATALOG, EVENT_BY_ID, DEFAULT_EVENT_IDS, buildEventQuery } from './eventCatalog';
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
  DEFAULT_SIGNAL_IDS.every(id => SIGNAL_BY_ID[id]),
  'default signal ids all resolve in SIGNAL_BY_ID',
);
const sample = SIGNAL_BY_ID['pv1_v'];
assert(sample !== undefined, 'pv1_v exists in catalog');
const kql = sample.buildQuery('ABC123', new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T06:00:00Z'));
assert(typeof kql === 'string' && kql.length > 0, 'pv1_v.buildQuery returns non-empty KQL');

console.log('\n[eventCatalog]');
assert(EVENT_CATALOG.length === 3, 'three event categories registered');
assert(
  new Set(EVENT_CATALOG.map(e => e.id)).size === 3,
  'all event ids are unique',
);
assert(
  DEFAULT_EVENT_IDS.every(id => EVENT_BY_ID[id]),
  'default event ids resolve',
);
const eq = buildEventQuery('ABC123', new Date('2026-01-01T00:00:00'), new Date('2026-01-01T01:00:00'), '1');
assert(eq.includes('Alarms'), 'event KQL targets Alarms table');
assert(eq.includes("comms_serial contains s"), 'event KQL filters by serial');
assert(eq.includes('| where value == 1'), 'event KQL applies output filter for active alarms');

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

console.log('\n[chartUtils.buildOverlapMarkers]');
{
  const series: SignalSeries[] = [
    { id: 's1', label: 'S1', unit: '', color: '#0f0', points: [{ t: 1000, v: 1 }] },
    { id: 's2', label: 'S2', unit: '', color: '#00f', points: [{ t: 1001, v: 2 }] }, // same bin
    { id: 's3', label: 'S3', unit: '', color: '#f00', points: [{ t: 9000, v: 3 }] }, // alone
  ];
  const events: EventInstance[] = [];
  const markers = buildOverlapMarkers(series, events, [0, 10000], 50);
  assert(markers.length === 1, 'two series in same bin produce one overlap marker');
  assert(markers[0].count === 2, 'marker count reflects 2 entities');
  // Now add an event in s3's bin -> second overlap
  const events2: EventInstance[] = [
    { id: 'e1', categoryId: 'c1', categoryLabel: 'C1', color: '#f0f', t: 9050, title: 'x' },
  ];
  const markers2 = buildOverlapMarkers(series, events2, [0, 10000], 50);
  assert(markers2.length === 2, 'event aligned with a sole series creates a second overlap');
  // Same-entity duplicates should NOT trigger overlap.
  const sameId: SignalSeries[] = [
    { id: 's1', label: 'S1', unit: '', color: '#0f0', points: [{ t: 1000, v: 1 }, { t: 1001, v: 2 }] },
  ];
  const markers3 = buildOverlapMarkers(sameId, [], [0, 10000], 50);
  assert(markers3.length === 0, 'same-series points do not count as overlap');
}

console.log('\n[interactionUtils.nearestPointAt]');
{
  const pts = [
    { t: 100, v: 1 },
    { t: 200, v: 2 },
    { t: 300, v: 3 },
    { t: 400, v: 4 },
  ];
  assert(nearestPointAt(pts, 205, 50)?.t === 200, 'finds nearest within tolerance');
  assert(nearestPointAt(pts, 250, 50)?.t === 200 || nearestPointAt(pts, 250, 50)?.t === 300, 'midpoint resolves to one neighbor');
  assert(nearestPointAt(pts, 1000, 50) === undefined, 'returns undefined when too far');
  assert(nearestPointAt([], 100, 50) === undefined, 'empty input -> undefined');
}

console.log('\n[interactionUtils.nearestEventsAt]');
{
  const ev: EventInstance[] = [
    { id: 'a', categoryId: 'c', categoryLabel: 'C', color: '#000', t: 100, title: 'a' },
    { id: 'b', categoryId: 'c', categoryLabel: 'C', color: '#000', t: 110, title: 'b' },
    { id: 'c', categoryId: 'c', categoryLabel: 'C', color: '#000', t: 500, title: 'c' },
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
  assert(pins.length === 2 && !pins.some(p => Math.abs(p - 200) <= 5), 'click within tolerance of an existing pin removes it');
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
  const tol = toleranceFromSpan(1000, 200); // 5 units
  const r = readoutAt(series, 102, tol);
  assert(r.length === 2, 'one readout per series');
  assert(r[0].value === 10, 'series A reads nearest sample');
  assert(r[1].value === undefined, 'empty series returns undefined value');
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failure${failures === 1 ? '' : 's'})`);
if (failures > 0) throw new Error(`Smoke test failed with ${failures} failures`);
