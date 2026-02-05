// src/components/InstantaneousGauges.tsx
// Instantaneous telemetry values displayed as professional animated gauges
// Auto-refreshes every 5 minutes
// OPTIMIZED: Uses batch API to fetch all telemetry in a single request

import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AnalogNeedleGauge, InverterModeDisplay, DigitalValueDisplay, BatterySoCGauge } from './gauges';

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
  { id: 'pv1_i', label: 'PV1 Current', telemetryName: '/INV/DCPORT/STAT/PV1/I', unit: 'A', min: 0, max: 20, category: 'solar', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 2 },
  { id: 'pv2_i', label: 'PV2 Current', telemetryName: '/INV/DCPORT/STAT/PV2/I', unit: 'A', min: 0, max: 20, category: 'solar', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 2 },
  { id: 'pv3_i', label: 'PV3 Current', telemetryName: '/INV/DCPORT/STAT/PV3/I', unit: 'A', min: 0, max: 20, category: 'solar', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 2 },
  { id: 'pv4_i', label: 'PV4 Current', telemetryName: '/INV/DCPORT/STAT/PV4/I', unit: 'A', min: 0, max: 20, category: 'solar', colorStart: '#f97316', colorEnd: '#fb923c', decimals: 2 },
  
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
const REFRESH_INTERVAL = 300000; // 5 minutes (300 seconds)

// ============================================================================
// Helper Functions
// ============================================================================

function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

// Build KQL for individual telemetry query
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

// Special query for Battery Relay (uses Alarms table - not batchable with Telemetry)
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
// Main Component - Individual Queries (Reliable)
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
      
      let value: number | null = null;
      if (isRelayQuery) {
        if (row?.value !== undefined && row?.value !== null) {
          const parsed = typeof row.value === 'number' ? row.value : parseFloat(row.value);
          value = isNaN(parsed) ? null : parsed;
        }
      } else {
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

  // Fetch all gauges individually (without setting loading state to avoid flicker)
  const fetchAllGauges = useCallback(async () => {
    if (!serial || !accessToken) return;

    // DON'T set loading state on refresh - it causes flickering
    // Only show loading on initial load (when no data exists)

    // Fetch in batches of 5 to avoid overwhelming the API
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
  }, [serial, accessToken, fetchGaugeData]);

  // Initial fetch - runs only once when serial changes
  useEffect(() => {
    if (!serial) return;
    
    // Set initial loading state only on first load
    setGaugeData(() => {
      const newData: Record<string, GaugeData> = {};
      GAUGE_CONFIGS.forEach(config => {
        newData[config.id] = { value: null, localtime: null, loading: true, error: null };
      });
      return newData;
    });
    
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial]); // Only re-run when serial changes, NOT when fetchAllGauges changes

  // Auto-refresh interval - separate from initial fetch
  useEffect(() => {
    if (!serial || isPaused) return;
    
    intervalRef.current = setInterval(() => {
      fetchAllGauges();
    }, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial, isPaused]); // Don't include fetchAllGauges to avoid re-creating interval

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
              Live telemetry • Auto-refresh every 5 min
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
            {isPaused ? 'Paused' : `Next: ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        marginBottom: '16px',
      }}>
        <span>
          {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
        </span>
        <span style={{ 
          background: 'linear-gradient(135deg, #22c55e20 0%, #16a34a20 100%)',
          padding: '4px 8px',
          borderRadius: '4px',
          color: '#22c55e',
          fontWeight: 600,
        }}>
          ⚡ Live
        </span>
      </div>
      
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
            
            {/* Gauges Grid - Use specialized components */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              {configs.map(config => {
                const data = gaugeData[config.id] || { value: null, localtime: null, loading: true, error: null };
                
                // WiFi Signal - Use Analog Needle Gauge
                if (config.id === 'wifi') {
                  return (
                    <AnalogNeedleGauge
                      key={config.id}
                      value={data.value}
                      min={config.min}
                      max={config.max}
                      unit={config.unit}
                      label={config.label}
                      loading={data.loading}
                      error={data.error}
                      timestamp={data.localtime}
                    />
                  );
                }
                
                // Inverter Mode - Use specialized display
                if (config.id === 'inv_mode') {
                  return (
                    <InverterModeDisplay
                      key={config.id}
                      value={data.value}
                      loading={data.loading}
                      error={data.error}
                      timestamp={data.localtime}
                    />
                  );
                }
                
                // Battery SoC - Use circular gauge
                if (config.id.includes('_soc')) {
                  const moduleNum = config.id.includes('bat1') ? 1 : config.id.includes('bat2') ? 2 : 3;
                  return (
                    <BatterySoCGauge
                      key={config.id}
                      value={data.value}
                      moduleNumber={moduleNum}
                      loading={data.loading}
                      error={data.error}
                      timestamp={data.localtime}
                    />
                  );
                }
                
                // All other metrics - Use Digital Value Display
                return (
                  <DigitalValueDisplay
                    key={config.id}
                    value={data.value}
                    unit={config.unit}
                    label={config.label}
                    min={config.min}
                    max={config.max}
                    decimals={config.decimals || 1}
                    loading={data.loading}
                    error={data.error}
                    timestamp={data.localtime}
                    colorStart={config.colorStart}
                    colorEnd={config.colorEnd}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InstantaneousGauges;
