// src/components/Dashboard.jsx
// Dashboard component - displays device telemetry data from Azure ADX
// All data is fetched from cloud - no mock/hardcoded values

import React, { useState } from 'react';
import api from '../services/api';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './layout/WidgetCard';
import KpiCard from './KpiCard';
import AdxSearchWifiSignalWidget from './AdxSearchWifiSignalWidget';
import AdxSearchPV1Widget from './AdxSearchPV1Widget';
import { PV2VoltageWidget, PV3VoltageWidget, PV4VoltageWidget, GridVoltageL1Widget, GridVoltageL2Widget, GridCurrentL1Widget, GridCurrentL2Widget, GridFrequencyTotalWidget } from './widgets';
import DeviceInfoWidget from './DeviceInfoWidget';
import { colors, spacing, borderRadius, typography } from '../styles/tokens';
import { formStyles, buttonStyles } from '../styles/components';
import { useSerial } from '../context/SerialContext';

const Dashboard = () => {
    // Use global serial context - persists across all tabs
    const { 
        serial: globalSerial, 
        setSerialDirect, 
        clearSerial, 
        hasSerial,
    } = useSerial();
    
    // Local input state for the search field
    const [serialInput, setSerialInput] = useState(globalSerial || '');
    // Active serial - the one we're currently displaying data for
    const [activeSerial, setActiveSerial] = useState(globalSerial || '');
    const [localError, setLocalError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState(null);

    // Widget refresh controls
    const [wifiAutoFetch, setWifiAutoFetch] = useState(true);
    const [wifiFetchSignal, setWifiFetchSignal] = useState(0);
    const [pv1AutoFetch, setPv1AutoFetch] = useState(true);
    const [pv1FetchSignal, setPv1FetchSignal] = useState(0);
    const [pv2AutoFetch, setPv2AutoFetch] = useState(true);
    const [pv2FetchSignal, setPv2FetchSignal] = useState(0);
    const [pv3AutoFetch, setPv3AutoFetch] = useState(true);
    const [pv3FetchSignal, setPv3FetchSignal] = useState(0);
    const [pv4AutoFetch, setPv4AutoFetch] = useState(true);
    const [pv4FetchSignal, setPv4FetchSignal] = useState(0);
    const [gridVoltageL1AutoFetch, setGridVoltageL1AutoFetch] = useState(true);
    const [gridVoltageL1FetchSignal, setGridVoltageL1FetchSignal] = useState(0);
    const [gridVoltageL2AutoFetch, setGridVoltageL2AutoFetch] = useState(true);
    const [gridVoltageL2FetchSignal, setGridVoltageL2FetchSignal] = useState(0);
    const [gridCurrentL1AutoFetch, setGridCurrentL1AutoFetch] = useState(true);
    const [gridCurrentL1FetchSignal, setGridCurrentL1FetchSignal] = useState(0);
    const [gridCurrentL2AutoFetch, setGridCurrentL2AutoFetch] = useState(true);
    const [gridCurrentL2FetchSignal, setGridCurrentL2FetchSignal] = useState(0);
    const [gridFrequencyTotalAutoFetch, setGridFrequencyTotalAutoFetch] = useState(true);
    const [gridFrequencyTotalFetchSignal, setGridFrequencyTotalFetchSignal] = useState(0);
    const [devInfoAutoFetch, setDevInfoAutoFetch] = useState(true);
    const [devInfoFetchSignal, setDevInfoFetchSignal] = useState(0);

    // KPI data will come from Azure ADX - null until fetched
    // These will be populated by KQL queries when serial is provided
    const [kpiData, setKpiData] = useState(null);
    
    // Computed: do we have an active serial to display?
    const hasActiveSerial = Boolean(activeSerial);

    const handleSearch = async () => {
        setLocalError('');
        setResult(null);
        setIsSearching(true);

        try {
            const response = await api.post('/search_serial/', { serial: serialInput });
            setResult(response.data);
            
            // Set the active serial immediately (local state updates synchronously)
            setActiveSerial(serialInput);
            
            // Update global context directly (no API call since we already validated)
            // This makes the serial available to other tabs
            setSerialDirect(serialInput);
            
            // Trigger all widgets to fetch data for the new serial
            // Use setTimeout to ensure state has updated before triggering
            setTimeout(() => {
                setWifiFetchSignal((n) => n + 1);
                setPv1FetchSignal((n) => n + 1);
                setPv2FetchSignal((n) => n + 1);
                setPv3FetchSignal((n) => n + 1);
                setPv4FetchSignal((n) => n + 1);
                setGridVoltageL1FetchSignal((n) => n + 1);
                setGridVoltageL2FetchSignal((n) => n + 1);
                setGridCurrentL1FetchSignal((n) => n + 1);
                setGridCurrentL2FetchSignal((n) => n + 1);
                setGridFrequencyTotalFetchSignal((n) => n + 1);
                setDevInfoFetchSignal((n) => n + 1);
            }, 100);
            
            // KPI data will be fetched from separate ADX endpoints
            // TODO: Add KQL queries for KPI metrics when provided
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setLocalError('Serial number not found.');
            } else if (err.response && err.response.status === 401) {
                setLocalError('Unauthorized. Please log in.');
            } else {
                setLocalError('Error searching serial.');
            }
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSerial = () => {
        setSerialInput('');
        setActiveSerial('');
        setResult(null);
        setLocalError('');
        setKpiData(null);
        clearSerial(); // Clear global context - resets all tabs
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && serialInput) {
            handleSearch();
        }
    };

    // Sync local input and active serial with global serial when it changes externally
    React.useEffect(() => {
        if (globalSerial && globalSerial !== serialInput) {
            setSerialInput(globalSerial);
            setActiveSerial(globalSerial);
        }
    }, [globalSerial]);

    // Styles using design tokens
    const styles = {
        kpiGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: spacing.lg,
            marginBottom: spacing.xxl,
        },
        searchSection: {
            marginBottom: spacing.xxl,
        },
        searchRow: {
            display: 'flex',
            flexDirection: 'row',
            gap: spacing.md,
            flexWrap: 'wrap',
        },
        searchInput: {
            ...formStyles.input,
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
        },
        searchButton: {
            ...buttonStyles.base,
            ...buttonStyles.primary,
            padding: '12px 20px',
        },
        chartsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: spacing.xxl,
            marginBottom: spacing.xxl,
        },
        chartContainer: {
            minHeight: '300px',
        },
        widgetActions: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
        },
        autoLabel: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: typography.fontSize.xs,
            color: colors.textTertiary,
            cursor: 'pointer',
        },
        refreshButton: {
            padding: '6px 10px',
            borderRadius: borderRadius.md,
            background: colors.bgHover,
            border: 'none',
            color: colors.textTertiary,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
        },
        errorBox: {
            marginTop: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            background: 'rgba(239, 68, 68, 0.1)',
            fontSize: typography.fontSize.sm,
            color: '#f87171',
        },
        successBox: {
            marginTop: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            background: 'rgba(16, 185, 129, 0.1)',
            fontSize: typography.fontSize.sm,
            color: '#34d399',
        },
    };

    return (
        <DashboardLayout title="Device Telemetry">
            {/* KPI Summary Section - Shows empty state until serial is provided and data fetched */}
            <div style={styles.kpiGrid}>
                <KpiCard
                    label="Active Devices"
                    value={kpiData?.activeDevices?.value || '--'}
                    trend={kpiData?.activeDevices?.trend}
                    sparklineData={kpiData?.activeDevices?.sparkline}
                    isEmpty={!hasActiveSerial || !kpiData}
                />
                <KpiCard
                    label="Healthy Status"
                    value={kpiData?.healthyDevices?.value || '--'}
                    status={kpiData?.healthyDevices?.status}
                    sparklineData={kpiData?.healthyDevices?.sparkline}
                    isEmpty={!hasActiveSerial || !kpiData}
                />
                <KpiCard
                    label="Avg Wi-Fi Signal"
                    value={kpiData?.avgRSSI?.value || '--'}
                    sparklineData={kpiData?.avgRSSI?.sparkline}
                    isEmpty={!hasActiveSerial || !kpiData}
                />
                <KpiCard
                    label="Avg Voltage"
                    value={kpiData?.avgVoltage?.value || '--'}
                    sparklineData={kpiData?.avgVoltage?.sparkline}
                    isEmpty={!hasActiveSerial || !kpiData}
                />
            </div>

            {/* Device Search Section */}
            <div style={styles.searchSection}>
                <WidgetCard title="Device Finder">
                    {hasActiveSerial && (
                        <div style={{ 
                            marginBottom: spacing.md, 
                            padding: spacing.sm, 
                            background: 'rgba(61, 205, 88, 0.1)', 
                            borderRadius: borderRadius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: colors.schneiderGreen, fontSize: typography.fontSize.sm }}>
                                <strong>Active Device:</strong> {activeSerial}
                            </span>
                            <button
                                onClick={handleClearSerial}
                                style={{
                                    padding: '4px 12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: borderRadius.sm,
                                    color: colors.statusCritical,
                                    fontSize: typography.fontSize.xs,
                                    cursor: 'pointer',
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                    <div style={styles.searchRow}>
                        <input
                            type="text"
                            value={serialInput}
                            onChange={(e) => setSerialInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter device serial number..."
                            style={styles.searchInput}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={!serialInput || isSearching}
                            style={{
                                ...styles.searchButton,
                                cursor: !serialInput || isSearching ? 'not-allowed' : 'pointer',
                                opacity: !serialInput || isSearching ? 0.5 : 1
                            }}
                        >
                            {isSearching ? (
                                <>
                                    <svg style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Find Device
                                </>
                            )}
                        </button>
                    </div>

                    {localError && (
                        <div style={styles.errorBox}>
                            <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{localError}</span>
                        </div>
                    )}

                    {result && (
                        <div style={styles.successBox}>
                            <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Device found successfully</span>
                        </div>
                    )}

                </WidgetCard>
            </div>

            {/* Telemetry Visualization Section */}
            <div style={styles.chartsGrid}>
                {/* Wi-Fi Signal */}
                <WidgetCard
                    title="Wi-Fi Signal Strength"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Wi-Fi data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={wifiAutoFetch}
                                        onChange={(e) => setWifiAutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setWifiFetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <AdxSearchWifiSignalWidget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={wifiAutoFetch}
                                onAutoFetchChange={setWifiAutoFetch}
                                fetchSignal={wifiFetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* PV1 Voltage */}
                <WidgetCard
                    title="PV1 Voltage"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view voltage data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={pv1AutoFetch}
                                        onChange={(e) => setPv1AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setPv1FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <AdxSearchPV1Widget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={pv1AutoFetch}
                                onAutoFetchChange={setPv1AutoFetch}
                                fetchSignal={pv1FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* PV2 Voltage */}
                <WidgetCard
                    title="PV2 Voltage"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view PV2 voltage data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={pv2AutoFetch}
                                        onChange={(e) => setPv2AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setPv2FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <PV2VoltageWidget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={pv2AutoFetch}
                                onAutoFetchChange={setPv2AutoFetch}
                                fetchSignal={pv2FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* PV3 Voltage */}
                <WidgetCard
                    title="PV3 Voltage"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view PV3 voltage data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={pv3AutoFetch}
                                        onChange={(e) => setPv3AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setPv3FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <PV3VoltageWidget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={pv3AutoFetch}
                                onAutoFetchChange={setPv3AutoFetch}
                                fetchSignal={pv3FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* PV4 Voltage */}
                <WidgetCard
                    title="PV4 Voltage"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view PV4 voltage data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={pv4AutoFetch}
                                        onChange={(e) => setPv4AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setPv4FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <PV4VoltageWidget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={pv4AutoFetch}
                                onAutoFetchChange={setPv4AutoFetch}
                                fetchSignal={pv4FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* Grid Voltage RMS L1 */}
                <WidgetCard
                    title="Grid Voltage RMS L1"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Grid Voltage L1 data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={gridVoltageL1AutoFetch}
                                        onChange={(e) => setGridVoltageL1AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setGridVoltageL1FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <GridVoltageL1Widget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={gridVoltageL1AutoFetch}
                                onAutoFetchChange={setGridVoltageL1AutoFetch}
                                fetchSignal={gridVoltageL1FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* Grid Voltage RMS L2 */}
                <WidgetCard
                    title="Grid Voltage RMS L2"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Grid Voltage L2 data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={gridVoltageL2AutoFetch}
                                        onChange={(e) => setGridVoltageL2AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setGridVoltageL2FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <GridVoltageL2Widget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={gridVoltageL2AutoFetch}
                                onAutoFetchChange={setGridVoltageL2AutoFetch}
                                fetchSignal={gridVoltageL2FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* Grid Current RMS L1 */}
                <WidgetCard
                    title="Grid Current RMS L1"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Grid Current L1 data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={gridCurrentL1AutoFetch}
                                        onChange={(e) => setGridCurrentL1AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setGridCurrentL1FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <GridCurrentL1Widget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={gridCurrentL1AutoFetch}
                                onAutoFetchChange={setGridCurrentL1AutoFetch}
                                fetchSignal={gridCurrentL1FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* Grid Current RMS L2 */}
                <WidgetCard
                    title="Grid Current RMS L2"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Grid Current L2 data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={gridCurrentL2AutoFetch}
                                        onChange={(e) => setGridCurrentL2AutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setGridCurrentL2FetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <GridCurrentL2Widget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={gridCurrentL2AutoFetch}
                                onAutoFetchChange={setGridCurrentL2AutoFetch}
                                fetchSignal={gridCurrentL2FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>

                {/* Grid Frequency Total */}
                <WidgetCard
                    title="Grid Frequency Total"
                    isEmpty={!hasActiveSerial}
                    emptyMessage="Enter a device serial to view Grid Frequency data"
                    actions={
                        hasActiveSerial && (
                            <div style={styles.widgetActions}>
                                <label style={styles.autoLabel}>
                                    <input
                                        type="checkbox"
                                        checked={gridFrequencyTotalAutoFetch}
                                        onChange={(e) => setGridFrequencyTotalAutoFetch(e.target.checked)}
                                        style={{ width: '14px', height: '14px' }}
                                    />
                                    Auto
                                </label>
                                <button
                                    onClick={() => setGridFrequencyTotalFetchSignal((n) => n + 1)}
                                    style={styles.refreshButton}
                                >
                                    Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {hasActiveSerial && (
                        <div style={styles.chartContainer}>
                            <GridFrequencyTotalWidget
                                serial={activeSerial}
                                showControls={false}
                                autoFetchProp={gridFrequencyTotalAutoFetch}
                                onAutoFetchChange={setGridFrequencyTotalAutoFetch}
                                fetchSignal={gridFrequencyTotalFetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>
            </div>

            {/* Device Info Section */}
            <WidgetCard
                title="Device Information"
                isEmpty={!hasActiveSerial}
                emptyMessage="Enter a device serial to view device details"
                actions={
                    hasActiveSerial && (
                        <div style={styles.widgetActions}>
                            <label style={styles.autoLabel}>
                                <input
                                    type="checkbox"
                                    checked={devInfoAutoFetch}
                                    onChange={(e) => setDevInfoAutoFetch(e.target.checked)}
                                    style={{ width: '14px', height: '14px' }}
                                />
                                Auto
                            </label>
                            <button
                                onClick={() => setDevInfoFetchSignal((n) => n + 1)}
                                style={styles.refreshButton}
                            >
                                Refresh
                            </button>
                        </div>
                    )
                }
            >
                {hasActiveSerial && (
                    <DeviceInfoWidget
                        serial={activeSerial}
                        showControls={false}
                        autoFetchProp={devInfoAutoFetch}
                        onAutoFetchChange={setDevInfoAutoFetch}
                        fetchSignal={devInfoFetchSignal}
                    />
                )}
            </WidgetCard>
        </DashboardLayout>
    );
};

export default Dashboard;