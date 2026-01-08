// src/pages/About.tsx
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { colors } from '../styles/tokens';
import Logo from '../components/common/Logo';

const styles = {
  container: {
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  techGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
  },
  techBadge: {
    padding: '12px',
    borderRadius: '8px',
    background: colors.bgInput,
    border: '1px solid ' + colors.borderSubtle,
    textAlign: 'center' as const,
  },
};

export default function About() {
  const techStack = ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Django', 'REST Framework', 'Azure ADX', 'Recharts'];

  return (
    <DashboardLayout title="About" showFilters={false}>
      <div style={styles.container}>
        <WidgetCard>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <Logo size="lg" showText={false} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px 0' }}>Schneider Electric</h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>Prosumer V1 Analytics Dashboard</p>
            <p style={{ color: colors.textTertiary, fontSize: '13px', marginTop: '16px' }}>Version 1.0.0</p>
          </div>
        </WidgetCard>

        <WidgetCard title="About This Application">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              This dashboard provides real-time monitoring and analytics for Schneider Electric Prosumer V1 devices. 
              Track device telemetry, Wi-Fi signal strength, voltage measurements, and more.
            </p>
            <p style={{ color: colors.textSecondary, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Built with modern technologies including React, TypeScript, Tailwind CSS, and Django REST Framework.
              Data is queried from Azure Data Explorer (ADX) for real-time insights.
            </p>
          </div>
        </WidgetCard>

        <WidgetCard title="Technology Stack">
          <div style={styles.techGrid}>
            {techStack.map((tech) => (
              <div key={tech} style={styles.techBadge}>
                <span style={{ color: colors.textPrimary, fontSize: '13px', fontWeight: 500 }}>{tech}</span>
              </div>
            ))}
          </div>
        </WidgetCard>

        <WidgetCard title="Credits">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              <strong style={{ color: colors.textPrimary }}>Developed by:</strong> Gonzalo P
            </p>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              <strong style={{ color: colors.textPrimary }}>Organization:</strong> Schneider Electric
            </p>
            <p style={{ color: colors.textTertiary, fontSize: '13px', marginTop: '8px' }}>
              {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
