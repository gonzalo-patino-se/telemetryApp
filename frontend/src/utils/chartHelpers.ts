// src/utils/chartHelpers.ts
// Chart.js utilities for building chart configurations
// Centralized chart logic for consistency and reusability

import type { ChartOptions, ScatterDataPoint } from 'chart.js';
import type { AdxRow, ChartColorScheme, PointStyle } from '../types';
import { parseAdxLocaltime, formatTooltipDate } from './dateHelpers';

// ============================================================================
// Statistics Types & Helpers
// ============================================================================

export interface DataStatistics {
  count: number;
  min: number;
  max: number;
  avg: number;
  stdDev: number;
}

/**
 * Calculate statistics from an array of numeric values
 * Returns min, max, average, and standard deviation
 */
export function calculateStatistics(values: number[]): DataStatistics | null {
  if (!values || values.length === 0) return null;
  
  const count = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / count;
  
  // Calculate standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return { count, min, max, avg, stdDev };
}

/**
 * Calculate statistics from chart scatter points
 */
export function calculatePointStatistics(points: ScatterDataPoint[]): DataStatistics | null {
  const values = points
    .map(p => p.y as number)
    .filter(v => Number.isFinite(v));
  return calculateStatistics(values);
}

/**
 * Format a statistic value with appropriate precision
 */
export function formatStatValue(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals);
}

// ============================================================================
// Default Color Schemes
// ============================================================================

export const chartColorSchemes = {
  blue: {
    line: '#2563eb',
    fill: 'rgba(37, 99, 235, 0.15)',
    point: {
      radius: 4,
      backgroundColor: '#2563eb',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      hoverRadius: 6,
      hoverBackgroundColor: '#1d4ed8',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
      style: 'circle' as const,
    },
  },
  green: {
    line: '#10b981',
    fill: 'rgba(16, 185, 129, 0.15)',
    point: {
      radius: 4,
      backgroundColor: '#10b981',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      hoverRadius: 6,
      hoverBackgroundColor: '#059669',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
      style: 'circle' as const,
    },
  },
  purple: {
    line: '#8b5cf6',
    fill: 'rgba(139, 92, 246, 0.15)',
    point: {
      radius: 4,
      backgroundColor: '#8b5cf6',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      hoverRadius: 6,
      hoverBackgroundColor: '#7c3aed',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
      style: 'circle' as const,
    },
  },
  orange: {
    line: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.15)',
    point: {
      radius: 4,
      backgroundColor: '#f59e0b',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      hoverRadius: 6,
      hoverBackgroundColor: '#d97706',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
      style: 'circle' as const,
    },
  },
  red: {
    line: '#ef4444',
    fill: 'rgba(239, 68, 68, 0.15)',
    point: {
      radius: 6,
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
      borderWidth: 2,
      hoverRadius: 8,
      hoverBackgroundColor: '#dc2626',
      hoverBorderColor: '#dc2626',
      hoverBorderWidth: 2,
      style: 'crossRot' as const,
    },
  },
  // Special style for zero values - uses star marker
  zeroValue: {
    line: '#fbbf24',
    fill: 'rgba(251, 191, 36, 0.15)',
    point: {
      radius: 6,
      backgroundColor: '#fbbf24',
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverRadius: 8,
      hoverBackgroundColor: '#f59e0b',
      hoverBorderColor: '#ffffff',
      hoverBorderWidth: 2,
      style: 'star' as const,
    },
  },
} as const;

// ============================================================================
// Point Styling
// ============================================================================

/**
 * Get point style arrays for dynamic styling based on values
 * Used for special indicators (e.g., offline status, zero values)
 * - Zero values are marked with a star (★)
 * - Special values (e.g., offline) are marked with a cross (✕)
 */
export function getPointStyles(
  points: ScatterDataPoint[],
  colorScheme: ChartColorScheme,
  isSpecialValue?: (value: number) => boolean,
  specialStyle?: PointStyle
): {
  pointStyle: ('circle' | 'crossRot' | 'star')[];
  pointRadius: number[];
  pointBackgroundColor: string[];
  pointBorderColor: string[];
  pointBorderWidth: number[];
  pointHoverRadius: number[];
  pointHoverBackgroundColor: string[];
  pointHoverBorderColor: string[];
} {
  const defaultStyle = colorScheme.point;
  const special = specialStyle || chartColorSchemes.red.point;
  const zeroStyle = chartColorSchemes.zeroValue.point;

  // Helper to determine point style type
  const getStyleType = (value: number): 'special' | 'zero' | 'normal' => {
    if (isSpecialValue?.(value)) return 'special';
    if (value === 0) return 'zero';
    return 'normal';
  };

  return {
    pointStyle: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return 'crossRot';
      if (type === 'zero') return 'star';
      return 'circle';
    }),
    pointRadius: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.radius;
      if (type === 'zero') return zeroStyle.radius;
      return defaultStyle.radius;
    }),
    pointBackgroundColor: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.backgroundColor;
      if (type === 'zero') return zeroStyle.backgroundColor;
      return defaultStyle.backgroundColor;
    }),
    pointBorderColor: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.borderColor;
      if (type === 'zero') return zeroStyle.borderColor;
      return defaultStyle.borderColor;
    }),
    pointBorderWidth: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.borderWidth;
      if (type === 'zero') return zeroStyle.borderWidth;
      return defaultStyle.borderWidth;
    }),
    pointHoverRadius: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.hoverRadius;
      if (type === 'zero') return zeroStyle.hoverRadius;
      return defaultStyle.hoverRadius;
    }),
    pointHoverBackgroundColor: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.hoverBackgroundColor;
      if (type === 'zero') return zeroStyle.hoverBackgroundColor;
      return defaultStyle.hoverBackgroundColor;
    }),
    pointHoverBorderColor: points.map(p => {
      const type = getStyleType(p.y as number);
      if (type === 'special') return special.hoverBorderColor;
      if (type === 'zero') return zeroStyle.hoverBorderColor;
      return defaultStyle.hoverBorderColor;
    }),
  };
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Convert ADX rows to chart scatter points
 */
export function rowsToChartPoints(rows: AdxRow[]): ScatterDataPoint[] {
  return (rows || [])
    .filter(r => r && r.localtime && Number.isFinite(Number(r.value_double)))
    .map(r => ({
      x: parseAdxLocaltime(r.localtime as string),
      y: Number(r.value_double),
    }));
}

/**
 * Evenly downsample array to reduce chart points for performance
 */
export function downsampleData<T>(arr: T[], maxPoints: number): T[] {
  if (!Array.isArray(arr)) return [];
  if (arr.length <= maxPoints) return arr;
  
  const step = Math.ceil(arr.length / maxPoints);
  const out: T[] = [];
  
  for (let i = 0; i < arr.length; i += step) {
    out.push(arr[i]);
  }
  
  // Always include last point
  if (out[out.length - 1] !== arr[arr.length - 1]) {
    out.push(arr[arr.length - 1]);
  }
  
  return out;
}

// ============================================================================
// Chart Options Factory
// ============================================================================

interface TooltipConfig {
  unit: string;
  label: string;
  isSpecialValue?: (value: number) => boolean;
  specialValueLabel?: string;
}

/**
 * Create standard chart options for time series
 */
export function createTimeSeriesChartOptions(
  tooltipConfig: TooltipConfig
): ChartOptions<'line'> {
  const { unit, label, isSpecialValue, specialValueLabel } = tooltipConfig;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'Pp' },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          color: 'var(--text-tertiary)',
          font: { size: 10 },
        },
        grid: { display: false },
        title: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: false,
        grid: { color: 'var(--border-subtle)' },
        title: { display: false },
        ticks: {
          color: 'var(--text-tertiary)',
          font: { size: 10 },
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'nearest',
        intersect: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            if (!context.length || context[0].parsed.x === null) return '';
            return formatTooltipDate(context[0].parsed.x as number);
          },
          label: (context) => {
            const value = context.parsed.y;
            if (isSpecialValue?.(value as number) && specialValueLabel) {
              return [specialValueLabel, `${label}: ${value} ${unit}`];
            }
            return `${label}: ${value?.toFixed?.(1) ?? value} ${unit}`;
          },
        },
      },
    },
  };
}

// ============================================================================
// Dataset Factory
// ============================================================================

/**
 * Create chart dataset configuration
 */
export function createChartDataset(
  label: string,
  points: ScatterDataPoint[],
  colorScheme: ChartColorScheme,
  pointStyles?: ReturnType<typeof getPointStyles>
) {
  const baseDataset = {
    label,
    data: points,
    borderColor: colorScheme.line,
    backgroundColor: colorScheme.fill,
    fill: true,
    borderWidth: 1.5,
    tension: 0.2,
  };

  if (pointStyles) {
    return {
      ...baseDataset,
      ...pointStyles,
    };
  }

  // Default point styling
  return {
    ...baseDataset,
    pointRadius: colorScheme.point.radius,
    pointBackgroundColor: colorScheme.point.backgroundColor,
    pointBorderColor: colorScheme.point.borderColor,
    pointBorderWidth: colorScheme.point.borderWidth,
    pointHoverRadius: colorScheme.point.hoverRadius,
    pointHoverBackgroundColor: colorScheme.point.hoverBackgroundColor,
    pointHoverBorderColor: colorScheme.point.hoverBorderColor,
    pointHoverBorderWidth: colorScheme.point.hoverBorderWidth,
  };
}
