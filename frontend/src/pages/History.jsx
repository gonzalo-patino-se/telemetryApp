// src/pages/History.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { colors, spacing, borderRadius } from '../styles/tokens';
import { useSerial } from '../context/SerialContext';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '24px',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  button: (isActive) => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid ' + (isActive ? colors.accentPrimary : colors.borderSubtle),
    background: isActive ? colors.accentPrimary : colors.bgInput,
    color: isActive ? '#ffffff' : colors.textPrimary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }),
};

export default function History() {
  const [activeRange, setActiveRange] = useState('24h');
  const { serial, hasSerial } = useSerial();

  const ranges = [
    { id: '24h', label: 'Last 24h' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <DashboardLayout title="History">
      <div style={styles.grid}>
        <WidgetCard title="Time Range Filters">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              {hasSerial 
                ? `Viewing historical data for device: ${serial}` 
                : 'Enter a serial number to view historical data'}
            </p>
            <div style={styles.buttonGroup}>
              {ranges.map(range => (
                <button
                  key={range.id}
                  onClick={() => setActiveRange(range.id)}
                  style={styles.button(activeRange === range.id)}
                  disabled={!hasSerial}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </WidgetCard>
        
        <WidgetCard 
          title="Historical Data" 
          isEmpty={!hasSerial} 
          emptyMessage={!hasSerial ? "Enter a serial number to view historical telemetry data" : "No historical data available"}
        >
          {hasSerial && (
            <p style={{ color: colors.textTertiary, fontSize: '14px', margin: 0 }}>
              Historical data will be loaded from Azure for the selected time range.
            </p>
          )}
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
