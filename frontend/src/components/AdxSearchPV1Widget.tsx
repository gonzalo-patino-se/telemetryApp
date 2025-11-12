    // src/components/AdxSearchWidget.tsx
    import React, { useEffect, useMemo, useState } from 'react';
    import api from '../services/api';
    import { useAuth } from '../context/AuthContext';
    import DatePicker from 'react-datepicker';
    import 'react-datepicker/dist/react-datepicker.css';

    // ---- Chart.js (typed) ----
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

    // --------------------- Types & Helpers ---------------------
    interface AdxSearchWidgetProps {
    serial: string; // Provided by Dashboard
    }

    // Shape returned from ADX rows (we only need two fields for the chart)
    type AdxRow = {
    localtime?: string;    // ISO 8601 string
    value_double?: number; // numeric PV voltage
    [k: string]: any;
    };

    const QUERY_PATH = '/query_adx/'; // Change to '/api/query_adx/' if your axios baseURL does NOT include '/api'.

    function escapeKqlString(s: string) {
    // Escape single quotes for Kusto string literals
    return (s ?? '').replace(/'/g, "''");
    }

    function buildKql(serial: string, from: Date, to: Date) {
    const s = escapeKqlString(serial);
    const startIso = from.toISOString(); // UTC Z
    const endIso = to.toISOString();     // UTC Z
    return `
    let s = '${s}';
    let start = datetime(${startIso});
    let finish = datetime(${endIso});
    Telemetry
    | where comms_serial contains s
    | where name contains '/INV/DCPORT/STAT/PV1/V'
    | where localtime between (start .. finish)
    | where isnotnull(value_double)
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

    // --------------------- Component ---------------------
    const AdxSearchPV1Widget: React.FC<AdxSearchWidgetProps> = ({ serial }) => {
    const { accessToken, logout } = useAuth();

    // Default range: Last 24 hours
    const [{ fromDT, toDT }, setRange] = useState<{ fromDT: Date | null; toDT: Date | null }>(() => {
    const { start, end } = lastHours(24);
    return { fromDT: start, toDT: end };
    });

    const [rows, setRows] = useState<AdxRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [autoFetch, setAutoFetch] = useState(false);

    const canFetch = useMemo(() => {
    if (!serial || !fromDT || !toDT) return false;
    return toDT.getTime() > fromDT.getTime();
    }, [serial, fromDT, toDT]);

    const kql = useMemo(() => {
    if (!canFetch || !fromDT || !toDT) return null;
    return buildKql(serial, fromDT, toDT);
    }, [canFetch, serial, fromDT, toDT]);

    useEffect(() => {
    if (!autoFetch || !kql) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kql, autoFetch]);

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
        // Backend returns { name, kind, data: [...] }
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

    // ---------- Build typed chart series ----------
    // Use numeric timestamps to satisfy Chart.js ScatterDataPoint typing
    const points: ScatterDataPoint[] = useMemo(() => {
    const list = (rows ?? [])
        .filter(r => r && r.localtime && Number.isFinite(Number(r.value_double)))
        .map(r => ({
        x: new Date(r.localtime as string).getTime(), // <-- number (ms) for TS typing
        y: Number(r.value_double),
        }));
    return evenDownsample(list, 5000);
    }, [rows]);

    // Typed chart data & options
    const chartData: ChartData<'line', ScatterDataPoint[]> = useMemo(
    () => ({
        datasets: [
        {
            label: 'PV1 Voltage (V)',
            data: points,
            // parsing can be left default (true) because data are {x,y}
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            fill: true,
            pointRadius: 0,
            borderWidth: 1.5,
            tension: 0.2,
        },
        ],
    }),
    [points]
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
            ticks: { maxRotation: 0, autoSkip: true },
            grid: { display: false },
            title: { display: true, text: 'Time (local)' },
        },
        y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.08)' },
            title: { display: true, text: 'Voltage (V)' },
        },
        },
        plugins: {
        legend: { display: true },
        tooltip: { mode: 'nearest', intersect: false },
        },
    }),
    []
    );

    // --------------------- UI ---------------------
    return (
    <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-3">PV1 Voltage (ADX)</h3>

        {/* Range selectors */}
        <div className="flex flex-wrap items-end gap-3 mb-3">
        <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">From (local)</span>
            <DatePicker
            selected={fromDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, fromDT: d }))}
            placeholderText="Start date & time"
            className="border p-2 rounded"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            />
        </div>

        <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">To (local)</span>
            <DatePicker
            selected={toDT}
            onChange={(d: Date | null) => setRange(r => ({ ...r, toDT: d }))}
            placeholderText="End date & time"
            className="border p-2 rounded"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable={false}
            minDate={fromDT ?? undefined}
            />
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2">
            <button
            type="button"
            className="px-2 py-1 text-xs border rounded"
            onClick={() => {
                const { start, end } = lastHours(6);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 6h
            </button>
            <button
            type="button"
            className="px-2 py-1 text-xs border rounded"
            onClick={() => {
                const { start, end } = lastHours(24);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 24h
            </button>
            <button
            type="button"
            className="px-2 py-1 text-xs border rounded"
            onClick={() => {
                const { start, end } = lastHours(24 * 7);
                setRange({ fromDT: start, toDT: end });
            }}
            >
            Last 7d
            </button>
        </div>

        {/* Fetch controls */}
        <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs flex items-center gap-1">
            <input
                type="checkbox"
                checked={autoFetch}
                onChange={e => setAutoFetch(e.target.checked)}
            />
            Auto‑fetch on change
            </label>

            <button
            onClick={fetchData}
            disabled={!canFetch || loading}
            className={`px-3 py-2 rounded ${
                canFetch && !loading ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}
            >
            {loading ? 'Fetching…' : 'Fetch'}
            </button>
        </div>
        </div>

        {/* Current selection summary */}
        <div className="text-xs text-gray-600 mb-2">
        {fromDT && toDT ? (
            <>
            Selected (local): <code>{toLocalLabel(fromDT)}</code> →{' '}
            <code>{toLocalLabel(toDT)}</code>
            </>
        ) : (
            'Pick start & end, then click Fetch.'
        )}
        </div>

        {/* Status / Results */}
        {error && <div className="text-red-600">{error}</div>}
        {!error && !loading && rows.length === 0 && (
        <div className="text-sm">No data was found</div>
        )}

        {!error && rows.length > 0 && (
        <>
            <div className="text-xs text-gray-600 mb-2">
            Returned rows: <b>{rows.length}</b>
            </div>
            <div style={{ height: 300 }} className="mb-3">
            <Line data={chartData} options={chartOptions} />
            </div>

            {/* Debug preview (first 5 rows) */}
            <details>
            <summary className="cursor-pointer text-xs text-gray-500">
                Show first 5 rows (debug)
            </summary>
            <pre className="bg-gray-50 p-2 rounded max-h-64 overflow-auto text-xs">
    {JSON.stringify(rows.slice(0, 5), null, 2)}
            </pre>
            </details>
        </>
        )}
    </div>
    );
    };

    export default AdxSearchPV1Widget;