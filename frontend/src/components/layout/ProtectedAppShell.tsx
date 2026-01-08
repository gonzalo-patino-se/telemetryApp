// src/components/layout/ProtectedAppShell.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

const ProtectedAppShell: React.FC = () => {
    return (
    <div className="min-h-dvh flex flex-col bg-bg-primary theme-transition">
      {/* Global header */}
        <NavBar />

      {/* Page content */}
        <main className="flex-1">
        {/* Optional: shared page padding. 
            If your pages already include their own containers (like DashboardLayout),
            you can keep this minimal to avoid double padding. */}
        <Outlet />
        </main>

      {/* Global footer */}
        <Footer />
    </div>
    );
};

export default ProtectedAppShell;