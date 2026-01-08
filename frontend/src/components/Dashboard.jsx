// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './layout/WidgetCard';
import KpiCard from './KpiCard';
import AdxSearchWifiSignalWidget from './AdxSearchWifiSignalWidget';
import AdxSearchPV1Widget from './AdxSearchPV1Widget';
import DeviceInfoWidget from './DeviceInfoWidget';

const Dashboard = () => {
    const [serial, setSerial] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Wi‑Fi widget controls
    const [wifiAutoFetch, setWifiAutoFetch] = useState(true);
    const [wifiFetchSignal, setWifiFetchSignal] = useState(0);

    // PV1 widget controls
    const [pv1AutoFetch, setPv1AutoFetch] = useState(true);
    const [pv1FetchSignal, setPv1FetchSignal] = useState(0);

    // Device info controls
    const [devInfoAutoFetch, setDevInfoAutoFetch] = useState(true);
    const [devInfoFetchSignal, setDevInfoFetchSignal] = useState(0);

    // Mock KPI data - replace with real API calls
    const kpiData = {
        activeDevices: { value: '1,247', trend: { value: 12, direction: 'up' }, sparkline: [45, 52, 48, 61, 55, 67, 72, 68, 75] },
        healthyDevices: { value: '98.2%', status: 'healthy', sparkline: [95, 96, 97, 96, 98, 97, 99, 98, 98] },
        avgRSSI: { value: '-52 dBm', sparkline: [-55, -53, -54, -51, -52, -50, -51, -52, -52] },
        avgVoltage: { value: '240.8V', sparkline: [238, 239, 240, 241, 240, 241, 240, 241, 241] }
    };

    const handleSearch = async () => {
        setError('');
        setResult(null);
        setIsSearching(true);

        try {
            const response = await api.post('/search_serial/', { serial });
            setResult(response.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Serial number not found.');
            } else if (err.response && err.response.status === 401) {
                setError('Unauthorized. Please log in.');
            } else {
                setError('Error searching serial.');
            }
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && serial) {
            handleSearch();
        }
    };

    return (
        <DashboardLayout title="Device Telemetry">
            {/* KPI Summary Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <KpiCard
                    label="Active Devices"
                    value={kpiData.activeDevices.value}
                    trend={kpiData.activeDevices.trend}
                    sparklineData={kpiData.activeDevices.sparkline}
                />
                <KpiCard
                    label="Healthy Status"
                    value={kpiData.healthyDevices.value}
                    status={kpiData.healthyDevices.status}
                    sparklineData={kpiData.healthyDevices.sparkline}
                />
                <KpiCard
                    label="Avg Wi-Fi Signal"
                    value={kpiData.avgRSSI.value}
                    sparklineData={kpiData.avgRSSI.sparkline}
                />
                <KpiCard
                    label="Avg Voltage"
                    value={kpiData.avgVoltage.value}
                    sparklineData={kpiData.avgVoltage.sparkline}
                />
            </div>

            {/* Device Search Section */}
            <div style={{ marginBottom: '24px' }}>
                <WidgetCard title="Device Finder">
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter device serial number..."
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '12px',
                                color: '#f1f5f9',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={!serial || isSearching}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: !serial || isSearching ? 'not-allowed' : 'pointer',
                                opacity: !serial || isSearching ? 0.5 : 1
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

                    {error && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '13px', color: '#f87171' }}>
                            <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {result && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', fontSize: '13px', color: '#34d399' }}>
                            <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Device found successfully</span>
                        </div>
                    )}
                </WidgetCard>
            </div>

            {/* Telemetry Visualization Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Wi‑Fi Signal */}
                <WidgetCard
                    title="Wi‑Fi Signal Strength"
                    isEmpty={!serial}
                    emptyMessage="Enter a device serial to view Wi-Fi data"
                    actions={
                        serial && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
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
                                    style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                    ⟳ Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {serial && (
                        <div style={{ minHeight: '300px' }}>
                            <AdxSearchWifiSignalWidget
                                serial={serial}
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
                    isEmpty={!serial}
                    emptyMessage="Enter a device serial to view voltage data"
                    actions={
                        serial && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
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
                                    style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                                >
                                    ⟳ Refresh
                                </button>
                            </div>
                        )
                    }
                >
                    {serial && (
                        <div style={{ minHeight: '300px' }}>
                            <AdxSearchPV1Widget
                                serial={serial}
                                showControls={false}
                                autoFetchProp={pv1AutoFetch}
                                onAutoFetchChange={setPv1AutoFetch}
                                fetchSignal={pv1FetchSignal}
                            />
                        </div>
                    )}
                </WidgetCard>
            </div>

            {/* Device Info Section */}
            <WidgetCard
                title="Device Information"
                isEmpty={!serial}
                emptyMessage="Enter a device serial to view device details"
                actions={
                    serial && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
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
                                style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                            >
                                ⟳ Refresh
                            </button>
                        </div>
                    )
                }
            >
                {serial && (
                    <DeviceInfoWidget
                        serial={serial}
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