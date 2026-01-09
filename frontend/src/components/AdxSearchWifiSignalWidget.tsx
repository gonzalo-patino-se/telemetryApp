    // src/components/AdxSearchWifiSignalWidget.tsx

    import React, { useEffect, useMemo, useState } from 'react';
    import api from '../services/api';
    import { useAuth } from '../context/AuthContext';
    import DatePicker from 'react-datepicker';
    import 'react-datepicker/dist/react-datepicker.css';
    import { calculatePointStatistics, formatStatValue } from '../utils/chartHelpers';

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

    // ---------------------------- Types & Helpers
    interface AdxSearchWifiSignalWidgetProps {
    /** Device serial provided by the Dashboard/Search */
    serial: string;

    /** Hide the internal action controls (Auto‑fetch + Fetch) when header hosts them */
    showControls?: boolean;

    /** Optional: controlled auto-fetch from parent (if provided, overrides internal state) */
    autoFetchProp?: boolean;
    onAutoFetchChange?: (value: boolean) => void;

    /** Optional: increment to trigger a fetch from parent (e.g., header button click) */
    fetchSignal?: number;
    }

    type AdxRow = {
    localtime?: string;     // ISO 8601 string
    value_double?: number;  // numeric Wi‑Fi signal (dBm)
    [k: string]: any;
    };

    const QUERY_PATH = '/query_adx/';

    function escapeKqlString(s: string) {
    return (s ?? '').replace(/'/g, "''");
    }

    // Format date for KQL query - standard YYYY-MM-DD HH:MM:SS.0000 format
    function toLocalKqlDatetime(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    // Standard format: YYYY-MM-DD
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.0000`;
    }

    function buildKql(serial: string, from: Date, to: Date) {
    const s = escapeKqlString(serial);
    const startLocal = toLocalKqlDatetime(from);
    const endLocal = toLocalKqlDatetime(to);
    // localtime is already a datetime column in ADX - query it directly
    return `
    let s = '${s}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Telemetry
    | where comms_serial contains s
    | where name contains '/SCC/WIFI/STAT/SIGNAL_STRENGTH'
    | where localtime between (start .. finish)
    | project localtime, value_double
    | order by localtime asc
    `.trim();
    }

    function lastHours(h: number) {
    const end = new Date();
    const start = new Date(end.getTime() - h * 60 * 60 * 1000);
    return { start, end };
    }

    function toLocalLabel(d?: Date | string) {
    try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt ? dt.toLocaleString() : '';
    } catch {
    return '';
    }
    }

    function evenDownsample<T>(arr: T[], maxPoints: number): T[] {
    if (!Array.isArray(arr)) return [];
    if (arr.length <= maxPoints) return arr;
    const step = Math.ceil(arr.length / maxPoints);
    const out: T[] = [];
    for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
    if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
    return out;
    }

    // CSV export helper
    function downloadCsv(rows: AdxRow[], filename: string) {
    if (!rows.length) return;
    const headers = ['localtime', 'value_double', 'signal_status'];
    const OFFLINE_VAL = -127;
    const csvRows = [
        headers.join(','),
        ...rows.map(r => {
        const status = r.value_double === OFFLINE_VAL ? 'offline' : 'online';
        return [
            r.localtime ?? '',
            r.value_double ?? '',
            status
        ].join(',');
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

    // ---------------------------- Component
    const AdxSearchWifiSignalWidget: React.FC<AdxSearchWifiSignalWidgetProps> = ({
    serial,
    showControls = true,
    autoFetchProp,
    onAutoFetchChange,
    fetchSignal,
    }) => {
    const { accessToken, logout } = useAuth();

    // Default range: Last 24 hours
    const [{ fromDT, toDT }, setRange] = useState<{ fromDT: Date | null; toDT: Date | null }>(() => {
    const { start, end } = lastHours(24);
    return { fromDT: start, toDT: end };
    });

    const [rows, setRows] = useState<AdxRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Internal autoFetch if parent doesn't control it - default to TRUE for better UX
    const [autoFetchInternal, setAutoFetchInternal] = useState(true);
    const autoFetch = autoFetchProp ?? autoFetchInternal;

    const canFetch = useMemo(() => {
    if (!serial || !fromDT || !toDT) return false;
    return toDT.getTime() > fromDT.getTime();
    }, [serial, fromDT, toDT]);

    const kql = useMemo(() => {
    if (!canFetch || !fromDT || !toDT) return null;
    return buildKql(serial, fromDT, toDT);
    }, [canFetch, serial, fromDT, toDT]);

    // Auto-fetch on range/serial changes (if enabled)
    useEffect(() => {
    if (!autoFetch) return;
    if (!canFetch || !fromDT || !toDT || !serial) return;
    
    const currentKql = buildKql(serial, fromDT, toDT);
    
    const doFetch = async () => {
        setLoading(true);
        setError('');
        console.log('WiFi Signal KQL Query:', currentKql);
        try {
        const res = await api.post(
            QUERY_PATH,
            { kql: currentKql },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log('WiFi Signal Response:', dataArray.length, 'rows');
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
    }, [autoFetch, canFetch, serial, fromDT, toDT, accessToken, logout]);

    // Parent-triggered fetch via fetchSignal bump
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
    console.log('WiFi Signal KQL Query (manual):', kql);
    try {
        const res = await api.post(
        QUERY_PATH,
        { kql },
        { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log('WiFi Signal Response:', dataArray.length, 'rows');
        setRows(dataArray);
    } catch (err: any) {
        if (err?.response?.status === 401) await logout();
        setError(err?.response?.data?.error ?? 'Error fetching data');
        setRows([]);
    } finally {
        setLoading(false);
    }
    }

    // -127 dBm indicates inverter offline
    const OFFLINE_VALUE = -127;

    // Parse localtime from Azure - handles multiple formats:
    // - ISO format: "2025-03-06T15:44:33.000Z"
    // - US locale: "3/11/2025, 10:45:01 AM"
    function parseLocalTimeAsIs(localtime: string): number {
    if (!localtime) return 0;
    
    // Check if it's US locale format: "M/D/YYYY, H:MM:SS AM/PM"
    if (localtime.includes('/') && localtime.includes(',')) {
        const [datePart, timeWithAmPm] = localtime.split(', ');
        const [month, day, year] = datePart.split('/').map(Number);
        
        // Parse time with AM/PM
        const timeMatch = timeWithAmPm?.match(/(\d+):(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);
        const ampm = timeMatch[4]?.toUpperCase();
        
        // Convert to 24-hour format
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
        }
        return new Date(year, month - 1, day).getTime();
    }
    
    // ISO format: "2025-03-06T15:44:33.000Z"
    // Remove Z suffix to prevent UTC interpretation
    const cleaned = localtime.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
    const [datePart, timePart] = cleaned.split('T');
    if (!datePart) return 0;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours = 0, minutes = 0, seconds = 0] = (timePart || '00:00:00').split(':').map(s => parseFloat(s) || 0);
    return new Date(year, month - 1, day, Math.floor(hours), Math.floor(minutes), Math.floor(seconds)).getTime();
    }

    const points: ScatterDataPoint[] = useMemo(() => {
    const list = (rows ?? [])
        .filter(r => r && r.localtime && Number.isFinite(Number(r.value_double)))
        .map(r => ({
        x: parseLocalTimeAsIs(r.localtime as string),
        y: Number(r.value_double),
        }));
    return evenDownsample(list, 5000);
    }, [rows]);

    // Calculate statistics from points
    const stats = useMemo(() => calculatePointStatistics(points), [points]);

    // Helper to determine point type: offline, zero, or normal
    const getPointType = (value: number): 'offline' | 'zero' | 'normal' => {
    if (value === OFFLINE_VALUE) return 'offline';
    if (value === 0) return 'zero';
    return 'normal';
    };

    // Dynamic point styles: X marker for offline (-127), star for zero, circle for normal
    const pointStyles = useMemo(() => {
    return points.map(p => {
        const type = getPointType(p.y as number);
        if (type === 'offline') return 'crossRot';
        if (type === 'zero') return 'star';
        return 'circle';
    }) as ('circle' | 'crossRot' | 'star')[];
    }, [points]);

    const pointColors = useMemo(() => {
    return points.map(p => {
        const type = getPointType(p.y as number);
        if (type === 'offline') return '#ef4444'; // red
        if (type === 'zero') return '#fbbf24'; // yellow
        return '#2563eb'; // blue
    });
    }, [points]);

    const pointRadii = useMemo(() => {
    return points.map(p => {
        const type = getPointType(p.y as number);
        if (type === 'offline' || type === 'zero') return 6;
        return 4;
    });
    }, [points]);

    const chartData: ChartData<'line', ScatterDataPoint[]> = useMemo(
    () => ({
        datasets: [
        {
            label: 'Wi‑Fi Signal Strength (dBm)',
            data: points,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            fill: true,
            pointStyle: pointStyles,
            pointRadius: pointRadii,
            pointBackgroundColor: pointColors,
            pointBorderColor: points.map(p => {
                const type = getPointType(p.y as number);
                if (type === 'offline') return '#ef4444';
                if (type === 'zero') return '#ffffff';
                return '#ffffff';
            }),
            pointBorderWidth: points.map(p => {
                const type = getPointType(p.y as number);
                if (type === 'offline' || type === 'zero') return 2;
                return 1.5;
            }),
            pointHoverRadius: points.map(p => {
                const type = getPointType(p.y as number);
                if (type === 'offline' || type === 'zero') return 8;
                return 6;
            }),
            pointHoverBackgroundColor: points.map(p => {
                const type = getPointType(p.y as number);
                if (type === 'offline') return '#dc2626';
                if (type === 'zero') return '#f59e0b';
                return '#1d4ed8';
            }),
            pointHoverBorderColor: points.map(p => {
                const type = getPointType(p.y as number);
                if (type === 'offline') return '#dc2626';
                return '#ffffff';
            }),
            pointHoverBorderWidth: 2,
            borderWidth: 1.5,
            tension: 0.2,
        },
        ],
    }),
    [points, pointStyles, pointRadii, pointColors]
    );

    const chartOptions: ChartOptions<'line'> = useMemo(
    () => ({
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
                return date.toLocaleString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
                });
            },
            label: (context) => {
                const value = context.parsed.y;
                if (value === OFFLINE_VALUE) {
                return ['⛔ Device Offline', `Signal: ${value} dBm`];
                }
                if (value === 0) {
                return [`★ Zero Value Detected`, `Signal: ${value} dBm`];
                }
                return `Signal: ${value} dBm`;
            }
            }
        },
        },
    }),
    []
    );

    // ---------------------------- UI (no outer card container/title)
    return (
    <>
        {/* Range selectors */}
        <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex flex-col">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From (local)</span>
            <DatePicker
            selected={fromDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, fromDT: d }))}
            placeholderText="Start date & time"
            className="widget-datepicker-input"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            portalId="root"
            />
        </div>

        <div className="flex flex-col">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To (local)</span>
            <DatePicker
            selected={toDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, toDT: d }))}
            placeholderText="End date & time"
            className="widget-datepicker-input"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            minDate={fromDT ?? undefined}
            portalId="root"
            />
        </div>

        {/* Quick presets with modern styling */}
        <div className="flex items-center gap-2">
            <button
            type="button"
            className="widget-preset-btn"
            onClick={() => {
                const { start, end } = lastHours(6);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 6h
            </button>
            <button
            type="button"
            className="widget-preset-btn"
            onClick={() => {
                const { start, end } = lastHours(24);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 24h
            </button>
            <button
            type="button"
            className="widget-preset-btn"
            onClick={() => {
                const { start, end } = lastHours(24 * 7);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 7d
            </button>
        </div>

        {/* Fetch controls — hidden if parent renders them in header */}
        {showControls && (
            <div className="flex items-center gap-3 ml-auto">
            <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                type="checkbox"
                checked={autoFetch}
                onChange={e => {
                    onAutoFetchChange?.(e.target.checked);
                    if (autoFetchProp === undefined) setAutoFetchInternal(e.target.checked);
                }}
                style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: 'var(--accent-primary)' }}
                />
                Auto‑fetch on change
            </label>
            <button
                onClick={fetchData}
                disabled={!canFetch || loading}
                className="widget-fetch-btn"
            >
                {loading ? 'Fetching…' : 'Fetch'}
            </button>
            </div>
        )}
        </div>

        {/* Current selection summary */}
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

        {/* Debug: Show KQL query */}
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
                onClick={() => downloadCsv(rows, `wifi_signal_${serial}_${new Date().toISOString().slice(0,10)}.csv`)}
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
                <div className="text-[10px] text-text-tertiary">dBm</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Max</div>
                <div className="text-sm font-semibold text-text-primary">{formatStatValue(stats.max)}</div>
                <div className="text-[10px] text-text-tertiary">dBm</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Avg</div>
                <div className="text-sm font-semibold text-accent-primary">{formatStatValue(stats.avg)}</div>
                <div className="text-[10px] text-text-tertiary">dBm</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-0.5">Std Dev</div>
                <div className="text-sm font-semibold text-text-primary">{formatStatValue(stats.stdDev)}</div>
                <div className="text-[10px] text-text-tertiary">dBm</div>
              </div>
            </div>
            )}

            <div className="h-[180px] sm:h-[220px] mb-3">
            <Line data={chartData} options={chartOptions} />
            </div>

            {/* Debug preview (first 5 rows) */}
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

    export default AdxSearchWifiSignalWidget;