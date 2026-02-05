// src/components/gauges/InverterModeDisplay.tsx
// Professional inverter operating mode status display

import React from 'react';
import { formatTimestamp, isTimestampStale } from './utils';

interface InverterModeDisplayProps {
  value: number | null;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
}

// Inverter mode definitions
const INVERTER_MODES: Record<number, { label: string; color: string; icon: string; description: string }> = {
  [-1]: { label: 'INVALID', color: '#ef4444', icon: '⚠', description: 'Invalid state' },
  0: { label: 'UNDEFINED', color: '#6b7280', icon: '○', description: 'State not defined' },
  1: { label: 'OFFLINE', color: '#6b7280', icon: '◯', description: 'System offline' },
  2: { label: 'DISABLED', color: '#f59e0b', icon: '⊘', description: 'Inverter disabled' },
  3: { label: 'STANDBY', color: '#3b82f6', icon: '◉', description: 'Ready and waiting' },
  4: { label: 'NORMAL', color: '#22c55e', icon: '●', description: 'Operating normally' },
  5: { label: 'LIMP MODE', color: '#f97316', icon: '◐', description: 'Reduced capacity' },
  6: { label: 'FAULT (AUTO)', color: '#ef4444', icon: '⚡', description: 'Auto-clearing fault' },
  7: { label: 'FAULT (MANUAL)', color: '#dc2626', icon: '⛔', description: 'Manual reset required' },
  8: { label: 'FW UPDATE', color: '#8b5cf6', icon: '↻', description: 'Firmware updating' },
  9: { label: 'SELF TEST', color: '#06b6d4', icon: '✓', description: 'Running diagnostics' },
};

const InverterModeDisplay: React.FC<InverterModeDisplayProps> = ({
  value,
  loading = false,
  error = null,
  timestamp = null,
}) => {
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  const modeInfo = hasValue ? (INVERTER_MODES[value] || INVERTER_MODES[-1]) : INVERTER_MODES[-1];
  
  // Status indicator animation
  const isOperational = value === 4;
  const isFault = value === 6 || value === 7;
  const isUpdating = value === 8;

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
          borderRadius: '16px',
        }}>
          <div className="gauge-spinner" />
        </div>
      )}
      
      {/* Status Display */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${modeInfo.color}15 0%, ${modeInfo.color}05 100%)`,
        border: `3px solid ${modeInfo.color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 0 20px ${modeInfo.color}30`,
      }}>
        {/* Animated ring for operational state */}
        {isOperational && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px solid ${modeInfo.color}`,
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        )}
        
        {/* Fault warning animation */}
        {isFault && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px solid ${modeInfo.color}`,
            animation: 'fault-blink 1s ease-in-out infinite',
          }} />
        )}
        
        {/* Update spinner */}
        {isUpdating && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px dashed ${modeInfo.color}`,
            animation: 'spin 3s linear infinite',
          }} />
        )}
        
        {/* Mode Icon */}
        <div style={{
          fontSize: '32px',
          marginBottom: '4px',
          filter: `drop-shadow(0 0 8px ${modeInfo.color}80)`,
        }}>
          {modeInfo.icon}
        </div>
        
        {/* Mode Code */}
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          fontFamily: 'monospace',
        }}>
          {hasValue ? `MODE ${value}` : '--'}
        </div>
      </div>
      
      {/* Mode Label */}
      <div style={{
        marginTop: '12px',
        padding: '6px 16px',
        borderRadius: '8px',
        background: `${modeInfo.color}20`,
        border: `1px solid ${modeInfo.color}40`,
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: modeInfo.color,
          letterSpacing: '0.5px',
        }}>
          {hasValue ? modeInfo.label : 'UNKNOWN'}
        </span>
      </div>
      
      {/* Description */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        {hasValue ? modeInfo.description : 'No data available'}
      </div>
      
      {/* Label */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}>
        Inverter Mode
      </div>
      
      {/* Timestamp */}
      <div style={{
        marginTop: '4px',
        fontSize: '10px',
        color: isTimestampStale(timestamp) ? '#f59e0b' : 'var(--text-tertiary)',
      }}>
        {error ? '⚠️ Error' : formatTimestamp(timestamp)}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes fault-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InverterModeDisplay;
