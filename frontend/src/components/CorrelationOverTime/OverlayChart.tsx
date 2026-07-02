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
}) => {
  const xDomain = React.useMemo(
    () => computeXDomain(start, end, series, events),
    [start, end, series, events],
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

  const handleMouseMove = React.useCallback((state: { activeLabel?: number | string }) => {
    const al = state?.activeLabel;
    if (al == null) {
      hoverXRef.current = null;
      return;
    }
    const t = typeof al === 'number' ? al : Number(al);
    hoverXRef.current = Number.isFinite(t) ? t : null;
  }, []);

  const handleClick = React.useCallback(() => {
    if (suppressNextChartClickRef.current) {
      // Reset and skip — an event-dot click handled the pin.
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
    <div style={{ width: '100%', height, position: 'relative' }}>
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
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          margin={{ top: 18, right: 16, bottom: 8, left: 8 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            hoverXRef.current = null;
          }}
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
            allowDataOverflow={false}
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

          {/* Tooltip — single instance, custom body. */}
          <Tooltip
            cursor={{ stroke: 'var(--accent-primary)', strokeOpacity: 0.5, strokeDasharray: '3 3' }}
            wrapperStyle={{ outline: 'none' }}
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
              n > 1200
                ? false
                : ({
                    r: n > 400 ? 1.4 : n > 150 ? 1.8 : 2.2,
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
                activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
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
                  ifOverflow="extendDomain"
                  label={{
                    value: `📌 ${idx + 1}`,
                    position: 'top',
                    fill: 'var(--accent-primary)',
                    fontSize: 10,
                  }}
                />
                {readouts.map((r, ri) =>
                  r.value == null ? null : (
                    <ReferenceDot
                      key={`pin-${idx}-${r.id}`}
                      x={pt}
                      y={r.value}
                      yAxisId={r.id}
                      r={3}
                      fill={r.color}
                      stroke="var(--bg-elevated)"
                      strokeWidth={1}
                      ifOverflow="extendDomain"
                      label={{
                        value: `${r.label}: ${
                          Math.abs(r.value) >= 1000
                            ? r.value.toFixed(0)
                            : r.value.toFixed(2)
                        }${r.unit ? ' ' + r.unit : ''}`,
                        position: ri % 2 === 0 ? 'right' : 'left',
                        fill: r.color,
                        fontSize: 10,
                      }}
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverlayChart;
