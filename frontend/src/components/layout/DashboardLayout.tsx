import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

interface DashboardLayoutProps {
    title?: string;
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
    return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
        <NavBar />
        <main className="flex-1">
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
        </main>
        <Footer />
    </div>
    );
};


export default DashboardLayout;

