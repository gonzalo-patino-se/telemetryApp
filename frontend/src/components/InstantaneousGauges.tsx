// src/components/InstantaneousGauges.tsx
// Instantaneous telemetry values displayed as animated gauges
// Auto-refreshes every 10 seconds

import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// Types
// ============================================================================

interface GaugeConfig {
  id: string;
  label: string;
  telemetryName: string;
  unit: string;
  min: number;
  max: number;
  category: 'wifi' | 'solar' | 'grid' | 'battery' | 'load' | 'inverter';
  colorStart: string;
  colorEnd: string;
  decimals?: number;
}

interface GaugeData {
  value: number | null;
  localtime: string | null;
  loading: boolean;
  error: string | null;
}

interface InstantaneousGaugesProps {
  serial: string;
}

// ============================================================================
// Gauge Configurations - All telemetry metrics
// ============================================================================

const GAUGE_CONFIGS: GaugeConfig[] = [
  // WiFi
  { id: 'wifi', label: 'WiFi Signal', telemetryName: '/SCC/WIFI/STAT/SIGNAL_STRENGTH', unit: 'dBm', min: -100, max: 0, category: 'wifi', colorStart: '#3b82f6', colorEnd: '#06b6d4' },
  { id: 'inv_mode', label: 'Inverter Mode', telemetryName: 'INV/DEV/STAT/OPERATING_STATE', unit: '', min:-1, max:9, category: 'inverter', colorStart: '#6366f1', colorEnd: '#818cf8', decimals: 0,},
  
  // Solar PV
  { id: 'pv1', label: 'PV1 Voltage', telemetryName: '/INV/DCPORT/STAT/PV1/V', unit: 'V', min: 0, max: 500, category: 'solar', colorStart: '#f59e0b', colorEnd: '#fbbf24' },
  { id: 'pv2', label: 'PV2 Voltage', telemetryName: '/INV/DCPORT/STAT/PV2/V', unit: 'V', min: 0, max: 500, category: 'solar', colorStart: '#f59e0b', colorEnd: '#fbbf24' },
  { id: 'pv3', label: 'PV3 Voltage', telemetryName: '/INV/DCPORT/STAT/PV3/V', unit: 'V', min: 0, max: 500, category: 'solar', colorStart: '#f59e0b', colorEnd: '#fbbf24' },
  { id: 'pv4', label: 'PV4 Voltage', telemetryName: '/INV/DCPORT/STAT/PV4/V', unit: 'V', min: 0, max: 500, category: 'solar', colorStart: '#f59e0b', colorEnd: '#fbbf24' },
  
  // Grid
  { id: 'grid_v_l1', label: 'Grid V L1', telemetryName: '/INV/ACPORT/STAT/VRMS_L1N', unit: 'V', min: 0, max: 280, category: 'grid', colorStart: '#10b981', colorEnd: '#34d399' },
  { id: 'grid_v_l2', label: 'Grid V L2', telemetryName: '/INV/ACPORT/STAT/VRMS_L2N', unit: 'V', min: 0, max: 280, category: 'grid', colorStart: '#10b981', colorEnd: '#34d399' },
  { id: 'grid_i_l1', label: 'Grid I L1', telemetryName: '/INV/ACPORT/STAT/IRMS_L1', unit: 'A', min: 0, max: 100, category: 'grid', colorStart: '#8b5cf6', colorEnd: '#a78bfa', decimals: 2 },
  { id: 'grid_i_l2', label: 'Grid I L2', telemetryName: '/INV/ACPORT/STAT/IRMS_L2', unit: 'A', min: 0, max: 100, category: 'grid', colorStart: '#8b5cf6', colorEnd: '#a78bfa', decimals: 2 },
  { id: 'grid_freq', label: 'Grid Freq', telemetryName: '/INV/ACPORT/STAT/FREQ_TOTAL', unit: 'Hz', min: 55, max: 65, category: 'grid', colorStart: '#06b6d4', colorEnd: '#22d3ee', decimals: 2 },
  
  // Battery Module 1
  { id: 'bat1_v', label: 'Bat 1 Voltage', telemetryName: '/BMS/MODULE1/STAT/V', unit: 'V', min: 40, max: 60, category: 'battery', colorStart: '#ef4444', colorEnd: '#f87171', decimals: 1 },
  { id: 'bat1_temp', label: 'Bat 1 Temp', telemetryName: '/BMS/MODULE1/STAT/TEMP', unit: '°C', min: 0, max: 60, category: 'battery', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 1 },
  { id: 'bat1_soc', label: 'Bat 1 SoC', telemetryName: '/BMS/MODULE1/STAT/USER_SOC', unit: '%', min: 0, max: 100, category: 'battery', colorStart: '#22c55e', colorEnd: '#4ade80' },
  { id: 'bat1_i', label: 'Bat 1 Current', telemetryName: '/BMS/MODULE1/STAT/I', unit: 'A', min: -50, max: 50, category: 'battery', colorStart: '#eab308', colorEnd: '#facc15', decimals: 2 },
  
  // Battery Module 2
  { id: 'bat2_v', label: 'Bat 2 Voltage', telemetryName: '/BMS/MODULE2/STAT/V', unit: 'V', min: 40, max: 60, category: 'battery', colorStart: '#ef4444', colorEnd: '#f87171', decimals: 1 },
  { id: 'bat2_temp', label: 'Bat 2 Temp', telemetryName: '/BMS/MODULE2/STAT/TEMP', unit: '°C', min: 0, max: 60, category: 'battery', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 1 },
  { id: 'bat2_soc', label: 'Bat 2 SoC', telemetryName: '/BMS/MODULE2/STAT/USER_SOC', unit: '%', min: 0, max: 100, category: 'battery', colorStart: '#22c55e', colorEnd: '#4ade80' },
  { id: 'bat2_i', label: 'Bat 2 Current', telemetryName: '/BMS/MODULE2/STAT/I', unit: 'A', min: -50, max: 50, category: 'battery', colorStart: '#eab308', colorEnd: '#facc15', decimals: 2 },
  
  // Battery Module 3
  { id: 'bat3_v', label: 'Bat 3 Voltage', telemetryName: '/BMS/MODULE3/STAT/V', unit: 'V', min: 40, max: 60, category: 'battery', colorStart: '#ef4444', colorEnd: '#f87171', decimals: 1 },
  { id: 'bat3_temp', label: 'Bat 3 Temp', telemetryName: '/BMS/MODULE3/STAT/TEMP', unit: '°C', min: 0, max: 60, category: 'battery', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 1 },
  { id: 'bat3_soc', label: 'Bat 3 SoC', telemetryName: '/BMS/MODULE3/STAT/USER_SOC', unit: '%', min: 0, max: 100, category: 'battery', colorStart: '#22c55e', colorEnd: '#4ade80' },
  { id: 'bat3_i', label: 'Bat 3 Current', telemetryName: '/BMS/MODULE3/STAT/I', unit: 'A', min: -50, max: 50, category: 'battery', colorStart: '#eab308', colorEnd: '#facc15', decimals: 2 },
  
  // Load (using normal telemetry for instantaneous - fast telemetry requires different query)
  { id: 'load_v_l1', label: 'Load V L1', telemetryName: '/SYS/MEAS/STAT/PANEL/VRMS_L1N', unit: 'V', min: 0, max: 280, category: 'load', colorStart: '#ec4899', colorEnd: '#f472b6' },
  { id: 'load_v_l2', label: 'Load V L2', telemetryName: '/SYS/MEAS/STAT/PANEL/VRMS_L2N', unit: 'V', min: 0, max: 280, category: 'load', colorStart: '#ec4899', colorEnd: '#f472b6' },
  { id: 'load_i_l1', label: 'Load I L1', telemetryName: '/SYS/MEAS/STAT/LOAD/IRMS_L1', unit: 'A', min: 0, max: 100, category: 'load', colorStart: '#a855f7', colorEnd: '#c084fc', decimals: 2 },
  { id: 'load_i_l2', label: 'Load I L2', telemetryName: '/SYS/MEAS/STAT/LOAD/IRMS_L2', unit: 'A', min: 0, max: 100, category: 'load', colorStart: '#a855f7', colorEnd: '#c084fc', decimals: 2 },
  { id: 'load_freq', label: 'Load Freq', telemetryName: '/SYS/MEAS/STAT/PANEL/FREQ_TOTAL', unit: 'Hz', min: 55, max: 65, category: 'load', colorStart: '#06b6d4', colorEnd: '#22d3ee', decimals: 2 },
  
  // Battery Relay (uses Alarms table - value is 0=Inactive, 1=Active)
  { id: 'bat_main_relay', label: 'Battery Relay', telemetryName: '/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR', unit: '', min: 0, max: 1, category: 'battery', colorStart: '#22c55e', colorEnd: '#4ade80' },
];

const QUERY_PATH = '/query_adx/';
const REFRESH_INTERVAL = 10000; // 10 seconds

// ============================================================================
// Helper Functions
// ============================================================================

function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

function buildInstantaneousKql(serial: string, telemetryName: string): string {
  const s = escapeKqlString(serial);
  return `
    let s = '${s}';
    Telemetry
    | where comms_serial contains s
    | where name contains '${telemetryName}'
    | top 1 by localtime desc
    | project localtime, value_double
  `.trim();
}

// Special query for Battery Relay (uses Alarms table)
function buildBatteryRelayKql(serial: string): string {
  const s = escapeKqlString(serial);
  return `
    let s = '${s}';
    Alarms
    | where comms_serial contains s
    | where name has '/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR'
    | top 1 by localtime desc
    | project localtime, value
  `.trim();
}

function formatTimestamp(localtime: string | null): string {
  if (!localtime) return '--';
  try {
    const date = new Date(localtime);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--';
  }
}

// ============================================================================
// Animated Gauge Component
// ============================================================================

interface GaugeProps {
  config: GaugeConfig;
  data: GaugeData;
}

const AnimatedGauge: React.FC<GaugeProps> = ({ config, data }) => {
  const { label, unit, min, max, colorStart, colorEnd, decimals = 0 } = config;
  const { value, localtime, loading, error } = data;
  
  // Safely check if value is a valid number
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  
  // Calculate percentage for gauge fill
  const percentage = hasValue
    ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
    : 0;
  
  // SVG arc calculations
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 1.5; // 270 degrees arc
  const offset = circumference - (percentage / 100) * circumference;
  
  // Special handling for Battery Relay - show Activated/Not Activated/Invalid instead of 1/0/-1
  const isRelayGauge = config.id === 'bat_main_relay';
  const getRelayDisplayValue = (val: number) => {
    if (val === 1) return 'Activated';
    if (val === 0) return 'Not Activated';
    return 'Invalid';
  };

  const isInverterModeGauge = config.id === 'inv_mode';

  const getInverterModeString = (val: number) => {
    switch (val) {
        case -1: return 'INVALID';
        case 0: return 'UNDEFINED';
        case 1: return 'OFFLINE';
        case 2: return 'DISABLED';
        case 3: return 'STANDBY';
        case 4: return 'NORMAL';
        case 5: return 'LIMP_MODE';
        case 6: return 'FAULT_AUTO_CLEAR';
        case 7: return 'FAULT_MANUAL_CLEAR';
        case 8: return 'FW_UPDATE_IN_PROGRESS';
        case 9: return 'SELF_TESTING';
        default: return '--';
    }
};

  const displayValue = !hasValue 
    ? '--' 
    : isRelayGauge 
      ? getRelayDisplayValue(value)
      : isInverterModeGauge
        ? getInverterModeString(value)
        : value.toFixed(decimals);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      background: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)',
      minWidth: '140px',
      position: 'relative',
      overflow: 'hidden',
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
      
      {/* Gauge SVG */}
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.85}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gradient-${config.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={`glow-${config.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background arc */}
        <path
          d={describeArc(size/2, size/2 + 10, radius, -135, 135)}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Animated foreground arc */}
        <path
          d={describeArc(size/2, size/2 + 10, radius, -135, 135)}
          fill="none"
          stroke={`url(#gradient-${config.id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={hasValue ? `url(#glow-${config.id})` : undefined}
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
        
        {/* Value text */}
        <text
          x={size/2}
          y={size/2 + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: isRelayGauge ? '12px' : '22px',
            fontWeight: 700,
            fill: hasValue 
              ? (isRelayGauge 
                  ? (value === 0 ? '#22c55e' : value === 1 ? '#f59e0b' : '#ef4444') 
                  : colorEnd) 
              : 'var(--text-tertiary)',
          }}
        >
          {displayValue}
        </text>
        
        {/* Unit text */}
        <text
          x={size/2}
          y={size/2 + 25}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            fill: 'var(--text-tertiary)',
          }}
        >
          {unit}
        </text>
      </svg>
      
      {/* Label */}
      <div style={{
        marginTop: '4px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </div>
      
      {/* Timestamp */}
      <div style={{
        marginTop: '2px',
        fontSize: '9px',
        color: 'var(--text-tertiary)',
      }}>
        {error ? '⚠️ Error' : formatTimestamp(localtime)}
      </div>
    </div>
  );
};

// SVG arc path helper
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

// ============================================================================
// Category Header Component
// ============================================================================

const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  wifi: { icon: '📶', label: 'WiFi', color: '#3b82f6' },
  inverter: { icon: '⚙️', label: 'Inverter', color: '#6366f1' },
  solar: { icon: '☀️', label: 'Solar PV', color: '#f59e0b' },
  grid: { icon: '⚡', label: 'Grid', color: '#10b981' },
  battery: { icon: '🔋', label: 'Battery', color: '#ef4444' },
  load: { icon: '🏠', label: 'Load', color: '#ec4899' },
};

// ============================================================================
// Main Component
// ============================================================================

const InstantaneousGauges: React.FC<InstantaneousGaugesProps> = ({ serial }) => {
  const { accessToken, logout } = useAuth();
  const [gaugeData, setGaugeData] = useState<Record<string, GaugeData>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch single gauge data
  const fetchGaugeData = useCallback(async (config: GaugeConfig) => {
    // Use special query for Battery Relay (Alarms table)
    const isRelayQuery = config.id === 'bat_main_relay';
    const kql = isRelayQuery 
      ? buildBatteryRelayKql(serial)
      : buildInstantaneousKql(serial, config.telemetryName);
    
    try {
      const res = await api.post(
        QUERY_PATH,
        { kql },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
      const row = dataArray[0];
      
      // Handle value - Alarms table returns 'value', Telemetry returns 'value_double'
      let value: number | null = null;
      if (isRelayQuery) {
        // Battery Relay uses 'value' field from Alarms table
        if (row?.value !== undefined && row?.value !== null) {
          const parsed = typeof row.value === 'number' ? row.value : parseFloat(row.value);
          value = isNaN(parsed) ? null : parsed;
        }
      } else {
        // Normal telemetry uses 'value_double' field
        value = row?.value_double ?? null;
      }
      
      return {
        value,
        localtime: row?.localtime ?? null,
        loading: false,
        error: null,
      };
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      return {
        value: null,
        localtime: null,
        loading: false,
        error: err?.response?.data?.error ?? 'Error',
      };
    }
  }, [serial, accessToken, logout]);

  // Fetch all gauges
  const fetchAllGauges = useCallback(async () => {
    // Set all to loading
    setGaugeData(prev => {
      const newData: Record<string, GaugeData> = {};
      GAUGE_CONFIGS.forEach(config => {
        newData[config.id] = { ...prev[config.id], loading: true };
      });
      return newData;
    });

    // Fetch in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < GAUGE_CONFIGS.length; i += batchSize) {
      const batch = GAUGE_CONFIGS.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(fetchGaugeData));
      
      setGaugeData(prev => {
        const newData = { ...prev };
        batch.forEach((config, idx) => {
          newData[config.id] = results[idx];
        });
        return newData;
      });
      
      // Small delay between batches
      if (i + batchSize < GAUGE_CONFIGS.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setLastRefresh(new Date());
    setCountdown(REFRESH_INTERVAL / 1000);
  }, [fetchGaugeData]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (!serial) return;
    
    // Initial fetch
    fetchAllGauges();
    
    // Countdown timer
    countdownRef.current = setInterval(() => {
      if (!isPaused) {
        setCountdown(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [serial, fetchAllGauges, isPaused]);

  // Auto-refresh interval
  useEffect(() => {
    if (!serial || isPaused) return;
    
    intervalRef.current = setInterval(() => {
      fetchAllGauges();
    }, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [serial, isPaused, fetchAllGauges]);

  // Group gauges by category
  const groupedGauges = GAUGE_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, GaugeConfig[]>);

  const categoryOrder = ['wifi', 'inverter', 'solar', 'grid', 'battery', 'load'];

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: '16px',
      border: '1px solid var(--border-medium)',
      padding: '20px',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3dcd58 0%, #22c55e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 10"/>
            </svg>
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              Instantaneous Values
            </h3>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}>
              Live telemetry • Auto-refresh every 10s
            </p>
          </div>
        </div>
        
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Countdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'var(--bg-input)',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isPaused ? '#f59e0b' : '#22c55e',
              animation: isPaused ? 'none' : 'pulse 2s infinite',
            }} />
            {isPaused ? 'Paused' : `Next: ${countdown}s`}
          </div>
          
          {/* Pause/Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isPaused ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'var(--bg-input)',
              color: isPaused ? 'white' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {isPaused ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
              </>
            )}
          </button>
          
          {/* Manual Refresh */}
          <button
            onClick={fetchAllGauges}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh Now
          </button>
        </div>
      </div>
      
      {/* Last refresh time */}
      {lastRefresh && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          marginBottom: '16px',
        }}>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
      
      {/* Gauge Grid by Category */}
      {categoryOrder.map(category => {
        const configs = groupedGauges[category];
        if (!configs) return null;
        
        const catConfig = categoryConfig[category];
        
        return (
          <div key={category} style={{ marginBottom: '20px' }}>
            {/* Category Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '16px' }}>{catConfig.icon}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: catConfig.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {catConfig.label}
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, ${catConfig.color}40 0%, transparent 100%)`,
              }} />
            </div>
            
            {/* Gauges Grid */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              {configs.map(config => (
                <AnimatedGauge
                  key={config.id}
                  config={config}
                  data={gaugeData[config.id] || { value: null, localtime: null, loading: true, error: null }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InstantaneousGauges;
