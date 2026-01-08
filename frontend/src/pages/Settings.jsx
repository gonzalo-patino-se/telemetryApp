// src/pages/Settings.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../styles/tokens';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '24px',
    maxWidth: '900px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    color: colors.textPrimary,
    background: colors.bgInput,
    border: '1px solid ' + colors.borderMedium,
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    color: colors.textTertiary,
    background: colors.bgInput,
    border: '1px solid ' + colors.borderSubtle,
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  themeButton: (isActive) => ({
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid ' + (isActive ? colors.accentPrimary : colors.borderSubtle),
    background: isActive ? 'rgba(59, 130, 246, 0.15)' : colors.bgInput,
    color: isActive ? colors.textPrimary : colors.textSecondary,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: colors.textPrimary,
    background: colors.bgInput,
    border: '1px solid ' + colors.borderMedium,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <DashboardLayout title="Settings" showFilters={false}>
      <div style={styles.grid}>
        <WidgetCard title="Appearance">
          <div style={styles.stack}>
            <div>
              <label style={styles.label}>Theme</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setTheme('dark')} style={styles.themeButton(theme === 'dark')}>
                  <svg style={{ width: '24px', height: '24px', margin: '0 auto 8px auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>Dark</span>
                </button>
                <button onClick={() => setTheme('light')} style={styles.themeButton(theme === 'light')}>
                  <svg style={{ width: '24px', height: '24px', margin: '0 auto 8px auto', display: 'block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>Light</span>
                </button>
              </div>
            </div>
          </div>
        </WidgetCard>

        <WidgetCard title="Notifications">
          <div style={styles.stack}>
            <label style={styles.checkbox}>
              <span style={{ color: colors.textPrimary, fontSize: '13px' }}>Email alerts</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label style={styles.checkbox}>
              <span style={{ color: colors.textPrimary, fontSize: '13px' }}>Push notifications</span>
              <input type="checkbox" />
            </label>
            <label style={styles.checkbox}>
              <span style={{ color: colors.textPrimary, fontSize: '13px' }}>Critical alerts only</span>
              <input type="checkbox" />
            </label>
          </div>
        </WidgetCard>

        <WidgetCard title="Data Refresh">
          <div style={styles.stack}>
            <div>
              <label style={styles.label}>Auto-refresh interval</label>
              <select style={styles.select}>
                <option>5 seconds</option>
                <option>15 seconds</option>
                <option>30 seconds</option>
                <option>1 minute</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>
        </WidgetCard>

        <WidgetCard title="Account">
          <div style={styles.stack}>
            <div>
              <label style={styles.label}>Username</label>
              <input type="text" placeholder="admin" disabled style={styles.input} />
            </div>
            <button style={styles.button}>Change Password</button>
          </div>
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
