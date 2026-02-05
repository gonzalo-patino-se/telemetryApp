// src/components/widgets/BaseTimeSeriesWidget.tsx
// Base component for time-series telemetry widgets
// Provides common functionality: date range, auto-fetch, chart, CSV export
// Supports global time range from MasterTimeRangeWidget with individual override

import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTimeRangeOptional } from '../../context/TimeRangeContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  type ScatterDataPoint,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

import { parseAdxLocaltime, formatTooltipDate, getLastHours } from '../../utils/dateHelpers';
import { 
  chartColorSchemes, 
  getPointStyles, 
  downsampleData,
  calculatePointStatistics,
  formatStatValue,
} from '../../utils/chartHelpers';
import type { AdxRow } from '../../types';

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale
);

// ============================================================================
// Types
// ============================================================================

/** Telemetry mode - normal (15 min sampling) or fast (15 sec sampling) */
export type TelemetryMode = 'normal' | 'fast';

export interface WidgetConfig {
  /** Display label for the widget data */
  label: string;
  /** Unit of measurement (e.g., 'dBm', 'V', 'W') */
  unit: string;
  /** Color scheme key */
  colorScheme: keyof typeof chartColorSchemes;
  /** Value that indicates offline/invalid state (optional) */
  offlineValue?: number;
  /** Custom offline label (optional) */
  offlineLabel?: string;
  /** File prefix for CSV export */
  csvPrefix: string;
  /** Function to build KQL query (normal telemetry - default) */
  buildQuery: (serial: string, startDate: Date, endDate: Date) => string;
  /** Function to build fast telemetry KQL query (optional - enables toggle) */
  buildFastQuery?: (serial: string, startDate: Date, endDate: Date) => string;
  /** Whether this widget supports fast telemetry mode (auto-detected from buildFastQuery) */
  supportsFastTelemetry?: boolean;
  /** Default telemetry mode (defaults to 'normal') */
  defaultMode?: TelemetryMode;
}

export interface BaseTimeSeriesWidgetProps {
  /** Device serial number */
  serial: string;
  /** Widget configuration */
  config: WidgetConfig;
  /** Hide the internal controls when parent hosts them */
  showControls?: boolean;
  /** Controlled auto-fetch from parent */
  autoFetchProp?: boolean;
  onAutoFetchChange?: (value: boolean) => void;
  /** Signal to trigger fetch from parent */
  fetchSignal?: number;
  /** Controlled telemetry mode from parent (optional) */
  telemetryModeProp?: TelemetryMode;
  onTelemetryModeChange?: (mode: TelemetryMode) => void;
  /** Whether to use global time range from TimeRangeContext (default: true) */
  useGlobalTimeRange?: boolean;
}

const QUERY_PATH = '/query_adx/';

// ============================================================================
// CSV Export Helper
// ============================================================================

function downloadCsv(
  rows: AdxRow[], 
  filename: string, 
  unit: string,
  offlineValue?: number
): void {
  if (!rows.length) return;
  
  const hasOfflineColumn = offlineValue !== undefined;
  const headers = hasOfflineColumn 
    ? ['localtime', `value (${unit})`, 'status']
    : ['localtime', `value (${unit})`];
  
  const csvRows = [
    headers.join(','),
    ...rows.map(r => {
      const values = [
        r.localtime ?? '',
        r.value_double ?? ''
      ];
      if (hasOfflineColumn) {
        const status = r.value_double === offlineValue ? 'offline' : 'online';
        values.push(status);
      }
      return values.join(',');
    })
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Component
// ============================================================================

export const BaseTimeSeriesWidget: React.FC<BaseTimeSeriesWidgetProps> = ({
  serial,
  config,
  showControls = true,
  autoFetchProp,
  onAutoFetchChange,
  fetchSignal,
  telemetryModeProp,
  onTelemetryModeChange,
  useGlobalTimeRange = true,
}) => {
  const { logout } = useAuth();
  const timeRangeContext = useTimeRangeOptional();
  const { label, unit, colorScheme, offlineValue, offlineLabel, csvPrefix, buildQuery, buildFastQuery, defaultMode } = config;
  const colors = chartColorSchemes[colorScheme];
  
  // Determine if fast telemetry is supported
  const supportsFastTelemetry = Boolean(buildFastQuery);
  
  // Telemetry mode state (normal vs fast)
  const [telemetryModeInternal, setTelemetryModeInternal] = useState<TelemetryMode>(defaultMode ?? 'normal');
  const telemetryMode = telemetryModeProp ?? telemetryModeInternal;
  
  // Get the appropriate query builder based on mode
  const activeQueryBuilder = telemetryMode === 'fast' && buildFastQuery ? buildFastQuery : buildQuery;

  // Track whether widget is linked to global time range or using local override
  const [isLinkedToGlobal, setIsLinkedToGlobal] = useState(true);

  // Local time range state (used when unlinked or no global context)
  const [localRange, setLocalRange] = useState<{ fromDT: Date | null; toDT: Date | null }>(() => {
    const { start, end } = getLastHours(6); // Default to 6 hours for faster loading
    return { fromDT: start, toDT: end };
  });

  // Determine effective time range (global vs local)
  const effectiveRange = useMemo(() => {
    if (useGlobalTimeRange && isLinkedToGlobal && timeRangeContext) {
      return {
        fromDT: timeRangeContext.globalTimeRange.startDate,
        toDT: timeRangeContext.globalTimeRange.endDate,
      };
    }
    return localRange;
  }, [useGlobalTimeRange, isLinkedToGlobal, timeRangeContext, localRange]);

  const { fromDT, toDT } = effectiveRange;

  // Sync local range when global changes (for smooth unlinking)
  useEffect(() => {
    if (useGlobalTimeRange && isLinkedToGlobal && timeRangeContext) {
      setLocalRange({
        fromDT: timeRangeContext.globalTimeRange.startDate,
        toDT: timeRangeContext.globalTimeRange.endDate,
      });
    }
  }, [useGlobalTimeRange, isLinkedToGlobal, timeRangeContext]);

  // Helper to set range (updates local, and re-links if setting while unlinked)
  const setRange = (newRange: { fromDT: Date | null; toDT: Date | null }) => {
    setLocalRange(newRange);
    // If user manually sets range, unlink from global
    if (isLinkedToGlobal) {
      setIsLinkedToGlobal(false);
    }
  };

  const [rows, setRows] = useState<AdxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoFetchInternal, setAutoFetchInternal] = useState(true);
  const autoFetch = autoFetchProp ?? autoFetchInternal;

  // Computed
  const canFetch = useMemo(() => {
    if (!serial || !fromDT || !toDT) return false;
    return toDT.getTime() > fromDT.getTime();
  }, [serial, fromDT, toDT]);

  const kql = useMemo(() => {
    if (!canFetch || !fromDT || !toDT) return null;
    return activeQueryBuilder(serial, fromDT, toDT);
  }, [canFetch, serial, fromDT, toDT, activeQueryBuilder]);

  // Auto-fetch effect with abort controller
  useEffect(() => {
    if (!autoFetch) return;
    if (!canFetch || !fromDT || !toDT || !serial) return;
    
    const abortController = new AbortController();
    const currentKql = activeQueryBuilder(serial, fromDT, toDT);
    
    const doFetch = async () => {
      setLoading(true);
      setError('');
      try {
        // Cookies sent automatically with withCredentials: true
        const res = await api.post(
          QUERY_PATH,
          { kql: currentKql },
          { 
            signal: abortController.signal
          }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        setRows(dataArray);
      } catch (err: any) {
        // Ignore aborted requests
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        if (err?.response?.status === 401) await logout();
        setError(err?.response?.data?.error ?? 'Error fetching data');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    
    void doFetch();
    
    // Cleanup: abort pending request when dependencies change
    return () => abortController.abort();
  }, [autoFetch, canFetch, serial, fromDT, toDT, logout, activeQueryBuilder, telemetryMode]);

  // Parent-triggered fetch with abort controller
  useEffect(() => {
    if (fetchSignal === undefined) return;
    if (!canFetch || !kql) return;
    
    const abortController = new AbortController();
    
    const doFetch = async () => {
      setLoading(true);
      setError('');
      try {
        // Cookies sent automatically with withCredentials: true
        const res = await api.post(
          QUERY_PATH,
          { kql },
          { 
            signal: abortController.signal
          }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        setRows(dataArray);
      } catch (err: any) {
        // Ignore aborted requests
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        if (err?.response?.status === 401) await logout();
        setError(err?.response?.data?.error ?? 'Error fetching data');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    
    void doFetch();
    
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSignal]);

  // Manual fetch function for button click
  async function fetchData() {
    if (!kql) return;
    setLoading(true);
    setError('');
    try {
      // Cookies sent automatically with withCredentials: true
      const res = await api.post(
        QUERY_PATH,
        { kql }
      );
      const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
      setRows(dataArray);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      if (err?.response?.status === 401) await logout();
      setError(err?.response?.data?.error ?? 'Error fetching data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Chart data processing
  const points: ScatterDataPoint[] = useMemo(() => {
    const list = (rows ?? [])
      .filter(r => r && r.localtime && Number.isFinite(Number(r.value_double)))
      .map(r => ({
        x: parseAdxLocaltime(r.localtime as string),
        y: Number(r.value_double),
      }));
    return downsampleData(list, 5000);
  }, [rows]);

  // Calculate statistics from points
  const stats = useMemo(() => calculatePointStatistics(points), [points]);

  // Point styles for offline values
  const isSpecialValue = offlineValue !== undefined 
    ? (value: number) => value === offlineValue 
    : undefined;
  
  const pointStylesData = useMemo(() => {
    return getPointStyles(points, colors, isSpecialValue);
  }, [points, colors, isSpecialValue]);

  // Chart configuration
  const chartData: ChartData<'line', ScatterDataPoint[]> = useMemo(() => ({
    datasets: [{
      label: `${label} (${unit})`,
      data: points,
      borderColor: colors.line,
      backgroundColor: colors.fill,
      fill: true,
      pointStyle: pointStylesData.pointStyle,
      pointRadius: pointStylesData.pointRadius,
      pointBackgroundColor: pointStylesData.pointBackgroundColor,
      pointBorderColor: pointStylesData.pointBorderColor,
      pointBorderWidth: pointStylesData.pointBorderWidth,
      pointHoverRadius: pointStylesData.pointHoverRadius,
      pointHoverBackgroundColor: pointStylesData.pointHoverBackgroundColor,
      pointHoverBorderColor: pointStylesData.pointHoverBorderColor,
      pointHoverBorderWidth: 2,
      borderWidth: 1.5,
      tension: 0.2,
    }],
  }), [points, colors, label, unit, pointStylesData]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'Pp' },
        ticks: { 
          maxRotation: 0, 
          autoSkip: true,
          color: 'var(--text-tertiary)',
          font: { size: 10 }
        },
        grid: { display: false },
        title: { display: false },
        border: { display: false }
      },
      y: {
        beginAtZero: false,
        grid: { color: 'var(--border-subtle)' },
        title: { display: false },
        ticks: { 
          color: 'var(--text-tertiary)',
          font: { size: 10 }
        },
        border: { display: false }
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { 
        mode: 'nearest', 
        intersect: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (!context.length || context[0].parsed.x === null) return '';
            const date = new Date(context[0].parsed.x as number);
            return formatTooltipDate(date);
          },
          label: (context) => {
            const value = context.parsed.y;
            if (offlineValue !== undefined && value === offlineValue) {
              return [`⛔ ${offlineLabel ?? 'Device Offline'}`, `${label}: ${value} ${unit}`];
            }
            if (value === 0) {
              return [`★ Zero Value Detected`, `${label}: ${value} ${unit}`];
            }
            return `${label}: ${value} ${unit}`;
          }
        }
      },
    },
  }), [label, unit, offlineValue, offlineLabel]);

  const toLocalLabel = (d?: Date | string) => {
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt ? dt.toLocaleString() : '';
    } catch {
      return '';
    }
  };

  // UI
  return (
    <>
      {/* Date range selectors - Modern compact design */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '10px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}>
        {/* Link/Unlink to Global Time Range */}
        {useGlobalTimeRange && timeRangeContext && (
          <button
            type="button"
            onClick={() => setIsLinkedToGlobal(!isLinkedToGlobal)}
            title={isLinkedToGlobal ? 'Linked to master time range - click to use custom range' : 'Using custom range - click to sync with master'}
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              border: isLinkedToGlobal 
                ? '1px solid rgba(139, 92, 246, 0.4)' 
                : '1px solid rgba(148, 163, 184, 0.2)',
              background: isLinkedToGlobal 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)' 
                : 'transparent',
              color: isLinkedToGlobal ? '#a78bfa' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isLinkedToGlobal ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Linked
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3"/>
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                Custom
              </>
            )}
          </button>
        )}

        {/* From Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#64748b' 
          }}>From</span>
          <DatePicker
            selected={fromDT}
            onChange={(d: Date | null) => setRange({ fromDT: d, toDT })}
            placeholderText="Start"
            className="modern-datepicker"
            showTimeSelect
            timeIntervals={15}
            dateFormat="MMM d, HH:mm"
            isClearable={false}
            portalId="root"
          />
        </div>

        {/* Arrow separator */}
        <span style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>→</span>

        {/* To Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#64748b' 
          }}>To</span>
          <DatePicker
            selected={toDT}
            onChange={(d: Date | null) => setRange({ fromDT, toDT: d })}
            placeholderText="End"
            className="modern-datepicker"
            showTimeSelect
            timeIntervals={15}
            dateFormat="MMM d, HH:mm"
            isClearable={false}
            minDate={fromDT ?? undefined}
            portalId="root"
          />
        </div>

        {/* Divider */}
        <div style={{ 
          width: '1px', 
          height: '32px', 
          background: 'rgba(148, 163, 184, 0.2)',
          marginLeft: '4px',
          marginRight: '4px',
        }} />

        {/* Quick presets - Pill buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[6, 24, 24 * 7].map((hours) => {
            const presetLabel = hours < 24 ? `${hours}h` : hours === 24 ? '24h' : '7d';
            return (
              <button
                key={hours}
                type="button"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '16px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.color = '#e2e8f0';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                }}
                onClick={() => {
                  const { start, end } = getLastHours(hours);
                  setRange({ fromDT: start, toDT: end });
                }}
              >
                {presetLabel}
              </button>
            );
          })}
        </div>

        {/* Telemetry Mode Toggle - Modern segmented control */}
        {supportsFastTelemetry && (
          <>
            <div style={{ 
              width: '1px', 
              height: '32px', 
              background: 'rgba(148, 163, 184, 0.2)',
              marginLeft: '4px',
              marginRight: '4px',
            }} />
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '4px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '20px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
            }}>
              <button
                type="button"
                onClick={() => {
                  onTelemetryModeChange?.('normal');
                  if (telemetryModeProp === undefined) setTelemetryModeInternal('normal');
                }}
                style={{
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: telemetryMode === 'normal' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : 'transparent',
                  color: telemetryMode === 'normal' ? '#ffffff' : '#64748b',
                  boxShadow: telemetryMode === 'normal' 
                    ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Normal Telemetry - sampled every 15 minutes"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                15min
              </button>
              <button
                type="button"
                onClick={() => {
                  onTelemetryModeChange?.('fast');
                  if (telemetryModeProp === undefined) setTelemetryModeInternal('fast');
                }}
                style={{
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: telemetryMode === 'fast' 
                    ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' 
                    : 'transparent',
                  color: telemetryMode === 'fast' ? '#ffffff' : '#64748b',
                  boxShadow: telemetryMode === 'fast' 
                    ? '0 2px 8px rgba(249, 115, 22, 0.3)' 
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Fast Telemetry - sampled every 15 seconds"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                15sec
              </button>
            </div>
          </>
        )}

        {/* Fetch controls - right aligned */}
        {showControls && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginLeft: 'auto' 
          }}>
            <label style={{ 
              fontSize: '11px', 
              color: '#94a3b8', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer' 
            }}>
              <input
                type="checkbox"
                checked={autoFetch}
                onChange={e => {
                  onAutoFetchChange?.(e.target.checked);
                  if (autoFetchProp === undefined) setAutoFetchInternal(e.target.checked);
                }}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer',
                }}
              />
              Auto
            </label>
            <button
              onClick={fetchData}
              disabled={!canFetch || loading}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '18px',
                border: 'none',
                cursor: canFetch && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                background: canFetch && !loading 
                  ? 'linear-gradient(135deg, #3dcd58 0%, #22c55e 100%)' 
                  : 'rgba(100, 116, 139, 0.2)',
                color: canFetch && !loading ? '#ffffff' : '#64748b',
                boxShadow: canFetch && !loading 
                  ? '0 2px 8px rgba(61, 205, 88, 0.3)' 
                  : 'none',
              }}
            >
              {loading ? '⏳' : '↻ Fetch'}
            </button>
          </div>
        )}
      </div>

      {/* Selection summary */}
      <div className="text-xs text-text-secondary mb-2 flex items-center gap-2 flex-wrap">
        {fromDT && toDT ? (
          <>
            Selected (local): <code className="bg-bg-primary px-1 py-0.5 rounded text-text-primary font-mono">{toLocalLabel(fromDT)}</code> →{' '}
            <code className="bg-bg-primary px-1 py-0.5 rounded text-text-primary font-mono">{toLocalLabel(toDT)}</code>
            {supportsFastTelemetry && (
              <span 
                className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide inline-flex items-center gap-1 ${
                  telemetryMode === 'fast' 
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {telemetryMode === 'fast' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                )}
                {telemetryMode === 'fast' ? '15s sampling' : '15min sampling'}
              </span>
            )}
          </>
        ) : (
          'Pick start & end, then click Fetch.'
        )}
      </div>

      {/* Debug: KQL Query */}
      {kql && (
        <details className="mb-2">
          <summary className="cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
            Show KQL Query (debug)
          </summary>
          <pre className="bg-bg-primary border border-border-subtle p-2 rounded-lg max-h-40 overflow-auto text-xs text-text-secondary mt-2 whitespace-pre-wrap">
            {kql}
          </pre>
        </details>
      )}

      {/* Status / Results */}
      {error && <div className="text-status-critical text-sm">{error}</div>}

      {!error && !loading && rows.length === 0 && (
        <div className="text-sm text-text-tertiary">No data was found</div>
      )}

      {!error && rows.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-text-secondary">
              Returned rows: <span className="font-semibold text-text-primary">{rows.length}</span>
            </div>
            <button
              onClick={() => downloadCsv(
                rows, 
                `${csvPrefix}_${serial}_${new Date().toISOString().slice(0, 10)}.csv`,
                unit,
                offlineValue
              )}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              title="Download data as CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              CSV
            </button>
          </div>

          {/* Statistics Panel */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-3 p-2 bg-bg-primary rounded-lg border border-border-subtle">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Min</div>
                <div className="text-sm font-semibold text-text-primary">{formatStatValue(stats.min)}</div>
                <div className="text-[10px] text-text-tertiary">{unit}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Max</div>
                <div className="text-sm font-semibold text-text-primary">{formatStatValue(stats.max)}</div>
                <div className="text-[10px] text-text-tertiary">{unit}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Avg</div>
                <div className="text-sm font-semibold text-accent-primary">{formatStatValue(stats.avg)}</div>
                <div className="text-[10px] text-text-tertiary">{unit}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Std Dev</div>
                <div className="text-sm font-semibold text-text-primary">{formatStatValue(stats.stdDev)}</div>
                <div className="text-[10px] text-text-tertiary">{unit}</div>
              </div>
            </div>
          )}

          <div className="h-[180px] sm:h-[220px] mb-3">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Debug preview */}
          <details>
            <summary className="cursor-pointer text-xs text-text-tertiary hover:text-text-secondary">
              Show first 5 rows (debug)
            </summary>
            <pre className="bg-bg-primary border border-border-subtle p-2 rounded-lg max-h-40 overflow-auto text-xs text-text-secondary mt-2">
              {JSON.stringify(rows.slice(0, 5), null, 2)}
            </pre>
          </details>
        </>
      )}
    </>
  );
};

export default BaseTimeSeriesWidget;
