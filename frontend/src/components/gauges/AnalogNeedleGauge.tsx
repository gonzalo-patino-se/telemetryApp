// src/components/gauges/AnalogNeedleGauge.tsx
// Professional analog needle gauge for metrics like WiFi signal strength

import React from 'react';
import { formatTimestamp, isTimestampStale } from './utils';

interface AnalogNeedleGaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  label: string;
  loading?: boolean;
  error?: string | null;
  timestamp?: string | null;
  colorZones?: { start: number; end: number; color: string }[];
}

const AnalogNeedleGauge: React.FC<AnalogNeedleGaugeProps> = ({
  value,
  min,
  max,
  unit,
  label,
  loading = false,
  error = null,
  timestamp = null,
  colorZones = [],
}) => {
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  
  // Handle 0 dBm as error for WiFi
  const isWifiError = unit === 'dBm' && value === 0;
  const displayValue = isWifiError ? null : value;
  const hasValidValue = hasValue && !isWifiError;
  
  // Calculate needle angle (from -135 to +135 degrees, total 270 degrees)
  const percentage = hasValidValue
    ? Math.max(0, Math.min(100, ((displayValue! - min) / (max - min)) * 100))
    : 0;
  const needleAngle = -135 + (percentage / 100) * 270;
  
  // Default color zones for WiFi signal if not provided
  const defaultWifiZones = [
    { start: 0, end: 25, color: '#ef4444' },    // Poor (red)
    { start: 25, end: 50, color: '#f59e0b' },   // Fair (orange)
    { start: 50, end: 75, color: '#eab308' },   // Good (yellow)
    { start: 75, end: 100, color: '#22c55e' },  // Excellent (green)
  ];
  
  const zones = colorZones.length > 0 ? colorZones : defaultWifiZones;
  
  // SVG dimensions
  const size = 160;
  const centerX = size / 2;
  const centerY = size / 2 + 10;
  const radius = 60;
  
  // Create arc path for gauge background segments
  const createArc = (startPercent: number, endPercent: number) => {
    const startAngle = -135 + (startPercent / 100) * 270;
    const endAngle = -135 + (endPercent / 100) * 270;
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  // Get signal quality label
  const getSignalQuality = (pct: number) => {
    if (isWifiError) return 'Error';
    if (pct >= 75) return 'Excellent';
    if (pct >= 50) return 'Good';
    if (pct >= 25) return 'Fair';
    return 'Poor';
  };
  
  const signalQuality = hasValidValue ? getSignalQuality(percentage) : (isWifiError ? 'Error' : '--');
  const qualityColor = isWifiError ? '#ef4444' : (
    percentage >= 75 ? '#22c55e' :
    percentage >= 50 ? '#eab308' :
    percentage >= 25 ? '#f59e0b' : '#ef4444'
  );

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
      
      {/* Gauge SVG */}
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <defs>
          {/* Drop shadow for needle */}
          <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3"/>
          </filter>
          {/* Metallic gradient for needle */}
          <linearGradient id="needle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
        
        {/* Gauge background (dark) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 8}
          fill="var(--bg-input)"
          stroke="var(--border-medium)"
          strokeWidth="1"
        />
        
        {/* Color zone arcs */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={createArc(zone.start, zone.end)}
            fill="none"
            stroke={zone.color}
            strokeWidth="12"
            strokeLinecap="butt"
            opacity={0.8}
          />
        ))}
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = -135 + (tick / 100) * 270;
          const rad = (angle - 90) * Math.PI / 180;
          const innerR = radius - 18;
          const outerR = radius - 8;
          const x1 = centerX + innerR * Math.cos(rad);
          const y1 = centerY + innerR * Math.sin(rad);
          const x2 = centerX + outerR * Math.cos(rad);
          const y2 = centerY + outerR * Math.sin(rad);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text-tertiary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Minor tick marks */}
        {[12.5, 37.5, 62.5, 87.5].map((tick) => {
          const angle = -135 + (tick / 100) * 270;
          const rad = (angle - 90) * Math.PI / 180;
          const innerR = radius - 14;
          const outerR = radius - 8;
          const x1 = centerX + innerR * Math.cos(rad);
          const y1 = centerY + innerR * Math.sin(rad);
          const x2 = centerX + outerR * Math.cos(rad);
          const y2 = centerY + outerR * Math.sin(rad);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text-tertiary)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}
        
        {/* Needle */}
        <g 
          transform={`rotate(${needleAngle}, ${centerX}, ${centerY})`}
          filter="url(#needle-shadow)"
          style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Needle body */}
          <polygon
            points={`
              ${centerX},${centerY - radius + 15}
              ${centerX - 4},${centerY}
              ${centerX + 4},${centerY}
            `}
            fill="url(#needle-gradient)"
          />
          {/* Needle cap */}
          <circle
            cx={centerX}
            cy={centerY}
            r="8"
            fill="#374151"
            stroke="#1f2937"
            strokeWidth="2"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill="#6b7280"
          />
        </g>
        
        {/* Center value display */}
        <text
          x={centerX}
          y={centerY + 35}
          textAnchor="middle"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            fill: isWifiError ? '#ef4444' : 'var(--text-primary)',
            fontFamily: 'monospace',
          }}
        >
          {isWifiError ? 'ERR' : (hasValidValue ? displayValue!.toFixed(0) : '--')}
        </text>
        <text
          x={centerX}
          y={centerY + 50}
          textAnchor="middle"
          style={{
            fontSize: '11px',
            fill: 'var(--text-tertiary)',
          }}
        >
          {unit}
        </text>
      </svg>
      
      {/* Signal quality badge */}
      <div style={{
        marginTop: '8px',
        padding: '4px 12px',
        borderRadius: '12px',
        background: `${qualityColor}20`,
        border: `1px solid ${qualityColor}40`,
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: qualityColor,
        }}>
          {signalQuality}
        </span>
      </div>
      
      {/* Label */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        {label}
      </div>
      
      {/* Timestamp */}
      <div style={{
        marginTop: '4px',
        fontSize: '10px',
        color: isTimestampStale(timestamp) ? '#f59e0b' : 'var(--text-tertiary)',
      }}>
        {error ? '⚠️ Error' : formatTimestamp(timestamp)}
      </div>
    </div>
  );
};

export default AnalogNeedleGauge;
