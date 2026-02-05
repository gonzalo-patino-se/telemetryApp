    // src/components/DeviceInfoWidget.jsx
    import React, { useEffect, useState } from 'react';
    import { useAdxQuery } from '../hooks/useAdxQuery';
    import { colors, spacing, borderRadius, typography } from '../styles/tokens';

    // CSV export helper
    function downloadCsv(data, filename) {
        if (!data || !Array.isArray(data.data) || !data.data.length) return;
        const row = data.data[0];
        const headers = Object.keys(row);
        const csvRows = [
            headers.join(','),
            headers.map(h => {
                const val = row[h];
                // Escape values that contain commas or quotes
                if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val ?? '';
            }).join(',')
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

    // Styles using design tokens
    const styles = {
        controlsRow: {
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
        },
        checkboxLabel: {
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
        },
        checkbox: {
            width: '14px',
            height: '14px',
        },
        fetchButton: {
            padding: '6px 12px',
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        fetchButtonEnabled: {
            background: colors.accentPrimary,
            color: 'white',
        },
        fetchButtonDisabled: {
            background: colors.bgInput,
            color: colors.textTertiary,
            cursor: 'not-allowed',
        },
        loadingContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            color: colors.textSecondary,
        },
        spinner: {
            width: '16px',
            height: '16px',
            animation: 'spin 1s linear infinite',
        },
        errorText: {
            color: colors.statusCritical,
            fontSize: typography.fontSize.sm,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing.md,
        },
        infoCard: {
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            background: colors.bgInput,
            border: `1px solid ${colors.borderSubtle}`,
        },
        infoLabel: {
            color: colors.textTertiary,
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px',
        },
        infoValue: {
            color: colors.textPrimary,
            fontSize: typography.fontSize.sm,
            fontFamily: 'monospace',
        },
        emptyText: {
            color: colors.textTertiary,
            fontSize: typography.fontSize.sm,
        },
    };

    /**
     * Uniform widget props so actions can live in the WidgetCard header.
     * - showControls: if true, widget renders its own "Auto‑fetch / Fetch" inline controls.
     *                 When false, controls are expected to be provided in the card header.
     * - autoFetchProp: parent-controlled Auto‑fetch toggle (optional).
     * - onAutoFetchChange: callback when auto-fetch changes (only relevant when parent controls).
     * - fetchSignal: bump this number from parent to trigger a fetch on demand.
     * - onDataLoaded: callback when data is loaded, passes the data to parent.
     */
    const DeviceInfoWidget = ({
    serial,
    showControls = true,
    autoFetchProp,
    onAutoFetchChange,
    fetchSignal,
    onDataLoaded,
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
        // Notify parent about loaded data (for PDF export)
        if (onDataLoaded && result) {
            onDataLoaded(result);
        }
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
        <div style={styles.controlsRow}>
            <label style={styles.checkboxLabel}>
            <input
                type="checkbox"
                checked={autoFetch}
                onChange={(e) => {
                onAutoFetchChange?.(e.target.checked);
                if (autoFetchProp === undefined) setAutoFetchInternal(e.target.checked);
                }}
                style={styles.checkbox}
            />
            Auto‑fetch on change
            </label>
            <button
            onClick={fetchData}
            disabled={!canFetch || loading}
            style={{
                ...styles.fetchButton,
                ...(canFetch && !loading ? styles.fetchButtonEnabled : styles.fetchButtonDisabled),
            }}
            >
            {loading ? 'Fetching…' : 'Fetch'}
            </button>
        </div>
        )}

        {/* Body */}
        {loading && (
            <div style={styles.loadingContainer}>
                <svg style={styles.spinner} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading device info...</span>
            </div>
        )}
        {error && <p style={styles.errorText}>{error}</p>}

        {data && Array.isArray(data.data) && data.data.length > 0 ? (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
                <button
                    onClick={() => downloadCsv(data, `device_info_${serial}_${new Date().toISOString().slice(0,10)}.csv`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        fontSize: typography.fontSize.xs,
                        border: `1px solid ${colors.borderDefault}`,
                        borderRadius: borderRadius.md,
                        color: colors.textSecondary,
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
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
            <div style={styles.grid}>
                <div style={styles.infoCard}>
                    <p style={styles.infoLabel}>Serial</p>
                    <p style={styles.infoValue}>{data.data[0].device_serial || '—'}</p>
                </div>
                <div style={styles.infoCard}>
                    <p style={styles.infoLabel}>MAC Address</p>
                    <p style={styles.infoValue}>{data.data[0].mac_address || '—'}</p>
                </div>
                <div style={styles.infoCard}>
                    <p style={styles.infoLabel}>Firmware</p>
                    <p style={{ ...styles.infoValue, fontFamily: 'inherit' }}>{data.data[0].firmware_version || '—'}</p>
                </div>
                <div style={styles.infoCard}>
                    <p style={styles.infoLabel}>Local Time</p>
                    <p style={{ ...styles.infoValue, fontFamily: 'inherit' }}>
                        {data.data[0].localtime ? new Date(data.data[0].localtime).toLocaleString() : '—'}
                    </p>
                </div>
            </div>
        </>
        ) : (
        !loading && <p style={styles.emptyText}>No device data available.</p>
        )}
    </>
    );
    };

    export default DeviceInfoWidget;