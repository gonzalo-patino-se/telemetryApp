// src/components/layout/NavBar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import LogoutButton from '../LogoutButton';
import ThemeToggle from '../ThemeToggle';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../styles/tokens';

const tabs = [
  { label: 'Dashboard', to: '/dashboard', end: true },
  { label: 'Events', to: '/events' },
  { label: 'Validation', to: '/validation-report' },
  { label: 'Settings', to: '/settings' },
  { label: 'About', to: '/about' },
];

const adminTab = { label: 'Administration', to: '/admin', end: false };

// Styles using design tokens for consistency
const styles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    width: '100%',
    background: 'var(--bg-surface)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `0 ${spacing.xxl}`,
  },
  brandRow: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
  },
  tabsNav: {
    display: 'flex',
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    listStyle: 'none',
    margin: 0,
    padding: '0 0 12px 0',
  },
  tabLink: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    background: 'transparent',
  },
  tabLinkHover: {
    color: 'var(--text-primary)',
    background: 'var(--bg-surface-hover)',
  },
  tabLinkActive: {
    color: 'var(--text-primary)',
    background: 'var(--bg-surface-hover)',
  },
  activeIndicator: {
    position: 'absolute' as const,
    left: '16px',
    right: '16px',
    bottom: '-4px',
    height: '2px',
    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '2px',
  },
};

const NavBar: React.FC = () => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const visibleTabs = isAdmin ? [...tabs, adminTab] : tabs;

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Brand row */}
        <div style={styles.brandRow}>
          <Logo size="md" showText={true} />
          <div style={styles.actions}>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        {/* Tabs row */}
        <nav aria-label="Primary navigation" style={styles.tabsNav}>
          <ul style={styles.tabs}>
            {visibleTabs.map(({ label, to, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onMouseEnter={() => setHoveredTab(to)}
                  onMouseLeave={() => setHoveredTab(null)}
                  style={({ isActive }) => ({
                    ...styles.tabLink,
                    ...(hoveredTab === to && !isActive ? styles.tabLinkHover : {}),
                    ...(isActive ? styles.tabLinkActive : {}),
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && <span style={styles.activeIndicator} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
