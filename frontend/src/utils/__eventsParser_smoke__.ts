// Smoke tests for src/utils/eventsParser.ts.
//
// Run with:
//   cd frontend
//   npx tsx src/utils/__eventsParser_smoke__.ts
//
// Pure logic only, no React / no DOM. The fixture rows below are real
// payloads captured from the production ADX cluster on 2026-06-01.

import {
  normalizeAlarmRow,
  normalizeAlarmRows,
  parseEventName,
  parseEventTimestamp,
  parseEventValue,
  severityFromName,
  toIsoTimestamp,
} from './eventsParser';

let failures = 0;
function assert(cond: unknown, msg: string): void {
  if (cond) console.log('  ✓', msg);
  else {
    console.error('  ✗', msg);
    failures++;
  }
}

// ---------------------------------------------------------------------------
console.log('\n[parseEventTimestamp]');
{
  // Real ADX wire format -- the one that breaks `new Date()` in Firefox.
  const t1 = parseEventTimestamp('2026-05-31 23:30:02+00:00');
  assert(t1 === Date.UTC(2026, 4, 31, 23, 30, 2), 'ADX space+offset parsed as UTC');

  // ISO with Z.
  const t2 = parseEventTimestamp('2026-05-31T23:30:02Z');
  assert(t2 === Date.UTC(2026, 4, 31, 23, 30, 2), 'ISO Z form parsed');

  // ADX without timezone -- treated as UTC.
  const t3 = parseEventTimestamp('2026-05-31 23:30:02.1234567');
  assert(t3 === Date.UTC(2026, 4, 31, 23, 30, 2, 123), 'no-TZ form treated as UTC, fractional trimmed to ms');

  // Offset other than UTC.
  const t4 = parseEventTimestamp('2026-05-31 18:30:02-05:00');
  assert(t4 === Date.UTC(2026, 4, 31, 23, 30, 2), 'negative offset converts to UTC');

  // Epoch ms numeric.
  const t5 = parseEventTimestamp(1700000000000);
  assert(t5 === 1700000000000, 'epoch ms accepted');

  // Epoch seconds numeric -- promoted to ms.
  const t6 = parseEventTimestamp(1700000000);
  assert(t6 === 1700000000 * 1000, 'epoch seconds promoted to ms');

  // Date instance.
  const d = new Date('2026-01-01T00:00:00Z');
  assert(parseEventTimestamp(d) === d.getTime(), 'Date instance passes through');

  // Garbage rejected.
  assert(parseEventTimestamp(null) === null, 'null → null');
  assert(parseEventTimestamp(undefined) === null, 'undefined → null');
  assert(parseEventTimestamp('') === null, 'empty string → null');
  assert(parseEventTimestamp('not a date') === null, 'bad string → null');
  assert(parseEventTimestamp({}) === null, 'object → null');
  assert(parseEventTimestamp(NaN) === null, 'NaN → null');

  // toIsoTimestamp wrapper.
  assert(
    toIsoTimestamp('2026-05-31 23:30:02+00:00') === '2026-05-31T23:30:02.000Z',
    'toIsoTimestamp round-trips through UTC',
  );
  assert(toIsoTimestamp('garbage') === null, 'toIsoTimestamp returns null on garbage');
}

// ---------------------------------------------------------------------------
console.log('\n[parseEventValue]');
{
  const a = parseEventValue('1');
  assert(a.numeric === 1 && a.state === 'active' && a.label === 'Active', 'string "1" → Active');

  const b = parseEventValue('0');
  assert(b.numeric === 0 && b.state === 'cleared' && b.label === 'Cleared', 'string "0" → Cleared');

  const c = parseEventValue(1);
  assert(c.numeric === 1 && c.state === 'active', 'number 1 → Active');

  const d = parseEventValue(0);
  assert(d.numeric === 0 && d.state === 'cleared', 'number 0 → Cleared');

  const e = parseEventValue('  2  ');
  assert(e.numeric === 2 && e.state === 'unknown' && e.label === '2', 'numeric ≠ 0/1 → unknown but kept');

  const f = parseEventValue(null);
  assert(f.numeric === null && f.state === 'unknown' && f.label === '—', 'null → em-dash placeholder');

  const g = parseEventValue('');
  assert(g.numeric === null && g.state === 'unknown' && g.label === '—', 'empty string → em-dash');

  const h = parseEventValue(true);
  assert(h.numeric === 1 && h.state === 'active', 'true → Active');
}

// ---------------------------------------------------------------------------
console.log('\n[parseEventName]');
{
  const n1 = parseEventName('/INV/ACPORT/EVENT/ALARM/DC_DISCONNECT');
  assert(n1.code === 'DC_DISCONNECT', 'code extracted from leaf segment');
  assert(n1.severityBucket === 'ALARM', 'severity bucket = ALARM');
  assert(n1.breadcrumb === 'INV / ACPORT / EVENT / ALARM', 'breadcrumb has 4 segments');
  assert(n1.pretty.startsWith('DC Disconnect'), 'pretty humanizes code (short tokens preserved)');

  const n2 = parseEventName('/INV/DEV/EVENT/WARN/PORT_LEVEL_WARNINGS');
  assert(n2.severityBucket === 'WARN', 'WARN bucket detected');
  assert(n2.pretty.includes('Port Level Warnings'), 'snake_case humanized in pretty');

  const n3 = parseEventName('/BMS/MODULE2/EVENT/INFO/CHARGE_ALLOWED');
  assert(n3.severityBucket === 'INFO', 'INFO bucket detected');

  const n4 = parseEventName('CommunicationFault');
  assert(n4.code === 'CommunicationFault', 'non-slash name uses raw as code');
  assert(n4.segments.length === 1, 'non-slash name has 1 segment');
  assert(n4.severityBucket === '', 'no severity bucket when no path');

  const n5 = parseEventName('');
  assert(n5.code === '(unnamed)', 'empty name → (unnamed)');

  const n6 = parseEventName(null);
  assert(n6.code === '(unnamed)', 'null name → (unnamed)');
}

// ---------------------------------------------------------------------------
console.log('\n[severityFromName]');
{
  assert(severityFromName('/INV/ACPORT/EVENT/ALARM/DC_DISCONNECT') === 'warning', 'ALARM bucket → warning');
  assert(severityFromName('/INV/ACPORT/EVENT/FAULT/IMD_FAULT') === 'critical', 'FAULT bucket → critical');
  assert(severityFromName('/BMS/MODULE2/EVENT/INFO/CHARGE_ALLOWED') === 'info', 'INFO bucket → info');
  assert(severityFromName('/INV/DEV/EVENT/WARN/PORT_LEVEL_WARNINGS') === 'warning', 'WARN bucket → warning');
  // Fallback: substring on non-slash codes.
  assert(severityFromName('CriticalFailure') === 'critical', 'fallback: "Critical" → critical');
  assert(severityFromName('OverVoltage') === 'warning', 'fallback: "OverVoltage" → warning');
  assert(severityFromName('Heartbeat') === 'info', 'fallback: unknown → info');
}

// ---------------------------------------------------------------------------
console.log('\n[normalizeAlarmRow]');
{
  // Verbatim row from the live ADX response captured 2026-06-01.
  const liveRow = {
    urn: 'urn:dev:cer:07f9e0be3de410a3b9f5f312eeec1406cfde6532',
    mac_address: '28:29:86:95:5d:cb',
    comms_serial: '1C2422V00047',
    localtime: '2026-05-31 23:30:02+00:00',
    utctime: '2026-06-01 06:30:02+00:00',
    deviceType: 'SCC_NAM',
    device_serial: '1C2422V00047',
    eventCode: '',
    name: '/INV/ACPORT/EVENT/ALARM/DC_DISCONNECT',
    value: '1',
    external_name: '',
  };
  const norm = normalizeAlarmRow(liveRow);
  assert(norm !== null, 'live row normalized successfully');
  assert(norm!.timestamp === Date.UTC(2026, 4, 31, 23, 30, 2), 'live row timestamp parsed');
  assert(norm!.name.code === 'DC_DISCONNECT', 'live row code = DC_DISCONNECT');
  assert(norm!.severity === 'warning', 'live row severity = warning (ALARM bucket)');
  assert(norm!.value.state === 'active' && norm!.value.label === 'Active', 'live row value = Active');
  assert(norm!.isoTimestamp === '2026-05-31T23:30:02.000Z', 'ISO timestamp round-trips');

  // Falls back to utctime when localtime is missing.
  const onlyUtc = normalizeAlarmRow({ ...liveRow, localtime: '' });
  assert(onlyUtc !== null, 'falls back to utctime');
  assert(
    onlyUtc!.timestamp === Date.UTC(2026, 5, 1, 6, 30, 2),
    'utctime used when localtime blank',
  );

  // Drops rows that cannot be charted.
  assert(normalizeAlarmRow({ name: 'X', value: '1' }) === null, 'no timestamp → dropped');
  assert(
    normalizeAlarmRow({ localtime: '2026-01-01T00:00:00Z', value: '1' }) === null,
    'no name → dropped',
  );
  assert(normalizeAlarmRow(null) === null, 'null row → null');
  assert(normalizeAlarmRow('hi') === null, 'non-object row → null');
}

// ---------------------------------------------------------------------------
console.log('\n[normalizeAlarmRows]');
{
  const mixed = [
    { localtime: '2026-05-31 23:30:02+00:00', name: '/A/B/EVENT/ALARM/X', value: '1' },
    null,
    { localtime: 'garbage', name: '/A/B/EVENT/INFO/Y', value: '0' },
    { localtime: '2026-05-31 23:35:00+00:00', name: '/A/B/EVENT/FAULT/Z', value: '1' },
    'not even a row',
  ];
  const out = normalizeAlarmRows(mixed);
  assert(out.length === 2, 'normalizeAlarmRows drops invalid entries');
  assert(out[0].name.code === 'X' && out[1].name.code === 'Z', 'order preserved across drops');
  assert(normalizeAlarmRows(null as unknown) === undefined ? false : true, 'null input is safe');
  assert(normalizeAlarmRows(undefined as unknown).length === 0, 'undefined input → []');
  assert(normalizeAlarmRows({} as unknown).length === 0, 'non-array input → []');
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failure${failures === 1 ? '' : 's'})`);
if (failures > 0) throw new Error(`eventsParser smoke test failed with ${failures} failures`);
