// src/components/dashboard.jsx
import React, { useState } from 'react';
import api from '../services/api';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './layout/WidgetCard';
import AdxSearchWifiSignalWidget from './AdxSearchWifiSignalWidget';
import AdxSearchPV1Widget from './AdxSearchPV1Widget';
import DeviceInfoWidget from './DeviceInfoWidget';

const Dashboard = () => {
    const [serial, setSerial] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // ---- Wi‑Fi widget header controls
    const [wifiAutoFetch, setWifiAutoFetch] = useState(true);
    const [wifiFetchSignal, setWifiFetchSignal] = useState(0);

    // ---- PV1 widget header controls
    const [pv1AutoFetch, setPv1AutoFetch] = useState(true);
    const [pv1FetchSignal, setPv1FetchSignal] = useState(0);

    //------Device info
    const [devInfoAutoFetch, setDevInfoAutoFetch] = useState(true);
    const [devInfoFetchSignal, setDevInfoFetchSignal] = useState(0);

    const handleSearch = async () => {
    setError('');
    setResult(null);

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
    }
    };

    return (
    <DashboardLayout title="Dashboard">
        {/* Top search row */}
        <div className="mb-4">
        <WidgetCard title="Find Device">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Enter device serial..."
                className="w-full sm:w-80 border rounded px-3 py-2"
            />
            <button
                onClick={handleSearch}
                className="inline-flex items-center justify-center rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                disabled={!serial}
            >
                Search
            </button>
            </div>

            {error && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
            </div>
            )}

        </WidgetCard>
        </div>

        {/* Responsive grid of widgets */}
        <div className="grid grid-cols-4 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Wi‑Fi Signal (ADX) with header actions */}
        <WidgetCard
            title="Wi‑Fi Signal (ADX)"
            actions={
            <div className="flex items-center gap-3">
                <label className="text-xs flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={wifiAutoFetch}
                    onChange={(e) => setWifiAutoFetch(e.target.checked)}
                />
                Auto‑fetch
                </label>
                <button
                onClick={() => setWifiFetchSignal((n) => n + 1)}
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                >
                Fetch
                </button>
            </div>
            }
        >
            <AdxSearchWifiSignalWidget
            serial={serial}
            showControls={false}
            autoFetchProp={wifiAutoFetch}
            onAutoFetchChange={setWifiAutoFetch}
            fetchSignal={wifiFetchSignal}
            />
        </WidgetCard>

        {/* PV1 Voltage (ADX) with header actions (now consistent with Wi‑Fi) */}
        <WidgetCard
            title="PV1 Voltage (ADX)"
            actions={
            <div className="flex items-center gap-3">
                <label className="text-xs flex items-center gap-1">
                <input
                    type="checkbox"
                    checked={pv1AutoFetch}
                    onChange={(e) => setPv1AutoFetch(e.target.checked)}
                />
                Auto‑fetch
                </label>
                <button
                onClick={() => setPv1FetchSignal((n) => n + 1)}
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                >
                Fetch
                </button>
            </div>
            }
        >
            <AdxSearchPV1Widget
            serial={serial}
            showControls={false}
            autoFetchProp={pv1AutoFetch}
            onAutoFetchChange={setPv1AutoFetch}
            fetchSignal={pv1FetchSignal}
            />
        </WidgetCard>

        <WidgetCard
            title="Device Info"
            actions={
                <div className= "flex items-center gap-3">
                    <label className="text-xs flex items-center gap-1">
                        <input
                            type = "checkbox"
                            checked= {devInfoAutoFetch}
                            onChange={(e) => setDevInfoAutoFetch (e.target.checked)}
                        />
                        Auto-fetch
                    </label>
                    <button
                        onClick={() => setDevInfoFetchSignal((n) => n + 1)}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">
                            Fetch
                    </button>
                </div>
            }
        >
            <DeviceInfoWidget
                serial = {serial}
                showControls ={ false }
                autoFetchProp = {devInfoAutoFetch}
                onAutoFetchChange={setDevInfoAutoFetch}
                fetchSignal={devInfoFetchSignal}
            />
        </WidgetCard>


        
        </div>
    </DashboardLayout>
    );
};

export default Dashboard;