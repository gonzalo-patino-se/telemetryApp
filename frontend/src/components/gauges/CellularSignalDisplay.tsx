// src/components/gauges/CellularSignalDisplay.tsx
// Instant gauge for the Cellular Low-Signal-Strength alarm.
// value semantics:
//   1  -> alarm active = LOW SIGNAL (BAD, red)
//   0  -> alarm cleared = OK (green)
//   null/undefined -> no data yet (gray)

import React from 'react';
import { formatTimestamp, isTimestampStale } from './utils';

interface CellularSignalDisplayProps {
  value: number | null;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
}

interface StateInfo {
  label: string;
  color: string;
  bars: number;
  description: string;
}

const STATE_OK: StateInfo = { label: 'Low Signal Not Detected', color: '#22c55e', bars: 4, description: 'No low cellular signal detected' };
const STATE_LOW: StateInfo = { label: 'Low Signal Detected', color: '#ef4444', bars: 1, description: 'Low cellular signal alarm active' };

const CellularSignalDisplay: React.FC<CellularSignalDisplayProps> = ({
  value,
  loading = false,
  error = null,
  timestamp = null,
}) => {
  // Semantics:
  //   value === 1            -> alarm active = Low Signal Detected (BAD, red)
  //   any other value        -> Low Signal Not Detected (OK, green)
  //   error                  -> show error state below the badge but still render OK badge.
  const isLow = Number.isFinite(value as number) && (value as number) === 1;
  const state: StateInfo = isLow ? STATE_LOW : STATE_OK;
  const stale = isTimestampStale(timestamp ?? null);
  const noHistory = !error && (value === null || value === undefined);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      width: '180px',
      height: '200px',
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '16px',
        }}>
          <div className="gauge-spinner" />
        </div>
      )}

      {/* Circular status badge */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${state.color}15 0%, ${state.color}05 100%)`,
        border: `3px solid ${state.color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 0 20px ${state.color}30`,
        paddingTop: 12,
        paddingBottom: 8,
      }}>
        {isLow && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px solid ${state.color}`,
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        )}

        {/* Cellular bars icon */}
        <svg width="56" height="40" viewBox="0 0 56 40" style={{ marginBottom: 10 }}>
          <g fill={state.color} stroke={state.color}>
            <rect x={2}  y={28} width={6} height={10} opacity={state.bars >= 1 ? 1 : 0.2} />
            <rect x={14} y={22} width={6} height={16} opacity={state.bars >= 2 ? 1 : 0.2} />
            <rect x={26} y={14} width={6} height={24} opacity={state.bars >= 3 ? 1 : 0.2} />
            <rect x={38} y={4}  width={6} height={34} opacity={state.bars >= 4 ? 1 : 0.2} />
          </g>
        </svg>
        <div style={{ fontSize: 13, fontWeight: 700, color: state.color, letterSpacing: 0.5, marginTop: 2, textAlign: 'center', maxWidth: 100, lineHeight: 1.2 }}>
          {state.label}
        </div>
      </div>

      {/* Title */}
      <div style={{
        marginTop: 10,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-primary)',
        textAlign: 'center',
      }}>
        Cellular Signal
      </div>

      {/* Description / error / timestamp */}
      <div style={{
        marginTop: 4,
        fontSize: 10,
        color: error ? '#ef4444' : 'var(--text-muted)',
        textAlign: 'center',
        minHeight: 14,
      }}>
        {error
          ? error
          : noHistory
            ? 'No alarm history (assumed OK)'
            : timestamp
              ? `${stale ? '⚠ ' : ''}${formatTimestamp(timestamp)}`
              : state.description}
      </div>
    </div>
  );
};

export default CellularSignalDisplay;
