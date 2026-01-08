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
import { PV2VoltageWidget, PV3VoltageWidget, PV4VoltageWidget, GridVoltageL1Widget, GridVoltageL2Widget, GridCurrentL1Widget, GridCurrentL2Widget, GridFrequencyTotalWidget, Battery1VoltageWidget, Battery1TempWidget, Battery1SoCWidget, Battery1CurrentWidget, Battery2VoltageWidget, Battery2TempWidget, Battery2SoCWidget, Battery2CurrentWidget, Battery3VoltageWidget, Battery3TempWidget, Battery3SoCWidget, Battery3CurrentWidget, BatteryMainRelayWidget, LoadVoltageL1Widget, LoadVoltageL2Widget, LoadFrequencyTotalWidget } from './widgets';
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
    // Battery Module 1
    const [battery1VoltageAutoFetch, setBattery1VoltageAutoFetch] = useState(true);
    const [battery1VoltageFetchSignal, setBattery1VoltageFetchSignal] = useState(0);
    const [battery1TempAutoFetch, setBattery1TempAutoFetch] = useState(true);
    const [battery1TempFetchSignal, setBattery1TempFetchSignal] = useState(0);
    const [battery1SoCAutoFetch, setBattery1SoCAutoFetch] = useState(true);
    const [battery1SoCFetchSignal, setBattery1SoCFetchSignal] = useState(0);
    const [battery1CurrentAutoFetch, setBattery1CurrentAutoFetch] = useState(true);
    const [battery1CurrentFetchSignal, setBattery1CurrentFetchSignal] = useState(0);
    // Battery Module 2
    const [battery2VoltageAutoFetch, setBattery2VoltageAutoFetch] = useState(true);
    const [battery2VoltageFetchSignal, setBattery2VoltageFetchSignal] = useState(0);
    const [battery2TempAutoFetch, setBattery2TempAutoFetch] = useState(true);
    const [battery2TempFetchSignal, setBattery2TempFetchSignal] = useState(0);
    const [battery2SoCAutoFetch, setBattery2SoCAutoFetch] = useState(true);
    const [battery2SoCFetchSignal, setBattery2SoCFetchSignal] = useState(0);
    const [battery2CurrentAutoFetch, setBattery2CurrentAutoFetch] = useState(true);
    const [battery2CurrentFetchSignal, setBattery2CurrentFetchSignal] = useState(0);
    // Battery Module 3
    const [battery3VoltageAutoFetch, setBattery3VoltageAutoFetch] = useState(true);
    const [battery3VoltageFetchSignal, setBattery3VoltageFetchSignal] = useState(0);
    const [battery3TempAutoFetch, setBattery3TempAutoFetch] = useState(true);
    const [battery3TempFetchSignal, setBattery3TempFetchSignal] = useState(0);
    const [battery3SoCAutoFetch, setBattery3SoCAutoFetch] = useState(true);
    const [battery3SoCFetchSignal, setBattery3SoCFetchSignal] = useState(0);
    const [battery3CurrentAutoFetch, setBattery3CurrentAutoFetch] = useState(true);
    const [battery3CurrentFetchSignal, setBattery3CurrentFetchSignal] = useState(0);
    // Battery Main Relay
    const [batteryMainRelayAutoFetch, setBatteryMainRelayAutoFetch] = useState(true);
    const [batteryMainRelayFetchSignal, setBatteryMainRelayFetchSignal] = useState(0);
    // Load Measurements (Fast Telemetry)
    const [loadVoltageL1AutoFetch, setLoadVoltageL1AutoFetch] = useState(true);
    const [loadVoltageL1FetchSignal, setLoadVoltageL1FetchSignal] = useState(0);
    const [loadVoltageL2AutoFetch, setLoadVoltageL2AutoFetch] = useState(true);
    const [loadVoltageL2FetchSignal, setLoadVoltageL2FetchSignal] = useState(0);
    const [loadFrequencyTotalAutoFetch, setLoadFrequencyTotalAutoFetch] = useState(true);
    const [loadFrequencyTotalFetchSignal, setLoadFrequencyTotalFetchSignal] = useState(0);
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
            
            // Staggered widget fetching for better performance
            // Batch 1: Most important widgets (immediate)
            setTimeout(() => {
                setWifiFetchSignal((n) => n + 1);
                setPv1FetchSignal((n) => n + 1);
                setDevInfoFetchSignal((n) => n + 1);
            }, 50);
            
            // Batch 2: PV widgets (100ms delay)
            setTimeout(() => {
                setPv2FetchSignal((n) => n + 1);
                setPv3FetchSignal((n) => n + 1);
                setPv4FetchSignal((n) => n + 1);
            }, 150);
            
            // Batch 3: Grid widgets (200ms delay)
            setTimeout(() => {
                setGridVoltageL1FetchSignal((n) => n + 1);
                setGridVoltageL2FetchSignal((n) => n + 1);
                setGridCurrentL1FetchSignal((n) => n + 1);
                setGridCurrentL2FetchSignal((n) => n + 1);
                setGridFrequencyTotalFetchSignal((n) => n + 1);
            }, 250);
            
            // Batch 4: Battery Module 1 (350ms delay)
            setTimeout(() => {
                setBattery1VoltageFetchSignal((n) => n + 1);
                setBattery1TempFetchSignal((n) => n + 1);
                setBattery1SoCFetchSignal((n) => n + 1);
                setBattery1CurrentFetchSignal((n) => n + 1);
            }, 400);
            
            // Batch 5: Battery Module 2 (500ms delay)
            setTimeout(() => {
                setBattery2VoltageFetchSignal((n) => n + 1);
                setBattery2TempFetchSignal((n) => n + 1);
                setBattery2SoCFetchSignal((n) => n + 1);
                setBattery2CurrentFetchSignal((n) => n + 1);
            }, 550);
            
            // Batch 6: Battery Module 3 (650ms delay)
            setTimeout(() => {
                setBattery3VoltageFetchSignal((n) => n + 1);
                setBattery3TempFetchSignal((n) => n + 1);
                setBattery3SoCFetchSignal((n) => n + 1);
                setBattery3CurrentFetchSignal((n) => n + 1);
            }, 700);
            
            // Batch 7: Battery Main Relay + Fast Telemetry (850ms delay)
            setTimeout(() => {
                setBatteryMainRelayFetchSignal((n) => n + 1);
                setLoadVoltageL1FetchSignal((n) => n + 1);
                setLoadVoltageL2FetchSignal((n) => n + 1);
                setLoadFrequencyTotalFetchSignal((n) => n + 1);
            }, 850);
            
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
        // Improved responsive grid for widget cards
        chartsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: spacing.lg,
            marginBottom: spacing.lg,
        },
        // 2-column grid for paired widgets (L1/L2, etc.)
        chartsGridPaired: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: spacing.lg,
            marginBottom: spacing.lg,
        },
        // 4-column grid for battery modules
        chartsGridBattery: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: spacing.md,
            marginBottom: spacing.lg,
        },
        chartContainer: {
            minHeight: '280px',
        },
        // Section headers for grouping
        sectionHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.lg,
            marginTop: spacing.xxl,
            paddingBottom: spacing.sm,
            borderBottom: `1px solid ${colors.borderSubtle}`,
        },
        sectionTitle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
            margin: 0,
        },
        sectionIcon: {
            width: '24px',
            height: '24px',
            color: colors.schneiderGreen,
        },
        sectionBadge: {
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.textTertiary,
            background: colors.bgHover,
            padding: '2px 8px',
            borderRadius: borderRadius.full,
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

    // Helper to render a widget card with standard props
    const renderWidgetCard = (title, Widget, autoFetch, setAutoFetch, fetchSignal, setFetchSignal) => (
        <WidgetCard
            title={title}
            isEmpty={!hasActiveSerial}
            emptyMessage="Enter a device serial"
            actions={hasActiveSerial && (
                <div style={styles.widgetActions}>
                    <label style={styles.autoLabel}>
                        <input type="checkbox" checked={autoFetch} onChange={(e) => setAutoFetch(e.target.checked)} style={{ width: '14px', height: '14px' }} />
                        Auto
                    </label>
                    <button onClick={() => setFetchSignal((n) => n + 1)} style={styles.refreshButton}>Refresh</button>
                </div>
            )}
        >
            {hasActiveSerial && (
                <div style={styles.chartContainer}>
                    <Widget serial={activeSerial} showControls={false} autoFetchProp={autoFetch} onAutoFetchChange={setAutoFetch} fetchSignal={fetchSignal} />
                </div>
            )}
        </WidgetCard>
    );

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

            {/* ==================== SYSTEM STATUS ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <h2 style={styles.sectionTitle}>System Status</h2>
                <span style={styles.sectionBadge}>1 widget</span>
            </div>
            <div style={styles.chartsGrid}>
                {renderWidgetCard("Wi-Fi Signal Strength", AdxSearchWifiSignalWidget, wifiAutoFetch, setWifiAutoFetch, wifiFetchSignal, setWifiFetchSignal)}
            </div>

            {/* ==================== SOLAR PV INPUTS ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h2 style={styles.sectionTitle}>Solar PV Inputs</h2>
                <span style={styles.sectionBadge}>4 channels</span>
            </div>
            <div style={styles.chartsGridPaired}>
                {renderWidgetCard("PV1 Voltage", AdxSearchPV1Widget, pv1AutoFetch, setPv1AutoFetch, pv1FetchSignal, setPv1FetchSignal)}
                {renderWidgetCard("PV2 Voltage", PV2VoltageWidget, pv2AutoFetch, setPv2AutoFetch, pv2FetchSignal, setPv2FetchSignal)}
                {renderWidgetCard("PV3 Voltage", PV3VoltageWidget, pv3AutoFetch, setPv3AutoFetch, pv3FetchSignal, setPv3FetchSignal)}
                {renderWidgetCard("PV4 Voltage", PV4VoltageWidget, pv4AutoFetch, setPv4AutoFetch, pv4FetchSignal, setPv4FetchSignal)}
            </div>

            {/* ==================== GRID MEASUREMENTS ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 style={styles.sectionTitle}>Grid Measurements</h2>
                <span style={styles.sectionBadge}>5 parameters</span>
            </div>
            <div style={styles.chartsGridPaired}>
                {renderWidgetCard("Grid Voltage L1", GridVoltageL1Widget, gridVoltageL1AutoFetch, setGridVoltageL1AutoFetch, gridVoltageL1FetchSignal, setGridVoltageL1FetchSignal)}
                {renderWidgetCard("Grid Voltage L2", GridVoltageL2Widget, gridVoltageL2AutoFetch, setGridVoltageL2AutoFetch, gridVoltageL2FetchSignal, setGridVoltageL2FetchSignal)}
                {renderWidgetCard("Grid Current L1", GridCurrentL1Widget, gridCurrentL1AutoFetch, setGridCurrentL1AutoFetch, gridCurrentL1FetchSignal, setGridCurrentL1FetchSignal)}
                {renderWidgetCard("Grid Current L2", GridCurrentL2Widget, gridCurrentL2AutoFetch, setGridCurrentL2AutoFetch, gridCurrentL2FetchSignal, setGridCurrentL2FetchSignal)}
                {renderWidgetCard("Grid Frequency", GridFrequencyTotalWidget, gridFrequencyTotalAutoFetch, setGridFrequencyTotalAutoFetch, gridFrequencyTotalFetchSignal, setGridFrequencyTotalFetchSignal)}
            </div>

            {/* ==================== LOAD MEASUREMENTS (FAST TELEMETRY) ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 style={styles.sectionTitle}>Load Measurements</h2>
                <span style={styles.sectionBadge}>Fast Telemetry</span>
            </div>
            <div style={styles.chartsGridPaired}>
                {renderWidgetCard("Load Voltage L1", LoadVoltageL1Widget, loadVoltageL1AutoFetch, setLoadVoltageL1AutoFetch, loadVoltageL1FetchSignal, setLoadVoltageL1FetchSignal)}
                {renderWidgetCard("Load Voltage L2", LoadVoltageL2Widget, loadVoltageL2AutoFetch, setLoadVoltageL2AutoFetch, loadVoltageL2FetchSignal, setLoadVoltageL2FetchSignal)}
                {renderWidgetCard("Load Frequency", LoadFrequencyTotalWidget, loadFrequencyTotalAutoFetch, setLoadFrequencyTotalAutoFetch, loadFrequencyTotalFetchSignal, setLoadFrequencyTotalFetchSignal)}
            </div>

            {/* ==================== BATTERY MODULE 1 ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 12h6m-3-3v6" />
                </svg>
                <h2 style={styles.sectionTitle}>Battery Module 1</h2>
                <span style={styles.sectionBadge}>4 parameters</span>
            </div>
            <div style={styles.chartsGridBattery}>
                {renderWidgetCard("Voltage", Battery1VoltageWidget, battery1VoltageAutoFetch, setBattery1VoltageAutoFetch, battery1VoltageFetchSignal, setBattery1VoltageFetchSignal)}
                {renderWidgetCard("Temperature", Battery1TempWidget, battery1TempAutoFetch, setBattery1TempAutoFetch, battery1TempFetchSignal, setBattery1TempFetchSignal)}
                {renderWidgetCard("State of Charge", Battery1SoCWidget, battery1SoCAutoFetch, setBattery1SoCAutoFetch, battery1SoCFetchSignal, setBattery1SoCFetchSignal)}
                {renderWidgetCard("Current", Battery1CurrentWidget, battery1CurrentAutoFetch, setBattery1CurrentAutoFetch, battery1CurrentFetchSignal, setBattery1CurrentFetchSignal)}
            </div>

            {/* ==================== BATTERY MODULE 2 ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 12h6m-3-3v6" />
                </svg>
                <h2 style={styles.sectionTitle}>Battery Module 2</h2>
                <span style={styles.sectionBadge}>4 parameters</span>
            </div>
            <div style={styles.chartsGridBattery}>
                {renderWidgetCard("Voltage", Battery2VoltageWidget, battery2VoltageAutoFetch, setBattery2VoltageAutoFetch, battery2VoltageFetchSignal, setBattery2VoltageFetchSignal)}
                {renderWidgetCard("Temperature", Battery2TempWidget, battery2TempAutoFetch, setBattery2TempAutoFetch, battery2TempFetchSignal, setBattery2TempFetchSignal)}
                {renderWidgetCard("State of Charge", Battery2SoCWidget, battery2SoCAutoFetch, setBattery2SoCAutoFetch, battery2SoCFetchSignal, setBattery2SoCFetchSignal)}
                {renderWidgetCard("Current", Battery2CurrentWidget, battery2CurrentAutoFetch, setBattery2CurrentAutoFetch, battery2CurrentFetchSignal, setBattery2CurrentFetchSignal)}
            </div>

            {/* ==================== BATTERY MODULE 3 ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 12h6m-3-3v6" />
                </svg>
                <h2 style={styles.sectionTitle}>Battery Module 3</h2>
                <span style={styles.sectionBadge}>4 parameters</span>
            </div>
            <div style={styles.chartsGridBattery}>
                {renderWidgetCard("Voltage", Battery3VoltageWidget, battery3VoltageAutoFetch, setBattery3VoltageAutoFetch, battery3VoltageFetchSignal, setBattery3VoltageFetchSignal)}
                {renderWidgetCard("Temperature", Battery3TempWidget, battery3TempAutoFetch, setBattery3TempAutoFetch, battery3TempFetchSignal, setBattery3TempFetchSignal)}
                {renderWidgetCard("State of Charge", Battery3SoCWidget, battery3SoCAutoFetch, setBattery3SoCAutoFetch, battery3SoCFetchSignal, setBattery3SoCFetchSignal)}
                {renderWidgetCard("Current", Battery3CurrentWidget, battery3CurrentAutoFetch, setBattery3CurrentAutoFetch, battery3CurrentFetchSignal, setBattery3CurrentFetchSignal)}
            </div>

            {/* ==================== BATTERY SYSTEM STATUS ==================== */}
            <div style={styles.sectionHeader}>
                <svg style={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 style={styles.sectionTitle}>Battery System Status</h2>
                <span style={styles.sectionBadge}>Alarms</span>
            </div>
            <div style={styles.chartsGrid}>
                {renderWidgetCard("Main Relay Status", BatteryMainRelayWidget, batteryMainRelayAutoFetch, setBatteryMainRelayAutoFetch, batteryMainRelayFetchSignal, setBatteryMainRelayFetchSignal)}
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