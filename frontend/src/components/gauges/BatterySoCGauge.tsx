// src/components/gauges/BatterySoCGauge.tsx
// Professional circular battery state of charge gauge

import React from 'react';

interface BatterySoCGaugeProps {
  value: number | null;
  moduleNumber: number;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
}

const BatterySoCGauge: React.FC<BatterySoCGaugeProps> = ({
  value,
  moduleNumber,
  loading = false,
  error = null,
  timestamp = null,
}) => {
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  const percentage = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  
  // Color based on SoC level
  const getColor = (soc: number) => {
    if (soc >= 80) return '#22c55e'; // Green
    if (soc >= 50) return '#84cc16'; // Lime
    if (soc >= 30) return '#eab308'; // Yellow
    if (soc >= 15) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };
  
  const color = hasValue ? getColor(percentage) : '#6b7280';
  
  // SVG circle calculations
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      minWidth: '120px',
      position: 'relative',
    }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '12px',
        }}>
          <div className="gauge-spinner" />
        </div>
      )}
      
      {/* Module badge */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'var(--bg-input)',
        fontSize: '9px',
        fontWeight: 600,
        color: 'var(--text-tertiary)',
      }}>
        M{moduleNumber}
      </div>
      
      {/* Circular gauge */}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${color}60)`,
          }}
        />
      </svg>
      
      {/* Center value */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -70%)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '22px',
          fontWeight: 700,
          color: hasValue ? color : 'var(--text-tertiary)',
          lineHeight: 1,
        }}>
          {hasValue ? Math.round(percentage) : '--'}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          marginTop: '2px',
        }}>
          %
        </div>
      </div>
      
      {/* Battery icon indicator */}
      <div style={{
        marginTop: '-10px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={color}>
          <rect x="2" y="7" width="18" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
          <rect x="4" y="9" width={14 * (percentage / 100)} height="6" rx="0.5" fill={color}/>
          <rect x="20" y="10" width="2" height="4" rx="0.5" fill={color}/>
        </svg>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: color,
        }}>
          {percentage >= 80 ? 'Full' : percentage >= 50 ? 'Good' : percentage >= 30 ? 'Low' : percentage >= 15 ? 'Very Low' : 'Critical'}
        </span>
      </div>
      
      {/* Label */}
      <div style={{
        marginTop: '6px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}>
        Battery {moduleNumber} SoC
      </div>
      
      {/* Timestamp */}
      <div style={{
        marginTop: '2px',
        fontSize: '9px',
        color: 'var(--text-tertiary)',
      }}>
        {error ? '⚠️ Error' : (timestamp ? new Date(timestamp).toLocaleTimeString() : '--')}
      </div>
    </div>
  );
};

export default BatterySoCGauge;
