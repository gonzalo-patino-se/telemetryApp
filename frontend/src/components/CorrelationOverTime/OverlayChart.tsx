// src/components/CorrelationOverTime/OverlayChart.tsx
// Pure presentational overlay chart.
//   - Single shared X-axis (time)
//   - One independent, HIDDEN Y-axis per series  -> "overlay with independent y"
//   - Events rendered as a real <Scatter> series so they:
//       * align to time precisely (share the same time XAxis as the lines)
//       * are individually clickable (click pins that exact event timestamp)
//       * participate in Recharts hover/tooltip detection
//   - Blue ✕ overlap dots (decorative)

import React from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EventInstance, SignalSeries } from './types';
import {
  buildOverlapMarkers,
  computeXDomain,
  formatXTick,
  paddedYDomain,
} from './chartUtils';
import { CorrelationTooltip } from './CorrelationTooltip';
import { readoutAt, toleranceFromSpan } from './interactionUtils';

interface OverlayChartProps {
  series: SignalSeries[];
  events: EventInstance[];
  /** Optional explicit time domain — usually wired to TimeRangeContext. */
  start: Date | null;
  end: Date | null;
  height?: number;
  /** Pinned timestamps (epoch ms). Up to 3, managed by the parent. */
  pins?: number[];
  /** Fired when the user clicks the chart at a given timestamp. */
  onPinToggle?: (t: number) => void;
  /**
   * Active zoom window [startMs, endMs]. When set, the chart renders only this
   * sub-range of the full time domain. Null = full (un-zoomed) view.
   */
  zoomDomain?: [number, number] | null;
  /** Fired when the user drag-selects a new zoom window on the chart. */
  onZoomChange?: (domain: [number, number]) => void;
}

/** Reserved synthetic y-axis used solely to position overlap markers. */
const OVERLAP_AXIS_ID = '__overlap';
const OVERLAP_Y = 0.06; // near the bottom of the plot (just above the X-axis)

/** Reserved synthetic y-axis used to scatter event dots near the top. */
const EVENTS_AXIS_ID = '__events';
const EVENTS_Y = 0.94; // near the top of the plot

/** Reserved synthetic y-axis for "no data" ✕ markers (computed series gaps). */
const MISSING_AXIS_ID = '__missing';
const MISSING_Y = 0.14; // just above the overlap lane

export const OverlayChart: React.FC<OverlayChartProps> = ({
  series,
  events,
  start,
  end,
  height = 240,
  pins = [],
  onPinToggle,
  zoomDomain = null,
  onZoomChange,
}) => {
  const fullDomain = React.useMemo(
    () => computeXDomain(start, end, series, events),
    [start, end, series, events],
  );
  // Effective domain: the zoom window when active, otherwise the full range.
  const xDomain = React.useMemo<[number, number]>(
    () => zoomDomain ?? fullDomain,
    [zoomDomain, fullDomain],
  );
  const span = xDomain[1] - xDomain[0];
  const tol = React.useMemo(() => toleranceFromSpan(span), [span]);

  const overlaps = React.useMemo(
    () => buildOverlapMarkers(series, events, xDomain),
    [series, events, xDomain],
  );

  // ---------------------------------------------------------------------
  // "No data" ✕ markers. Computed-power series (P = V × I) emit a gap
  // timestamp wherever a required input was missing, so we never fabricate a
  // value. Render them as small ✕ marks in a dedicated bottom lane, colored
  // per series. Bucketed per (series, time-bin) and hard-capped so a fully
  // missing signal stays legible instead of flooding the axis.
  // ---------------------------------------------------------------------
  const missingMarkers = React.useMemo(() => {
    const HARD_CAP = 400;
    const withGaps = series.filter(s => (s.gaps?.length ?? 0) > 0);
    if (withGaps.length === 0) return [] as { key: string; t: number; color: string; label: string }[];
    const span = xDomain[1] - xDomain[0];
    const bucketCount = 120;
    const binWidth = span > 0 ? span / bucketCount : 1;
    const seen = new Set<string>();
    const out: { key: string; t: number; color: string; label: string }[] = [];
    for (const s of withGaps) {
      for (const t of s.gaps ?? []) {
        if (t < xDomain[0] || t > xDomain[1]) continue;
        const bin = Math.floor((t - xDomain[0]) / binWidth);
        const key = `${s.id}|${bin}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ key: `${s.id}-${t}`, t, color: s.color, label: s.label });
        if (out.length >= HARD_CAP) return out;
      }
    }
    return out;
  }, [series, xDomain]);

  // ---------------------------------------------------------------------
  // Render-side downsample for the event scatter lane.
  // The full `events` array is preserved (used by the tooltip for accurate
  // readouts and by the CSV exporter). Only the dots actually rendered are
  // bucketed: per (name, time-bucket) we keep the FIRST event in each bin.
  // This keeps Recharts responsive even when the server returns thousands
  // of alarms over a 7-day range.
  // ---------------------------------------------------------------------
  const renderEvents = React.useMemo(() => {
    const HARD_CAP = 800;
    if (events.length <= HARD_CAP) return events;
    // Choose enough buckets that, with all names contributing one dot per
    // bucket, we stay near the cap. Floor of 60 keeps the visual spread
    // useful even for a single very chatty alarm name.
    const distinctNames = new Set(events.map(e => e.categoryId)).size || 1;
    const bucketCount = Math.max(60, Math.floor(HARD_CAP / distinctNames));
    const span = xDomain[1] - xDomain[0];
    const binWidth = span > 0 ? span / bucketCount : 1;
    const seen = new Set<string>();
    const out: typeof events = [];
    for (const e of events) {
      const bin = Math.floor((e.t - xDomain[0]) / binWidth);
      const key = `${e.categoryId}|${bin}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
      if (out.length >= HARD_CAP) break;
    }
    return out;
  }, [events, xDomain]);

  const eventsTruncated = renderEvents.length < events.length;

  /**
   * Scatter dataset for events. Each point carries the underlying
   * EventInstance so the click handler and custom shape have full context.
   * MUST be sorted ascending by `t` because Recharts <Line> uses the array
   * order to draw the path; our line is invisible (stroke=none) but the
   * dots' (cx, cy) computation still depends on a well-formed series.
   */
  const scatterData = React.useMemo(() => {
    const arr = renderEvents.map(e => ({
      t: e.t,
      y: EVENTS_Y,
      evt: e,
    }));
    arr.sort((a, b) => a.t - b.t);
    return arr;
  }, [renderEvents]);

  // Track the most recent hover x so we can convert a click into a pin toggle.
  const hoverXRef = React.useRef<number | null>(null);
  // Suppress the next chart-level click after an event-dot click so we
  // don't double-toggle (dot pins, then chart-level click would un-pin).
  const suppressNextChartClickRef = React.useRef(false);

  // ---------------------------------------------------------------------
  // Drag-to-zoom. While the primary button is held, we paint a translucent
  // selection rectangle (ReferenceArea) between the mousedown time and the
  // current hover time. On release, if the span is non-trivial we hand the
  // [lo, hi] window up to the parent, which drives `zoomDomain`.
  // ---------------------------------------------------------------------
  const [refAreaLeft, setRefAreaLeft] = React.useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = React.useState<number | null>(null);
  const isSelectingRef = React.useRef(false);

  // ---------------------------------------------------------------------
  // Shift-drag to pan. When a zoom window is active, holding Shift and
  // dragging grabs the plot and slides it left/right within the full range.
  // We anchor on the pixel position at mousedown and translate pixel deltas
  // into time deltas using the measured plot width, so the grabbed point
  // tracks the cursor smoothly. Plain (no-Shift) drags still zoom.
  // ---------------------------------------------------------------------
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isPanningRef = React.useRef(false);
  const panStartPxRef = React.useRef(0);
  const panStartDomainRef = React.useRef<[number, number]>([0, 0]);
  // Chart margins (mirror the <ComposedChart margin> below) so the usable plot
  // width can be derived from the container width for px→time conversion.
  const MARGIN_LEFT = 8;
  const MARGIN_RIGHT = 16;

  const panByPixels = React.useCallback(
    (pixelDelta: number) => {
      const el = containerRef.current;
      if (!el) return;
      const plotWidth = el.clientWidth - MARGIN_LEFT - MARGIN_RIGHT;
      if (!(plotWidth > 0)) return;
      const [startLo, startHi] = panStartDomainRef.current;
      const winSpan = startHi - startLo;
      if (!(winSpan > 0)) return;
      // Dragging right (positive pixelDelta) reveals earlier data → shift left.
      const deltaTime = -pixelDelta * (winSpan / plotWidth);
      const [fullLo, fullHi] = fullDomain;
      let lo = startLo + deltaTime;
      let hi = startHi + deltaTime;
      if (lo < fullLo) {
        lo = fullLo;
        hi = fullLo + winSpan;
      }
      if (hi > fullHi) {
        hi = fullHi;
        lo = fullHi - winSpan;
      }
      onZoomChange?.([lo, hi]);
    },
    [fullDomain, onZoomChange],
  );

  const handleMouseDown = React.useCallback(
    (
      state: { activeLabel?: number | string; chartX?: number },
      e?: React.MouseEvent,
    ) => {
      // Shift-drag pans (only meaningful while zoomed); plain drag zooms.
      if (e?.shiftKey && zoomDomain && typeof state?.chartX === 'number') {
        isPanningRef.current = true;
        panStartPxRef.current = state.chartX;
        panStartDomainRef.current = [xDomain[0], xDomain[1]];
        return;
      }
      const al = state?.activeLabel;
      if (al == null) return;
      const t = typeof al === 'number' ? al : Number(al);
      if (!Number.isFinite(t)) return;
      isSelectingRef.current = true;
      setRefAreaLeft(t);
      setRefAreaRight(t);
    },
    [zoomDomain, xDomain],
  );

  const handleMouseMove = React.useCallback(
    (state: { activeLabel?: number | string; chartX?: number }) => {
      if (isPanningRef.current && typeof state?.chartX === 'number') {
        panByPixels(state.chartX - panStartPxRef.current);
        return;
      }
      const al = state?.activeLabel;
      if (al == null) {
        hoverXRef.current = null;
        return;
      }
      const t = typeof al === 'number' ? al : Number(al);
      hoverXRef.current = Number.isFinite(t) ? t : null;
      if (isSelectingRef.current && Number.isFinite(t)) {
        setRefAreaRight(t);
      }
    },
    [panByPixels],
  );

  const handleMouseUp = React.useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      // Swallow the click Recharts fires after a pan so it doesn't pin.
      suppressNextChartClickRef.current = true;
      return;
    }
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    const l = refAreaLeft;
    const r = refAreaRight;
    setRefAreaLeft(null);
    setRefAreaRight(null);
    if (l == null || r == null) return;
    const lo = Math.min(l, r);
    const hi = Math.max(l, r);
    // Require the drag to cover a meaningful slice (>0.5% of the current span)
    // so an ordinary click still registers as a pin instead of a zoom.
    const minSpan = Math.max((xDomain[1] - xDomain[0]) * 0.005, 1);
    if (hi - lo >= minSpan) {
      // A real drag happened — suppress the click that Recharts fires next so
      // we don't also toggle a pin at the release point.
      suppressNextChartClickRef.current = true;
      onZoomChange?.([lo, hi]);
    }
  }, [refAreaLeft, refAreaRight, xDomain, onZoomChange]);

  const handleClick = React.useCallback(() => {
    if (suppressNextChartClickRef.current) {
      // Reset and skip — an event-dot click or a zoom drag handled this.
      suppressNextChartClickRef.current = false;
      return;
    }
    if (!onPinToggle) return;
    const t = hoverXRef.current;
    if (t != null) onPinToggle(t);
  }, [onPinToggle]);

  // Recharts needs a `data` array per Line; we draw one Line per series and
  // pass its `points` directly via the `data` prop (rather than a single
  // joined dataset) so each series keeps its own y-axis cleanly.
  return (
    <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }}>
      {zoomDomain && (
        <div
          role="status"
          aria-live="polite"
          title="Drag to zoom further · Shift+drag to pan left/right · use “Reset zoom” to return to the full range."
          style={{
            position: 'absolute',
            top: 4,
            left: 8,
            zIndex: 2,
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 3,
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)',
            pointerEvents: 'none',
          }}
        >
          Zoomed · Shift+drag to pan
        </div>
      )}
      {eventsTruncated && (
        <div
          role="status"
          aria-live="polite"
          title="Tooltip and CSV export still see all events; only on-chart dots are throttled for performance."
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            zIndex: 2,
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 3,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none',
          }}
        >
          Showing {renderEvents.length} of {events.length} events
        </div>
      )}
      {/* Pin readouts panel. The exact values at each pinned timestamp are
          listed here — in a solid-background overlay pinned to the bottom-left
          corner — instead of as floating labels on the plot, so the numbers are
          always legible and never sit on top of the very curves being read. */}
      {pins.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            zIndex: 3,
            maxWidth: '46%',
            maxHeight: '70%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '6px 8px',
            borderRadius: 6,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            fontSize: 11,
            fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none',
          }}
        >
          {pins.map((pt, idx) => {
            const readouts = readoutAt(series, pt, tol).filter(r => r.value != null);
            return (
              <div key={`pinbox-${idx}-${pt}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  📌 {idx + 1} · {formatXTick(pt, span)}
                </div>
                {readouts.length === 0 ? (
                  <div style={{ color: 'var(--text-tertiary)' }}>no data near this time</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                    {readouts.map(r => (
                      <span
                        key={`pinbox-${idx}-${r.id}`}
                        style={{ color: r.color, whiteSpace: 'nowrap' }}
                      >
                        {r.label}:{' '}
                        {Math.abs(r.value as number) >= 1000
                          ? (r.value as number).toFixed(0)
                          : (r.value as number).toFixed(2)}
                        {r.unit ? ` ${r.unit}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          margin={{ top: 18, right: 16, bottom: 8, left: 8 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            hoverXRef.current = null;
            // Abandon an in-progress selection if the pointer leaves the plot.
            if (isSelectingRef.current) {
              isSelectingRef.current = false;
              setRefAreaLeft(null);
              setRefAreaRight(null);
            }
            // Abandon an in-progress pan too.
            if (isPanningRef.current) {
              isPanningRef.current = false;
            }
          }}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          {/* Horizontal-only, very low contrast grid. */}
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="0"
            vertical={false}
          />

          {/* Shared time X-axis. */}
          <XAxis
            type="number"
            dataKey="t"
            domain={xDomain}
            scale="time"
            tickFormatter={t => formatXTick(t as number, span)}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={false}
            minTickGap={60}
            allowDataOverflow={zoomDomain != null}
            allowDuplicatedCategory={false}
          />

          {/* Independent, hidden Y-axis per series. */}
          {series.map(s => (
            <YAxis
              key={`y-${s.id}`}
              yAxisId={s.id}
              domain={paddedYDomain(s.vMin, s.vMax)}
              hide
            />
          ))}

          {/* Hidden axis dedicated to overlap markers, fixed [0,1] domain. */}
          <YAxis yAxisId={OVERLAP_AXIS_ID} type="number" domain={[0, 1]} hide />

          {/* Hidden axis dedicated to the event scatter lane (top of plot). */}
          <YAxis yAxisId={EVENTS_AXIS_ID} type="number" domain={[0, 1]} hide />

          {/* Hidden axis dedicated to the "no data" ✕ lane (bottom of plot). */}
          <YAxis yAxisId={MISSING_AXIS_ID} type="number" domain={[0, 1]} hide />

          {/* Tooltip — single instance, custom body. Locked to the top of the
              plot (y is fixed; it still tracks the cursor horizontally) and
              allowed to escape the view box, so the readout never drops down
              over the very lines the user is inspecting. */}
          <Tooltip
            cursor={{ stroke: 'var(--accent-primary)', strokeOpacity: 0.5, strokeDasharray: '3 3' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 0 }}
            offset={16}
            allowEscapeViewBox={{ x: true, y: true }}
            content={(props) => (
              <CorrelationTooltip
                active={props.active}
                label={props.label as number | string | undefined}
                series={series}
                events={events}
                xDomain={xDomain}
              />
            )}
          />

          {/* Series lines. Thin, slightly transparent, with per-sample dots
              so users can see exactly where data points exist (parity with
              the History chart cards). Dot size scales down on dense series
              to keep the chart readable. */}
          {series.map(s => {
            if (s.points.length === 0) return null;
            // Smaller dots when many samples; hide entirely if exceptionally dense.
            const n = s.points.length;
            const dotProps =
              n > 2000
                ? false
                : ({
                    r: n > 800 ? 2.4 : n > 300 ? 3 : 3.6,
                    fill: s.color,
                    stroke: 'var(--bg-elevated)',
                    strokeWidth: 0.5,
                  } as const);
            return (
              <Line
                key={`line-${s.id}`}
                yAxisId={s.id}
                data={s.points}
                dataKey="v"
                type="monotone"
                stroke={s.color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
                strokeDasharray={s.dash}
                dot={dotProps}
                activeDot={{ r: 5, fill: s.color, strokeWidth: 0 }}
                isAnimationActive={false}
                connectNulls={false}
                name={s.label}
              />
            );
          })}

          {/* Event markers rendered via a transparent <Line> with a custom
              `dot` function. Why a Line (and not Scatter): Lines reuse the
              exact same axis-binding pipeline as the signal lines, which we
              already know align perfectly to the time XAxis. The Scatter
              path was unreliable when multiple independent Y-axes exist on
              the same chart. The line itself is invisible (stroke=none); we
              only render the dots, each of which:
                - sits exactly on the event's timestamp on the X axis
                - accepts pointer events (cursor=pointer)
                - on click, pins the event's exact timestamp
              The full hover/tooltip is provided by the chart-level Tooltip
              (CorrelationTooltip), which already lists all events within
              ±tolerance of the cursor. */}
          {scatterData.length > 0 && (
            <Line
              data={scatterData}
              xAxisId={0}
              yAxisId={EVENTS_AXIS_ID}
              dataKey="y"
              type="linear"
              name="__events_lane"
              stroke="transparent"
              strokeWidth={0}
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
              connectNulls={false}
              dot={(props: {
                cx?: number;
                cy?: number;
                index?: number;
                payload?: { evt?: EventInstance };
              }) => {
                const { cx = 0, cy = 0, payload, index = 0 } = props;
                const e = payload?.evt;
                if (!e || !Number.isFinite(cx) || !Number.isFinite(cy)) {
                  // Recharts requires the `dot` function to always return an
                  // SVG element; an empty <g/> is the safest no-op.
                  return <g key={`evt-empty-${index}`} />;
                }
                // Active = filled, cleared (value === 0) = ring (hollow).
                const filled = e.value !== 0;
                return (
                  <g
                    key={`evt-${e.id}`}
                    aria-label={`Event: ${e.title} at ${new Date(e.t).toLocaleString()}`}
                    style={{ cursor: onPinToggle ? 'pointer' : 'default' }}
                    onClick={(ev: React.MouseEvent) => {
                      ev.stopPropagation();
                      // Belt-and-suspenders: also flag the chart-level
                      // handler to skip its next invocation, since
                      // Recharts' synthetic onClick may fire regardless
                      // of DOM-level stopPropagation.
                      suppressNextChartClickRef.current = true;
                      if (onPinToggle) onPinToggle(e.t);
                    }}
                  >
                    {/* Wider invisible hit target for easier hover/click.
                        `pointer-events: all` is required because SVG by
                        default ignores events on `fill="transparent"`. */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={9}
                      fill="transparent"
                      style={{ pointerEvents: 'all' }}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={filled ? e.color : 'var(--bg-elevated)'}
                      stroke={e.color}
                      strokeWidth={1.4}
                      style={{ pointerEvents: 'all' }}
                    />
                  </g>
                );
              }}
              activeDot={false}
            />
          )}

          {/* Pinned timestamps — solid thin reference lines + per-series chips. */}
          {pins.map((pt, idx) => {
            const readouts = readoutAt(series, pt, tol);
            return (
              <React.Fragment key={`pin-${idx}-${pt}`}>
                <ReferenceLine
                  x={pt}
                  xAxisId={0}
                  stroke="var(--accent-primary)"
                  strokeOpacity={0.85}
                  strokeWidth={1}
                  ifOverflow="hidden"
                  label={{
                    value: `📌 ${idx + 1}`,
                    position: 'top',
                    fill: 'var(--accent-primary)',
                    fontSize: 10,
                  }}
                />
                {readouts.map((r) =>
                  r.value == null ? null : (
                    <ReferenceDot
                      key={`pin-${idx}-${r.id}`}
                      x={pt}
                      y={r.value}
                      yAxisId={r.id}
                      r={4.5}
                      fill={r.color}
                      stroke="var(--bg-elevated)"
                      strokeWidth={1.5}
                      ifOverflow="hidden"
                    />
                  ),
                )}
              </React.Fragment>
            );
          })}

          {/* Blue ✕ overlap markers, one per cluster bucket. */}
          {overlaps.map((o, i) => (
            <ReferenceDot
              key={`ovl-${i}`}
              x={o.t}
              y={OVERLAP_Y}
              xAxisId={0}
              yAxisId={OVERLAP_AXIS_ID}
              r={4}
              shape={(props: { cx?: number; cy?: number }) => {
                const { cx = 0, cy = 0 } = props;
                const r = 4;
                return (
                  <g aria-label={`Overlap: ${o.label}`}>
                    <line
                      x1={cx - r}
                      y1={cy - r}
                      x2={cx + r}
                      y2={cy + r}
                      stroke="var(--accent-primary)"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                    <line
                      x1={cx - r}
                      y1={cy + r}
                      x2={cx + r}
                      y2={cy - r}
                      stroke="var(--accent-primary)"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }}
            />
          ))}

          {/* ✕ "no data" markers — one per (series, time-bucket) where a computed
              value could not be produced. Colored by the owning series so the
              user can tell which signal is missing data at that instant. */}
          {missingMarkers.map(m => (
            <ReferenceDot
              key={`miss-${m.key}`}
              x={m.t}
              y={MISSING_Y}
              xAxisId={0}
              yAxisId={MISSING_AXIS_ID}
              r={4}
              shape={(props: { cx?: number; cy?: number }) => {
                const { cx = 0, cy = 0 } = props;
                const r = 3.5;
                return (
                  <g aria-label={`No data: ${m.label} at ${new Date(m.t).toLocaleString()}`}>
                    <line
                      x1={cx - r}
                      y1={cy - r}
                      x2={cx + r}
                      y2={cy + r}
                      stroke={m.color}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                    />
                    <line
                      x1={cx - r}
                      y1={cy + r}
                      x2={cx + r}
                      y2={cy - r}
                      stroke={m.color}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }}
            />
          ))}

          {/* Drag-to-zoom selection marquee — painted LAST so it sits on top of
              every series/marker (like the rectangle tool in Paint). It only
              appears while a drag is in progress; releasing commits the zoom. */}
          {refAreaLeft != null &&
            refAreaRight != null &&
            refAreaLeft !== refAreaRight && (
              <ReferenceArea
                xAxisId={0}
                yAxisId={OVERLAP_AXIS_ID}
                x1={refAreaLeft}
                x2={refAreaRight}
                y1={0}
                y2={1}
                stroke="var(--accent-primary)"
                strokeOpacity={0.9}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="var(--accent-primary)"
                fillOpacity={0.18}
                ifOverflow="visible"
              />
            )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverlayChart;
