// src/hooks/useOptimizedTelemetry.ts
// Optimized hook for fetching multiple telemetry values in a single batch request
// Reduces ADX query costs by batching all telemetry requests into one query

import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// Types
// ============================================================================

export interface TelemetryValue {
  value: number | null;
  localtime: string | null;
  loading: boolean;
  error: string | null;
}

export interface BatchTelemetryResult {
  data: Record<string, TelemetryValue>;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  refetch: () => Promise<void>;
  stats: {
    queriesSaved: number;
    cacheHits: number;
    totalQueries: number;
  };
}

interface BatchApiResponse {
  success: boolean;
  data: Record<string, {
    value: number | null;
    localtime: string | null;
  }>;
  cached: boolean;
  query_count: number;
}

// ============================================================================
// Configuration
// ============================================================================

const BATCH_ENDPOINT = '/batch_telemetry/';
const STATS_ENDPOINT = '/adx_stats/';
const DEFAULT_REFRESH_INTERVAL = 10000; // 10 seconds

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOptimizedTelemetry(
  serial: string,
  telemetryNames: string[],
  refreshInterval: number = DEFAULT_REFRESH_INTERVAL,
  isPaused: boolean = false
): BatchTelemetryResult {
  const { accessToken, logout } = useAuth();
  const [data, setData] = useState<Record<string, TelemetryValue>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState({ queriesSaved: 0, cacheHits: 0, totalQueries: 0 });
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchCountRef = useRef(0);

  // Initialize data structure
  useEffect(() => {
    const initialData: Record<string, TelemetryValue> = {};
    telemetryNames.forEach(name => {
      initialData[name] = {
        value: null,
        localtime: null,
        loading: true,
        error: null
      };
    });
    setData(initialData);
  }, [telemetryNames]);

  // Batch fetch function - makes ONE API call for ALL telemetry values
  const fetchBatch = useCallback(async () => {
    if (!serial || !accessToken || telemetryNames.length === 0) return;

    setIsLoading(true);
    setError(null);

    // Set all items to loading
    setData(prev => {
      const updated = { ...prev };
      telemetryNames.forEach(name => {
        updated[name] = { ...updated[name], loading: true };
      });
      return updated;
    });

    try {
      const response = await api.post<BatchApiResponse>(
        BATCH_ENDPOINT,
        {
          serial,
          telemetry_names: telemetryNames
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (response.data.success) {
        const newData: Record<string, TelemetryValue> = {};
        
        telemetryNames.forEach(name => {
          const result = response.data.data[name];
          newData[name] = {
            value: result?.value ?? null,
            localtime: result?.localtime ?? null,
            loading: false,
            error: null
          };
        });

        setData(newData);
        setLastRefresh(new Date());
        fetchCountRef.current += 1;

        // Update stats - calculate queries saved
        // Without batching: N queries (one per telemetry name)
        // With batching: 1 query
        const queriesSaved = telemetryNames.length - 1;
        setStats(prev => ({
          queriesSaved: prev.queriesSaved + queriesSaved,
          cacheHits: prev.cacheHits + (response.data.cached ? 1 : 0),
          totalQueries: prev.totalQueries + 1
        }));
      } else {
        throw new Error('Batch query failed');
      }
    } catch (err: any) {
      console.error('Batch telemetry fetch error:', err);
      
      if (err?.response?.status === 401) {
        await logout();
        return;
      }

      const errorMessage = err?.response?.data?.error ?? err?.message ?? 'Unknown error';
      setError(errorMessage);

      // Set error on all items
      setData(prev => {
        const updated = { ...prev };
        telemetryNames.forEach(name => {
          updated[name] = {
            ...updated[name],
            loading: false,
            error: errorMessage
          };
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [serial, accessToken, telemetryNames, logout]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!serial || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchBatch();

    // Set up auto-refresh interval
    intervalRef.current = setInterval(fetchBatch, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [serial, isPaused, refreshInterval, fetchBatch]);

  return {
    data,
    isLoading,
    error,
    lastRefresh,
    refetch: fetchBatch,
    stats
  };
}

// ============================================================================
// Utility Hook for Fetching ADX Stats
// ============================================================================

export interface ADXStats {
  cache_hits: number;
  cache_misses: number;
  queries_executed: number;
  queries_batched: number;
  rate_limit_exceeded: number;
  uptime_seconds: number;
}

export function useADXStats(refreshInterval: number = 30000) {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<ADXStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await api.get<ADXStats>(STATS_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch ADX stats:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, refetch: fetchStats };
}

export default useOptimizedTelemetry;
