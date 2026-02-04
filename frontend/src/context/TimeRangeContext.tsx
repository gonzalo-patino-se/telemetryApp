// src/context/TimeRangeContext.tsx
// Global time range context for historical widgets
// Allows a master widget to control time range for all child widgets
// Individual widgets can override by "unlinking" from the master

import React, { createContext, useContext, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type TimeRangePreset = '15m' | '1h' | '6h' | '12h' | '24h' | '3d' | '7d' | 'custom';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  preset: TimeRangePreset;
}

interface TimeRangeContextType {
  /** The global time range */
  globalTimeRange: TimeRange;
  /** Update the global time range */
  setGlobalTimeRange: (range: TimeRange) => void;
  /** Apply a preset to the global time range */
  applyPreset: (preset: TimeRangePreset) => void;
  /** Signal that increments when global range changes (for triggering refetch) */
  globalRangeSignal: number;
}

// ============================================================================
// Helpers
// ============================================================================

export function getPresetRange(preset: TimeRangePreset): { start: Date; end: Date } {
  const now = new Date();
  const end = now;
  let start: Date;

  switch (preset) {
    case '15m':
      start = new Date(now.getTime() - 15 * 60 * 1000);
      break;
    case '1h':
      start = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '12h':
      start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '3d':
      start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
    default:
      // Default to 6 hours for custom
      start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
  }

  return { start, end };
}

export function getPresetLabel(preset: TimeRangePreset): string {
  switch (preset) {
    case '15m': return 'Last 15 minutes';
    case '1h': return 'Last 1 hour';
    case '6h': return 'Last 6 hours';
    case '12h': return 'Last 12 hours';
    case '24h': return 'Last 24 hours';
    case '3d': return 'Last 3 days';
    case '7d': return 'Last 7 days';
    case 'custom': return 'Custom range';
    default: return preset;
  }
}

// ============================================================================
// Context
// ============================================================================

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const TimeRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with 6 hours (sensible default for dashboard)
  const [globalTimeRange, setGlobalTimeRangeState] = useState<TimeRange>(() => {
    const { start, end } = getPresetRange('6h');
    return { startDate: start, endDate: end, preset: '6h' };
  });
  
  const [globalRangeSignal, setGlobalRangeSignal] = useState(0);

  const setGlobalTimeRange = useCallback((range: TimeRange) => {
    setGlobalTimeRangeState(range);
    setGlobalRangeSignal(prev => prev + 1);
  }, []);

  const applyPreset = useCallback((preset: TimeRangePreset) => {
    const { start, end } = getPresetRange(preset);
    setGlobalTimeRange({
      startDate: start,
      endDate: end,
      preset,
    });
  }, [setGlobalTimeRange]);

  return (
    <TimeRangeContext.Provider value={{ 
      globalTimeRange, 
      setGlobalTimeRange, 
      applyPreset,
      globalRangeSignal,
    }}>
      {children}
    </TimeRangeContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useTimeRange = () => {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider');
  }
  return context;
};

// Optional hook that returns undefined if not in provider (for backward compatibility)
export const useTimeRangeOptional = () => {
  return useContext(TimeRangeContext);
};
