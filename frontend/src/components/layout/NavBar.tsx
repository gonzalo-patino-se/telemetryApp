// src/components/layout/NavBar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import LogoutButton from '../LogoutButton';

type Tab = { label: string; to: string; end?: boolean };
const tabs: Tab[] = [
{ label: 'Dashboard', to: '/dashboard', end: true },
{ label: 'History',   to: '/history' },
{ label: 'Events',    to: '/events' },
{ label: 'Firmware',  to: '/firmware' },
{ label: 'Settings',  to: '/settings' },
{ label: 'About',     to: '/about' },
];

const NavBar: React.FC = () => {
const base =
'px-3 py-2 text-sm font-medium rounded-t-md transition-colors text-gray-600 hover:text-gray-900';
const active = 'text-blue-700';

return (
<header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Brand row */}
    <div className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
        <div className="h-6 w-6 rounded bg-blue-600" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">IoT Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
        <LogoutButton />
        </div>
    </div>

    {/* Tabs row */}
    <nav aria-label="Primary tabs" className="flex items-center overflow-x-auto">
        <div className="flex gap-2">
        {tabs.map(({ label, to, end }) => (
            <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => [base, isActive ? active : ''].join(' ')}
            >
            {({ isActive }) => (
                <span className="relative inline-flex flex-col items-center">
                <span>{label}</span>
                <span
                    className={[
                    'mt-2 block h-0.5 w-full rounded',
                    isActive ? 'bg-blue-600' : 'bg-transparent',
                    ].join(' ')}
                />
                </span>
            )}
            </NavLink>
        ))}
        </div>
    </nav>
    </div>
</header>
);
};

export default NavBar;