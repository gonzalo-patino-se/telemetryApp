// src/components/CorrelationOverTime/OverlayChart.tsx
// Phase 2: pure presentational overlay chart.
//   - Single shared X-axis (time)
//   - One independent, HIDDEN Y-axis per series  -> "overlay with independent y"
//   - Thin strokes, low-opacity gridlines, theme via CSS variables
//   - Vertical event markers (ReferenceLine + glyph) + blue ✕ overlap dots
//
// Interactions (tooltip, pins, selector) are added in Phase 3 — this file
// keeps the chart deliberately stateless / declarative.

import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
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

interface OverlayChartProps {
  series: SignalSeries[];
  events: EventInstance[];
  /** Optional explicit time domain — usually wired to TimeRangeContext. */
  start: Date | null;
  end: Date | null;
  height?: number;
}

/** Reserved synthetic y-axis used solely to position overlap markers. */
const OVERLAP_AXIS_ID = '__overlap';
const OVERLAP_Y = 0.06; // near the bottom of the plot (just above the X-axis)

export const OverlayChart: React.FC<OverlayChartProps> = ({
  series,
  events,
  start,
  end,
  height = 240,
}) => {
  const xDomain = React.useMemo(
    () => computeXDomain(start, end, series, events),
    [start, end, series, events],
  );
  const span = xDomain[1] - xDomain[0];

  const overlaps = React.useMemo(
    () => buildOverlapMarkers(series, events, xDomain),
    [series, events, xDomain],
  );

  // Recharts needs a `data` array per Line; we draw one Line per series and
  // pass its `points` directly via the `data` prop (rather than a single
  // joined dataset) so each series keeps its own y-axis cleanly.
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 18, right: 16, bottom: 8, left: 8 }}>
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

          {/* Independent, hidden Y-axis per series.
              Keeps each series in its own [min,max] band without wasting
              card width on numeric gutters. Magnitudes live in the legend
              and tooltip — they're not comparable by height by design. */}
          {series.map(s => (
            <YAxis
              key={`y-${s.id}`}
              yAxisId={s.id}
              domain={paddedYDomain(s.vMin, s.vMax)}
              hide
            />
          ))}

          {/* Hidden axis dedicated to overlap markers, fixed [0,1] domain. */}
          <YAxis yAxisId={OVERLAP_AXIS_ID} domain={[0, 1]} hide />

          {/* Series lines. Thin, slightly transparent. */}
          {series.map(s =>
            s.points.length === 0 ? null : (
              <Line
                key={`line-${s.id}`}
                yAxisId={s.id}
                data={s.points}
                dataKey="v"
                type="monotone"
                stroke={s.color}
                strokeWidth={1.5}
                strokeOpacity={0.85}
                dot={false}
                activeDot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                isAnimationActive={false}
                connectNulls={false}
                name={s.label}
              />
            ),
          )}

          {/* Event markers — vertical reference lines + a small glyph at top.
              We piggy-back the glyph on the line label so it renders without
              a separate <text> child and stays inside the plot area. */}
          {events.map(e => (
            <ReferenceLine
              key={`evt-${e.id}`}
              x={e.t}
              xAxisId={0}
              stroke={e.color}
              strokeOpacity={0.55}
              strokeDasharray="3 3"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={{
                value: e.glyph ?? '◆',
                position: 'top',
                fill: e.color,
                fontSize: 10,
              }}
            />
          ))}

          {/* Blue ✕ overlap markers, one per cluster bucket. */}
          {overlaps.map((o, i) => (
            <ReferenceDot
              key={`ovl-${i}`}
              x={o.t}
              y={OVERLAP_Y}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverlayChart;
