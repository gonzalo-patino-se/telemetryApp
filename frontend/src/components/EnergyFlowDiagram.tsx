// src/components/EnergyFlowDiagram.tsx
// Animated Energy Flow Diagram - Solar PV + Grid Sections
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

// ============================================================================
// Grid Configurations
// ============================================================================

const GRID_CONFIGS: TelemetryConfig[] = [
  { id: 'gridVL1', label: 'V L1', telemetryName: '/INV/ACPORT/STAT/VRMS_L1N', unit: 'V', category: 'grid', decimals: 1 },
  { id: 'gridVL2', label: 'V L2', telemetryName: '/INV/ACPORT/STAT/VRMS_L2N', unit: 'V', category: 'grid', decimals: 1 },
  { id: 'gridIL1', label: 'I L1', telemetryName: '/INV/ACPORT/STAT/IRMS_L1', unit: 'A', category: 'grid', decimals: 2 },
  { id: 'gridIL2', label: 'I L2', telemetryName: '/INV/ACPORT/STAT/IRMS_L2', unit: 'A', category: 'grid', decimals: 2 },
  { id: 'gridFreq', label: 'Freq', telemetryName: '/INV/ACPORT/STAT/FREQ_TOTAL', unit: 'Hz', category: 'grid', decimals: 2 },
];

// ============================================================================
// Battery Configurations (3 modules)
// ============================================================================

const BATTERY_CONFIGS: TelemetryConfig[] = [
  // Battery Module 1
  { id: 'bat1V', label: 'Bat 1 V', telemetryName: '/BMS/MODULE1/STAT/V', unit: 'V', category: 'battery1', decimals: 1 },
  { id: 'bat1Temp', label: 'Bat 1 Temp', telemetryName: '/BMS/MODULE1/STAT/TEMP', unit: '°C', category: 'battery1', decimals: 1 },
  { id: 'bat1SoC', label: 'Bat 1 SoC', telemetryName: '/BMS/MODULE1/STAT/USER_SOC', unit: '%', category: 'battery1', decimals: 0 },
  { id: 'bat1I', label: 'Bat 1 I', telemetryName: '/BMS/MODULE1/STAT/I', unit: 'A', category: 'battery1', decimals: 2 },
  
  // Battery Module 2
  { id: 'bat2V', label: 'Bat 2 V', telemetryName: '/BMS/MODULE2/STAT/V', unit: 'V', category: 'battery2', decimals: 1 },
  { id: 'bat2Temp', label: 'Bat 2 Temp', telemetryName: '/BMS/MODULE2/STAT/TEMP', unit: '°C', category: 'battery2', decimals: 1 },
  { id: 'bat2SoC', label: 'Bat 2 SoC', telemetryName: '/BMS/MODULE2/STAT/USER_SOC', unit: '%', category: 'battery2', decimals: 0 },
  { id: 'bat2I', label: 'Bat 2 I', telemetryName: '/BMS/MODULE2/STAT/I', unit: 'A', category: 'battery2', decimals: 2 },
  
  // Battery Module 3
  { id: 'bat3V', label: 'Bat 3 V', telemetryName: '/BMS/MODULE3/STAT/V', unit: 'V', category: 'battery3', decimals: 1 },
  { id: 'bat3Temp', label: 'Bat 3 Temp', telemetryName: '/BMS/MODULE3/STAT/TEMP', unit: '°C', category: 'battery3', decimals: 1 },
  { id: 'bat3SoC', label: 'Bat 3 SoC', telemetryName: '/BMS/MODULE3/STAT/USER_SOC', unit: '%', category: 'battery3', decimals: 0 },
  { id: 'bat3I', label: 'Bat 3 I', telemetryName: '/BMS/MODULE3/STAT/I', unit: 'A', category: 'battery3', decimals: 2 },
];

// ============================================================================
// Load Configurations
// ============================================================================

const LOAD_CONFIGS: TelemetryConfig[] = [
  { id: 'loadVL1', label: 'Load V L1', telemetryName: '/SYS/MEAS/STAT/LOAD/VRMS_L1N', unit: 'V', category: 'load', decimals: 1 },
  { id: 'loadVL2', label: 'Load V L2', telemetryName: '/SYS/MEAS/STAT/LOAD/VRMS_L2N', unit: 'V', category: 'load', decimals: 1 },
  { id: 'loadFreq', label: 'Load Freq', telemetryName: '/SYS/MEAS/STAT/LOAD/FREQ_TOTAL', unit: 'Hz', category: 'load', decimals: 2 },
];

// Combined configs for fetching
const ALL_CONFIGS: TelemetryConfig[] = [...SOLAR_CONFIGS, ...GRID_CONFIGS, ...BATTERY_CONFIGS, ...LOAD_CONFIGS];

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
      <text x={40} y={-10} textAnchor="middle" className="panel-label-lg">
        {label}
      </text>
      
      {/* Value display - enlarged */}
      <rect
        x={10}
        y={55}
        width={60}
        height={26}
        rx={4}
        className="value-badge"
      />
      <text x={40} y={73} textAnchor="middle" className="value-text-lg">
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
// Horizontal Flow Line Component (for Grid connection)
// ============================================================================

interface HorizontalFlowLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive: boolean;
  color: string;
  flowDirection: 'left' | 'right';
}

const HorizontalFlowLine: React.FC<HorizontalFlowLineProps> = ({ 
  startX, startY, endX, endY, isActive, color, flowDirection 
}) => {
  const path = `M ${startX} ${startY} L ${endX} ${endY}`;
  
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
          className={flowDirection === 'right' ? 'flow-animation' : 'flow-animation-reverse'}
        />
      )}
      
      {/* Flow particles */}
      {isActive && (
        <>
          <circle r={4} fill={color} className="flow-particle">
            <animateMotion 
              dur="1s" 
              repeatCount="indefinite" 
              path={flowDirection === 'right' ? path : `M ${endX} ${endY} L ${startX} ${startY}`} 
            />
          </circle>
          <circle r={4} fill={color} className="flow-particle">
            <animateMotion 
              dur="1s" 
              repeatCount="indefinite" 
              path={flowDirection === 'right' ? path : `M ${endX} ${endY} L ${startX} ${startY}`} 
              begin="0.33s"
            />
          </circle>
          <circle r={4} fill={color} className="flow-particle">
            <animateMotion 
              dur="1s" 
              repeatCount="indefinite" 
              path={flowDirection === 'right' ? path : `M ${endX} ${endY} L ${startX} ${startY}`} 
              begin="0.66s"
            />
          </circle>
        </>
      )}
    </g>
  );
};

// ============================================================================
// Grid SVG Component
// ============================================================================

interface GridComponentProps {
  x: number;
  y: number;
  voltageL1: number | null;
  voltageL2: number | null;
  currentL1: number | null;
  currentL2: number | null;
  frequency: number | null;
  loading: boolean;
  isActive: boolean;
}

const GridComponent: React.FC<GridComponentProps> = ({ 
  x, y, voltageL1, voltageL2, currentL1, currentL2, frequency, loading, isActive 
}) => {
  const formatValue = (val: number | null, decimals: number = 1) => 
    val !== null ? val.toFixed(decimals) : '--';

  return (
    <g transform={`translate(${x}, ${y})`} className="grid-component-group">
      {/* Grid icon - Power transmission tower */}
      <g className={`grid-tower ${isActive ? 'active' : ''}`}>
        {/* Tower base */}
        <path
          d="M 30 0 L 45 70 L 55 70 L 70 0 Z"
          className="grid-tower-body"
        />
        {/* Cross beams */}
        <line x1={35} y1={20} x2={65} y2={20} className="grid-tower-beam" />
        <line x1={38} y1={40} x2={62} y2={40} className="grid-tower-beam" />
        {/* Power lines */}
        <line x1={20} y1={10} x2={80} y2={10} className="grid-power-line" />
        <line x1={15} y1={5} x2={85} y2={5} className="grid-power-line" />
        {/* Insulators */}
        <circle cx={30} cy={10} r={3} className="grid-insulator" />
        <circle cx={70} cy={10} r={3} className="grid-insulator" />
        <circle cx={25} cy={5} r={3} className="grid-insulator" />
        <circle cx={75} cy={5} r={3} className="grid-insulator" />
      </g>
      
      {/* Glow effect when active */}
      {isActive && (
        <rect
          x={15}
          y={-5}
          width={70}
          height={80}
          rx={8}
          className="grid-glow"
        />
      )}
      
      {/* Label */}
      <text x={50} y={-15} textAnchor="middle" className="grid-label-lg">GRID</text>
      
      {/* Values panel - expanded with larger text */}
      <g transform="translate(-15, 75)">
        <rect x={0} y={0} width={130} height={110} rx={6} className="grid-values-panel" />
        
        {/* Status indicator */}
        <circle cx={115} cy={14} r={6} className={`grid-status ${isActive ? 'active' : ''}`} />
        
        {/* L1 Section */}
        <text x={10} y={20} className="grid-section-label-lg">L1</text>
        <text x={40} y={20} className="grid-value-label-lg">V:</text>
        <text x={58} y={20} className="grid-value-text-lg">
          {loading ? '...' : `${formatValue(voltageL1, 1)} V`}
        </text>
        <text x={40} y={38} className="grid-value-label-lg">I:</text>
        <text x={58} y={38} className="grid-value-text-lg">
          {loading ? '...' : `${formatValue(currentL1, 2)} A`}
        </text>
        
        {/* Divider */}
        <line x1={10} y1={48} x2={120} y2={48} className="grid-divider" />
        
        {/* L2 Section */}
        <text x={10} y={66} className="grid-section-label-lg">L2</text>
        <text x={40} y={66} className="grid-value-label-lg">V:</text>
        <text x={58} y={66} className="grid-value-text-lg">
          {loading ? '...' : `${formatValue(voltageL2, 1)} V`}
        </text>
        <text x={40} y={84} className="grid-value-label-lg">I:</text>
        <text x={58} y={84} className="grid-value-text-lg">
          {loading ? '...' : `${formatValue(currentL2, 2)} A`}
        </text>
        
        {/* Divider */}
        <line x1={10} y1={94} x2={120} y2={94} className="grid-divider" />
        
        {/* Frequency */}
        <text x={10} y={108} className="grid-value-label-lg">Freq:</text>
        <text x={55} y={108} className="grid-value-text-lg grid-freq">
          {loading ? '...' : `${formatValue(frequency, 2)} Hz`}
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// Battery Module SVG Component
// ============================================================================

interface BatteryModuleProps {
  x: number;
  y: number;
  moduleNumber: number;
  voltage: number | null;
  temperature: number | null;
  soc: number | null;
  current: number | null;
  loading: boolean;
  isActive: boolean;
  isCharging: boolean;
}

const BatteryModule: React.FC<BatteryModuleProps> = ({
  x, y, moduleNumber, voltage, temperature, soc, current, loading, isActive, isCharging
}) => {
  const formatValue = (val: number | null, decimals: number = 1) =>
    val !== null ? val.toFixed(decimals) : '--';
  
  // Calculate SoC percentage for fill level (0-100)
  const socPercent = soc !== null ? Math.max(0, Math.min(100, soc)) : 0;
  const fillHeight = (socPercent / 100) * 50; // Max height 50px
  
  // Determine battery color based on SoC
  const getBatteryColor = () => {
    if (soc === null) return '#6b7280'; // gray
    if (soc <= 20) return '#ef4444'; // red - critical
    if (soc <= 40) return '#f59e0b'; // orange - low
    return '#22c55e'; // green - good
  };

  return (
    <g transform={`translate(${x}, ${y})`} className="battery-module-group">
      {/* Battery icon */}
      <g className={`battery-icon ${isActive ? 'active' : ''}`}>
        {/* Battery terminal */}
        <rect x={25} y={0} width={20} height={6} rx={2} className="battery-terminal" />
        
        {/* Battery body */}
        <rect x={15} y={6} width={40} height={54} rx={4} className="battery-body" />
        
        {/* Battery fill level based on SoC */}
        <rect
          x={18}
          y={57 - fillHeight}
          width={34}
          height={fillHeight}
          rx={2}
          fill={getBatteryColor()}
          className="battery-fill"
        />
        
        {/* Battery glow when charging */}
        {isCharging && (
          <rect
            x={12}
            y={3}
            width={46}
            height={60}
            rx={6}
            className="battery-charging-glow"
          />
        )}
        
        {/* Charging indicator */}
        {isCharging && (
          <g transform="translate(35, 35)" className="charging-bolt">
            <path
              d="M -5 -8 L 2 -2 L -1 0 L 5 8 L -2 2 L 1 0 Z"
              fill="#fbbf24"
              className="bolt-icon"
            />
          </g>
        )}
      </g>
      
      {/* Module label */}
      <text x={35} y={-10} textAnchor="middle" className="battery-label-lg">
        BAT {moduleNumber}
      </text>
      
      {/* Values panel - enlarged */}
      <g transform="translate(-10, 65)">
        <rect x={0} y={0} width={90} height={75} rx={4} className="battery-values-panel" />
        
        {/* SoC - prominent display */}
        <text x={45} y={20} textAnchor="middle" className="battery-soc-value-lg" fill={getBatteryColor()}>
          {loading ? '...' : `${formatValue(soc, 0)}%`}
        </text>
        
        {/* Voltage */}
        <text x={10} y={40} className="battery-value-label-lg">V:</text>
        <text x={28} y={40} className="battery-value-text-lg">
          {loading ? '...' : `${formatValue(voltage, 1)} V`}
        </text>
        
        {/* Current */}
        <text x={10} y={55} className="battery-value-label-lg">I:</text>
        <text x={28} y={55} className={`battery-value-text-lg ${isCharging ? 'charging' : 'discharging'}`}>
          {loading ? '...' : `${formatValue(current, 2)} A`}
        </text>
        
        {/* Temperature */}
        <text x={10} y={70} className="battery-value-label-lg">T:</text>
        <text x={28} y={70} className="battery-value-text-lg">
          {loading ? '...' : `${formatValue(temperature, 1)}°C`}
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// Load Component SVG
// ============================================================================

interface LoadComponentProps {
  x: number;
  y: number;
  voltageL1: number | null;
  voltageL2: number | null;
  frequency: number | null;
  loading: boolean;
  isActive: boolean;
}

const LoadComponent: React.FC<LoadComponentProps> = ({
  x, y, voltageL1, voltageL2, frequency, loading, isActive
}) => {
  const formatValue = (val: number | null, decimals: number = 1) =>
    val !== null ? val.toFixed(decimals) : '--';

  return (
    <g transform={`translate(${x}, ${y})`} className="load-component-group">
      {/* House icon */}
      <g className={`load-house ${isActive ? 'active' : ''}`}>
        {/* Roof */}
        <path
          d="M 50 5 L 10 40 L 20 40 L 20 75 L 80 75 L 80 40 L 90 40 Z"
          className="load-house-body"
        />
        {/* Door */}
        <rect x={40} y={50} width={20} height={25} rx={2} className="load-door" />
        {/* Window left */}
        <rect x={25} y={45} width={12} height={12} rx={1} className="load-window" />
        {/* Window right */}
        <rect x={63} y={45} width={12} height={12} rx={1} className="load-window" />
        {/* Chimney */}
        <rect x={70} y={15} width={8} height={20} className="load-chimney" />
      </g>
      
      {/* Glow effect when active */}
      {isActive && (
        <rect
          x={5}
          y={0}
          width={90}
          height={80}
          rx={8}
          className="load-glow"
        />
      )}
      
      {/* Label */}
      <text x={50} y={-8} textAnchor="middle" className="load-label">LOAD</text>
      
      {/* Values panel - enlarged for better readability */}
      <g transform="translate(-10, 80)">
        <rect x={0} y={0} width={120} height={95} rx={6} className="load-values-panel" />
        
        {/* Status indicator */}
        <circle cx={108} cy={14} r={6} className={`load-status ${isActive ? 'active' : ''}`} />
        
        {/* L1 Voltage */}
        <text x={10} y={22} className="load-value-label-lg">V L1:</text>
        <text x={55} y={22} className="load-value-text-lg">
          {loading ? '...' : `${formatValue(voltageL1, 1)} V`}
        </text>
        
        {/* L2 Voltage */}
        <text x={10} y={46} className="load-value-label-lg">V L2:</text>
        <text x={55} y={46} className="load-value-text-lg">
          {loading ? '...' : `${formatValue(voltageL2, 1)} V`}
        </text>
        
        {/* Divider */}
        <line x1={10} y1={58} x2={110} y2={58} className="load-divider" />
        
        {/* Frequency */}
        <text x={10} y={80} className="load-value-label-lg">Freq:</text>
        <text x={55} y={80} className="load-value-text-lg load-freq">
          {loading ? '...' : `${formatValue(frequency, 2)} Hz`}
        </text>
      </g>
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
      ALL_CONFIGS.forEach(config => {
        newData[config.id] = { ...prev[config.id], loading: true };
      });
      return newData;
    });

    // Fetch all in parallel
    const results = await Promise.all(ALL_CONFIGS.map(fetchTelemetryData));
    
    setTelemetryData(prev => {
      const newData = { ...prev };
      ALL_CONFIGS.forEach((config, idx) => {
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
  
  // Grid values
  const gridValues = {
    voltageL1: telemetryData.gridVL1?.value ?? null,
    voltageL2: telemetryData.gridVL2?.value ?? null,
    currentL1: telemetryData.gridIL1?.value ?? null,
    currentL2: telemetryData.gridIL2?.value ?? null,
    frequency: telemetryData.gridFreq?.value ?? null,
  };
  
  // Battery values (3 modules)
  const batteryValues = {
    bat1: {
      voltage: telemetryData.bat1V?.value ?? null,
      temperature: telemetryData.bat1Temp?.value ?? null,
      soc: telemetryData.bat1SoC?.value ?? null,
      current: telemetryData.bat1I?.value ?? null,
    },
    bat2: {
      voltage: telemetryData.bat2V?.value ?? null,
      temperature: telemetryData.bat2Temp?.value ?? null,
      soc: telemetryData.bat2SoC?.value ?? null,
      current: telemetryData.bat2I?.value ?? null,
    },
    bat3: {
      voltage: telemetryData.bat3V?.value ?? null,
      temperature: telemetryData.bat3Temp?.value ?? null,
      soc: telemetryData.bat3SoC?.value ?? null,
      current: telemetryData.bat3I?.value ?? null,
    },
  };
  
  // Battery status - active if voltage > 40V, charging if current > 0
  const bat1Active = (batteryValues.bat1.voltage ?? 0) > 40;
  const bat2Active = (batteryValues.bat2.voltage ?? 0) > 40;
  const bat3Active = (batteryValues.bat3.voltage ?? 0) > 40;
  const bat1Charging = (batteryValues.bat1.current ?? 0) > 0;
  const bat2Charging = (batteryValues.bat2.current ?? 0) > 0;
  const bat3Charging = (batteryValues.bat3.current ?? 0) > 0;
  const anyBatteryActive = bat1Active || bat2Active || bat3Active;
  const anyBatteryCharging = bat1Charging || bat2Charging || bat3Charging;
  
  // Load values
  const loadValues = {
    voltageL1: telemetryData.loadVL1?.value ?? null,
    voltageL2: telemetryData.loadVL2?.value ?? null,
    frequency: telemetryData.loadFreq?.value ?? null,
  };
  
  // Load is active if we have voltage readings
  const loadIsActive = (loadValues.voltageL1 ?? 0) > 100 || (loadValues.voltageL2 ?? 0) > 100;
  
  // Grid is active if we have voltage readings
  const gridIsActive = (gridValues.voltageL1 ?? 0) > 100 || (gridValues.voltageL2 ?? 0) > 100;
  
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
            <h3 className="header-title">Energy Flow Diagram</h3>
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
      <svg viewBox="-60 0 760 540" className="energy-flow-svg">
        <defs>
          {/* Glow filter */}
          <filter id="glow-solar" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Glow filter for grid */}
          <filter id="glow-grid" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
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
          
          {/* Gradient for grid */}
          <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#166534"/>
            <stop offset="100%" stopColor="#14532d"/>
          </linearGradient>
          
          {/* Gradient for load (house) */}
          <linearGradient id="load-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9d174d"/>
            <stop offset="100%" stopColor="#831843"/>
          </linearGradient>
          
          {/* Gradient for load (house) active state */}
          <linearGradient id="load-gradient-active" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#db2777"/>
            <stop offset="100%" stopColor="#be185d"/>
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
          endX={180}
          endY={165}
          isActive={pvValues.pv1 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={165}
          startY={110}
          endX={200}
          endY={165}
          isActive={pvValues.pv2 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={265}
          startY={110}
          endX={230}
          endY={165}
          isActive={pvValues.pv3 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        <FlowLine
          startX={365}
          startY={110}
          endX={260}
          endY={165}
          isActive={pvValues.pv4 > PRODUCING_THRESHOLD}
          color="#f59e0b"
        />
        
        {/* Inverter - centered under solar panels */}
        <Inverter x={155} y={165} isActive={anyProducing || gridIsActive || anyBatteryActive} />
        
        {/* Grid Connection Line (Inverter to Grid) */}
        <HorizontalFlowLine
          startX={255}
          startY={200}
          endX={500}
          endY={200}
          isActive={gridIsActive}
          color="#22c55e"
          flowDirection={anyProducing ? 'right' : 'left'}
        />
        
        {/* Grid Component */}
        <GridComponent
          x={500}
          y={170}
          voltageL1={gridValues.voltageL1}
          voltageL2={gridValues.voltageL2}
          currentL1={gridValues.currentL1}
          currentL2={gridValues.currentL2}
          frequency={gridValues.frequency}
          loading={telemetryData.gridVL1?.loading ?? true}
          isActive={gridIsActive}
        />
        
        {/* ==================== BATTERY SECTION ==================== */}
        
        {/* Battery 1 */}
        <BatteryModule
          x={80}
          y={350}
          moduleNumber={1}
          voltage={batteryValues.bat1.voltage}
          temperature={batteryValues.bat1.temperature}
          soc={batteryValues.bat1.soc}
          current={batteryValues.bat1.current}
          loading={telemetryData.bat1V?.loading ?? true}
          isActive={bat1Active}
          isCharging={bat1Charging}
        />
        
        {/* Battery 2 */}
        <BatteryModule
          x={170}
          y={350}
          moduleNumber={2}
          voltage={batteryValues.bat2.voltage}
          temperature={batteryValues.bat2.temperature}
          soc={batteryValues.bat2.soc}
          current={batteryValues.bat2.current}
          loading={telemetryData.bat2V?.loading ?? true}
          isActive={bat2Active}
          isCharging={bat2Charging}
        />
        
        {/* Battery 3 */}
        <BatteryModule
          x={260}
          y={350}
          moduleNumber={3}
          voltage={batteryValues.bat3.voltage}
          temperature={batteryValues.bat3.temperature}
          soc={batteryValues.bat3.soc}
          current={batteryValues.bat3.current}
          loading={telemetryData.bat3V?.loading ?? true}
          isActive={bat3Active}
          isCharging={bat3Charging}
        />
        
        {/* Battery to Inverter connection - parallel bus bar */}
        <g className="battery-bus">
          {/* Horizontal bus bar connecting all batteries */}
          <line x1={115} y1={345} x2={295} y2={345} className="bus-bar" />
          
          {/* Vertical connections from each battery to bus */}
          <line x1={115} y1={345} x2={115} y2={355} className="bus-connector" />
          <line x1={205} y1={345} x2={205} y2={355} className="bus-connector" />
          <line x1={295} y1={345} x2={295} y2={355} className="bus-connector" />
        </g>
        
        {/* Flow line from battery bus to inverter - vertical connection */}
        <HorizontalFlowLine
          startX={205}
          startY={345}
          endX={205}
          endY={235}
          isActive={anyBatteryActive}
          color="#f59e0b"
          flowDirection={anyBatteryCharging ? 'left' : 'right'}
        />
        
        {/* ==================== LOAD SECTION ==================== */}
        
        {/* Load Component - positioned to the left of inverter */}
        <LoadComponent
          x={-50}
          y={170}
          voltageL1={loadValues.voltageL1}
          voltageL2={loadValues.voltageL2}
          frequency={loadValues.frequency}
          loading={telemetryData.loadVL1?.loading ?? true}
          isActive={loadIsActive}
        />
        
        {/* Flow line from inverter to load - horizontal to the left */}
        <g className="load-connection">
          <HorizontalFlowLine
            startX={155}
            startY={200}
            endX={50}
            endY={200}
            isActive={loadIsActive}
            color="#ec4899"
            flowDirection="left"
          />
        </g>
      </svg>
      
      {/* Legend */}
      <div className="energy-flow-legend">
        <div className="legend-item">
          <div className="legend-dot producing" />
          <span>Solar Active</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot grid-active" />
          <span>Grid Connected</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot idle" />
          <span>Idle</span>
        </div>
        <div className="legend-item">
          <div className="legend-line solar" />
          <span>Solar Flow</span>
        </div>
        <div className="legend-item">
          <div className="legend-line grid" />
          <span>Grid Flow</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot battery-charging" />
          <span>Battery Charging</span>
        </div>
        <div className="legend-item">
          <div className="legend-line battery" />
          <span>Battery Flow</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot load-active" />
          <span>Load Active</span>
        </div>
        <div className="legend-item">
          <div className="legend-line load" />
          <span>Load Flow</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyFlowDiagram;
