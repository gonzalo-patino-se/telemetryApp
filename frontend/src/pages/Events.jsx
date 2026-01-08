// src/pages/Events.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { colors, spacing, borderRadius, typography } from '../styles/tokens';
import { useSerial } from '../context/SerialContext';

const styles = {
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: '24px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    background: colors.bgInput,
    border: '1px solid ' + colors.borderSubtle,
    transition: 'all 0.2s ease',
    cursor: 'default',
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
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
};

const getStatusDot = (type) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  marginTop: '6px',
  flexShrink: 0,
  background: type === 'info' ? colors.statusInfo
    : type === 'warning' ? colors.statusWarning
    : type === 'healthy' ? colors.statusHealthy
    : type === 'critical' ? colors.statusCritical
    : colors.statusInfo,
});

export default function Events() {
  const [hoveredId, setHoveredId] = useState(null);
  const { serial, hasSerial } = useSerial();

  // Events will be fetched from Azure based on serial number
  // Empty array when no serial is provided
  const events = hasSerial ? [] : [];

  return (
    <DashboardLayout title="Events">
      <div style={styles.gridTwoCols}>
        <WidgetCard 
          title="Recent Events" 
          isEmpty={!hasSerial || events.length === 0}
          emptyMessage={!hasSerial ? "Enter a serial number to view device events" : "No events found for this device"}
        >
          {hasSerial && events.length > 0 && (
            <div style={styles.stack}>
              {events.map(event => (
                <div 
                  key={event.id} 
                  style={{
                    ...styles.listItem,
                    ...(hoveredId === event.id ? { borderColor: colors.borderMedium, background: 'rgba(15, 23, 42, 0.6)' } : {})
                  }}
                  onMouseEnter={() => setHoveredId(event.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div style={getStatusDot(event.type)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: colors.textPrimary, fontSize: '14px', margin: 0 }}>{event.message}</p>
                    <p style={{ color: colors.textTertiary, fontSize: '12px', marginTop: '4px' }}>
                      Device: {event.device} - {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>
        
        <WidgetCard title="Event Filters">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={styles.label}>Event Type</label>
              <select style={styles.select} disabled={!hasSerial}>
                <option>All Events</option>
                <option>Info</option>
                <option>Warning</option>
                <option>Critical</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Time Range</label>
              <select style={styles.select} disabled={!hasSerial}>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
