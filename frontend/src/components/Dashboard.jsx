import React, { useState } from 'react';
import api from '../services/api';
import DashboardLayout from './layout/DashboardLayout';
import WidgetCard from './layout/WidgetCard';
import AdxSearchWifiSignalWidget from './AdxSearchWifiSignalWidget';

const Dashboard = () => {
    const [serial, setSerial] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

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

            {/* Optional: show basic result preview if available */}
            {result && (
            <div className="mt-3">
                <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-3 text-xs">
                {JSON.stringify(result, null, 2)}
                </pre>
            </div>
            )}
        </WidgetCard>
        </div>

        {/* Responsive grid of widgets */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Example widget card: ADX WiFi Signal */}
        <WidgetCard title="Wi‑Fi Signal (ADX)">
            {/* NOTE: The widget currently renders its own border/padding/bg. */}
            {/* We'll keep it as-is for now to avoid behavior changes. */}
            <AdxSearchWifiSignalWidget serial={serial} />
        </WidgetCard>

        {/* Future: add more widgets here as <WidgetCard title="...">...</WidgetCard> */}
        </div>
    </DashboardLayout>
    );
};

export default Dashboard;
