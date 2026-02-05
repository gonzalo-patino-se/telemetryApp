// src/components/gauges/BatterySoCGauge.tsx
// Professional battery state of charge gauge - clean modern design

import React from 'react';
import { formatTimestamp, isTimestampStale } from './utils';

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
  
  const getStatus = (soc: number) => {
    if (soc >= 80) return 'Full';
    if (soc >= 50) return 'Good';
    if (soc >= 30) return 'Low';
    if (soc >= 15) return 'Very Low';
    return 'Critical';
  };
  
  const color = hasValue ? getColor(percentage) : '#6b7280';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      width: '180px',
      height: '200px',
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
      
      {/* Header with module number */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Battery {moduleNumber}
        </span>
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          color: color,
          padding: '2px 6px',
          borderRadius: '4px',
          background: `${color}15`,
        }}>
          {hasValue ? getStatus(percentage) : '--'}
        </span>
      </div>
      
      {/* Large Battery Visual */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Battery container */}
        <div style={{ position: 'relative' }}>
          {/* Battery body */}
          <div style={{
            width: '70px',
            height: '100px',
            border: `3px solid ${color}`,
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--bg-input)',
          }}>
            {/* Fill level */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${percentage}%`,
              background: `linear-gradient(180deg, ${color}cc 0%, ${color} 100%)`,
              transition: 'height 0.8s ease-out',
              borderRadius: '0 0 4px 4px',
            }} />
            
            {/* Percentage text overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: 700,
                color: percentage > 50 ? '#fff' : color,
                textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                lineHeight: 1,
              }}>
                {hasValue ? Math.round(percentage) : '--'}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: percentage > 50 ? '#fff' : color,
                textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                opacity: 0.9,
              }}>
                %
              </span>
            </div>
          </div>
          
          {/* Battery cap (positive terminal) */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '8px',
            background: color,
            borderRadius: '3px 3px 0 0',
          }} />
        </div>
      </div>
      
      {/* Timestamp */}
      <div style={{
        marginTop: '8px',
        fontSize: '9px',
        color: isTimestampStale(timestamp) ? '#f59e0b' : 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        {error ? '⚠️ Error' : formatTimestamp(timestamp)}
      </div>
    </div>
  );
};

export default BatterySoCGauge;
