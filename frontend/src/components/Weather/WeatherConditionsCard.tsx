// src/components/Weather/WeatherConditionsCard.tsx
// ---------------------------------------------------------------------------
// Weather Conditions card.
//
// Sits directly above the PV History charts. When the customer's ZIP is known
// (entered in the timezone selector), it fetches hourly weather for that
// location over the dashboard's currently selected time range and plots it on
// the SAME x-axis / display timezone as the telemetry charts — so PV output
// can be correlated with irradiance, cloud cover, temperature, etc.
//
// Without a ZIP the card still renders, with a prompt to collect one.
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import WidgetCard from '../layout/WidgetCard';
import { useTimezone } from '../../context/TimezoneContext';
import { useTimeRange } from '../../context/TimeRangeContext';
import { useWeatherData, type WeatherPoint } from './useWeatherData';
import { weatherCodeInfo } from './weatherCodes';

const NO_ZIP_MESSAGE =
  "Get the customer's ZIP/postal code to enable weather charts and customer site time alignment.";

interface MiniChartProps {
  points: WeatherPoint[];
  dataKey: keyof WeatherPoint;
  label: string;
  unit?: string;
  color: string;
  type?: 'area' | 'line';
  domain: [number, number];
  formatTick: (t: number, span: number) => string;
  formatFull: (t: number) => string;
}

const CHART_HEIGHT = 150;

const MiniChart: React.FC<MiniChartProps> = ({
  points,
  dataKey,
  label,
  unit,
  color,
  type = 'area',
  domain,
  formatTick,
  formatFull,
}) => {
  const span = domain[1] - domain[0];
  const hasData = points.some(p => p[dataKey] != null);

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </span>
        {unit && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{unit}</span>
        )}
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart
            data={points}
            margin={{ top: 6, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              type="number"
              dataKey="t"
              domain={domain}
              scale="time"
              tickFormatter={t => formatTick(t as number, span)}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              tickLine={false}
              minTickGap={60}
              allowDataOverflow
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: color, strokeOpacity: 0.5, strokeDasharray: '3 3' }}
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                fontSize: 11,
                color: 'var(--text-primary)',
              }}
              labelFormatter={(t) => formatFull(Number(t))}
              formatter={(v) => [
                `${v ?? '—'}${unit ? ` ${unit}` : ''}`,
                label,
              ]}
            />
            {type === 'area' ? (
              <Area
                type="monotone"
                dataKey={dataKey as string}
                stroke={color}
                fill={color}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey as string}
                stroke={color}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: CHART_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 12,
          }}
        >
          No {label.toLowerCase()} data for this range
        </div>
      )}
    </div>
  );
};

/** Compact strip of condition icons sampled across the selected range. */
const ConditionSummary: React.FC<{
  points: WeatherPoint[];
  formatFull: (t: number) => string;
}> = ({ points, formatFull }) => {
  const samples = useMemo(() => {
    const withCode = points.filter(p => p.weathercode != null);
    if (withCode.length === 0) return [];
    const maxSamples = 12;
    const step = Math.max(1, Math.ceil(withCode.length / maxSamples));
    const out: WeatherPoint[] = [];
    for (let i = 0; i < withCode.length; i += step) out.push(withCode[i]);
    return out;
  }, [points]);

  if (samples.length === 0) {
    return (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
        No condition summary for this range
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {samples.map(p => {
        const info = weatherCodeInfo(p.weathercode);
        return (
          <div
            key={p.t}
            title={`${info.label} · ${formatFull(p.t)}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minWidth: 56,
            }}
          >
            <span style={{ fontSize: 22 }}>{info.icon}</span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
              }}
            >
              {info.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const WeatherConditionsCard: React.FC = () => {
  const { zip, country, activeLabel, siteLocation } = useTimezone();
  const { globalTimeRange } = useTimeRange();
  const start = globalTimeRange.startDate;
  const end = globalTimeRange.endDate;

  const { formatTick, formatFull } = useTimezone();
  const { data, loading, error } = useWeatherData({
    zip,
    country,
    start,
    end,
  });

  const domain: [number, number] = useMemo(
    () => [start.getTime(), end.getTime()],
    [start, end],
  );

  const locationLabel = useMemo(() => {
    if (data?.place) {
      return `${data.place}${data.state ? ', ' + data.state : ''}`;
    }
    if (siteLocation?.place) {
      return `${siteLocation.place}${siteLocation.state ? ', ' + siteLocation.state : ''}`;
    }
    return zip ? `ZIP ${zip}` : '';
  }, [data, siteLocation, zip]);

  return (
    <WidgetCard
      title="🌦️ Weather Conditions"
      actions={
        locationLabel ? (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {locationLabel} · times in {activeLabel}
          </span>
        ) : undefined
      }
    >
      {!zip ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 30, marginBottom: 8 }}>📍</div>
          {NO_ZIP_MESSAGE}
        </div>
      ) : loading ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}
        >
          Loading weather…
        </div>
      ) : error ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--accent-danger, #ef4444)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : data && data.points.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Condition summary
            </div>
            <ConditionSummary points={data.points} formatFull={formatFull} />
          </div>

          {data.hasIrradiance && (
            <MiniChart
              points={data.points}
              dataKey="irradiance"
              label="Solar irradiance"
              unit={data.units.irradiance || 'W/m²'}
              color="#f59e0b"
              type="area"
              domain={domain}
              formatTick={formatTick}
              formatFull={formatFull}
            />
          )}

          <MiniChart
            points={data.points}
            dataKey="cloudcover"
            label="Cloud coverage"
            unit={data.units.cloudcover || '%'}
            color="#64748b"
            type="area"
            domain={domain}
            formatTick={formatTick}
            formatFull={formatFull}
          />

          <MiniChart
            points={data.points}
            dataKey="temperature"
            label="Temperature"
            unit={data.units.temperature || '°C'}
            color="#ef4444"
            type="line"
            domain={domain}
            formatTick={formatTick}
            formatFull={formatFull}
          />

          {data.hasPrecipitation && (
            <MiniChart
              points={data.points}
              dataKey="precipitation"
              label="Precipitation"
              unit={data.units.precipitation || 'mm'}
              color="#3b82f6"
              type="area"
              domain={domain}
              formatTick={formatTick}
              formatFull={formatFull}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}
        >
          No weather data available for this location and time range.
        </div>
      )}
    </WidgetCard>
  );
};

export default WeatherConditionsCard;
