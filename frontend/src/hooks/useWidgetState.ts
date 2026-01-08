// src/hooks/useWidgetState.ts
// Reusable hook for widget state management
// Handles date range, loading, error states, and auto-fetch logic

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { DateRange, WidgetFetchState, AdxRow } from '../types';

interface UseWidgetStateOptions {
  /** Initial hours for date range (default: 24) */
  initialHours?: number;
  /** Serial number for the device */
  serial: string;
  /** Whether auto-fetch is enabled */
  autoFetch: boolean;
  /** Fetch signal from parent */
  fetchSignal?: number;
  /** Function to build KQL query */
  buildQuery: (serial: string, from: Date, to: Date) => string;
  /** Function to execute the fetch */
  executeFetch: (kql: string) => Promise<AdxRow[]>;
}

interface UseWidgetStateReturn<T = AdxRow> extends WidgetFetchState<T> {
  /** Current date range */
  dateRange: DateRange;
  /** Set date range */
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  /** Whether fetch is allowed */
  canFetch: boolean;
  /** Current KQL query */
  kql: string | null;
  /** Manual fetch function */
  fetchData: () => Promise<void>;
  /** Set rows directly */
  setRows: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Get date range for last N hours
 */
export function getLastHours(hours: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Format date to locale string for display
 */
export function toLocalLabel(d?: Date | string): string {
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt ? dt.toLocaleString() : '';
  } catch {
    return '';
  }
}

/**
 * Custom hook for managing widget state
 * Encapsulates common logic for date range, fetching, loading states
 */
export function useWidgetState<T = AdxRow>(
  options: UseWidgetStateOptions
): UseWidgetStateReturn<T> {
  const {
    initialHours = 24,
    serial,
    autoFetch,
    fetchSignal,
    buildQuery,
    executeFetch,
  } = options;

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const { start, end } = getLastHours(initialHours);
    return { fromDT: start, toDT: end };
  });

  // Fetch state
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Computed values
  const canFetch = useMemo(() => {
    const { fromDT, toDT } = dateRange;
    if (!serial || !fromDT || !toDT) return false;
    return toDT.getTime() > fromDT.getTime();
  }, [serial, dateRange]);

  const kql = useMemo(() => {
    const { fromDT, toDT } = dateRange;
    if (!canFetch || !fromDT || !toDT) return null;
    return buildQuery(serial, fromDT, toDT);
  }, [canFetch, serial, dateRange, buildQuery]);

  // Fetch function
  const fetchData = useCallback(async () => {
    const { fromDT, toDT } = dateRange;
    if (!canFetch || !fromDT || !toDT || !serial) return;

    const currentKql = buildQuery(serial, fromDT, toDT);
    setLoading(true);
    setError('');

    try {
      const dataArray = await executeFetch(currentKql);
      setRows(dataArray as T[]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
      setError(errorMessage);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, serial, dateRange, buildQuery, executeFetch]);

  // Auto-fetch on changes
  useEffect(() => {
    if (!autoFetch || !canFetch) return;
    void fetchData();
  }, [autoFetch, canFetch, serial, dateRange.fromDT, dateRange.toDT]);

  // Parent-triggered fetch
  useEffect(() => {
    if (fetchSignal === undefined || !canFetch) return;
    void fetchData();
  }, [fetchSignal]);

  return {
    dateRange,
    setDateRange,
    rows,
    setRows,
    loading,
    error,
    canFetch,
    kql,
    fetchData,
  };
}

export default useWidgetState;
