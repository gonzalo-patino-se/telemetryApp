    // src/components/DeviceInfoWidget.jsx
    import React, { useEffect, useState } from 'react';
    import { useAdxQuery } from '../hooks/useAdxQuery';

    /**
     * Uniform widget props so actions can live in the WidgetCard header.
     * - showControls: if true, widget renders its own "Auto‑fetch / Fetch" inline controls.
     *                 When false, controls are expected to be provided in the card header.
     * - autoFetchProp: parent-controlled Auto‑fetch toggle (optional).
     * - onAutoFetchChange: callback when auto-fetch changes (only relevant when parent controls).
     * - fetchSignal: bump this number from parent to trigger a fetch on demand.
     */
    const DeviceInfoWidget = ({
    serial,
    showControls = true,
    autoFetchProp,
    onAutoFetchChange,
    fetchSignal,
    }) => {
    const { runQuery } = useAdxQuery();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Keep support for internal auto-fetch if parent doesn't control it.
    // Using "true" preserves the prior behavior: fetch automatically when serial changes.
    const [autoFetchInternal, setAutoFetchInternal] = useState(true);
    const autoFetch = autoFetchProp ?? autoFetchInternal;

    const canFetch = Boolean(serial && typeof serial === 'string' && serial.trim() !== '');

    const buildKql = (s) =>
    `DevInfo | where comms_serial contains '${(s ?? '').replace(/'/g, "''")}' | limit 1`;

    const fetchData = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError('');
    try {
        const kql = buildKql(serial);
        const result = await runQuery(kql);
        // console.debug('DeviceInfoWidget Query Result:', result);
        setData(result);
    } catch (err) {
        setError('Failed to load device info.');
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

    // Auto‑fetch when serial changes (if enabled)
    useEffect(() => {
    if (!autoFetch || !canFetch) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serial, autoFetch]);

    // Parent-triggered fetch via fetchSignal bumps
    useEffect(() => {
    if (fetchSignal === undefined) return;
    if (!canFetch) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchSignal]);

    // ---- UI (no outer card container/title; WidgetCard provides surface)
    return (
    <>
        {/* Optional inline controls — hidden when header actions are used */}
        {showControls && (
        <div className="mb-3 flex items-center gap-2">
            <label className="text-xs flex items-center gap-1">
            <input
                type="checkbox"
                checked={autoFetch}
                onChange={(e) => {
                onAutoFetchChange?.(e.target.checked);
                if (autoFetchProp === undefined) setAutoFetchInternal(e.target.checked);
                }}
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
        )}

        {/* Body */}
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {data && Array.isArray(data.data) && data.data.length > 0 ? (
        <>
            <p>
            <strong>Serial:</strong> {data.data[0].device_serial}
            </p>
            <p>
            <strong>MAC:</strong> {data.data[0].mac_address}
            </p>
            <p>
            <strong>Firmware:</strong> {data.data[0].firmware_version}
            </p>
            <p>
            <strong>Local Time:</strong>{' '}
            {data.data[0].localtime ? new Date(data.data[0].localtime).toLocaleString() : '—'}
            </p>
        </>
        ) : (
        !loading && <p>No data available.</p>
        )}
    </>
    );
    };

    export default DeviceInfoWidget;