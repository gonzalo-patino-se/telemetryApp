// src/components/CorrelationOverTime/csvUtils.ts
//
// Pin-snapshot CSV exporter for the Correlation Over Time card.
//
// Each pinned timestamp produces a "snapshot block" of rows: one row per
// selected signal (with its nearest sample value+unit) and one row per
// nearby event (within ±tolerance). All blocks are concatenated into a
// single CSV the user can download.

import type { EventInstance, SignalSeries } from './types';
import { nearestEventsAt, nearestPointAt } from './interactionUtils';

export interface BuildPinsCsvArgs {
  /** Pinned timestamps, epoch ms. Order is preserved. */
  pins: number[];
  series: SignalSeries[];
  events: EventInstance[];
  /** Time tolerance (ms) for matching signal samples and events to a pin. */
  tolerance: number;
  /** Optional serial included in every row for traceability. */
  serial?: string;
}

/** RFC-4180-ish escape: wrap in quotes if needed; double internal quotes. */
function csvEscape(raw: unknown): string {
  if (raw == null) return '';
  const s = String(raw);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Format a numeric value compactly without aggressive rounding. */
function formatValue(v: number): string {
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1000) return v.toFixed(0);
  if (abs >= 1) return v.toFixed(3);
  return v.toFixed(4);
}

/**
 * Build a CSV string snapshotting all selected signals + nearby events
 * at each pinned timestamp.
 *
 * Columns: pin_index, iso_timestamp, epoch_ms, serial, type, name, value, unit, detail
 *
 * `type` is 'signal' or 'event'.
 *   - For signals, `value` is the numeric reading (or empty if no data
 *     within tolerance), `unit` is the signal's unit, `detail` is empty.
 *   - For events, `value` is the raw alarm value (1/0), `unit` is empty,
 *     `detail` is the human-readable description (e.g. "active" / "cleared").
 */
export function buildPinsCsv(args: BuildPinsCsvArgs): string {
  const { pins, series, events, tolerance, serial } = args;
  const lines: string[] = [];
  const header = [
    'pin_index',
    'iso_timestamp',
    'epoch_ms',
    'serial',
    'type',
    'name',
    'value',
    'unit',
    'detail',
  ].join(',');
  lines.push(header);

  pins.forEach((t, i) => {
    const iso = new Date(t).toISOString();
    const idx = String(i + 1);

    // Signals: one row per selected series.
    for (const s of series) {
      const p = nearestPointAt(s.points, t, tolerance);
      const valueStr = p ? formatValue(p.v) : '';
      lines.push(
        [
          idx,
          iso,
          String(t),
          csvEscape(serial ?? ''),
          'signal',
          csvEscape(s.label),
          valueStr,
          csvEscape(s.unit),
          '',
        ].join(','),
      );
    }

    // Events: one row per occurrence within ±(tolerance * 2) of this pin.
    // The doubled tolerance matches what the on-screen tooltip uses (see
    // CorrelationTooltip), so the CSV reflects exactly the same context the
    // user just inspected by hovering before they pinned.
    const nearby = nearestEventsAt(events, t, tolerance * 2);
    for (const e of nearby) {
      lines.push(
        [
          idx,
          iso,
          String(t),
          csvEscape(serial ?? ''),
          'event',
          csvEscape(e.title),
          e.value != null ? String(e.value) : '',
          '',
          csvEscape(e.description ?? ''),
        ].join(','),
      );
    }
  });

  return lines.join('\r\n') + '\r\n';
}

/**
 * Trigger a browser download for the given CSV content. Safe no-op in SSR /
 * test environments where `document` / `URL.createObjectURL` are missing.
 */
export function downloadCsv(filename: string, content: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the click handler in some browsers can finish.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Build a deterministic, filesystem-safe filename for the export. */
export function buildPinsCsvFilename(serial: string | null | undefined): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace(/T/, '_')
    .replace(/Z$/, 'Z');
  const safeSerial = (serial ?? 'unknown').replace(/[^A-Za-z0-9_.-]/g, '_');
  return `correlation_pins_${safeSerial}_${stamp}.csv`;
}
