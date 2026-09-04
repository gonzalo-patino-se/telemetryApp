// src/context/ThresholdContext.tsx
// Loads the thresholds that apply to the signed-in user's tenant (FR-015/FR-016)
// and tracks per-card visibility. Administrators edit the values in the admin
// console; regular users may only toggle whether the lines are drawn.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  MISSING_THRESHOLD_TEXT,
  fetchEffectiveThresholds,
  type Threshold,
  type ThresholdMap,
} from '../services/thresholds';
import { useAuth } from './AuthContext';

const VISIBILITY_STORAGE_KEY = 'threshold-visibility-overrides';

type VisibilityOverrides = Record<string, boolean>;

interface ThresholdContextValue {
  thresholds: ThresholdMap;
  tenant: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  missingThresholdText: string;
  /** Threshold for a metric, or undefined when none is configured. */
  getThreshold: (metricKey: string) => Threshold | undefined;
  /** Whether the reference lines should be drawn for this card. */
  isVisible: (metricKey: string) => boolean;
  toggleVisibility: (metricKey: string) => void;
  refresh: () => Promise<void>;
}

const ThresholdContext = createContext<ThresholdContextValue | undefined>(undefined);

function readOverrides(): VisibilityOverrides {
  try {
    const raw = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisibilityOverrides) : {};
  } catch {
    return {};
  }
}

export const ThresholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [thresholds, setThresholds] = useState<ThresholdMap>({});
  const [tenant, setTenant] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingThresholdText, setMissingThresholdText] = useState(MISSING_THRESHOLD_TEXT);
  const [overrides, setOverrides] = useState<VisibilityOverrides>(readOverrides);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEffectiveThresholds();
      setThresholds(data.thresholds ?? {});
      setTenant(data.tenant ?? null);
      setIsAdmin(Boolean(data.is_admin));
      setMissingThresholdText(data.missing_threshold_text || MISSING_THRESHOLD_TEXT);
      setError(null);
    } catch (err: any) {
      // A 401 is handled globally by the axios interceptor; keep charts usable.
      if (err?.response?.status !== 401) {
        setError('Thresholds could not be loaded.');
      }
      setThresholds({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The endpoint requires authentication; skip it on the public pages.
    if (!isAuthenticated) {
      setThresholds({});
      setIsLoading(false);
      return;
    }
    void refresh();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    try {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      /* storage unavailable (private mode) - visibility stays session-only */
    }
  }, [overrides]);

  const getThreshold = useCallback(
    (metricKey: string) => thresholds[metricKey],
    [thresholds],
  );

  const isVisible = useCallback(
    (metricKey: string) => {
      const override = overrides[metricKey];
      if (override !== undefined) return override;
      return thresholds[metricKey]?.enabled ?? false;
    },
    [overrides, thresholds],
  );

  const toggleVisibility = useCallback(
    (metricKey: string) => {
      setOverrides(prev => {
        const current = prev[metricKey] ?? thresholds[metricKey]?.enabled ?? false;
        return { ...prev, [metricKey]: !current };
      });
    },
    [thresholds],
  );

  const value = useMemo<ThresholdContextValue>(
    () => ({
      thresholds,
      tenant,
      isAdmin,
      isLoading,
      error,
      missingThresholdText,
      getThreshold,
      isVisible,
      toggleVisibility,
      refresh,
    }),
    [thresholds, tenant, isAdmin, isLoading, error, missingThresholdText, getThreshold, isVisible, toggleVisibility, refresh],
  );

  return <ThresholdContext.Provider value={value}>{children}</ThresholdContext.Provider>;
};

export function useThresholds(): ThresholdContextValue {
  const context = useContext(ThresholdContext);
  if (!context) throw new Error('useThresholds must be used within ThresholdProvider');
  return context;
}

/** Optional variant so widgets still render without the provider (tests/stories). */
export function useThresholdsOptional(): ThresholdContextValue | undefined {
  return useContext(ThresholdContext);
}
