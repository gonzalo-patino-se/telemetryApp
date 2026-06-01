// src/context/RefreshIntervalContext.tsx
//
// Global "auto-refresh" tick generator. Settings → "Data Refresh" writes the
// interval here; every subscriber that depends on `refreshSignal` re-fetches
// when the value increments. Choosing "Disabled" suspends the timer so we
// don't keep hammering ADX while the user is away.
//
// The value is persisted in `localStorage` under `app-refresh-interval` so
// the preference survives reloads. Invalid / stale values fall back to
// `"disabled"` to keep the default behaviour conservative.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

/**
 * Allowed auto-refresh intervals. `"disabled"` suspends the timer entirely.
 * Add new values here AND in `INTERVAL_TO_MS` below -- the two stay in sync
 * via the exhaustive `Record` typing.
 */
export type RefreshInterval = 'disabled' | '5s' | '15s' | '30s' | '1m';

const INTERVAL_TO_MS: Record<RefreshInterval, number> = {
  disabled: 0,
  '5s': 5_000,
  '15s': 15_000,
  '30s': 30_000,
  '1m': 60_000,
};

/** Pretty label for the Settings select. */
export const INTERVAL_LABELS: Record<RefreshInterval, string> = {
  disabled: 'Disabled',
  '5s': '5 seconds',
  '15s': '15 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
};

export const REFRESH_INTERVAL_OPTIONS: RefreshInterval[] = [
  '5s',
  '15s',
  '30s',
  '1m',
  'disabled',
];

const STORAGE_KEY = 'app-refresh-interval';
const DEFAULT_INTERVAL: RefreshInterval = 'disabled';

interface RefreshIntervalContextType {
  /** Current interval choice. */
  interval: RefreshInterval;
  /** Update the choice (also persisted to localStorage). */
  setInterval: (next: RefreshInterval) => void;
  /**
   * Monotonically increasing tick. Increments once on mount (to give every
   * subscriber a single "initial" signal) and then on every interval. Use
   * this in `useEffect` dependency arrays.
   */
  refreshSignal: number;
  /** Force an immediate refresh (e.g. from a manual "Refresh" button). */
  forceRefresh: () => void;
}

const RefreshIntervalContext = createContext<RefreshIntervalContextType | undefined>(undefined);

function readInitialInterval(): RefreshInterval {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in INTERVAL_TO_MS) {
      return stored as RefreshInterval;
    }
  } catch {
    // Ignore localStorage failures (private mode, SSR, etc).
  }
  return DEFAULT_INTERVAL;
}

export function RefreshIntervalProvider({ children }: { children: ReactNode }) {
  const [interval, setIntervalState] = useState<RefreshInterval>(readInitialInterval);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Hold the latest interval in a ref so the timer callback always reads
  // the current value without having to re-create the interval each tick.
  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const setInterval = useCallback((next: RefreshInterval) => {
    setIntervalState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just won't survive a reload.
    }
  }, []);

  const forceRefresh = useCallback(() => {
    setRefreshSignal(prev => prev + 1);
  }, []);

  // Recreate the timer whenever the choice changes. "disabled" -> no timer.
  useEffect(() => {
    const ms = INTERVAL_TO_MS[interval];
    if (ms <= 0) return;
    const id = window.setInterval(() => {
      setRefreshSignal(prev => prev + 1);
    }, ms);
    return () => window.clearInterval(id);
  }, [interval]);

  const value = useMemo<RefreshIntervalContextType>(
    () => ({ interval, setInterval, refreshSignal, forceRefresh }),
    [interval, setInterval, refreshSignal, forceRefresh],
  );

  return (
    <RefreshIntervalContext.Provider value={value}>
      {children}
    </RefreshIntervalContext.Provider>
  );
}

/**
 * Hard-required consumer hook. Throws if used outside the provider so we
 * catch missing-provider bugs at first render rather than producing a
 * mysteriously-frozen UI.
 */
export function useRefreshInterval(): RefreshIntervalContextType {
  const ctx = useContext(RefreshIntervalContext);
  if (!ctx) {
    throw new Error('useRefreshInterval must be used within a RefreshIntervalProvider');
  }
  return ctx;
}

/**
 * Optional consumer for code paths that may render before the provider is
 * mounted (e.g. some test setups). Returns `undefined` instead of throwing.
 */
export function useRefreshIntervalOptional(): RefreshIntervalContextType | undefined {
  return useContext(RefreshIntervalContext);
}
