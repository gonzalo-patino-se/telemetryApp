// src/components/CorrelationOverTime/chartUtils.ts
// Pure helpers for the OverlayChart. Kept framework-free so they're easy
// to unit-test (see __smoke__.ts in this folder).

import type { EventInstance, SignalSeries } from './types';

/** Padding factor applied to each series' independent y-domain. */
const Y_PAD_RATIO = 0.05;

/**
 * Compute a padded [min, max] domain for one series' y-axis.
 * Recharts accepts numeric tuples; we return [min, max].
 */
export function paddedYDomain(
  vMin: number | undefined,
  vMax: number | undefined,
): [number, number] {
  if (vMin == null || vMax == null || !Number.isFinite(vMin) || !Number.isFinite(vMax)) {
    return [0, 1];
  }
  if (vMin === vMax) {
    // Flat-line series: open up the axis a bit so the line isn't on the edge.
    const pad = Math.max(Math.abs(vMin) * Y_PAD_RATIO, 1);
    return [vMin - pad, vMax + pad];
  }
  const span = vMax - vMin;
  const pad = span * Y_PAD_RATIO;
  return [vMin - pad, vMax + pad];
}

/**
 * Compute the shared x-domain. Prefers the explicit time range from the
 * caller (so the card aligns with sibling widgets via TimeRangeContext);
 * falls back to the data's own min/max if not provided.
 */
export function computeXDomain(
  start: Date | null,
  end: Date | null,
  series: SignalSeries[],
  events: EventInstance[],
): [number, number] {
  if (start && end) return [start.getTime(), end.getTime()];

  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const s of series) {
    for (const p of s.points) {
      if (p.t < lo) lo = p.t;
      if (p.t > hi) hi = p.t;
    }
  }
  for (const e of events) {
    if (e.t < lo) lo = e.t;
    if (e.t > hi) hi = e.t;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    const now = Date.now();
    return [now - 60_000, now];
  }
  return [lo, hi];
}

/** Time-axis tick formatter — short labels appropriate for a small card. */
export function formatXTick(t: number, span: number): string {
  const d = new Date(t);
  // < 6h: HH:MM
  if (span <= 6 * 3600_000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // < 3d: HH:MM on M/D
  if (span <= 3 * 24 * 3600_000) {
    return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  // longer: just date
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Format an x value for the tooltip header / pin label (full local time). */
export function formatXFull(t: number): string {
  const d = new Date(t);
  return d.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ----------------------------------------------------------------------------
// Overlap detection — the "blue ✕" markers
// ----------------------------------------------------------------------------

/**
 * Buckets every event time and every series-sample time into fixed-width
 * temporal bins; emits one overlap marker per bin that contains >= 2 distinct
 * entities (an "entity" = a series id or an event category id).
 *
 * - bin width ≈ pixelResolution worth of time (so visually-coincident points
 *   are detected as overlapping even if their timestamps differ by 1–2 ms).
 * - Returns marker timestamps placed at the *midpoint* of the bin, so the
 *   ✕ sits visually centered on the cluster.
 */
export interface OverlapMarker {
  /** Bin midpoint, used for x positioning. */
  t: number;
  /** Number of distinct entities that fell into this bin. */
  count: number;
  /** Tooltip text listing what overlapped. */
  label: string;
}

export function buildOverlapMarkers(
  series: SignalSeries[],
  events: EventInstance[],
  xDomain: [number, number],
  bucketCount = 200,
): OverlapMarker[] {
  const [lo, hi] = xDomain;
  if (!(hi > lo)) return [];
  const span = hi - lo;
  const bw = span / bucketCount;
  if (bw <= 0) return [];

  // bucket -> Map<entityId, label>
  const buckets = new Map<number, Map<string, string>>();

  const add = (t: number, entityId: string, label: string) => {
    if (t < lo || t > hi) return;
    const idx = Math.min(bucketCount - 1, Math.floor((t - lo) / bw));
    let m = buckets.get(idx);
    if (!m) {
      m = new Map();
      buckets.set(idx, m);
    }
    if (!m.has(entityId)) m.set(entityId, label);
  };

  for (const s of series) {
    for (const p of s.points) add(p.t, `s:${s.id}`, s.label);
  }
  for (const e of events) add(e.t, `e:${e.categoryId}`, e.categoryLabel);

  const out: OverlapMarker[] = [];
  for (const [idx, m] of buckets) {
    if (m.size < 2) continue;
    const t = lo + (idx + 0.5) * bw;
    out.push({
      t,
      count: m.size,
      label: Array.from(m.values()).join(', '),
    });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}
