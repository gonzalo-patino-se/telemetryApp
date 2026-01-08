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
            <label className="text-text-secondary text-xs flex items-center gap-1.5 cursor-pointer">
            <input
                type="checkbox"
                checked={autoFetch}
                onChange={(e) => {
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

        {/* Body */}
        {loading && (
            <div className="flex items-center gap-2 text-text-secondary">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading device info...</span>
            </div>
        )}
        {error && <p className="text-status-critical text-sm">{error}</p>}

        {data && Array.isArray(data.data) && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-bg-primary border border-border-subtle">
                <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Serial</p>
                <p className="text-text-primary font-mono">{data.data[0].device_serial}</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-primary border border-border-subtle">
                <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">MAC Address</p>
                <p className="text-text-primary font-mono">{data.data[0].mac_address}</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-primary border border-border-subtle">
                <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Firmware</p>
                <p className="text-text-primary">{data.data[0].firmware_version}</p>
            </div>
            <div className="p-3 rounded-lg bg-bg-primary border border-border-subtle">
                <p className="text-text-tertiary text-xs uppercase tracking-wide mb-1">Local Time</p>
                <p className="text-text-primary">
                    {data.data[0].localtime ? new Date(data.data[0].localtime).toLocaleString() : '—'}
                </p>
            </div>
        </div>
        ) : (
        !loading && <p className="text-text-tertiary text-sm">No device data available.</p>
        )}
    </>
    );
    };

    export default DeviceInfoWidget;