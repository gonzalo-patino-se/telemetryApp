    // src/pages/Events.jsx
    import React from 'react';
    import DashboardLayout from '../components/layout/DashboardLayout';
    import WidgetCard from '../components/layout/WidgetCard';

    export default function Events() {
    // Sample events data
    const events = [
        { id: 1, type: 'info', message: 'Device connected', time: '2 min ago', device: '5957226631' },
        { id: 2, type: 'warning', message: 'Low signal strength detected', time: '15 min ago', device: '5957226631' },
        { id: 3, type: 'healthy', message: 'Firmware update completed', time: '1 hour ago', device: '5957226632' },
        { id: 4, type: 'critical', message: 'Connection lost', time: '2 hours ago', device: '5957226633' },
    ];

    const typeStyles = {
        info: 'bg-status-info',
        warning: 'bg-status-warning',
        healthy: 'bg-status-healthy',
        critical: 'bg-status-critical',
    };

    return (
    <DashboardLayout title="Events">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <WidgetCard title="Recent Events">
            <div className="space-y-3">
                {events.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-border-subtle hover:border-border-medium transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${typeStyles[event.type]}`}></div>
                    <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm">{event.message}</p>
                    <p className="text-text-tertiary text-xs mt-1">Device: {event.device} • {event.time}</p>
                    </div>
                </div>
                ))}
            </div>
            </WidgetCard>
        </div>
        <div>
            <WidgetCard title="Event Filters">
            <div className="space-y-4">
                <div>
                <label className="text-text-tertiary text-xs uppercase tracking-wide block mb-2">Event Type</label>
                <select className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:border-border-focus focus:outline-none">
                    <option>All Events</option>
                    <option>Info</option>
                    <option>Warning</option>
                    <option>Critical</option>
                </select>
                </div>
                <div>
                <label className="text-text-tertiary text-xs uppercase tracking-wide block mb-2">Time Range</label>
                <select className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm focus:border-border-focus focus:outline-none">
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                </select>
                </div>
            </div>
            </WidgetCard>
        </div>
        </div>
    </DashboardLayout>
    );
    }