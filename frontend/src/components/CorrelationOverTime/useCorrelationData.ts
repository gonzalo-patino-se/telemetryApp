// src/components/CorrelationOverTime/useCorrelationData.ts
//
// Data hook for the Correlation Over Time card.
//
// v2 changes (event picker became dynamic):
//   - Events are now fetched ONCE per (serial, range) using outputFilter='all'.
//   - The unique `name` values become the entries in the event picker.
//   - Each name gets a deterministic color via colorForEventName().
//   - Caller passes `excludedEventNames` to hide specific names, instead of
//     selecting from a static category catalog.
//
// Out of scope: chart rendering, tooltip, pins, selector UI.

import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { parseAdxLocaltime } from '../../utils/dateHelpers';
import type { AdxRow } from '../../types';
import { SIGNAL_BY_ID } from './signalCatalog';
import {
  buildEventQuery,
  colorForEventName,
  type EventsOutputFilter,
} from './eventCatalog';
import type {
  CorrelationData,
  EventInstance,
  EventNameInfo,
  SignalSeries,
  TimePoint,
} from './types';

const QUERY_PATH = '/query_adx/';

/** Soft cap per series so the card stays smooth even on 7-day ranges. */
const MAX_POINTS_PER_SERIES = 1500;

/** Cap on ✕ "no data" markers per series so a fully-missing signal stays legible. */
const MAX_GAP_MARKERS = 200;

interface UseCorrelationDataArgs {
  serial: string;
  start: Date | null;
  end: Date | null;
  selectedSignalIds: string[];
  /** When true, the hook fetches alarm transitions in the current range. */
  eventsEnabled: boolean;
  /**
   * Names the user has explicitly turned OFF in the picker. Treating it as
   * a denylist means newly-discovered names default to "shown".
   */
  excludedEventNames: string[];
  /**
   * Server-side alarm value filter. '1' = active only (default — keeps row
   * counts manageable on 7d ranges), '0' = cleared only, 'all' = both.
   */
  eventsOutputFilter?: EventsOutputFilter;
  /** Bumped by the parent to force a refetch (e.g. on "Refresh" click). */
  refetchSignal?: number;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function rowsToPointsAndGaps(
  rows: AdxRow[],
  collectGaps: boolean,
): { points: TimePoint[]; gaps: number[] } {
  const points: TimePoint[] = [];
  const gaps: number[] = [];
  for (const r of rows) {
    if (!r.localtime) continue;
    const t = parseAdxLocaltime(r.localtime as string);
    if (!Number.isFinite(t) || t === 0) continue;
    const v = r.value_double == null ? NaN : Number(r.value_double);
    if (Number.isFinite(v)) {
      points.push({ t, v });
    } else if (collectGaps) {
      gaps.push(t);
    }
  }
  points.sort((a, b) => a.t - b.t);
  gaps.sort((a, b) => a - b);
  return { points, gaps };
}

function downsamplePoints(points: TimePoint[], cap: number): TimePoint[] {
  if (points.length <= cap) return points;
  const stride = Math.ceil(points.length / cap);
  const out: TimePoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  const last = points[points.length - 1];
  if (out[out.length - 1]?.t !== last.t) out.push(last);
  return out;
}

/** Uniform-stride downsample for a sorted list of timestamps (✕ markers). */
function downsampleTimes(times: number[], cap: number): number[] {
  if (times.length <= cap) return times;
  const stride = Math.ceil(times.length / cap);
  const out: number[] = [];
  for (let i = 0; i < times.length; i += stride) out.push(times[i]);
  const last = times[times.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
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

/**
 * Convert raw Alarms rows to EventInstance + an aggregated availableEventNames
 * list (one entry per distinct name, with palette color and occurrence count).
 *
 * Row shape mirrors src/pages/Events.tsx: { localtime, name, value }.
 */
function buildEvents(
  rows: AdxRow[],
): { events: EventInstance[]; available: EventNameInfo[] } {
  const events: EventInstance[] = [];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const lt = r.localtime as string | undefined;
    if (!lt) continue;
    const t = parseAdxLocaltime(lt);
    if (!Number.isFinite(t) || t === 0) continue;
    const name = ((r.name as string | undefined) ?? 'event').trim() || 'event';
    // The Events tab reads `value` (not `value_double`); accept both for
    // resilience but prefer `value`.
    const valueRaw =
      (r.value as number | string | undefined) ??
      (r.value_double as number | string | undefined);
    const valueNum =
      valueRaw == null || valueRaw === '' ? undefined : Number(valueRaw);
    const color = colorForEventName(name);
    events.push({
      id: `${name}:${t}:${valueNum ?? ''}`,
      categoryId: name,
      categoryLabel: name,
      color,
      t,
      title: name,
      description:
        valueNum === 1
          ? 'active'
          : valueNum === 0
            ? 'cleared'
            : valueNum != null
              ? `value=${valueNum}`
              : undefined,
      value: Number.isFinite(valueNum as number)
        ? (valueNum as number)
        : undefined,
    });
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  events.sort((a, b) => a.t - b.t);
  const available: EventNameInfo[] = Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      color: colorForEventName(name),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { events, available };
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useCorrelationData(
  args: UseCorrelationDataArgs,
): CorrelationData {
  const {
    serial,
    start,
    end,
    selectedSignalIds,
    eventsEnabled,
    excludedEventNames,
    eventsOutputFilter = '1',
    refetchSignal,
  } = args;

  const [series, setSeries] = useState<SignalSeries[]>([]);
  const [allEvents, setAllEvents] = useState<EventInstance[]>([]);
  const [availableEventNames, setAvailableEventNames] = useState<EventNameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);

  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!serial || !start || !end) {
      setSeries([]);
      setAllEvents([]);
      setAvailableEventNames([]);
      setError(null);
      setPartial(false);
      return;
    }
    if (selectedSignalIds.length === 0 && !eventsEnabled) {
      setSeries([]);
      setAllEvents([]);
      setAvailableEventNames([]);
      setError(null);
      setPartial(false);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    setPartial(false);

    const errorBag: string[] = [];
    const captureError = (label: string, e: unknown) => {
      const msg =
        typeof e === 'object' && e && 'message' in e
        && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : 'request failed';
      errorBag.push(`${label}: ${msg}`);
    };

    const signalPromises = selectedSignalIds.map(
      async (id): Promise<SignalSeries | null> => {
        const def = SIGNAL_BY_ID[id];
        if (!def) return null;
        try {
          const kql = def.buildQuery(serial, start, end);
          const res = await api.post(QUERY_PATH, { kql });
          const rows: AdxRow[] = (res.data?.data ?? []) as AdxRow[];
          const { points: rawPoints, gaps: rawGaps } = rowsToPointsAndGaps(
            rows,
            def.markMissing === true,
          );
          const points = downsamplePoints(rawPoints, MAX_POINTS_PER_SERIES);
          const gaps = downsampleTimes(rawGaps, MAX_GAP_MARKERS);
          const { vMin, vMax } = summarizeRange(points);
          return {
            id: def.id,
            label: def.label,
            unit: def.unit,
            color: def.color,
            dash: def.dash,
            points,
            gaps,
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
      },
    );

    const eventsPromise: Promise<{
      events: EventInstance[];
      available: EventNameInfo[];
    }> = eventsEnabled
      ? (async () => {
          try {
            const kql = buildEventQuery(serial, start, end, undefined, eventsOutputFilter);
            const res = await api.post(QUERY_PATH, { kql });
            const rows: AdxRow[] = (res.data?.data ?? []) as AdxRow[];
            return buildEvents(rows);
          } catch (e) {
            captureError('events', e);
            return { events: [], available: [] };
          }
        })()
      : Promise.resolve({ events: [], available: [] });

    Promise.all([Promise.all(signalPromises), eventsPromise])
      .then(([sResults, eResult]) => {
        if (myReqId !== reqIdRef.current) return; // stale
        const cleanSeries = sResults.filter(
          (s): s is SignalSeries => s !== null,
        );
        const anyEmpty =
          cleanSeries.some(s => s.points.length === 0) ||
          (eventsEnabled && eResult.events.length === 0);
        setSeries(cleanSeries);
        setAllEvents(eResult.events);
        setAvailableEventNames(eResult.available);
        setPartial(anyEmpty);
        if (errorBag.length > 0) {
          // eslint-disable-next-line no-console
          console.warn('[CorrelationOverTime] errors:', errorBag);
          setError(errorBag[0]);
        }
      })
      .catch((e: unknown) => {
        if (myReqId !== reqIdRef.current) return;
        const msg =
          e instanceof Error ? e.message : 'Failed to load correlation data';
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
    eventsEnabled,
    eventsOutputFilter,
    refetchSignal,
  ]);

  // Apply the deny-list filter on every render — cheap and avoids stale state
  // when the user toggles names without changing the underlying fetch.
  const excludedSet = new Set(excludedEventNames);
  const events =
    excludedSet.size === 0
      ? allEvents
      : allEvents.filter(e => !excludedSet.has(e.categoryId));

  return {
    series,
    events,
    availableEventNames,
    loading,
    error,
    partial,
  };
}
