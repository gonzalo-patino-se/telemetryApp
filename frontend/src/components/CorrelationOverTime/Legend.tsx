// src/components/CorrelationOverTime/Legend.tsx
// Compact legend for the Correlation Over Time card.
// Shows: color dot · label · unit · range chip (or "no data").
// Heights are NOT comparable across series, so the range chip is the only
// magnitude affordance we expose on-card.

import React from 'react';
import type { SignalSeries, EventInstance } from './types';

interface LegendProps {
  series: SignalSeries[];
  events: EventInstance[];
}

function formatRange(s: SignalSeries): string {
  if (s.points.length === 0) return 'no data';
  const lo = s.vMin ?? 0;
  const hi = s.vMax ?? 0;
  const fmt = (n: number) =>
    Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(2);
  if (lo === hi) return `${fmt(lo)} ${s.unit}`;
  return `${fmt(lo)}–${fmt(hi)} ${s.unit}`;
}

export const Legend: React.FC<LegendProps> = ({ series, events }) => {
  // Distinct event categories present in the resolved instances.
  const eventCategories = React.useMemo(() => {
    const seen = new Map<string, { label: string; color: string; count: number }>();
    for (const e of events) {
      const prev = seen.get(e.categoryId);
      if (prev) prev.count += 1;
      else seen.set(e.categoryId, { label: e.categoryLabel, color: e.color, count: 1 });
    }
    return Array.from(seen.values()).sort((a, b) => b.count - a.count);
  }, [events]);

  if (series.length === 0 && eventCategories.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 12px',
        padding: '6px 8px 0',
        fontSize: 11,
        lineHeight: 1.4,
        color: 'var(--text-secondary)',
      }}
    >
      {series.map(s => {
        const empty = s.points.length === 0;
        return (
          <span
            key={s.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: empty ? 0.5 : 1,
            }}
            title={`${s.label} (${s.unit})`}
          >
            {/* SVG swatch — same color + dash as the line on the chart. */}
            <svg
              aria-hidden
              width={18}
              height={6}
              viewBox="0 0 18 6"
              style={{ display: 'inline-block', flex: '0 0 auto' }}
            >
              <line
                x1={0}
                y1={3}
                x2={18}
                y2={3}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.dash}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ color: 'var(--text-primary)' }}>{s.label}</span>
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-tertiary)',
              }}
            >
              · {formatRange(s)}
            </span>
          </span>
        );
      })}

      {eventCategories.map(c => (
        <span
          key={c.label}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title={`${c.label} — ${c.count} event${c.count === 1 ? '' : 's'}`}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: c.color,
              display: 'inline-block',
              flex: '0 0 auto',
            }}
          />
          <span style={{ color: 'var(--text-primary)' }}>{c.label}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>· {c.count}</span>
        </span>
      ))}

      {/* Overlap legend chip — explains the blue ✕ markers. */}
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        title="Two or more selected signals or events occur in the same instant"
      >
        <span
          aria-hidden
          style={{
            color: 'var(--accent-primary)',
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          ✕
        </span>
        <span style={{ color: 'var(--text-primary)' }}>Overlap</span>
      </span>

      {/* No-data legend chip — explains the series-colored ✕ markers used
          where a computed value (e.g. power) could not be produced because an
          input was missing. */}
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        title="A required input was missing, so no value was computed at that time (shown as ✕ instead of a plotted point)"
      >
        <span
          aria-hidden
          style={{
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          ✕
        </span>
        <span style={{ color: 'var(--text-primary)' }}>No data</span>
      </span>
    </div>
  );
};

export default Legend;
