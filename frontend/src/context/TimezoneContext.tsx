// src/context/TimezoneContext.tsx
// ---------------------------------------------------------------------------
// Global timezone display setting for the dashboard.
//
// Lets the user render every timestamp (axes, tooltips, cards) in one of:
//   * UTC
//   * Browser local time
//   * Customer site local time (resolved from a ZIP/postal code)
//
// The ZIP code is also reused by the Weather Conditions card. Selection and
// ZIP are persisted to localStorage (mirrors the ThemeContext pattern). The
// site timezone is resolved on demand via the backend /api/geo_timezone/ proxy.
// ---------------------------------------------------------------------------

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../services/api';
import {
  resolveTimeZone,
  formatFullInZone,
  formatTickInZone,
  tzModeLabel,
  type TimezoneMode,
} from '../utils/timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiteLocation {
  zip: string;
  country: string;
  place: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface TimezoneContextValue {
  /** Active display mode. */
  mode: TimezoneMode;
  setMode: (mode: TimezoneMode) => void;

  /** Customer ZIP/postal code (shared with the Weather card). */
  zip: string;
  /** 2-letter country code for the ZIP (defaults to 'us'). */
  country: string;
  /** Persist a new ZIP/country and re-resolve the site timezone. */
  setZipCountry: (zip: string, country?: string) => void;

  /** Resolved IANA timezone for the site (e.g. "America/Los_Angeles"). */
  siteTimeZone: string | null;
  /** Short abbreviation for the site zone (e.g. "PDT"), when known. */
  siteAbbreviation: string | null;
  /** Resolved site location metadata, when available. */
  siteLocation: SiteLocation | null;

  /** True while resolving the site timezone from the ZIP. */
  resolving: boolean;
  /** Error message from the last resolve attempt, if any. */
  resolveError: string | null;

  /** IANA zone string to pass to Intl (undefined = browser-local). */
  effectiveTimeZone: string | undefined;
  /** Short label for the active zone, e.g. "UTC" / "Local" / "PDT". */
  activeLabel: string;

  /** Format helpers bound to the active timezone. */
  formatTick: (t: number, span: number) => string;
  formatFull: (t: number) => string;
}

const TimezoneContext = createContext<TimezoneContextValue | undefined>(undefined);

const LS_MODE = 'app-tz-mode';
const LS_ZIP = 'app-tz-zip';
const LS_COUNTRY = 'app-tz-country';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<TimezoneMode>(() => {
    const stored = localStorage.getItem(LS_MODE);
    return stored === 'utc' || stored === 'browser' || stored === 'site'
      ? stored
      : 'browser';
  });
  const [zip, setZip] = useState<string>(() => localStorage.getItem(LS_ZIP) || '');
  const [country, setCountry] = useState<string>(
    () => localStorage.getItem(LS_COUNTRY) || 'us',
  );

  const [siteTimeZone, setSiteTimeZone] = useState<string | null>(null);
  const [siteAbbreviation, setSiteAbbreviation] = useState<string | null>(null);
  const [siteLocation, setSiteLocation] = useState<SiteLocation | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const setMode = useCallback((next: TimezoneMode) => {
    setModeState(next);
    localStorage.setItem(LS_MODE, next);
  }, []);

  const setZipCountry = useCallback((nextZip: string, nextCountry?: string) => {
    const z = (nextZip || '').trim();
    const c = (nextCountry || 'us').trim().toLowerCase();
    setZip(z);
    setCountry(c);
    localStorage.setItem(LS_ZIP, z);
    localStorage.setItem(LS_COUNTRY, c);
  }, []);

  // Resolve the site timezone whenever we have a ZIP (regardless of mode, so
  // the Weather card and a later switch to 'site' both work immediately).
  useEffect(() => {
    if (!zip) {
      setSiteTimeZone(null);
      setSiteAbbreviation(null);
      setSiteLocation(null);
      setResolveError(null);
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolveError(null);
    api
      .post('/geo_timezone/', { zip, country })
      .then(res => {
        if (cancelled) return;
        const data = res.data || {};
        setSiteTimeZone(data.timezone || null);
        setSiteAbbreviation(data.timezone_abbreviation || null);
        setSiteLocation(data.location || null);
      })
      .catch(err => {
        if (cancelled) return;
        setSiteTimeZone(null);
        setSiteAbbreviation(null);
        setSiteLocation(null);
        // Surface the real cause: a backend WeatherServiceError message, an
        // HTTP status (e.g. 401 auth), or a browser-level network failure.
        const status = err?.response?.status;
        const detail =
          err?.response?.data?.error || err?.response?.data?.detail;
        let message: string;
        if (detail) {
          message = detail;
        } else if (status === 401 || status === 403) {
          message = 'Session expired — please sign in again';
        } else if (status) {
          message = `Timezone lookup failed (HTTP ${status})`;
        } else {
          message = `Network error reaching server${
            err?.message ? ` (${err.message})` : ''
          }`;
        }
        setResolveError(message);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zip, country]);

  const effectiveTimeZone = useMemo(
    () => resolveTimeZone(mode, siteTimeZone),
    [mode, siteTimeZone],
  );

  const activeLabel = useMemo(
    () => tzModeLabel(mode, siteAbbreviation),
    [mode, siteAbbreviation],
  );

  const formatTick = useCallback(
    (t: number, span: number) => formatTickInZone(t, span, effectiveTimeZone),
    [effectiveTimeZone],
  );
  const formatFull = useCallback(
    (t: number) => formatFullInZone(t, effectiveTimeZone),
    [effectiveTimeZone],
  );

  const value: TimezoneContextValue = {
    mode,
    setMode,
    zip,
    country,
    setZipCountry,
    siteTimeZone,
    siteAbbreviation,
    siteLocation,
    resolving,
    resolveError,
    effectiveTimeZone,
    activeLabel,
    formatTick,
    formatFull,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useTimezone = (): TimezoneContextValue => {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return ctx;
};

/** Optional variant for components that may render outside the provider. */
export const useTimezoneOptional = (): TimezoneContextValue | undefined =>
  useContext(TimezoneContext);
