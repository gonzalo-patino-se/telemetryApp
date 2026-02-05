// src/components/HistoricalWidgetsSection.tsx
// Organized Historical Widgets with Collapsible Sections
// Professional layout with tabs for different categories

import React, { useState } from 'react';
import WidgetCard from './layout/WidgetCard';
import { colors, spacing, borderRadius, typography } from '../styles/tokens';

// ============================================================================
// Types
// ============================================================================

interface WidgetConfig {
  id: string;
  title: string;
  Widget: React.ComponentType<any>;
  autoFetch: boolean;
  setAutoFetch: (val: boolean) => void;
  fetchSignal: number;
  setFetchSignal: (fn: (n: number) => number) => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  widgets: WidgetConfig[];
}

interface HistoricalWidgetsSectionProps {
  serial: string;
  categories: CategoryConfig[];
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    marginTop: spacing.xxl,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.bgSurface,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.borderSubtle}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: '44px',
    height: '44px',
    borderRadius: borderRadius.lg,
    background: `linear-gradient(135deg, ${colors.schneiderGreen} 0%, #22c55e 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    margin: 0,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  tabContainer: {
    display: 'flex',
    gap: spacing.xs,
    padding: spacing.xs,
    background: colors.bgInput,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflowX: 'auto' as const,
  },
  tab: (isActive: boolean, color: string) => ({
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: 'none',
    background: isActive ? color : 'transparent',
    color: isActive ? '#ffffff' : colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    whiteSpace: 'nowrap' as const,
  }),
  tabIcon: {
    width: '18px',
    height: '18px',
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    cursor: 'pointer',
  },
  categoryTitle: {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    background: colors.bgHover,
    padding: '2px 8px',
    borderRadius: borderRadius.full,
  },
  expandIcon: (isExpanded: boolean) => ({
    width: '20px',
    height: '20px',
    color: colors.textTertiary,
    transition: 'transform 0.2s ease',
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
  }),
  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: spacing.md,
  },
  widgetsGridCompact: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing.md,
  },
  chartContainer: {
    minHeight: '280px',
  },
  widgetActions: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '6px 10px',
    borderRadius: borderRadius.md,
    background: colors.bgHover,
    border: 'none',
    color: colors.textTertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
  },
  viewAllButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    background: 'transparent',
    border: `1px solid ${colors.borderSubtle}`,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    background: colors.bgSurface,
    borderRadius: borderRadius.lg,
    border: `1px dashed ${colors.borderSubtle}`,
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
};

// ============================================================================
// Category Icons
// ============================================================================

const CategoryIcons = {
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  ),
  solar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  load: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  battery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="18" height="10" rx="2" ry="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <line x1="6" y1="11" x2="6" y2="13" />
      <line x1="10" y1="11" x2="10" y2="13" />
      <line x1="14" y1="11" x2="14" y2="13" />
    </svg>
  ),
};

// ============================================================================
// Component
// ============================================================================

const HistoricalWidgetsSection: React.FC<HistoricalWidgetsSectionProps> = ({
  serial,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );

  const hasSerial = Boolean(serial);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Filter categories based on active tab
  const visibleCategories = activeTab === 'all' 
    ? categories 
    : categories.filter(c => c.id === activeTab);

  // Render a widget card with standard props
  const renderWidget = (config: WidgetConfig) => (
    <WidgetCard
      key={config.id}
      title={config.title}
      isEmpty={!hasSerial}
      emptyMessage="Enter a device serial"
      actions={hasSerial && (
        <div style={styles.widgetActions}>
          <label style={styles.autoLabel}>
            <input 
              type="checkbox" 
              checked={config.autoFetch} 
              onChange={(e) => config.setAutoFetch(e.target.checked)} 
              style={{ width: '14px', height: '14px' }} 
            />
            Auto
          </label>
          <button 
            onClick={() => config.setFetchSignal((n) => n + 1)} 
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </div>
      )}
    >
      {hasSerial && (
        <div style={styles.chartContainer}>
          <config.Widget 
            serial={serial} 
            showControls={false} 
            autoFetchProp={config.autoFetch} 
            onAutoFetchChange={config.setAutoFetch} 
            fetchSignal={config.fetchSignal} 
          />
        </div>
      )}
    </WidgetCard>
  );

  return (
    <div style={styles.container}>
      {/* Section Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </div>
          <div>
            <h2 style={styles.headerTitle}>Historical Telemetry</h2>
            <p style={styles.headerSubtitle}>
              Time-series data • {categories.reduce((sum, c) => sum + c.widgets.length, 0)} widgets
            </p>
          </div>
        </div>
        
        {/* Expand/Collapse Controls */}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button onClick={expandAll} style={styles.viewAllButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Expand All
          </button>
          <button onClick={collapseAll} style={styles.viewAllButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 14h6v6M14 10h6V4M20 20l-7-7M4 4l7 7" />
            </svg>
            Collapse All
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('all')}
          style={styles.tab(activeTab === 'all', colors.schneiderGreen)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          All Categories
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            style={styles.tab(activeTab === category.id, category.color)}
          >
            <span style={styles.tabIcon}>{CategoryIcons[category.id as keyof typeof CategoryIcons]}</span>
            {category.label}
            <span style={{
              fontSize: '10px',
              background: activeTab === category.id ? 'rgba(255,255,255,0.2)' : colors.bgHover,
              padding: '2px 6px',
              borderRadius: '10px',
            }}>
              {category.widgets.length}
            </span>
          </button>
        ))}
      </div>

      {/* Category Sections */}
      {!hasSerial ? (
        <div style={styles.emptyState}>
          <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p style={styles.emptyText}>
            Enter a device serial number to view historical telemetry data
          </p>
        </div>
      ) : (
        visibleCategories.map(category => (
          <div key={category.id} style={styles.categorySection}>
            {/* Category Header (Collapsible) */}
            <div 
              style={styles.categoryHeader}
              onClick={() => toggleCategory(category.id)}
            >
              <span style={{ 
                width: '28px', 
                height: '28px', 
                color: category.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {CategoryIcons[category.id as keyof typeof CategoryIcons]}
              </span>
              <h3 style={{ ...styles.categoryTitle, color: category.color }}>
                {category.label}
              </h3>
              <span style={styles.categoryBadge}>
                {category.widgets.length} widgets
              </span>
              <svg 
                style={styles.expandIcon(expandedCategories.has(category.id))} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Widgets Grid (Collapsible Content) */}
            {expandedCategories.has(category.id) && (
              <div style={category.id === 'battery' ? styles.widgetsGridCompact : styles.widgetsGrid}>
                {category.widgets.map(renderWidget)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default HistoricalWidgetsSection;
