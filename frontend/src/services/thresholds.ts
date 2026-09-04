// src/services/thresholds.ts
// Shared threshold types, API access and Passed/Failed/Unknown classification.
// The backend applies exactly the same rules (adminconfig/thresholds.py) so the
// history charts, the PDF report and the validation report always agree.

import api from './api';

export type ThresholdStatus = 'passed' | 'failed' | 'unknown';

export const MISSING_THRESHOLD_TEXT = 'Threshold needs to be defined.';

export interface Threshold {
  metric_key: string;
  label: string;
  unit: string;
  subsystem: string;
  lower_limit: number | null;
  upper_limit: number | null;
  enabled: boolean;
  is_protected: boolean;
  scope: string;
  notes?: string;
  updated_at?: string | null;
}

export type ThresholdMap = Record<string, Threshold>;

export interface EffectiveThresholdsResponse {
  tenant: string | null;
  is_admin: boolean;
  thresholds: ThresholdMap;
  missing_threshold_text: string;
}

export interface MetricCatalogEntry {
  key: string;
  label: string;
  unit: string;
  subsystem: string;
  telemetry_name: string | null;
  source: 'telemetry' | 'alarms' | 'computed';
}

/** Classify a value against a threshold. Mirrors the backend implementation. */
export function classifyValue(
  value: number | null | undefined,
  threshold?: Threshold | null,
): ThresholdStatus {
  if (!threshold) return 'unknown';
  const { lower_limit: lower, upper_limit: upper } = threshold;
  if (lower === null && upper === null) return 'unknown';
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'unknown';
  const numeric = Number(value);
  if (lower !== null && numeric < lower) return 'failed';
  if (upper !== null && numeric > upper) return 'failed';
  return 'passed';
}

/** Human readable threshold band, or the "needs to be defined" message. */
export function formatThreshold(threshold?: Threshold | null, missingText = MISSING_THRESHOLD_TEXT): string {
  if (!threshold) return missingText;
  const { lower_limit: lower, upper_limit: upper, unit } = threshold;
  const suffix = unit ? ` ${unit}` : '';
  if (lower !== null && upper !== null) return `${lower} to ${upper}${suffix}`;
  if (lower !== null) return `\u2265 ${lower}${suffix}`;
  if (upper !== null) return `\u2264 ${upper}${suffix}`;
  return missingText;
}

export const STATUS_LABELS: Record<ThresholdStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  unknown: 'Unknown',
};

export const STATUS_COLORS: Record<ThresholdStatus, string> = {
  passed: '#22c55e',
  failed: '#ef4444',
  unknown: '#94a3b8',
};

/** Colour used for the dotted reference lines on history charts. */
export const THRESHOLD_LINE_COLOR = '#ef4444';

export async function fetchEffectiveThresholds(): Promise<EffectiveThresholdsResponse> {
  const res = await api.get<EffectiveThresholdsResponse>('/thresholds/effective/');
  return res.data;
}

export async function fetchMetricCatalog(): Promise<MetricCatalogEntry[]> {
  const res = await api.get<{ metrics: MetricCatalogEntry[] }>('/metrics/');
  return res.data.metrics ?? [];
}
