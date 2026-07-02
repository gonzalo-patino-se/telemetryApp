// src/components/CorrelationOverTime/CorrelationTooltip.tsx
// Custom Recharts tooltip body for the Correlation Over Time card.
//
// What it shows at the hovered x:
//   - full timestamp header
//   - one row per *selected* series (color dot · label · value unit, or "no data")
//   - one row per event within ±tolerance (glyph · title @ time, optional description)

import React from 'react';
import { formatXFull } from './chartUtils';
import { nearestEventsAt, readoutAt, toleranceFromSpan } from './interactionUtils';
import type { EventInstance, SignalSeries } from './types';

interface CorrelationTooltipProps {
  /** Recharts injects these. */
  active?: boolean;
  label?: number | string;
  /** Card-level data, passed through by the chart. */
  series: SignalSeries[];
  events: EventInstance[];
  xDomain: [number, number];
  /** IANA timezone for rendering the timestamp header. */
  timeZone?: string;
}

function formatValue(v: number, unit: string): string {
  const abs = Math.abs(v);
  const fixed = abs >= 1000 ? v.toFixed(0) : abs >= 1 ? v.toFixed(2) : v.toFixed(3);
  return unit ? `${fixed} ${unit}` : fixed;
}

export const CorrelationTooltip: React.FC<CorrelationTooltipProps> = ({
  active,
  label,
  series,
  events,
  xDomain,
  timeZone,
}) => {
  if (!active || label == null) return null;
  const t = typeof label === 'number' ? label : Number(label);
  if (!Number.isFinite(t)) return null;

  const span = xDomain[1] - xDomain[0];
  const tol = toleranceFromSpan(span);

  const readouts = readoutAt(series, t, tol);
  const nearbyEvents = nearestEventsAt(events, t, tol * 2);

  return (
    <div
      role="tooltip"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        padding: '8px 10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        fontSize: 11,
        lineHeight: 1.45,
        color: 'var(--text-primary)',
        maxWidth: 280,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: 'var(--text-secondary)',
          marginBottom: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatXFull(t, timeZone)}
      </div>

      {readouts.length === 0 && nearbyEvents.length === 0 && (
        <div style={{ color: 'var(--text-tertiary)' }}>no data</div>
      )}

      {readouts.map(r => (
        <div
          key={`r-${r.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '1px 0' }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: r.color,
              flex: '0 0 auto',
            }}
          />
          <span style={{ flex: 1, color: 'var(--text-primary)' }}>{r.label}</span>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: r.value == null ? 'var(--text-tertiary)' : 'var(--text-primary)',
            }}
          >
            {r.value == null ? 'no data' : formatValue(r.value, r.unit)}
          </span>
        </div>
      ))}

      {nearbyEvents.length > 0 && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {nearbyEvents.map(e => (
            <div
              key={`e-${e.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                padding: '1px 0',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: e.color,
                  flex: '0 0 auto',
                  marginTop: 4,
                }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ color: 'var(--text-primary)' }}>{e.title}</span>
                {e.description && (
                  <span style={{ color: 'var(--text-tertiary)' }}> · {e.description}</span>
                )}
                <div
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 10,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {new Date(e.t).toLocaleTimeString([], { timeZone })}
                </div>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorrelationTooltip;
