// src/components/CorrelationOverTime/CorrelationOverTimeCard.tsx
//
// Top-level card composition. v2 wiring:
//   - signals: static catalog selector unchanged
//   - events:  dynamic name picker driven by useCorrelationData.availableEventNames
//              (deny-list state to remember user's deselections)
//   - export:  "Export pins (n)" button → CSV snapshot per pinned timestamp
//   - render:  events drawn as scatter dots on a top lane (see OverlayChart)

import React from 'react';
import WidgetCard from '../layout/WidgetCard';
import { useSerial } from '../../context/SerialContext';
import { useTimeRangeOptional } from '../../context/TimeRangeContext';
import { useTimezoneOptional } from '../../context/TimezoneContext';
import { useAuth } from '../../context/AuthContext';

import { OverlayChart } from './OverlayChart';
import { Legend } from './Legend';
import { Selector } from './Selector';
import type { SelectorEventItem } from './Selector';
import { useCorrelationData } from './useCorrelationData';
import type { EventsOutputFilter } from './eventCatalog';
import { computeXDomain } from './chartUtils';
import {
  clearOutOfRangePins,
  togglePin,
  toleranceFromSpan,
} from './interactionUtils';
import {
  buildFullCsv,
  buildFullCsvFilename,
  buildPinsCsv,
  buildPinsCsvFilename,
  downloadCsv,
} from './csvUtils';

const MAX_PINS = 3;

interface CorrelationOverTimeCardProps {
  /** Optional override; defaults to global SerialContext value. */
  serial?: string | null;
  /** Card height for the chart area. */
  chartHeight?: number;
}

const buttonStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: 'var(--accent-primary)',
  background: 'rgba(59,130,246,0.12)',
  color: 'var(--accent-primary)',
  fontWeight: 600,
};

export const CorrelationOverTimeCard: React.FC<CorrelationOverTimeCardProps> = ({
  serial: serialProp,
  chartHeight = 240,
}) => {
  // ----- Time + serial bindings -----------------------------------------
  const serialCtx = useSerial();
  const tr = useTimeRangeOptional();
  const tz = useTimezoneOptional();
  const { isAuthenticated } = useAuth();

  const serial = (serialProp ?? serialCtx.serial ?? '').trim();
  const start = tr?.globalTimeRange.startDate ?? null;
  const end = tr?.globalTimeRange.endDate ?? null;

  // ----- Selection state -------------------------------------------------
  // Defaults are intentionally empty: when the user (re)opens the dashboard
  // — including after a session timeout that forces re-login — nothing is
  // pre-selected. They must explicitly pick signals and/or turn events on.
  const [selectedSignalIds, setSelectedSignalIds] =
    React.useState<string[]>([]);

  // Events start OFF; user opts in.
  const [eventsEnabled, setEventsEnabled] = React.useState(false);
  // DENY-list: names the user has explicitly turned OFF. New names default
  // to "shown" because they aren't in this set.
  const [excludedEventNames, setExcludedEventNames] = React.useState<string[]>(
    [],
  );
  // Server-side filter — default to "active alarms only" (value==1) which
  // matches the Events tab's default and keeps the row count manageable on
  // long ranges (e.g. 7 days).
  const [eventsOutputFilter, setEventsOutputFilter] =
    React.useState<EventsOutputFilter>('1');

  // ----- Pins state ------------------------------------------------------
  const [pins, setPins] = React.useState<number[]>([]);

  // ----- Zoom state ------------------------------------------------------
  // Active drag-zoom window [startMs, endMs]; null = full view. Driven by the
  // OverlayChart's drag-select, cleared via "Reset zoom".
  const [zoomDomain, setZoomDomain] = React.useState<[number, number] | null>(
    null,
  );

  // Manual refresh signal.
  const [refetchSignal, setRefetchSignal] = React.useState(0);

  // ----- Data ------------------------------------------------------------
  const {
    series,
    events,
    availableEventNames,
    loading,
    error,
  } = useCorrelationData({
    serial,
    start,
    end,
    selectedSignalIds,
    eventsEnabled,
    excludedEventNames,
    eventsOutputFilter,
    refetchSignal,
  });

  // ----- X domain & pin housekeeping ------------------------------------
  const xDomain = React.useMemo(
    () => computeXDomain(start, end, series, events),
    [start, end, series, events],
  );
  React.useEffect(() => {
    setPins(prev => {
      const next = clearOutOfRangePins(prev, xDomain);
      return next.length === prev.length ? prev : next;
    });
  }, [xDomain[0], xDomain[1]]);

  // Reset any active zoom when the underlying global time range changes, so a
  // stale window can't linger outside the newly-selected range.
  React.useEffect(() => {
    setZoomDomain(null);
  }, [start?.getTime(), end?.getTime()]);

  // ----- Button-driven zoom (in / out) ----------------------------------
  // Step-zoom around the center of the currently-visible window. Zoom-in
  // halves the span; zoom-out doubles it, clamped to the full range (and
  // cleared entirely once it reaches the full extent).
  const zoomBy = React.useCallback(
    (factor: number) => {
      const [fullLo, fullHi] = xDomain;
      const fullSpan = fullHi - fullLo;
      if (!(fullSpan > 0)) return;
      const [lo, hi] = zoomDomain ?? xDomain;
      const center = (lo + hi) / 2;
      const newSpan = (hi - lo) * factor;
      // Zooming out to (or past) the full range just clears the zoom.
      if (newSpan >= fullSpan) {
        setZoomDomain(null);
        return;
      }
      let nextLo = center - newSpan / 2;
      let nextHi = center + newSpan / 2;
      // Keep the window inside the full range.
      if (nextLo < fullLo) {
        nextHi += fullLo - nextLo;
        nextLo = fullLo;
      }
      if (nextHi > fullHi) {
        nextLo -= nextHi - fullHi;
        nextHi = fullHi;
      }
      setZoomDomain([Math.max(nextLo, fullLo), Math.min(nextHi, fullHi)]);
    },
    [xDomain, zoomDomain],
  );
  const zoomIn = React.useCallback(() => zoomBy(0.5), [zoomBy]);
  const zoomOut = React.useCallback(() => zoomBy(2), [zoomBy]);

  // ----- Button-driven pan (left / right) -------------------------------
  // Shift the visible window along the time axis by a fraction of its span,
  // clamped so it never slides past the full range. Only meaningful while a
  // zoom window is active (fraction < 0: earlier, > 0: later).
  const panBy = React.useCallback(
    (fraction: number) => {
      if (!zoomDomain) return;
      const [fullLo, fullHi] = xDomain;
      const [lo, hi] = zoomDomain;
      const winSpan = hi - lo;
      if (!(winSpan > 0)) return;
      let nextLo = lo + winSpan * fraction;
      let nextHi = hi + winSpan * fraction;
      if (nextLo < fullLo) {
        nextLo = fullLo;
        nextHi = fullLo + winSpan;
      }
      if (nextHi > fullHi) {
        nextHi = fullHi;
        nextLo = fullHi - winSpan;
      }
      setZoomDomain([nextLo, nextHi]);
    },
    [xDomain, zoomDomain],
  );
  const panLeft = React.useCallback(() => panBy(-0.25), [panBy]);
  const panRight = React.useCallback(() => panBy(0.25), [panBy]);

  // ----- Session-timeout reset ------------------------------------------
  // Whenever the user is no longer authenticated (logout or session timeout
  // forcing a re-login), wipe every selection so that on the next sign-in
  // the card opens with nothing pre-selected — matching the "fresh" defaults.
  React.useEffect(() => {
    if (!isAuthenticated) {
      setSelectedSignalIds([]);
      setEventsEnabled(false);
      setExcludedEventNames([]);
      setPins([]);
      setZoomDomain(null);
    }
  }, [isAuthenticated]);

  // ----- Event picker bridging ------------------------------------------
  // selector items: every available name with color + count
  const eventSelectorItems: SelectorEventItem[] = React.useMemo(
    () =>
      availableEventNames.map(n => ({
        id: n.name,
        label: n.name,
        color: n.color,
        count: n.count,
      })),
    [availableEventNames],
  );
  // selector "selectedIds" = available − excluded (so checked = visible)
  const selectorSelectedEventNames = React.useMemo(() => {
    const excluded = new Set(excludedEventNames);
    return availableEventNames
      .map(n => n.name)
      .filter(n => !excluded.has(n));
  }, [availableEventNames, excludedEventNames]);
  // when the selector reports a new "selected" set, derive the new exclusion list
  const handleEventSelectionChange = React.useCallback(
    (ids: string[]) => {
      const selected = new Set(ids);
      const next = availableEventNames
        .map(n => n.name)
        .filter(n => !selected.has(n));
      setExcludedEventNames(next);
      // If the user selected anything, ensure events are enabled.
      if (ids.length > 0) setEventsEnabled(true);
    },
    [availableEventNames],
  );

  // ----- Handlers --------------------------------------------------------
  const handlePinToggle = React.useCallback(
    (t: number) => {
      const span = xDomain[1] - xDomain[0];
      const tol = toleranceFromSpan(span);
      setPins(prev => togglePin(prev, t, tol, MAX_PINS));
    },
    [xDomain[0], xDomain[1]],
  );

  const handleRefresh = React.useCallback(() => {
    setRefetchSignal(n => n + 1);
  }, []);

  const clearPins = React.useCallback(() => setPins([]), []);
  const handleExportPins = React.useCallback(() => {
    if (pins.length === 0) return;
    const span = xDomain[1] - xDomain[0];
    const tol = toleranceFromSpan(span);
    const csv = buildPinsCsv({ pins, series, events, tolerance: tol, serial });
    downloadCsv(buildPinsCsvFilename(serial || null), csv);
  }, [pins, series, events, xDomain, serial]);

  // Export every signal sample + every event currently loaded into the
  // chart (not just the pinned timestamps).
  const handleExportAll = React.useCallback(() => {
    const csv = buildFullCsv({ series, events, serial });
    downloadCsv(buildFullCsvFilename(serial || null), csv);
  }, [series, events, serial]);

  const hasAnyData = React.useMemo(
    () => series.some(s => s.points.length > 0) || events.length > 0,
    [series, events],
  );

  const handleToggleEventsEnabled = React.useCallback(() => {
    setEventsEnabled(prev => {
      const next = !prev;
      // When re-enabling, clear the deny list so the user gets everything back.
      if (next) setExcludedEventNames([]);
      return next;
    });
  }, []);

  // ----- Empty / error / no-serial states --------------------------------
  const noSerial = !serial;
  const noSelection = selectedSignalIds.length === 0 && !eventsEnabled;

  // ----- Toolbar ---------------------------------------------------------
  const toolbar = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Selector
        kind="signals"
        selectedIds={selectedSignalIds}
        onChange={setSelectedSignalIds}
      />

      <button
        type="button"
        onClick={handleToggleEventsEnabled}
        style={{
          ...buttonStyle,
          background: eventsEnabled
            ? 'rgba(59,130,246,0.12)'
            : 'var(--bg-elevated)',
          color: eventsEnabled
            ? 'var(--accent-primary)'
            : 'var(--text-secondary)',
        }}
        aria-pressed={eventsEnabled}
        title={
          eventsEnabled
            ? 'Hide all events'
            : 'Show events for the current time range'
        }
      >
        {eventsEnabled ? '● Events on' : '○ Events off'}
      </button>

      {eventsEnabled && (
        <>
          <button
            type="button"
            onClick={() =>
              setEventsOutputFilter(prev => (prev === '1' ? 'all' : '1'))
            }
            style={buttonStyle}
            aria-pressed={eventsOutputFilter === '1'}
            title={
              eventsOutputFilter === '1'
                ? 'Currently showing only active alarms (value=1). Click to also include cleared transitions.'
                : 'Currently showing all alarm transitions (active + cleared). Click to limit to active only.'
            }
          >
            {eventsOutputFilter === '1' ? '◉ Active only' : '◎ All transitions'}
          </button>

          <Selector
            kind="events"
            selectedIds={selectorSelectedEventNames}
            onChange={handleEventSelectionChange}
            availableItems={eventSelectorItems}
            buttonLabel={
              loading && availableEventNames.length === 0
                ? 'Events (loading…)'
                : availableEventNames.length === 0
                  ? 'Events (none)'
                  : `Events (${selectorSelectedEventNames.length} of ${availableEventNames.length})`
            }
          />
        </>
      )}

      <button
        type="button"
        onClick={handleRefresh}
        style={buttonStyle}
        aria-label="Refresh correlation data"
        disabled={noSerial || noSelection}
      >
        ↻ Refresh
      </button>

      {hasAnyData && (
        <button
          type="button"
          onClick={handleExportAll}
          style={buttonStyle}
          aria-label="Export all signals and events currently shown in the chart to CSV"
          title="Download a CSV with every signal sample and every event currently loaded in the chart"
        >
          ⤓ Export all
        </button>
      )}

      {hasAnyData && (
        <button
          type="button"
          onClick={zoomIn}
          style={buttonStyle}
          aria-label="Zoom in on the center of the current view"
          title="Zoom in (show a narrower time range)"
        >
          ＋ Zoom in
        </button>
      )}

      {hasAnyData && (
        <button
          type="button"
          onClick={zoomOut}
          style={buttonStyle}
          aria-label="Zoom out from the center of the current view"
          title="Zoom out (show a wider time range)"
          disabled={!zoomDomain}
        >
          － Zoom out
        </button>
      )}

      {zoomDomain && (
        <button
          type="button"
          onClick={panLeft}
          style={buttonStyle}
          aria-label="Pan the view earlier in time"
          title="Pan left (earlier) · tip: Shift+drag on the chart also pans"
        >
          ◀ Pan
        </button>
      )}

      {zoomDomain && (
        <button
          type="button"
          onClick={panRight}
          style={buttonStyle}
          aria-label="Pan the view later in time"
          title="Pan right (later) · tip: Shift+drag on the chart also pans"
        >
          Pan ▶
        </button>
      )}

      {zoomDomain && (
        <button
          type="button"
          onClick={() => setZoomDomain(null)}
          style={primaryButtonStyle}
          aria-label="Reset zoom to the full time range"
          title="Return to the full time range"
        >
          ⤢ Reset zoom
        </button>
      )}

      {pins.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleExportPins}
            style={primaryButtonStyle}
            aria-label={`Export ${pins.length} pinned snapshot${pins.length === 1 ? '' : 's'} to CSV`}
            title="Download a CSV with one row per (pin × signal) and (pin × event)"
          >
            ⤓ Export pins ({pins.length})
          </button>
          <button
            type="button"
            onClick={clearPins}
            style={buttonStyle}
            aria-label={`Clear ${pins.length} pinned timestamp${pins.length === 1 ? '' : 's'}`}
          >
            Clear pins ({pins.length}/{MAX_PINS})
          </button>
        </>
      )}

      {loading && (
        <span
          aria-live="polite"
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Loading…
        </span>
      )}

      {error && (
        <span
          role="alert"
          style={{
            fontSize: 11,
            color: 'var(--status-critical, #ef4444)',
            background: 'rgba(239,68,68,0.1)',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {error}
        </span>
      )}

      <span
        aria-live="polite"
        style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pins.length > 0 ? `${pins.length} pin${pins.length === 1 ? '' : 's'}` : ''}
      </span>
    </div>
  );

  // ----- Body ------------------------------------------------------------
  const showEmpty = noSerial || noSelection;

  return (
    <WidgetCard
      title="Correlation Over Time"
      actions={null}
      isEmpty={false /* we render our own conditional empty state below toolbar */}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toolbar}

        {showEmpty ? (
          <div
            style={{
              minHeight: chartHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              fontSize: 12,
              border: '1px dashed var(--border-subtle)',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
            }}
          >
            {noSerial
              ? 'Search a device to begin correlating signals over time.'
              : 'Select at least one signal or enable events to overlay.'}
          </div>
        ) : (
          <>
            <OverlayChart
              series={series}
              events={events}
              start={start}
              end={end}
              height={chartHeight}
              pins={pins}
              onPinToggle={handlePinToggle}
              zoomDomain={zoomDomain}
              onZoomChange={setZoomDomain}
              timeZone={tz?.effectiveTimeZone}
            />
            <Legend series={series} events={events} />
          </>
        )}
      </div>
    </WidgetCard>
  );
};

export default CorrelationOverTimeCard;
