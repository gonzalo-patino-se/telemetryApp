    // src/pages/History.jsx
    import React from 'react';
    import DashboardLayout from '../components/layout/DashboardLayout';
    import WidgetCard from '../components/layout/WidgetCard'; // optional, for consistent cards

    export default function History() {
    return (
    <DashboardLayout title="History">
        {/* Put your content in the same containers / cards you use on the dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WidgetCard title="Filters">History filters/content</WidgetCard>
        <WidgetCard title="Results">Table or charts…</WidgetCard>
        </div>
    </DashboardLayout>
    );
    }