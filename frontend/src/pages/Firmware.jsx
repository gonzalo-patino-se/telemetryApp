// src/pages/Firmware.jsx
import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { colors, spacing, borderRadius } from '../styles/tokens';
import { useSerial } from '../context/SerialContext';

const styles = {
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: '24px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderRadius: '12px',
    background: colors.bgInput,
    border: '1px solid ' + colors.borderSubtle,
    transition: 'all 0.2s ease',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  badge: (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 500,
    borderRadius: '6px',
    background: status === 'current' ? 'rgba(34, 197, 94, 0.15)'
      : status === 'available' ? 'rgba(59, 130, 246, 0.15)'
      : colors.bgInput,
    color: status === 'current' ? colors.statusHealthy
      : status === 'available' ? colors.statusInfo
      : colors.textTertiary,
  }),
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
};

export default function Firmware() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { serial, hasSerial } = useSerial();

  // Firmware data will be fetched from Azure based on serial number
  // Empty array when no serial is provided
  const firmwareVersions = hasSerial ? [] : [];
  const currentVersion = null; // Will be fetched from API

  const statusLabels = { current: 'Current', available: 'Available', outdated: 'Outdated' };

  return (
    <DashboardLayout title="Firmware Management">
      <div style={styles.gridTwoCols}>
        <WidgetCard 
          title="Available Firmware Versions"
          isEmpty={!hasSerial || firmwareVersions.length === 0}
          emptyMessage={!hasSerial ? "Enter a serial number to view firmware versions" : "No firmware data available"}
        >
          {hasSerial && firmwareVersions.length > 0 && (
            <div style={styles.stack}>
              {firmwareVersions.map((fw, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.listItem,
                    ...(hoveredIdx === idx ? { borderColor: colors.borderMedium, background: 'rgba(15, 23, 42, 0.6)' } : {})
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                      v{fw.version}
                    </div>
                    <span style={styles.badge(fw.status)}>{statusLabels[fw.status]}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: colors.textTertiary, fontSize: '12px', margin: 0 }}>{fw.date}</p>
                    <p style={{ color: colors.textSecondary, fontSize: '13px', marginTop: '4px' }}>{fw.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>
        
        <WidgetCard 
          title="Update Status"
          isEmpty={!hasSerial}
          emptyMessage="Enter a serial number to check firmware status"
        >
          {hasSerial && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {currentVersion ? (
                <>
                  <div style={styles.iconContainer}>
                    <svg style={{ width: '32px', height: '32px', color: colors.statusHealthy }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p style={{ color: colors.textPrimary, fontSize: '16px', fontWeight: 500, margin: 0 }}>Firmware Up to Date</p>
                  <p style={{ color: colors.textTertiary, fontSize: '13px', marginTop: '8px' }}>Version {currentVersion}</p>
                </>
              ) : (
                <p style={{ color: colors.textTertiary, fontSize: '14px', margin: 0 }}>Loading firmware status...</p>
              )}
            </div>
          )}
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
