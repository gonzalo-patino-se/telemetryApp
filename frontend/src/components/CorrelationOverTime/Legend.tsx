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
    const seen = new Map<string, { label: string; color: string; glyph?: string; count: number }>();
    for (const e of events) {
      const prev = seen.get(e.categoryId);
      if (prev) prev.count += 1;
      else seen.set(e.categoryId, { label: e.categoryLabel, color: e.color, glyph: e.glyph, count: 1 });
    }
    return Array.from(seen.values());
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
            <span
              aria-hidden
              style={{
                width: 10,
                height: 2,
                background: s.color,
                borderRadius: 1,
                display: 'inline-block',
              }}
            />
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
          <span aria-hidden style={{ color: c.color, fontSize: 10 }}>
            {c.glyph ?? '◆'}
          </span>
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
    </div>
  );
};

export default Legend;
