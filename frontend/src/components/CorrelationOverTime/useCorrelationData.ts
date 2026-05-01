// src/components/CorrelationOverTime/useCorrelationData.ts
// Phase 1 data hook for the Correlation Over Time card.
//
// Responsibilities:
//   - Resolve selected signal ids -> KQL queries -> AdxRow[] -> SignalSeries[]
//   - Resolve selected event ids -> KQL -> EventInstance[]
//   - Parse timestamps with the shared parseAdxLocaltime util
//   - Down-sample defensively to keep the small card responsive
//
// Out of scope (later phases): chart rendering, tooltip, pins, selector UI.

import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { parseAdxLocaltime } from '../../utils/dateHelpers';
import type { AdxRow } from '../../types';
import { SIGNAL_BY_ID } from './signalCatalog';
import { EVENT_BY_ID, buildEventQuery } from './eventCatalog';
import type {
  CorrelationData,
  EventInstance,
  SignalSeries,
  TimePoint,
} from './types';

const QUERY_PATH = '/query_adx/';

/** Soft cap per series so the card stays smooth even on 7-day ranges. */
const MAX_POINTS_PER_SERIES = 1500;

interface UseCorrelationDataArgs {
  serial: string;
  start: Date | null;
  end: Date | null;
  selectedSignalIds: string[];
  selectedEventIds: string[];
  /** Bumped by the parent to force a refetch (e.g. on "Refresh" click). */
  refetchSignal?: number;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function rowsToPoints(rows: AdxRow[]): TimePoint[] {
  const points: TimePoint[] = [];
  for (const r of rows) {
    if (!r.localtime || r.value_double == null) continue;
    const t = parseAdxLocaltime(r.localtime as string);
    const v = Number(r.value_double);
    if (!Number.isFinite(t) || t === 0 || !Number.isFinite(v)) continue;
    points.push({ t, v });
  }
  points.sort((a, b) => a.t - b.t);
  return points;
}

/** Even-stride downsample to cap render cost without changing shape much. */
function downsamplePoints(points: TimePoint[], cap: number): TimePoint[] {
  if (points.length <= cap) return points;
  const stride = Math.ceil(points.length / cap);
  const out: TimePoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  // Always include the last point so the line reaches the right edge.
  const last = points[points.length - 1];
  if (out[out.length - 1]?.t !== last.t) out.push(last);
  return out;
}

function summarizeRange(points: TimePoint[]): { vMin?: number; vMax?: number } {
  if (!points.length) return {};
  let vMin = points[0].v;
  let vMax = points[0].v;
  for (let i = 1; i < points.length; i++) {
    const v = points[i].v;
    if (v < vMin) vMin = v;
    else if (v > vMax) vMax = v;
  }
  return { vMin, vMax };
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useCorrelationData(args: UseCorrelationDataArgs): CorrelationData {
  const { serial, start, end, selectedSignalIds, selectedEventIds, refetchSignal } = args;

  const [series, setSeries] = useState<SignalSeries[]>([]);
  const [events, setEvents] = useState<EventInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);

  // Avoid race conditions when the user changes selection rapidly.
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!serial || !start || !end) {
      setSeries([]);
      setEvents([]);
      setError(null);
      setPartial(false);
      return;
    }
    if (selectedSignalIds.length === 0 && selectedEventIds.length === 0) {
      setSeries([]);
      setEvents([]);
      setError(null);
      setPartial(false);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    setPartial(false);

    // Collected errors from per-series / per-event promises (first one wins).
    const errorBag: string[] = [];
    const captureError = (label: string, e: unknown) => {
      const msg =
        (typeof e === 'object' && e && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : null) ?? 'request failed';
      errorBag.push(`${label}: ${msg}`);
    };

    const signalPromises = selectedSignalIds.map(async (id): Promise<SignalSeries | null> => {
      const def = SIGNAL_BY_ID[id];
      if (!def) return null;
      try {
        const kql = def.buildQuery(serial, start, end);
        const res = await api.post(QUERY_PATH, { kql });
        const rows: AdxRow[] = (res.data?.data ?? []) as AdxRow[];
        const points = downsamplePoints(rowsToPoints(rows), MAX_POINTS_PER_SERIES);
        const { vMin, vMax } = summarizeRange(points);
        return {
          id: def.id,
          label: def.label,
          unit: def.unit,
          color: def.color,
          dash: def.dash,
          points,
          vMin,
          vMax,
        };
      } catch (e) {
        captureError(def.label, e);
        return {
          id: def.id,
          label: def.label,
          unit: def.unit,
          color: def.color,
          dash: def.dash,
          points: [],
        };
      }
    });

    const eventPromises = selectedEventIds.map(async (id): Promise<EventInstance[]> => {
      const def = EVENT_BY_ID[id];
      if (!def) return [];
      try {
        const kql = buildEventQuery(serial, start, end, def.outputFilter);
        const res = await api.post(QUERY_PATH, { kql });
        const rows: AdxRow[] = (res.data?.data ?? []) as AdxRow[];
        const out: EventInstance[] = [];
        for (const r of rows) {
          const lt = r.localtime as string | undefined;
          if (!lt) continue;
          const t = parseAdxLocaltime(lt);
          if (!Number.isFinite(t) || t === 0) continue;
          const name = (r.name as string | undefined) ?? 'event';
          const value = (r.value as string | number | undefined) ?? '';
          out.push({
            id: `${def.id}:${t}:${name}`,
            categoryId: def.id,
            categoryLabel: def.label,
            color: def.color,
            glyph: def.glyph,
            t,
            title: name,
            description: value !== '' ? `value=${value}` : undefined,
          });
        }
        return out;
      } catch (e) {
        captureError(def.label, e);
        return [];
      }
    });

    Promise.all([Promise.all(signalPromises), Promise.all(eventPromises)])
      .then(([sResults, eResults]) => {
        if (myReqId !== reqIdRef.current) return; // stale
        const cleanSeries = sResults.filter((s): s is SignalSeries => s !== null);
        const flatEvents = eResults.flat().sort((a, b) => a.t - b.t);
        const anyEmpty =
          cleanSeries.some(s => s.points.length === 0) ||
          (selectedEventIds.length > 0 && flatEvents.length === 0);
        setSeries(cleanSeries);
        setEvents(flatEvents);
        setPartial(anyEmpty);
        if (errorBag.length > 0) {
          // Surface the first error; full list logged for debugging.
          // eslint-disable-next-line no-console
          console.warn('[CorrelationOverTime] errors:', errorBag);
          setError(errorBag[0]);
        }
      })
      .catch((e: unknown) => {
        if (myReqId !== reqIdRef.current) return;
        const msg = e instanceof Error ? e.message : 'Failed to load correlation data';
        setError(msg);
      })
      .finally(() => {
        if (myReqId === reqIdRef.current) setLoading(false);
      });
  }, [
    serial,
    start?.getTime(),
    end?.getTime(),
    selectedSignalIds.join(','),
    selectedEventIds.join(','),
    refetchSignal,
  ]);

  return { series, events, loading, error, partial };
}
