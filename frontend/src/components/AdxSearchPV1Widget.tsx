    // src/components/AdxSearchPV1Widget.tsx
    import React, { useEffect, useMemo, useState } from 'react';
    import api from '../services/api';
    import { useAuth } from '../context/AuthContext';
    import DatePicker from 'react-datepicker';
    import 'react-datepicker/dist/react-datepicker.css';

    // ---- Chart.js (typed)
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
    interface AdxSearchPV1WidgetProps {
    /** Device serial provided by the Dashboard/Search */
    serial: string;

    /** Hide internal action controls when header hosts them */
    showControls?: boolean;

    /** Optional: controlled auto-fetch from parent */
    autoFetchProp?: boolean;
    onAutoFetchChange?: (value: boolean) => void;

    /** Optional: increment to trigger a fetch from parent (e.g., header button) */
    fetchSignal?: number;
    }

    // Shape returned from ADX rows (we only need two fields for the chart)
    type AdxRow = {
    localtime?: string;     // ISO 8601 string
    value_double?: number;  // numeric PV voltage
    [k: string]: any;
    };

    const QUERY_PATH = '/query_adx/'; // Change to '/api/query_adx/' if your axios baseURL does NOT include '/api'.

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
    | where name contains '/INV/DCPORT/STAT/PV1/V'
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

    // Even downsample to keep charts snappy with large series
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
    const headers = ['localtime', 'pv1_voltage'];
    const csvRows = [
        headers.join(','),
        ...rows.map(r => [
        r.localtime ?? '',
        r.value_double ?? ''
        ].join(','))
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
    const AdxSearchPV1Widget: React.FC<AdxSearchPV1WidgetProps> = ({
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
        console.log('PV1 Voltage KQL Query:', currentKql);
        try {
        const res = await api.post(
            QUERY_PATH,
            { kql: currentKql },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log('PV1 Voltage Response:', dataArray.length, 'rows');
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
    console.log('PV1 Voltage KQL Query (manual):', kql);
    try {
        const res = await api.post(
        QUERY_PATH,
        { kql },
        { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const dataArray = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log('PV1 Voltage Response:', dataArray.length, 'rows');
        setRows(dataArray);
    } catch (err: any) {
        if (err?.response?.status === 401) await logout();
        setError(err?.response?.data?.error ?? 'Error fetching data');
        setRows([]);
    } finally {
        setLoading(false);
    }
    }

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

    // ---------- Build typed chart series
    const points: ScatterDataPoint[] = useMemo(() => {
    const list = (rows ?? [])
        .filter(r => r && r.localtime && Number.isFinite(Number(r.value_double)))
        .map(r => ({
        x: parseLocalTimeAsIs(r.localtime as string),
        y: Number(r.value_double),
        }));
    return evenDownsample(list, 5000);
    }, [rows]);

    // Dynamic point styles to highlight zero values with a star
    const pointStyles = useMemo(() => {
    return {
        pointStyle: points.map(p => p.y === 0 ? 'star' : 'circle') as ('circle' | 'star')[],
        pointRadius: points.map(p => p.y === 0 ? 6 : 4),
        pointBackgroundColor: points.map(p => p.y === 0 ? '#fbbf24' : '#10b981'),
        pointBorderColor: points.map(p => p.y === 0 ? '#ffffff' : '#ffffff'),
        pointBorderWidth: points.map(p => p.y === 0 ? 2 : 1.5),
        pointHoverRadius: points.map(p => p.y === 0 ? 8 : 6),
        pointHoverBackgroundColor: points.map(p => p.y === 0 ? '#f59e0b' : '#059669'),
        pointHoverBorderColor: points.map(() => '#ffffff'),
    };
    }, [points]);

    const chartData: ChartData<'line', ScatterDataPoint[]> = useMemo(
    () => ({
        datasets: [
        {
            label: 'PV1 Voltage (V)',
            data: points,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            pointStyle: pointStyles.pointStyle,
            pointRadius: pointStyles.pointRadius,
            pointBackgroundColor: pointStyles.pointBackgroundColor,
            pointBorderColor: pointStyles.pointBorderColor,
            pointBorderWidth: pointStyles.pointBorderWidth,
            pointHoverRadius: pointStyles.pointHoverRadius,
            pointHoverBackgroundColor: pointStyles.pointHoverBackgroundColor,
            pointHoverBorderColor: pointStyles.pointHoverBorderColor,
            pointHoverBorderWidth: 2,
            borderWidth: 1.5,
            tension: 0.2,
        },
        ],
    }),
    [points, pointStyles]
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
                if (value === 0) {
                return [`★ Zero Value Detected`, `PV1 Voltage: ${value?.toFixed(1) ?? '—'} V`];
                }
                return `PV1 Voltage: ${value?.toFixed(1) ?? '—'} V`;
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
            <button
            type="button"
            className="px-2.5 py-1.5 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            onClick={() => {
                const { start, end } = lastHours(6);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 6h
            </button>
            <button
            type="button"
            className="px-2.5 py-1.5 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
            onClick={() => {
                const { start, end } = lastHours(24);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 24h
            </button>
            <button
            type="button"
            className="px-2.5 py-1.5 text-xs border border-border-default rounded-md text-text-secondary hover:bg-bg-hover transition-colors"
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
                onClick={() => downloadCsv(rows, `pv1_voltage_${serial}_${new Date().toISOString().slice(0,10)}.csv`)}
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

    export default AdxSearchPV1Widget;