// src/components/layout/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
    title?: string;
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
    return (
    <div className="w-full">
      {/* Page header (optional) */}
        {title ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </div>
        ) : null}

      {/* Page content container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        {children}
        </div>
    </div>
    );
};

export default DashboardLayout;