    // src/components/layout/NavBar.tsx
    import React from 'react';
    import { NavLink } from 'react-router-dom';
    import LogoutButton from '../LogoutButton';
    import s from './NavBar.module.css';

    const tabs = [
    { label: 'Dashboard', to: '/dashboard', end: true },
    { label: 'History',   to: '/history' },
    { label: 'Events',    to: '/events' },
    { label: 'Firmware',  to: '/firmware' },
    { label: 'Settings',  to: '/settings' },
    { label: 'About',     to: '/about' },
    ];

    const NavBar: React.FC = () => {
    return (
    <header className={s.header}>
        <div className={s.frame}>
        <div className={s.container}>
            {/* Brand row */}
            <div className={s.brandRow}>
            <div className={s.brand}>
                <div className={s.logo} aria-hidden />
                <span>IoT Dashboard</span>
            </div>
            <LogoutButton />
            </div>

            {/* Tabs row (centered to same width as page) */}
            <nav aria-label="Primary tabs" className={s.tabsNav}>
            <ul className={s.tabs}>
                {tabs.map(({ label, to, end }) => (
                <li key={to}>
                    <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                        `${s.tabLink} ${isActive ? s.active : ''}`
                    }
                    >
                    {label}
                    </NavLink>
                </li>
                ))}
            </ul>
            </nav>
        </div>
        </div>
    </header>
    );
    };

