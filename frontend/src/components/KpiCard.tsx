// src/components/KpiCard.tsx
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number; // Percentage change
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  status?: 'healthy' | 'warning' | 'critical' | 'info';
  onClick?: () => void;
  sparklineData?: number[]; // Simple array of values for mini chart
}

export default function KpiCard({ 
  label, 
  value, 
  trend, 
  icon,
  status,
  onClick,
  sparklineData 
}: KpiCardProps) {

  return (
    <div 
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '20px',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Header with label and icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        {icon && (
          <div style={{ color: '#64748b' }}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value and sparkline in row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.025em', color: status ? (status === 'healthy' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444') : '#f1f5f9' }}>
            {value}
          </div>
          
          {/* Trend indicator */}
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: '500', color: trend.direction === 'up' ? '#10b981' : trend.direction === 'down' ? '#ef4444' : '#64748b' }}>
              {trend.direction === 'up' && (
                <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        
        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div style={{ flexShrink: 0, height: '40px', width: '80px' }}>
            <MiniSparkline data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );
}

// Simple SVG sparkline component
function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 96; // w-24 = 96px
  const height = 40; // h-10 = 40px
  const padding = 2;

  // Calculate points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      {/* Subtle area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="var(--chart-area-fill)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent-cyan)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
