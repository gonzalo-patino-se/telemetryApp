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
  /** Convenience min/max of v for the independent y-axis (undefined when empty). */
  vMin?: number;
  vMax?: number;
}

/** Catalog entry: an event category the user *can* select in the picker. */
export interface EventDef {
  /** Stable id, e.g. "alarms_active" / "alarms_cleared". */
  id: string;
  /** Human label, e.g. "Active alarms". */
  label: string;
  /** Vertical-line / icon color. */
  color: string;
  /** "1" = active, "0" = cleared, "all" = both. Mirrors Events.tsx. */
  outputFilter: '1' | '0' | 'all';
  /** Optional glyph for the marker top, e.g. "▲", "◆", "●". */
  glyph?: string;
}

/** A single event occurrence pinned to the time axis. */
export interface EventInstance {
  /** Synthetic id: `${categoryId}:${t}:${title}`. */
  id: string;
  categoryId: string;
  categoryLabel: string;
  color: string;
  glyph?: string;
  /** Epoch ms. */
  t: number;
  title: string;
  description?: string;
}

/** Aggregate result returned by useCorrelationData. */
export interface CorrelationData {
  series: SignalSeries[];
  events: EventInstance[];
  loading: boolean;
  error: string | null;
  /** Fired when any underlying request errored; UI may toast. */
  partial: boolean;
}
