// src/components/gauges/DigitalValueDisplay.tsx
// Professional digital display for voltage, current, frequency, temperature metrics

import React from 'react';

interface DigitalValueDisplayProps {
  value: number | null;
  unit: string;
  label: string;
  min?: number;
  max?: number;
  decimals?: number;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
  colorStart?: string;
  colorEnd?: string;
  icon?: React.ReactNode;
  warningThreshold?: number;
  criticalThreshold?: number;
}

const DigitalValueDisplay: React.FC<DigitalValueDisplayProps> = ({
  value,
  unit,
  label,
  min = 0,
  max = 100,
  decimals = 1,
  loading = false,
  error = null,
  timestamp = null,
  colorStart = '#3b82f6',
  colorEnd = '#06b6d4',
  icon,
  warningThreshold,
  criticalThreshold,
}) => {
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  
  // Calculate percentage for bar
  const percentage = hasValue
    ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
    : 0;
  
  // Determine status color
  let statusColor = colorEnd;
  if (hasValue && criticalThreshold !== undefined && value >= criticalThreshold) {
    statusColor = '#ef4444';
  } else if (hasValue && warningThreshold !== undefined && value >= warningThreshold) {
    statusColor = '#f59e0b';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '14px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      minWidth: '140px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${colorStart}, ${colorEnd})`,
      }} />
      
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
      
      {/* Header with icon and label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        {icon && (
          <span style={{ 
            color: colorEnd, 
            display: 'flex',
            alignItems: 'center',
          }}>
            {icon}
          </span>
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {label}
        </span>
      </div>
      
      {/* Value display */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
        marginBottom: '10px',
      }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 700,
          color: hasValue ? statusColor : 'var(--text-tertiary)',
          fontFamily: "'SF Mono', 'Roboto Mono', monospace",
          lineHeight: 1,
        }}>
          {hasValue ? value.toFixed(decimals) : '--'}
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-tertiary)',
        }}>
          {unit}
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{
        height: '6px',
        background: 'var(--bg-input)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '8px',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: `linear-gradient(90deg, ${colorStart}, ${statusColor})`,
          borderRadius: '3px',
          transition: 'width 0.5s ease-out',
        }} />
      </div>
      
      {/* Min/Max labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        color: 'var(--text-tertiary)',
        marginBottom: '6px',
      }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      
      {/* Timestamp */}
      <div style={{
        fontSize: '9px',
        color: 'var(--text-tertiary)',
        textAlign: 'right',
      }}>
        {error ? '⚠️ Error' : (timestamp ? new Date(timestamp).toLocaleTimeString() : '--')}
      </div>
    </div>
  );
};

export default DigitalValueDisplay;
