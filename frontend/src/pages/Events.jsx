    // src/pages/Events.jsx
    import React from 'react';
    import DashboardLayout from '../components/layout/DashboardLayout';
    import WidgetCard from '../components/layout/WidgetCard';

    export default function Events() {
    return (
    <DashboardLayout title="Events">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <WidgetCard title="Recent events">…</WidgetCard>
        <WidgetCard title="Filters">…</WidgetCard>
        </div>
    </DashboardLayout>
    );
    }