// src/components/AdxSearchWidget.tsx
import React, { useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

    interface AdxSearchWidgetProps {
    serial: string; // comes from Dashboard/SearchBar
    }

    type AdxRow = {
    localtime?: string;
    value_double?: number;
    [k: string]: any;
    };

    // Escape single quotes inside user/prop strings for KQL
    function escapeKqlString(s: string) {
    return (s ?? '').replace(/'/g, "''");
    }

    // Format the query exactly like Postman, with let params and UTC timestamps
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
    | project localtime, value_double
    | order by localtime asc
    `.trim();
    }

    const AdxSearchWidget: React.FC<AdxSearchWidgetProps> = ({ serial }) => {
    const { accessToken, logout } = useAuth();

    // Use date+time selection to avoid zero-width windows
    const [fromDT, setFromDT] = useState<Date | null>(null);
    const [toDT, setToDT] = useState<Date | null>(null);

    const [rows, setRows] = useState<AdxRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canFetch = useMemo(() => {
    if (!serial || !fromDT || !toDT) return false;
    return toDT.getTime() > fromDT.getTime();
    }, [serial, fromDT, toDT]);

    const fetchData = async () => {
    if (!canFetch || !fromDT || !toDT) return;
    const kql = buildKql(serial, fromDT, toDT);

    setLoading(true);
    setError('');
    try {
        // ⚠️ If your axios baseURL does NOT include '/api', change path to '/api/query_adx/'
        const res = await api.post(
        '/query_adx/',
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
    };

    return (
    <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-3">PV Voltage (ADX)</h3>

        <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">From (local)</span>
            <DatePicker
            selected={fromDT}
            onChange={(d: Date | null) => setFromDT(d)}
            placeholderText="Start date & time"
            className="border p-2 rounded"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable
            />
        </div>
        <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">To (local)</span>
            <DatePicker
            selected={toDT}
            onChange={(d: Date | null) => setToDT(d)}
            placeholderText="End date & time"
            className="border p-2 rounded"
            showTimeSelect
            timeIntervals={15}
            dateFormat="yyyy-MM-dd HH:mm"
            isClearable
            minDate={fromDT ?? undefined}
            />
        </div>
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

        {/* Quick visibility into what you're querying */}
        <div className="text-xs text-gray-600 mb-2">
        {fromDT && toDT
            ? <>Selected (local): <code>{fromDT.toLocaleString()}</code> → <code>{toDT.toLocaleString()}</code></>
            : 'Pick start & end, then click Fetch.'}
        </div>

        {error && <div className="text-red-600">{error}</div>}

        {!error && !loading && (
        rows.length === 0 ? (
            <div>No data was found</div>
        ) : (
            <div className="text-xs">
            <div className="mb-2 text-gray-600">Returned rows: <b>{rows.length}</b></div>
            <pre className="bg-gray-50 p-2 rounded max-h-64 overflow-auto">
    {JSON.stringify(rows.slice(0, 5), null, 2)}
            </pre>
            </div>
        )
        )}
    </div>
    );
    };

export default AdxSearchWidget;