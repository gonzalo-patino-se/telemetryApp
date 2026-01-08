// src/pages/About.tsx
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';

export default function About() {
    return (
        <DashboardLayout title="About" showFilters={false}>
            <div className="max-w-3xl space-y-6">
                <WidgetCard>
                    <div className="text-center py-6">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent-primary to-accent-cyan flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl font-bold text-white">SE</span>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Schneider Electric</h2>
                        <p className="text-text-secondary">Prosumer V1 Analytics Dashboard</p>
                        <p className="text-text-tertiary text-sm mt-4">Version 1.0.0</p>
                    </div>
                </WidgetCard>

                <WidgetCard title="About This Application">
                    <div className="prose prose-sm text-text-secondary space-y-4">
                        <p>
                            This dashboard provides real-time monitoring and analytics for Schneider Electric Prosumer V1 devices. 
                            Track device telemetry, Wi-Fi signal strength, voltage measurements, and more.
                        </p>
                        <p>
                            Built with modern technologies including React, TypeScript, Tailwind CSS, and Django REST Framework.
                            Data is queried from Azure Data Explorer (ADX) for real-time insights.
                        </p>
                    </div>
                </WidgetCard>

                <WidgetCard title="Technology Stack">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Django', 'REST Framework', 'Azure ADX', 'Recharts'].map((tech) => (
                            <div key={tech} className="p-3 rounded-lg bg-bg-primary border border-border-subtle text-center">
                                <span className="text-text-primary text-sm font-medium">{tech}</span>
                            </div>
                        ))}
                    </div>
                </WidgetCard>

                <WidgetCard title="Credits">
                    <div className="text-text-secondary text-sm">
                        <p><strong className="text-text-primary">Developed by:</strong> Gonzalo P</p>
                        <p className="mt-2"><strong className="text-text-primary">Organization:</strong> Schneider Electric</p>
                        <p className="mt-2 text-text-tertiary">© {new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </WidgetCard>
            </div>
        </DashboardLayout>
    );
}
