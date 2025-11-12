import React from 'react';
import LogoutButton from '../LogoutButton';

const NavBar: React.FC = () => {
    return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-blue-600" aria-hidden />
            <span className="text-sm font-semibold tracking-wide">IoT Dashboard</span>
        </div>

        {/* Right section: global actions */}
        <div className="flex items-center gap-3">
            {/* Placeholder for future nav/filters */}
            <LogoutButton />
        </div>
        </div>
    </header>
    );
};

export default NavBar;