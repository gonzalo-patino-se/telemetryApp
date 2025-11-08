// src/components/DevicePV1Chart.jsx
//FIXME: Not working properly-- logic is wrong
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdxQuery } from '../hooks/useAdxQuery';

const POLL_MS = 5000;       // 5 seconds
const WINDOW_MINUTES = 15;  // show last 15 minutes
const MAX_POINTS = 2000;    // hard cap to avoid memory growth

const DevicePV1Chart = ({ serial }) => {
    const { runQuery } = useAdxQuery();
    const [points, setPoints] = useState([]); // [{ t: ISO string, v: number }]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const backoffRef = useRef(1); // for exponential backoff on errors
    const timerRef = useRef(null);

    const safeSerial = useMemo(() => serial?.trim().replace(/'/g, "''") || '', [serial]);

    const buildKql = () => (
    `Telemetry
        | where comms_serial == '${safeSerial}'
        | where name == '/INV/DCPORT/STAT/PV1/V'
        | project localtime, value_double
        | order by utctime asc`
    );

    const fetchData = async () => {
    if (!safeSerial) return;

    // Avoid polling when tab hidden
    if (document.hidden) return;

    setLoading(prev => prev || points.length === 0); // show loader on first load
    setError('');

    try {
        const kql = buildKql();
        const result = await runQuery(kql); // expect { name, kind, data: [{ utctime, value_double }, ...] }

        const rows = Array.isArray(result?.data) ? result.data : [];
        // Normalize to a simple array { t, v } with ISO timestamps
        const incoming = rows.map(r => ({
        t: typeof r.utctime === 'string' ? r.utctime : new Date(r.utctime).toISOString(),
        v: Number(r.value_double),
        })).filter(p => !Number.isNaN(p.v));

        // Deduplicate by timestamp and enforce sliding window
        setPoints(prev => {
        const map = new Map(prev.map(p => [p.t, p]));
        for (const p of incoming) map.set(p.t, p);
        let merged = Array.from(map.values()).sort((a, b) => new Date(a.t) - new Date(b.t));

        // Keep only last WINDOW_MINUTES and cap MAX_POINTS
        const minTs = Date.now() - WINDOW_MINUTES * 60 * 1000;
        merged = merged.filter(p => new Date(p.t).getTime() >= minTs);
        if (merged.length > MAX_POINTS) {
            merged = merged.slice(merged.length - MAX_POINTS);
        }
        return merged;
        });

        // reset backoff on success
        backoffRef.current = 1;
    } catch (err) {
        console.error('PV1 poll error:', err?.response || err);
        setError('Failed to load PV1 voltage.');
        // backoff (cap at 1 minute)
        backoffRef.current = Math.min(backoffRef.current * 2, 60000 / POLL_MS);
    } finally {
        setLoading(false);
    }
    };

    // Poll loop
    useEffect(() => {
    if (!safeSerial) return;

    const schedule = () => {
        const delay = POLL_MS * backoffRef.current;
        timerRef.current = window.setTimeout(async () => {
        await fetchData();
        schedule();
        }, delay);
    };

    // initial fetch immediately
    fetchData();
    schedule();

    // pause when tab hidden; resume on visible
    const handleVisibility = () => {
        if (document.hidden && timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        } else if (!document.hidden && !timerRef.current) {
        backoffRef.current = 1; // reset backoff when coming back
        fetchData();
        // restart loop
        timerRef.current = window.setTimeout(() => {
            fetchData().finally(() => { /* loop continues on next schedule */ });
        }, POLL_MS);
        }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeSerial, runQuery]);

    // Recharts expects keys that match dataKey
    const chartData = useMemo(() => (
    points.map(p => ({ time: new Date(p.t), pv1: p.v }))
    ), [points]);

    return (
    <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-2">PV1 Voltage (Last {WINDOW_MINUTES} min)</h2>

        {loading && points.length === 0 && <p>Loading…</p>}
        {!loading && error && <p className="text-red-500">{error}</p>}

        {chartData.length > 0 ? (
        <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                />
                <YAxis
                dataKey="pv1"
                unit=" V"
                tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(val) => [`${Number(val).toFixed(2)} V`, 'PV1']}
                />
                <Line
                type="monotone"
                dataKey="pv1"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
        ) : (
        !loading && !error && <p>No data in the last {WINDOW_MINUTES} minutes.</p>
        )}
    </div>
    );
};

export default DevicePV1Chart;