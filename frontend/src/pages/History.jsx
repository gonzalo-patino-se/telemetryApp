    // src/pages/History.jsx
    import React from 'react';
    import DashboardLayout from '../components/layout/DashboardLayout';
    import WidgetCard from '../components/layout/WidgetCard';

    export default function History() {
    return (
    <DashboardLayout title="History">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetCard title="Time Range Filters">
            <div className="space-y-4">
            <p className="text-text-secondary text-sm">Select a time range to view historical data</p>
            <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-accent-primary text-text-inverse text-sm">Last 24h</button>
                <button className="px-3 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-text-primary text-sm hover:bg-bg-surface-hover transition-colors">Last 7 days</button>
                <button className="px-3 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-text-primary text-sm hover:bg-bg-surface-hover transition-colors">Last 30 days</button>
                <button className="px-3 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-text-primary text-sm hover:bg-bg-surface-hover transition-colors">Custom</button>
            </div>
            </div>
        </WidgetCard>
        <WidgetCard title="Historical Data" isEmpty={true} emptyMessage="Select a time range and device to view historical telemetry data">
        </WidgetCard>
        </div>
    </DashboardLayout>
    );
    }