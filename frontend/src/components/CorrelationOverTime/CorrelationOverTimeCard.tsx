// src/components/CorrelationOverTime/CorrelationOverTimeCard.tsx
// Phase 4: top-level card composition.
// Composes Toolbar + OverlayChart + Legend on top of useCorrelationData.
// Drops cleanly into the dashboard inside a <WidgetCard>.

import React from 'react';
import WidgetCard from '../layout/WidgetCard';
import { useSerial } from '../../context/SerialContext';
import { useTimeRangeOptional } from '../../context/TimeRangeContext';

import { OverlayChart } from './OverlayChart';
import { Legend } from './Legend';
import { Selector } from './Selector';
import { useCorrelationData } from './useCorrelationData';
import { DEFAULT_SIGNAL_IDS } from './signalCatalog';
import { DEFAULT_EVENT_IDS } from './eventCatalog';
import { computeXDomain } from './chartUtils';
import { clearOutOfRangePins, togglePin, toleranceFromSpan } from './interactionUtils';

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

export const CorrelationOverTimeCard: React.FC<CorrelationOverTimeCardProps> = ({
  serial: serialProp,
  chartHeight = 240,
}) => {
  // ----- Time + serial bindings ------------------------------------------
  const serialCtx = useSerial();
  const tr = useTimeRangeOptional();

  const serial = (serialProp ?? serialCtx.serial ?? '').trim();
  const start = tr?.globalTimeRange.startDate ?? null;
  const end = tr?.globalTimeRange.endDate ?? null;

  // ----- Selection state -------------------------------------------------
  const [selectedSignalIds, setSelectedSignalIds] =
    React.useState<string[]>(DEFAULT_SIGNAL_IDS);
  const [selectedEventIds, setSelectedEventIds] =
    React.useState<string[]>(DEFAULT_EVENT_IDS);

  // ----- Pins state ------------------------------------------------------
  const [pins, setPins] = React.useState<number[]>([]);

  // Manual refresh signal.
  const [refetchSignal, setRefetchSignal] = React.useState(0);

  // ----- Data ------------------------------------------------------------
  const { series, events, loading, error } = useCorrelationData({
    serial,
    start,
    end,
    selectedSignalIds,
    selectedEventIds,
    refetchSignal,
  });

  // ----- Edge case: prune pins that fall outside the current time domain.
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

  // ----- Empty / error / no-serial states --------------------------------
  const noSerial = !serial;
  const noSelection = selectedSignalIds.length === 0 && selectedEventIds.length === 0;

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
      <Selector
        kind="events"
        selectedIds={selectedEventIds}
        onChange={setSelectedEventIds}
      />

      <button
        type="button"
        onClick={handleRefresh}
        style={buttonStyle}
        aria-label="Refresh correlation data"
        disabled={noSerial || noSelection}
      >
        ↻ Refresh
      </button>

      {pins.length > 0 && (
        <button
          type="button"
          onClick={clearPins}
          style={buttonStyle}
          aria-label={`Clear ${pins.length} pinned timestamp${pins.length === 1 ? '' : 's'}`}
        >
          Clear pins ({pins.length}/{MAX_PINS})
        </button>
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
              : 'Select at least one signal or event to overlay.'}
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
            />
            <Legend series={series} events={events} />
          </>
        )}
      </div>
    </WidgetCard>
  );
};

export default CorrelationOverTimeCard;
