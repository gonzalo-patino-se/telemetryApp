// src/components/widgets/BaseTimeSeriesWidget.tsx
// Base component for time-series telemetry widgets
// Provides common functionality: date range, auto-fetch, chart, CSV export

import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
  /** Function to build KQL query */
  buildQuery: (serial: string, startDate: Date, endDate: Date) => string;
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
}) => {
  const { accessToken, logout } = useAuth();
  const { label, unit, colorScheme, offlineValue, offlineLabel, csvPrefix, buildQuery } = config;
  const colors = chartColorSchemes[colorScheme];

  // State
  const [{ fromDT, toDT }, setRange] = useState<{ fromDT: Date | null; toDT: Date | null }>(() => {
    const { start, end } = getLastHours(24);
    return { fromDT: start, toDT: end };
  });

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
    return buildQuery(serial, fromDT, toDT);
  }, [canFetch, serial, fromDT, toDT, buildQuery]);

  // Auto-fetch effect
  useEffect(() => {
    if (!autoFetch) return;
    if (!canFetch || !fromDT || !toDT || !serial) return;
    
    const currentKql = buildQuery(serial, fromDT, toDT);
    
    const doFetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post(
          QUERY_PATH,
          { kql: currentKql },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        setRows(dataArray);
      } catch (err: any) {
        if (err?.response?.status === 401) await logout();
        setError(err?.response?.data?.error ?? 'Error fetching data');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    
    void doFetch();
  }, [autoFetch, canFetch, serial, fromDT, toDT, accessToken, logout, buildQuery]);

  // Parent-triggered fetch
  useEffect(() => {
    if (fetchSignal === undefined) return;
    if (!canFetch) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSignal]);

  async function fetchData() {
    if (!kql) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        QUERY_PATH,
        { kql },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
      setRows(dataArray);
    } catch (err: any) {
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
      {/* Date range selectors */}
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-text-tertiary mb-1">From (local)</span>
          <DatePicker
            selected={fromDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, fromDT: d }))}
            placeholderText="Start date & time"
            className="border border-border-default bg-bg-input text-text-primary p-2 rounded-md focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            portalId="root"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-text-tertiary mb-1">To (local)</span>
          <DatePicker
            selected={toDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, toDT: d }))}
            placeholderText="End date & time"
            className="border border-border-default bg-bg-input text-text-primary p-2 rounded-md focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            minDate={fromDT ?? undefined}
            portalId="root"
          />
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2">
          {[6, 24, 24 * 7].map((hours) => {
            const label = hours < 24 ? `Last ${hours}h` : hours === 24 ? 'Last 24h' : `Last ${hours / 24}d`;
            return (
              <button
                key={hours}
                type="button"
                className="px-2.5 py-1.5 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={() => {
                  const { start, end } = getLastHours(hours);
                  setRange({ fromDT: start, toDT: end });
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Fetch controls */}
        {showControls && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-text-secondary flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFetch}
                onChange={e => {
                  onAutoFetchChange?.(e.target.checked);
                  if (autoFetchProp === undefined) setAutoFetchInternal(e.target.checked);
                }}
                className="w-3.5 h-3.5 rounded border-border-default bg-bg-input accent-accent-primary"
              />
              Auto‑fetch on change
            </label>
            <button
              onClick={fetchData}
              disabled={!canFetch || loading}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                canFetch && !loading 
                  ? 'bg-accent-primary text-white hover:bg-accent-hover' 
                  : 'bg-bg-input text-text-tertiary cursor-not-allowed'
              }`}
            >
              {loading ? 'Fetching…' : 'Fetch'}
            </button>
          </div>
        )}
      </div>

      {/* Selection summary */}
      <div className="text-xs text-text-secondary mb-2">
        {fromDT && toDT ? (
          <>
            Selected (local): <code className="bg-bg-primary px-1 py-0.5 rounded text-text-primary font-mono">{toLocalLabel(fromDT)}</code> →{' '}
            <code className="bg-bg-primary px-1 py-0.5 rounded text-text-primary font-mono">{toLocalLabel(toDT)}</code>
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
