// Phase 1 smoke test for CorrelationOverTime foundation.
// Run with: npx tsx src/components/CorrelationOverTime/__smoke__.ts
// (or compile + node). Pure-logic only — no network, no React.

import { SIGNAL_CATALOG, SIGNAL_BY_ID, DEFAULT_SIGNAL_IDS } from './signalCatalog';
import { EVENT_CATALOG, EVENT_BY_ID, DEFAULT_EVENT_IDS, buildEventQuery } from './eventCatalog';

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

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failure${failures === 1 ? '' : 's'})`);
if (failures > 0) throw new Error(`Smoke test failed with ${failures} failures`);
