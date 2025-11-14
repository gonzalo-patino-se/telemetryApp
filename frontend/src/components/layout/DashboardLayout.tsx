// src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
title?: string;
toolbar?: React.ReactNode;   // optional right-side actions next to the title
children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, toolbar, children }) => {
return (
<div className="w-full">
    {/* Page header (matches dashboard look) */}
    {(title || toolbar) && (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between gap-4">
        {title ? (
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">{title}</h1>
        ) : (
            <div />
        )}
        {toolbar ?? null}
        </div>
        {/* subtle divider like in your screenshot */}
        <div className="mt-3 h-px bg-white/10" />
    </div>
    )}

    {/* Page body container (same width/paddings as dashboard) */}
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
    {children}
    </div>
</div>
);
};

export default DashboardLayout;