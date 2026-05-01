// src/components/gauges/BgcsRelayStatusDisplay.tsx
// Professional BGCS Grid Relay status display
// Similar to InverterModeDisplay but for relay states

import React from 'react';
import { formatTimestamp, isTimestampStale } from './utils';

interface BgcsRelayStatusDisplayProps {
  value: number | null;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
}

// BGCS Relay status definitions
const RELAY_STATES: Record<number, { label: string; color: string; icon: string; description: string }> = {
  [-1]: { label: 'INVALID', color: '#ef4444', icon: '⚠', description: 'Invalid state' },
  0: { label: 'UNDEFINED', color: '#6b7280', icon: '○', description: 'State not defined' },
  1: { label: 'OPEN', color: '#f59e0b', icon: '◇', description: 'Relay is open' },
  2: { label: 'CLOSED', color: '#22c55e', icon: '◆', description: 'Relay is closed' },
  3: { label: 'FAULTED_OPEN', color: '#dc2626', icon: '⚡', description: 'Faulted - open state' },
  4: { label: 'FAULTED_CLOSED', color: '#dc2626', icon: '⚡', description: 'Faulted - closed state' },
  5: { label: 'OVERRIDE_OPEN', color: '#8b5cf6', icon: '⊙', description: 'Override - open' },
  6: { label: 'OVERRIDE_CLOSED', color: '#8b5cf6', icon: '⊛', description: 'Override - closed' },
  7: { label: 'ESTOP_OPEN', color: '#ef4444', icon: '⛔', description: 'Emergency stop - open' },
  8: { label: 'ESTOP_CLOSED', color: '#ef4444', icon: '⛔', description: 'Emergency stop - closed' },
};

const BgcsRelayStatusDisplay: React.FC<BgcsRelayStatusDisplayProps> = ({
  value,
  loading = false,
  error = null,
  timestamp = null,
}) => {
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  const stateInfo = hasValue ? (RELAY_STATES[value] || RELAY_STATES[-1]) : RELAY_STATES[-1];
  
  // Status indicator animation
  const isClosed = value === 2;
  const isFaulted = value === 3 || value === 4;
  const isEstop = value === 7 || value === 8;
  const isOverride = value === 5 || value === 6;

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
        background: `linear-gradient(135deg, ${stateInfo.color}15 0%, ${stateInfo.color}05 100%)`,
        border: `3px solid ${stateInfo.color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 0 20px ${stateInfo.color}30`,
      }}>
        {/* Animated ring for closed/operational state */}
        {isClosed && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px solid ${stateInfo.color}`,
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
        )}
        
        {/* Fault warning animation */}
        {(isFaulted || isEstop) && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px solid ${stateInfo.color}`,
            animation: 'fault-blink 1s ease-in-out infinite',
          }} />
        )}
        
        {/* Override indicator */}
        {isOverride && (
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: `2px dashed ${stateInfo.color}`,
            animation: 'spin 4s linear infinite',
          }} />
        )}
        
        {/* State Icon */}
        <div style={{
          fontSize: '32px',
          marginBottom: '4px',
          filter: `drop-shadow(0 0 8px ${stateInfo.color}80)`,
        }}>
          {stateInfo.icon}
        </div>
        
        {/* State Code */}
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          fontFamily: 'monospace',
        }}>
          {hasValue ? `STATE ${value}` : '--'}
        </div>
      </div>
      
      {/* State Label */}
      <div style={{
        marginTop: '12px',
        padding: '6px 16px',
        borderRadius: '8px',
        background: `${stateInfo.color}20`,
        border: `1px solid ${stateInfo.color}40`,
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: stateInfo.color,
          letterSpacing: '0.5px',
        }}>
          {hasValue ? stateInfo.label : 'UNKNOWN'}
        </span>
      </div>
      
      {/* Description */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        {hasValue ? stateInfo.description : 'No data available'}
      </div>
      
      {/* Label */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}>
        BGCS Relay
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

export default BgcsRelayStatusDisplay;
