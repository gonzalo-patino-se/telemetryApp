// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  title?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  showFilters?: boolean; // Show time range and environment filters
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  title, 
  toolbar, 
  children,
  showFilters = true 
}) => {
  const [timeRange, setTimeRange] = useState('15m');
  const [environment, setEnvironment] = useState('prod');

  const selectStyle = {
    fontSize: '13px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#f1f5f9',
    outline: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Modern top bar with filters */}
      {(title || toolbar || showFilters) && (
        <div style={{ 
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)', 
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', gap: '16px', flexWrap: 'wrap' }}>
              {/* Left: Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {title && (
                  <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.025em' }}>
                    {title}
                  </h1>
                )}
                
                {/* Filters */}
                {showFilters && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Environment selector */}
                    <select 
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="prod">Production</option>
                      <option value="stage">Staging</option>
                      <option value="dev">Development</option>
                    </select>
                    
                    {/* Time range selector */}
                    <select 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="5m">Last 5 minutes</option>
                      <option value="15m">Last 15 minutes</option>
                      <option value="1h">Last 1 hour</option>
                      <option value="6h">Last 6 hours</option>
                      <option value="24h">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                    </select>
                  </div>
                )}
              </div>
              
              {/* Right: Custom toolbar */}
              {toolbar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {toolbar}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page body */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;