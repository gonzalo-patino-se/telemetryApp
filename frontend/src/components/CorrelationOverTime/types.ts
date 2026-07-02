// src/components/CorrelationOverTime/types.ts
// Type contracts for the "Correlation Over Time" card.
// Phase 1 (Foundation): consumed by useCorrelationData; rendered in later phases.

/** A single sampled point on the shared time (x) axis. */
export interface TimePoint {
  /** Epoch milliseconds (UTC). All series use the same time domain. */
  t: number;
  /** Raw, un-normalized value. Each series keeps its own y-scale. */
  v: number;
}

/** Catalog entry: a signal the user *can* select in the picker. */
export interface SignalDef {
  /** Stable id, e.g. "pv1_voltage" — used as the React key and selection id. */
  id: string;
  /** Human label shown in legend / selector, e.g. "PV1 Voltage". */
  label: string;
  /** Unit shown in tooltip / legend chip, e.g. "V". */
  unit: string;
  /** Hex color for line stroke (drawn from chartColorSchemes for visual continuity). */
  color: string;
  /**
   * Optional SVG `stroke-dasharray` (e.g. "6 3", "2 3"). Combined with `color`
   * this guarantees every signal in the same family stays visually distinct.
   * Undefined = solid line.
   */
  dash?: string;
  /** Optional grouping shown in the selector, e.g. "PV", "Grid", "Battery". */
  group?: string;
  /**
   * When true, the query is expected to emit rows with a valid `localtime` but
   * a null value where a calculation could not be performed (e.g. a computed
   * power series whose current factor is missing at that instant). Those rows
   * are surfaced as "gaps" (✕ markers) instead of being dropped, so the chart
   * never fabricates a value. Plain telemetry signals leave this false.
   */
  markMissing?: boolean;
  /**
   * Build the KQL query for this signal. Reuses the existing kqlBuilders so the
   * card produces the same data as the dedicated widget for that signal.
   */
  buildQuery: (serial: string, start: Date, end: Date) => string;
}

/** Resolved series ready to render on the chart. */
export interface SignalSeries {
  id: string;
  label: string;
  unit: string;
  color: string;
  /** Mirrors `SignalDef.dash`. Undefined = solid. */
  dash?: string;
  /** Sorted ascending by t. May be empty (will render as "no data" in legend). */
  points: TimePoint[];
  /**
   * Timestamps (epoch ms, sorted ascending) where a value was expected but
   * could not be computed because a required input was missing. Rendered as ✕
   * markers on the chart. Only populated for signals with `markMissing`.
   */
  gaps?: number[];
  /** Convenience min/max of v for the independent y-axis (undefined when empty). */
  vMin?: number;
  vMax?: number;
}

/**
 * One event occurrence ("alarm transition") pinned to the time axis.
 * After the v2 redesign the event picker is fully dynamic — there is no
 * fixed category catalog; each unique `name` is its own logical group with
 * a deterministic color (see `colorForEventName`).
 *
 * `categoryId` and `categoryLabel` are kept (both = `name`) so the existing
 * overlap detector and tooltip code work unchanged.
 */
export interface EventInstance {
  /** Synthetic id: `${name}:${t}:${value}`. */
  id: string;
  /** = name. Used by overlap detection to distinguish entities. */
  categoryId: string;
  /** = name. Human-readable. */
  categoryLabel: string;
  /** Per-name palette color. */
  color: string;
  /** Epoch ms. */
  t: number;
  /** Same as `categoryLabel`; kept for tooltip-row labels. */
  title: string;
  /** e.g. "value=1" / "value=0" — active vs. cleared transition. */
  description?: string;
  /** Raw alarm value (1 = active, 0 = cleared). */
  value?: number;
}

/** One row in the dynamic event-name picker. */
export interface EventNameInfo {
  /** Alarm name as returned by the Alarms table. */
  name: string;
  /** Per-name palette color. */
  color: string;
  /** Number of occurrences in the current time range. */
  count: number;
}

/** Aggregate result returned by useCorrelationData. */
export interface CorrelationData {
  series: SignalSeries[];
  /** Events filtered to the user's selection (= visible on the chart). */
  events: EventInstance[];
  /**
   * Every distinct event name observed in the current fetch — used to
   * populate the event picker. Includes names the user has currently
   * deselected (so they remain toggleable).
   */
  availableEventNames: EventNameInfo[];
  loading: boolean;
  error: string | null;
  /** Fired when any underlying request errored; UI may toast. */
  partial: boolean;
}
