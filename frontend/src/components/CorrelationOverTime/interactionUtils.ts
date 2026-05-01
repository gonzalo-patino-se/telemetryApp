// src/components/CorrelationOverTime/interactionUtils.ts
// Pure helpers for hover/click interactions. Framework-free so they can be
// unit-tested via the smoke runner.

import type { EventInstance, SignalSeries, TimePoint } from './types';

/**
 * Binary-search nearest point (by t) within tolerance.
 * Returns undefined if the series has no points or the nearest is too far.
 */
export function nearestPointAt(
  points: TimePoint[],
  t: number,
  tolerance: number,
): TimePoint | undefined {
  if (points.length === 0) return undefined;
  // Binary search for insertion index.
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  // lo points to first >= t. Compare with predecessor.
  const a = points[lo];
  const b = lo > 0 ? points[lo - 1] : undefined;
  const cand =
    b === undefined
      ? a
      : Math.abs(a.t - t) <= Math.abs(b.t - t)
        ? a
        : b;
  return Math.abs(cand.t - t) <= tolerance ? cand : undefined;
}

/** Events whose `t` falls within `±tolerance` of `t`. */
export function nearestEventsAt(
  events: EventInstance[],
  t: number,
  tolerance: number,
): EventInstance[] {
  const out: EventInstance[] = [];
  for (const e of events) {
    if (Math.abs(e.t - t) <= tolerance) out.push(e);
  }
  return out;
}

/**
 * Add or remove a pin. If a pin already exists within `tolerance` of `t`,
 * it's removed (toggle). Otherwise the pin is appended; if that would
 * exceed `max`, the oldest pin (index 0) is dropped (FIFO).
 *
 * Returns a NEW array (immutable update).
 */
export function togglePin(
  pins: number[],
  t: number,
  tolerance: number,
  max: number,
): number[] {
  const existingIdx = pins.findIndex(p => Math.abs(p - t) <= tolerance);
  if (existingIdx !== -1) {
    return pins.filter((_, i) => i !== existingIdx);
  }
  const next = [...pins, t];
  if (next.length > max) next.shift();
  return next;
}

/** Compute a hover/click tolerance from the visible time span. */
export function toleranceFromSpan(span: number, bucketCount = 200): number {
  if (!Number.isFinite(span) || span <= 0) return 1;
  return Math.max(1, span / bucketCount);
}

/**
 * Drop pins that fall outside the current x-domain. Pure utility — Phase 4
 * (the host component) decides when to call it.
 */
export function clearOutOfRangePins(
  pins: number[],
  domain: [number, number],
): number[] {
  const [lo, hi] = domain;
  return pins.filter(p => p >= lo && p <= hi);
}

/** Snapshot of one series' value at a given x, used by tooltip + pin labels. */
export interface SeriesReadout {
  id: string;
  label: string;
  unit: string;
  color: string;
  /** Undefined when the series has no data near `t`. */
  value: number | undefined;
  /** Actual sample time (may differ slightly from `t`). */
  t: number | undefined;
}

export function readoutAt(
  series: SignalSeries[],
  t: number,
  tolerance: number,
): SeriesReadout[] {
  return series.map(s => {
    const p = nearestPointAt(s.points, t, tolerance);
    return {
      id: s.id,
      label: s.label,
      unit: s.unit,
      color: s.color,
      value: p?.v,
      t: p?.t,
    };
  });
}
