// src/pages/Events.tsx
// Events page - displays alarms/events from Azure Data Explorer
// Features: Table view, aggregation chart, Pareto chart

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DashboardLayout from '../components/layout/DashboardLayout';
import WidgetCard from '../components/layout/WidgetCard';
import { colors, spacing } from '../styles/tokens';
import { useSerial } from '../context/SerialContext';
import { useAuth } from '../context/AuthContext';
import { useTimeRangeOptional } from '../context/TimeRangeContext';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  Legend,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface AlarmEvent {
  localtime: string;
  name: string;
  value: string | number;
}

interface AggregatedEvent {
  name: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

// ============================================================================
// Helpers
// ============================================================================

function escapeKqlString(s: string): string {
  return (s ?? '').replace(/'/g, "''");
}

function toLocalKqlDatetime(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.0000`;
}

function lastHours(h: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - h * 60 * 60 * 1000);
  return { start, end };
}

// Maximum events to fetch and display
const MAX_EVENTS_FETCH = 20000;  // Limit fetched from API
const MAX_EVENTS_DISPLAY = 20000; // Limit displayed in table when expanded (not collapsed)
const DEFAULT_EVENTS_DISPLAY = 500; // Default display when collapsed

// Build KQL query for fetching events
function buildEventsKql(serial: string, from: Date, to: Date, limit: number = MAX_EVENTS_FETCH): string {
  const s = escapeKqlString(serial);
  const startLocal = toLocalKqlDatetime(from);
  const endLocal = toLocalKqlDatetime(to);
  
  return `
    let s = '${s}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Alarms
    | where comms_serial contains s
    | where localtime between (start .. finish)
    | where value == 1
    | sort by localtime desc
    | project localtime, name, value
    | take ${limit}
  `.trim();
}

// Build KQL query for aggregation (event frequency)
function buildAggregationKql(serial: string, from: Date, to: Date, limit: number = MAX_EVENTS_FETCH): string {
  const s = escapeKqlString(serial);
  const startLocal = toLocalKqlDatetime(from);
  const endLocal = toLocalKqlDatetime(to);
  
  return `
    let s = '${s}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Alarms
    | where comms_serial contains s
    | where localtime between (start .. finish)
    | where value == 1
    | summarize count() by name
    | order by count_ desc
    | take ${limit}
  `.trim();
}

// Get severity level from event name
function getSeverityFromName(name: string): 'critical' | 'warning' | 'info' {
  const lower = name.toLowerCase();
  if (lower.includes('error') || lower.includes('fault') || lower.includes('critical') || lower.includes('fail')) {
    return 'critical';
  }
  if (lower.includes('warn') || lower.includes('alarm')) {
    return 'warning';
  }
  return 'info';
}

// Get status color
function getStatusColor(severity: 'critical' | 'warning' | 'info'): string {
  switch (severity) {
    case 'critical': return colors.statusCritical;
    case 'warning': return colors.statusWarning;
    case 'info': return colors.statusInfo;
    default: return colors.statusInfo;
  }
}

// Format event name for display
function formatEventName(name: string): string {
  // Remove common prefixes and make readable
  return name
    .replace(/^\/[A-Z]+\//, '')
    .replace(/\//g, ' → ')
    .replace(/_/g, ' ')
    .trim();
}

// ============================================================================
// Components
// ============================================================================

// Custom tooltip for charts
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: colors.textPrimary, fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ color: entry.color || colors.textSecondary, fontSize: '12px', margin: '4px 0' }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// Pareto chart colors
const PARETO_COLORS = [
  '#3dcd58', '#2196f3', '#ff9800', '#e91e63', '#9c27b0',
  '#00bcd4', '#4caf50', '#ff5722', '#607d8b', '#795548',
];

// ============================================================================
// Main Component
// ============================================================================

// Simple error boundary wrapper for charts
const ChartErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('chart') || event.message?.includes('width') || event.message?.includes('height')) {
        setHasError(true);
        event.preventDefault();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Chart could not be rendered. Try refreshing the page.</p>
        <button 
          onClick={() => setHasError(false)} 
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default function Events() {
  const { serial, hasSerial } = useSerial();
  const { logout } = useAuth();
  const timeRangeContext = useTimeRangeOptional();
  
  // State
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [aggregation, setAggregation] = useState<{ name: string; count_: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  
  // Delay chart rendering to ensure container has dimensions
  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Time range - use global if available, otherwise local
  const [isLinkedToGlobal, setIsLinkedToGlobal] = useState(true);
  const [localRange, setLocalRange] = useState<{ fromDT: Date | null; toDT: Date | null }>(() => {
    const { start, end } = lastHours(24);
    return { fromDT: start, toDT: end };
  });
  
  // Effective time range
  const fromDT = useMemo(() => {
    if (isLinkedToGlobal && timeRangeContext) {
      return timeRangeContext.globalTimeRange.startDate;
    }
    return localRange.fromDT;
  }, [isLinkedToGlobal, timeRangeContext, localRange.fromDT]);
  
  const toDT = useMemo(() => {
    if (isLinkedToGlobal && timeRangeContext) {
      return timeRangeContext.globalTimeRange.endDate;
    }
    return localRange.toDT;
  }, [isLinkedToGlobal, timeRangeContext, localRange.toDT]);
  
  // Filter state
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!hasSerial || !serial || !fromDT || !toDT) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch events (cookies sent automatically with withCredentials: true)
      const eventsKql = buildEventsKql(serial, fromDT, toDT);
      const eventsRes = await api.post('/query_adx/', { kql: eventsKql });
      const eventsData = Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : [];
      setEvents(eventsData);
      
      // Fetch aggregation
      const aggKql = buildAggregationKql(serial, fromDT, toDT);
      const aggRes = await api.post('/query_adx/', { kql: aggKql });
      const aggData = Array.isArray(aggRes.data?.data) ? aggRes.data.data : [];
      setAggregation(aggData);
      
    } catch (err: any) {
      if (err?.response?.status === 401) await logout();
      setError(err?.response?.data?.error ?? 'Error fetching events');
      setEvents([]);
      setAggregation([]);
    } finally {
      setLoading(false);
    }
  }, [hasSerial, serial, fromDT, toDT, logout]);
  
  // Auto-fetch on mount and when params change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const severity = getSeverityFromName(event.name);
      if (severityFilter !== 'all' && severity !== severityFilter) return false;
      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [events, severityFilter, searchTerm]);
  
  // Pareto data
  const paretoData = useMemo((): AggregatedEvent[] => {
    if (!aggregation.length) return [];
    
    const total = aggregation.reduce((sum, item) => sum + (item.count_ || 0), 0);
    let cumulative = 0;
    
    return aggregation.map(item => {
      const count = item.count_ || 0;
      const percentage = (count / total) * 100;
      cumulative += percentage;
      
      return {
        name: formatEventName(item.name),
        count,
        percentage,
        cumulativePercentage: cumulative,
      };
    });
  }, [aggregation]);
  
  // Styles
  const styles = {
    controlsRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'flex-end',
      gap: '24px',
      marginBottom: '32px',
      padding: '20px',
      background: colors.bgInput,
      borderRadius: '12px',
      border: `1px solid ${colors.borderSubtle}`,
    },
    controlGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: 600,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    input: {
      padding: '12px 16px',
      fontSize: '14px',
      color: colors.textPrimary,
      background: colors.bgSurface,
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: '8px',
      outline: 'none',
    },
    select: {
      padding: '12px 16px',
      fontSize: '14px',
      color: colors.textPrimary,
      background: colors.bgSurface,
      border: `1px solid ${colors.borderMedium}`,
      borderRadius: '8px',
      outline: 'none',
      cursor: 'pointer',
      minWidth: '160px',
    },
    button: {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 600,
      color: 'white',
      background: colors.schneiderGreen,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    linkButton: {
      padding: '12px 18px',
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    tableContainer: {
      overflowX: 'auto' as const,
      borderRadius: '12px',
      border: `1px solid ${colors.borderSubtle}`,
    },
    table: {
      width: '100%',
      borderCollapse: 'separate' as const,
      borderSpacing: '0',
      fontSize: '14px',
    },
    th: {
      textAlign: 'left' as const,
      padding: '18px 24px',
      background: colors.bgInput,
      color: colors.textSecondary,
      fontWeight: 600,
      fontSize: '13px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      borderBottom: `2px solid ${colors.borderMedium}`,
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '16px 24px',
      borderBottom: `1px solid ${colors.borderSubtle}`,
      color: colors.textPrimary,
      lineHeight: '1.5',
    },
    statusDot: (severity: string) => ({
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      display: 'inline-block',
      marginRight: '12px',
      background: getStatusColor(severity as any),
    }),
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px',
      color: colors.textTertiary,
    },
    chartContainer: {
      height: '450px',
      minHeight: '450px',
      minWidth: '300px',
      padding: '20px 0',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      marginBottom: '32px',
    },
    statCard: {
      padding: '24px',
      background: colors.bgInput,
      borderRadius: '12px',
      border: `1px solid ${colors.borderSubtle}`,
      textAlign: 'center' as const,
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 700,
      color: colors.textPrimary,
      marginBottom: '8px',
    },
    statLabel: {
      fontSize: '13px',
      color: colors.textTertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
  };
  
  // Summary stats
  const stats = useMemo(() => {
    const total = events.length;
    const critical = events.filter(e => getSeverityFromName(e.name) === 'critical').length;
    const warning = events.filter(e => getSeverityFromName(e.name) === 'warning').length;
    const info = events.filter(e => getSeverityFromName(e.name) === 'info').length;
    return { total, critical, warning, info };
  }, [events]);
  
  return (
    <DashboardLayout title="Events" showFilters={false}>
      {/* Controls */}
      <div style={styles.controlsRow}>
        {/* Link/Unlink toggle */}
        {timeRangeContext && (
          <div style={styles.controlGroup}>
            <span style={styles.label}>Master Range</span>
            <button
              onClick={() => setIsLinkedToGlobal(!isLinkedToGlobal)}
              style={{
                ...styles.linkButton,
                background: isLinkedToGlobal ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: isLinkedToGlobal ? '#60a5fa' : '#9ca3af',
                border: `1px solid ${isLinkedToGlobal ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
              }}
            >
              <span>{isLinkedToGlobal ? '🔗' : '🔓'}</span>
              <span>{isLinkedToGlobal ? 'Linked' : 'Unlinked'}</span>
            </button>
          </div>
        )}
        
        {/* Date pickers - only show when unlinked */}
        {(!timeRangeContext || !isLinkedToGlobal) && (
          <>
            <div style={styles.controlGroup}>
              <span style={styles.label}>From</span>
              <DatePicker
                selected={localRange.fromDT}
                onChange={(d: Date | null) => setLocalRange(r => ({ ...r, fromDT: d }))}
                showTimeSelect
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                className="widget-datepicker-input"
              />
            </div>
            <div style={styles.controlGroup}>
              <span style={styles.label}>To</span>
              <DatePicker
                selected={localRange.toDT}
                onChange={(d: Date | null) => setLocalRange(r => ({ ...r, toDT: d }))}
                showTimeSelect
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                className="widget-datepicker-input"
                minDate={localRange.fromDT ?? undefined}
              />
            </div>
          </>
        )}
        
        {/* Current range display when linked */}
        {timeRangeContext && isLinkedToGlobal && (
          <div style={{ ...styles.controlGroup, flex: 1 }}>
            <span style={styles.label}>Current Range</span>
            <div style={{
              padding: '10px 14px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '13px',
              color: colors.textSecondary,
            }}>
              📅 {fromDT?.toLocaleString()} — {toDT?.toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Severity filter */}
        <div style={styles.controlGroup}>
          <span style={styles.label}>Severity</span>
          <select
            style={styles.select}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        
        {/* Search */}
        <div style={{ ...styles.controlGroup, flex: 1, minWidth: '200px' }}>
          <span style={styles.label}>Search</span>
          <input
            type="text"
            placeholder="Search events..."
            style={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Refresh button */}
        <button
          onClick={fetchEvents}
          disabled={loading || !hasSerial}
          style={{
            ...styles.button,
            opacity: loading || !hasSerial ? 0.5 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: spacing.md,
          marginBottom: spacing.lg,
          background: 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${colors.statusCritical}`,
          borderRadius: '8px',
          color: colors.statusCritical,
          fontSize: '13px',
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Summary Stats */}
      {hasSerial && events.length > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Events</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `3px solid ${colors.statusCritical}` }}>
            <div style={{ ...styles.statValue, color: colors.statusCritical }}>{stats.critical}</div>
            <div style={styles.statLabel}>Critical</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `3px solid ${colors.statusWarning}` }}>
            <div style={{ ...styles.statValue, color: colors.statusWarning }}>{stats.warning}</div>
            <div style={styles.statLabel}>Warning</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `3px solid ${colors.statusInfo}` }}>
            <div style={{ ...styles.statValue, color: colors.statusInfo }}>{stats.info}</div>
            <div style={styles.statLabel}>Info</div>
          </div>
        </div>
      )}
      
      {/* Main content grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '32px' }}>
        {/* Pareto Chart */}
        <WidgetCard 
          title="Event Frequency (Pareto)"
          isEmpty={!hasSerial || paretoData.length === 0}
          emptyMessage={!hasSerial ? "Enter a serial number" : "No events in selected range"}
        >
          {paretoData.length > 0 && chartsReady && (
            <ChartErrorBoundary>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={paretoData} margin={{ top: 30, right: 80, bottom: 140, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderSubtle} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: colors.textTertiary, fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={120}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: colors.textTertiary, fontSize: 11 }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: colors.textTertiary }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: colors.textTertiary, fontSize: 11 }}
                    domain={[0, 100]}
                    label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fill: colors.textTertiary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Count" fill={colors.schneiderGreen}>
                    {paretoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PARETO_COLORS[index % PARETO_COLORS.length]} />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="cumulativePercentage" 
                    name="Cumulative %" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            </ChartErrorBoundary>
          )}
        </WidgetCard>
        
        {/* Top Events Bar Chart */}
        <WidgetCard 
          title="Top Events by Frequency"
          isEmpty={!hasSerial || paretoData.length === 0}
          emptyMessage={!hasSerial ? "Enter a serial number" : "No events in selected range"}
        >
          {paretoData.length > 0 && chartsReady && (
            <ChartErrorBoundary>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={paretoData.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 40, bottom: 20, left: 220 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.borderSubtle} horizontal={false} />
                  <XAxis type="number" tick={{ fill: colors.textTertiary, fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: colors.textSecondary, fontSize: 13 }}
                    width={200}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={colors.accentPrimary} radius={[0, 4, 4, 0]}>
                    {paretoData.slice(0, 10).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PARETO_COLORS[index % PARETO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            </ChartErrorBoundary>
          )}
        </WidgetCard>
      </div>
      
      {/* Events Table */}
      <WidgetCard 
        title={`Events Log (${filteredEvents.length} of ${events.length}${events.length >= MAX_EVENTS_FETCH ? '+' : ''})`}
        actions={
          filteredEvents.length > DEFAULT_EVENTS_DISPLAY ? (
            <button
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: colors.textSecondary,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isTableExpanded ? '▼ Collapse' : '▶ Expand'} ({isTableExpanded ? MAX_EVENTS_DISPLAY : DEFAULT_EVENTS_DISPLAY})
            </button>
          ) : undefined
        }
        isEmpty={!hasSerial}
        emptyMessage="Enter a serial number to view device events"
      >
        {hasSerial && (
          <div style={styles.tableContainer}>
            {filteredEvents.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No events found for the selected filters</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Severity</th>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Event Name</th>
                    <th style={styles.th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, isTableExpanded ? MAX_EVENTS_DISPLAY : DEFAULT_EVENTS_DISPLAY).map((event, index) => {
                    const severity = getSeverityFromName(event.name);
                    return (
                      <tr 
                        key={`${event.localtime}-${event.name}-${index}`}
                        style={{
                          background: index % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.3)',
                        }}
                      >
                        <td style={{ ...styles.td, width: '120px' }}>
                          <span style={styles.statusDot(severity)} />
                          <span style={{ 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            color: getStatusColor(severity),
                            textTransform: 'uppercase' 
                          }}>
                            {severity}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap' as const, width: '200px' }}>
                          {new Date(event.localtime).toLocaleString()}
                        </td>
                        <td style={{ ...styles.td, wordBreak: 'break-word' as const }}>
                          {event.name}
                        </td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px', width: '120px' }}>
                          {String(event.value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!isTableExpanded && filteredEvents.length > DEFAULT_EVENTS_DISPLAY && (
              <div 
                onClick={() => setIsTableExpanded(true)}
                style={{ 
                  padding: '16px', 
                  textAlign: 'center', 
                  color: colors.accentPrimary, 
                  fontSize: '14px', 
                  borderTop: `1px solid ${colors.borderSubtle}`,
                  cursor: 'pointer',
                  background: 'rgba(59, 130, 246, 0.05)',
                }}
              >
                ▶ Click to show more ({Math.min(filteredEvents.length, MAX_EVENTS_DISPLAY) - DEFAULT_EVENTS_DISPLAY} more events)
              </div>
            )}
            {isTableExpanded && filteredEvents.length > MAX_EVENTS_DISPLAY && (
              <div style={{ padding: '16px', textAlign: 'center', color: colors.textTertiary, fontSize: '14px', borderTop: `1px solid ${colors.borderSubtle}` }}>
                Showing {MAX_EVENTS_DISPLAY} of {filteredEvents.length} events (max limit: {MAX_EVENTS_FETCH}). Narrow your time range to see more details.
              </div>
            )}
            {events.length >= MAX_EVENTS_FETCH && (
              <div style={{ 
                padding: '12px 16px', 
                textAlign: 'center', 
                color: colors.statusWarning, 
                fontSize: '13px', 
                background: 'rgba(251, 191, 36, 0.1)',
                borderTop: `1px solid ${colors.borderSubtle}`,
              }}>
                ⚠️ Results limited to {MAX_EVENTS_FETCH} events. Narrow your time range for complete data.
              </div>
            )}
          </div>
        )}
      </WidgetCard>
    </DashboardLayout>
  );
}
