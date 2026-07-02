// src/components/Weather/useWeatherData.ts
// ---------------------------------------------------------------------------
// Data hook for the Weather Conditions card.
//
// Fetches hourly weather for the customer's ZIP over the dashboard's currently
// selected time range (via the backend /api/weather/ proxy → Open-Meteo).
//
// Open-Meteo returns timestamps in the site's local timezone (because the
// backend requests timezone=auto) plus a utc_offset_seconds. We convert each
// local timestamp back to an absolute epoch instant so the weather x-axis can
// be rendered in whichever display timezone the user has selected — exactly
// aligned with the PV/telemetry charts.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const WEATHER_PATH = '/weather/';

export interface WeatherPoint {
  /** Absolute epoch milliseconds. */
  t: number;
  temperature: number | null;
  cloudcover: number | null;
  precipitation: number | null;
  irradiance: number | null; // shortwave_radiation (W/m²)
  weathercode: number | null;
}

export interface WeatherUnits {
  temperature?: string;
  cloudcover?: string;
  precipitation?: string;
  irradiance?: string;
}

export interface WeatherData {
  points: WeatherPoint[];
  units: WeatherUnits;
  timezone: string | null;
  timezoneAbbreviation: string | null;
  place: string | null;
  state: string | null;
  /** True if the response actually carried an irradiance series. */
  hasIrradiance: boolean;
  /** True if the response actually carried a precipitation series. */
  hasPrecipitation: boolean;
}

interface UseWeatherDataArgs {
  zip: string;
  country: string;
  start: Date | null;
  end: Date | null;
  /** Bumped by the parent to force a refetch. */
  refetchSignal?: number;
}

/** Format a Date as a plain ISO date (YYYY-MM-DD) in the browser locale day. */
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface HourlyResponse {
  time?: string[];
  temperature_2m?: (number | null)[];
  cloudcover?: (number | null)[];
  precipitation?: (number | null)[];
  shortwave_radiation?: (number | null)[];
  weathercode?: (number | null)[];
}

function buildPoints(
  hourly: HourlyResponse,
  utcOffsetSeconds: number,
): WeatherPoint[] {
  const times = hourly.time || [];
  const out: WeatherPoint[] = [];
  for (let i = 0; i < times.length; i++) {
    // times[i] is site-local ISO with no zone marker, e.g. "2024-06-01T13:00".
    // Reinterpret it as UTC, then subtract the site offset to get the true
    // absolute instant.
    const asUtc = new Date(`${times[i]}Z`).getTime();
    if (!Number.isFinite(asUtc)) continue;
    const t = asUtc - utcOffsetSeconds * 1000;
    out.push({
      t,
      temperature: hourly.temperature_2m?.[i] ?? null,
      cloudcover: hourly.cloudcover?.[i] ?? null,
      precipitation: hourly.precipitation?.[i] ?? null,
      irradiance: hourly.shortwave_radiation?.[i] ?? null,
      weathercode: hourly.weathercode?.[i] ?? null,
    });
  }
  return out;
}

export function useWeatherData({
  zip,
  country,
  start,
  end,
  refetchSignal,
}: UseWeatherDataArgs) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const startMs = start ? start.getTime() : null;
  const endMs = end ? end.getTime() : null;

  useEffect(() => {
    if (!zip || startMs == null || endMs == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    const body = {
      zip,
      country,
      start_date: toIsoDate(new Date(startMs)),
      end_date: toIsoDate(new Date(endMs)),
    };

    api
      .post(WEATHER_PATH, body)
      .then(res => {
        if (reqId !== reqIdRef.current) return;
        const d = res.data || {};
        const hourly: HourlyResponse = d.hourly || {};
        const offset = Number(d.utc_offset_seconds) || 0;
        const units = d.units || {};
        setData({
          points: buildPoints(hourly, offset),
          units: {
            temperature: units.temperature_2m,
            cloudcover: units.cloudcover,
            precipitation: units.precipitation,
            irradiance: units.shortwave_radiation,
          },
          timezone: d.timezone || null,
          timezoneAbbreviation: d.timezone_abbreviation || null,
          place: d.location?.place || null,
          state: d.location?.state || null,
          hasIrradiance: Array.isArray(hourly.shortwave_radiation),
          hasPrecipitation: Array.isArray(hourly.precipitation),
        });
      })
      .catch(err => {
        if (reqId !== reqIdRef.current) return;
        setData(null);
        setError(
          err?.response?.data?.error ||
            'Could not load weather for this location and time range',
        );
      })
      .finally(() => {
        if (reqId === reqIdRef.current) setLoading(false);
      });
  }, [zip, country, startMs, endMs, refetchSignal]);

  return { data, loading, error };
}
