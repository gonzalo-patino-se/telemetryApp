// src/components/EnergyFlowDiagram.tsx
// Animated Energy Flow Diagram - Phase 1: Solar PV Section
// Same data fetching as InstantaneousGauges, but with animated SVG visuals

import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// Types
// ============================================================================

interface TelemetryConfig {
  id: string;
  label: string;
  telemetryName: string;
  unit: string;
  category: string;
  decimals?: number;
}

interface TelemetryData {
  value: number | null;
  localtime: string | null;
  loading: boolean;
  error: string | null;
}

interface EnergyFlowDiagramProps {
  serial: string;
}

// ============================================================================
// Solar PV Configurations
// ============================================================================

const SOLAR_CONFIGS: TelemetryConfig[] = [
  { id: 'pv1', label: 'PV1', telemetryName: '/INV/DCPORT/STAT/PV1/V', unit: 'V', category: 'solar', decimals: 0 },
  { id: 'pv2', label: 'PV2', telemetryName: '/INV/DCPORT/STAT/PV2/V', unit: 'V', category: 'solar', decimals: 0 },
  { id: 'pv3', label: 'PV3', telemetryName: '/INV/DCPORT/STAT/PV3/V', unit: 'V', category: 'solar', decimals: 0 },
  { id: 'pv4', label: 'PV4', telemetryName: '/INV/DCPORT/STAT/PV4/V', unit: 'V', category: 'solar', decimals: 0 },
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

// ============================================================================
// Solar Panel SVG Component
// ============================================================================

interface SolarPanelProps {
  x: number;
  y: number;
  label: string;
  value: number | null;
  unit: string;
  loading: boolean;
  isProducing: boolean;
}

const SolarPanel: React.FC<SolarPanelProps> = ({ x, y, label, value, unit, loading, isProducing }) => {
  const displayValue = value !== null ? value.toFixed(0) : '--';
  
  return (
    <g transform={`translate(${x}, ${y})`} className="solar-panel-group">
      {/* Panel body */}
      <rect
        x={0}
        y={0}
        width={80}
        height={50}
        rx={4}
        className={`solar-panel-body ${isProducing ? 'producing' : ''}`}
      />
      
      {/* Panel grid lines */}
      <line x1={20} y1={0} x2={20} y2={50} className="solar-panel-grid" />
      <line x1={40} y1={0} x2={40} y2={50} className="solar-panel-grid" />
      <line x1={60} y1={0} x2={60} y2={50} className="solar-panel-grid" />
      <line x1={0} y1={25} x2={80} y2={25} className="solar-panel-grid" />
      
      {/* Glow effect when producing */}
      {isProducing && (
        <rect
          x={-2}
          y={-2}
          width={84}
          height={54}
          rx={6}
          className="solar-panel-glow"
        />
      )}
      
      {/* Label */}
      <text x={40} y={-8} textAnchor="middle" className="panel-label">
        {label}
      </text>
      
      {/* Value display */}
      <rect
        x={15}
        y={55}
        width={50}
        height={22}
        rx={4}
        className="value-badge"
      />
      <text x={40} y={70} textAnchor="middle" className="value-text">
        {loading ? '...' : `${displayValue}${unit}`}
      </text>
      
      {/* Sun icon when producing */}
      {isProducing && (
        <g transform="translate(65, -5)" className="sun-icon">
          <circle cx={0} cy={0} r={6} fill="#fbbf24" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1={0}
              y1={0}
              x2={Math.cos((angle * Math.PI) / 180) * 10}
              y2={Math.sin((angle * Math.PI) / 180) * 10}
              stroke="#fbbf24"
              strokeWidth={2}
              strokeLinecap="round"
              className="sun-ray"
            />
          ))}
        </g>
      )}
    </g>
  );
};

// ============================================================================
// Inverter SVG Component
// ============================================================================

const Inverter: React.FC<{ x: number; y: number; isActive: boolean }> = ({ x, y, isActive }) => (
  <g transform={`translate(${x}, ${y})`} className="inverter-group">
    {/* Inverter body */}
    <rect
      x={0}
      y={0}
      width={100}
      height={70}
      rx={8}
      className={`inverter-body ${isActive ? 'active' : ''}`}
    />
    
    {/* Glow effect when active */}
    {isActive && (
      <rect
        x={-3}
        y={-3}
        width={106}
        height={76}
        rx={10}
        className="inverter-glow"
      />
    )}
    
    {/* Inverter icon/symbol */}
    <text x={50} y={28} textAnchor="middle" className="inverter-icon">⚡</text>
    <text x={50} y={50} textAnchor="middle" className="inverter-label">INVERTER</text>
    
    {/* Status LED */}
    <circle cx={85} cy={12} r={5} className={`status-led ${isActive ? 'active' : ''}`} />
  </g>
);

// ============================================================================
// Animated Flow Line Component
// ============================================================================

interface FlowLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
  color: string;
}

const FlowLine: React.FC<FlowLineProps> = ({ startX, startY, endX, endY, isActive, color }) => {
  // Calculate control points for curved path
  const midY = (startY + endY) / 2;
  const path = `M ${startX} ${startY} Q ${startX} ${midY}, ${(startX + endX) / 2} ${midY} T ${endX} ${endY}`;
  
  return (
    <g className="flow-line-group">
      {/* Background line */}
      <path
        d={path}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      
      {/* Animated flow line */}
      {isActive && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="8 12"
          className="flow-animation"
        />
      )}
      
      {/* Flow particles */}
      {isActive && (
        <>
          <circle r={4} fill={color} className="flow-particle">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r={4} fill={color} className="flow-particle" style={{ animationDelay: '0.5s' }}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path={path} begin="0.5s" />
          </circle>
          <circle r={4} fill={color} className="flow-particle" style={{ animationDelay: '1s' }}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path={path} begin="1s" />
          </circle>
        </>
      )}
    </g>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const EnergyFlowDiagram: React.FC<EnergyFlowDiagramProps> = ({ serial }) => {
  const { accessToken, logout } = useAuth();
  const [telemetryData, setTelemetryData] = useState<Record<string, TelemetryData>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch single telemetry value
  const fetchTelemetryData = useCallback(async (config: TelemetryConfig) => {
    const kql = buildInstantaneousKql(serial, config.telemetryName);
    
    try {
      const res = await api.post(
        QUERY_PATH,
        { kql },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
      const row = dataArray[0];
      
      return {
        value: row?.value_double ?? null,
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

  // Fetch all telemetry
  const fetchAllTelemetry = useCallback(async () => {
    // Set all to loading
    setTelemetryData(prev => {
      const newData: Record<string, TelemetryData> = {};
      SOLAR_CONFIGS.forEach(config => {
        newData[config.id] = { ...prev[config.id], loading: true };
      });
      return newData;
    });

    // Fetch all in parallel
    const results = await Promise.all(SOLAR_CONFIGS.map(fetchTelemetryData));
    
    setTelemetryData(prev => {
      const newData = { ...prev };
      SOLAR_CONFIGS.forEach((config, idx) => {
        newData[config.id] = results[idx];
      });
      return newData;
    });
    
    setLastRefresh(new Date());
    setCountdown(REFRESH_INTERVAL / 1000);
  }, [fetchTelemetryData]);

  // Initial fetch and countdown timer
  useEffect(() => {
    if (!serial) return;
    
    fetchAllTelemetry();
    
    countdownRef.current = setInterval(() => {
      if (!isPaused) {
        setCountdown(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [serial, fetchAllTelemetry, isPaused]);

  // Auto-refresh interval
  useEffect(() => {
    if (!serial || isPaused) return;
    
    intervalRef.current = setInterval(() => {
      fetchAllTelemetry();
    }, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [serial, isPaused, fetchAllTelemetry]);

  // Determine if panels are producing (voltage > 50V threshold)
  const PRODUCING_THRESHOLD = 50;
  const pvValues = {
    pv1: telemetryData.pv1?.value ?? 0,
    pv2: telemetryData.pv2?.value ?? 0,
    pv3: telemetryData.pv3?.value ?? 0,
    pv4: telemetryData.pv4?.value ?? 0,
  };
  
  const anyProducing = Object.values(pvValues).some(v => v > PRODUCING_THRESHOLD);

  return (
    <div className="energy-flow-container">
      {/* Header */}
      <div className="energy-flow-header">
        <div className="header-left">
          <div className="header-icon solar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </div>
          <div>
            <h3 className="header-title">Solar PV Energy Flow</h3>
            <p className="header-subtitle">Live telemetry • Auto-refresh every 10s</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="header-controls">
          <div className="countdown-badge">
            <div className={`status-dot ${isPaused ? 'paused' : 'active'}`} />
            {isPaused ? 'Paused' : `Next: ${countdown}s`}
          </div>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
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
          
          <button onClick={fetchAllTelemetry} className="control-btn refresh">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Last refresh time */}
      {lastRefresh && (
        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
      
      {/* SVG Diagram */}
      <svg viewBox="0 0 500 300" className="energy-flow-svg">
        <defs>
          {/* Glow filter */}
          <filter id="glow-solar" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient for solar panels */}
          <linearGradient id="solar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f"/>
            <stop offset="100%" stopColor="#0f2744"/>
          </linearGradient>
          
          {/* Gradient for inverter */}
          <linearGradient id="inverter-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-elevated)"/>
            <stop offset="100%" stopColor="var(--bg-surface)"/>
          </linearGradient>
        </defs>
        
        {/* Solar Panels Row */}
        <SolarPanel
          x={25}
          y={30}
          label="PV1"
          value={telemetryData.pv1?.value ?? null}
          unit="V"
          loading={telemetryData.pv1?.loading ?? true}
          isProducing={pvValues.pv1 > PRODUCING_THRESHOLD}
        />
        <SolarPanel
          x={125}
          y={30}
          label="PV2"
          value={telemetryData.pv2?.value ?? null}
          unit="V"
          loading={telemetryData.pv2?.loading ?? true}
          isProducing={pvValues.pv2 > PRODUCING_THRESHOLD}
        />
        <SolarPanel
          x={225}
          y={30}
          label="PV3"
          value={telemetryData.pv3?.value ?? null}
          unit="V"
          loading={telemetryData.pv3?.loading ?? true}
          isProducing={pvValues.pv3 > PRODUCING_THRESHOLD}
        />
        <SolarPanel
          x={325}
          y={30}
          label="PV4"
          value={telemetryData.pv4?.value ?? null}
          unit="V"
          loading={telemetryData.pv4?.loading ?? true}
          isProducing={pvValues.pv4 > PRODUCING_THRESHOLD}
        />
        
        {/* Flow Lines from each panel to inverter */}
        <FlowLine
          startX={65}
          startY={110}
          endX={200}
          endY={220}
          isActive={pvValues.pv1 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={165}
          startY={110}
          endX={220}
          endY={220}
          isActive={pvValues.pv2 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={265}
          startY={110}
          endX={250}
          endY={220}
          isActive={pvValues.pv3 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={365}
          startY={110}
          endX={280}
          endY={220}
          isActive={pvValues.pv4 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        
        {/* Inverter */}
        <Inverter x={200} y={220} isActive={anyProducing} />
      </svg>
      
      {/* Legend */}
      <div className="energy-flow-legend">
        <div className="legend-item">
          <div className="legend-dot producing" />
          <span>Producing (&gt;50V)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot idle" />
          <span>Idle/Night</span>
        </div>
        <div className="legend-item">
          <div className="legend-line" />
          <span>Energy Flow</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyFlowDiagram;
