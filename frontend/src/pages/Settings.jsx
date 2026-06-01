// src/pages/Settings.jsx
//
// Settings page. Everything here is rendered with CSS variables (defined
// in src/index.css under :root / [data-theme=`light`]) so the theme switch
// produces an immediately visible change. Pages still using the hardcoded
// `colors` tokens will be migrated incrementally.
import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { useTheme } from '../context/ThemeContext';
import {
  useRefreshInterval,
  INTERVAL_LABELS,
  REFRESH_INTERVAL_OPTIONS,
} from '../context/RefreshIntervalContext';

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
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-medium)',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  themeButton: (isActive) => ({
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid ' + (isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'),
    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
  button: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-medium)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    marginTop: '6px',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { interval, setInterval } = useRefreshInterval();

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

        <WidgetCard title="Data Refresh">
          <div style={styles.stack}>
            <div>
              <label htmlFor="refresh-interval" style={styles.label}>
                Auto-refresh interval
              </label>
              <select
                id="refresh-interval"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                style={styles.select}
              >
                {REFRESH_INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {INTERVAL_LABELS[opt]}
                  </option>
                ))}
              </select>
              <div style={styles.hint}>
                Choose how often dashboard widgets and the events table
                should re-query Azure Data Explorer. Saved automatically.
              </div>
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