// src/pages/Firmware.jsx
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';

export default function Firmware() {
    const firmwareVersions = [
        { version: '2.4.1', status: 'current', date: 'Dec 15, 2025', notes: 'Bug fixes and performance improvements' },
        { version: '2.4.0', status: 'available', date: 'Nov 28, 2025', notes: 'New Wi-Fi diagnostics feature' },
        { version: '2.3.5', status: 'outdated', date: 'Oct 10, 2025', notes: 'Security patches' },
    ];

    const statusStyles = {
        current: { bg: 'bg-status-healthy bg-opacity-10', text: 'text-status-healthy', label: 'Current' },
        available: { bg: 'bg-status-info bg-opacity-10', text: 'text-status-info', label: 'Available' },
        outdated: { bg: 'bg-bg-input', text: 'text-text-tertiary', label: 'Outdated' },
    };

    return (
        <DashboardLayout title="Firmware Management">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <WidgetCard title="Available Firmware Versions">
                        <div className="space-y-3">
                            {firmwareVersions.map((fw, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-bg-primary border border-border-subtle hover:border-border-medium transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="text-text-primary font-mono text-lg font-semibold">v{fw.version}</div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[fw.status].bg} ${statusStyles[fw.status].text}`}>
                                            {statusStyles[fw.status].label}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-text-tertiary text-xs">{fw.date}</p>
                                        <p className="text-text-secondary text-sm mt-1">{fw.notes}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </WidgetCard>
                </div>
                <div>
                    <WidgetCard title="Update Status">
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-status-healthy bg-opacity-10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-status-healthy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-text-primary font-medium">Firmware Up to Date</p>
                            <p className="text-text-tertiary text-sm mt-1">Version 2.4.1</p>
                        </div>
                    </WidgetCard>
                </div>
            </div>
        </DashboardLayout>
    );
}
