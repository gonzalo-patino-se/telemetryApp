// src/types/index.ts
// Centralized type definitions for the application
// This promotes type safety, reusability, and maintainability

import type { ScatterDataPoint, ChartData, ChartOptions } from 'chart.js';

// ============================================================================
// ADX Data Types
// ============================================================================

/** Generic ADX row returned from queries */
export interface AdxRow {
  localtime?: string;
  value_double?: number;
  [key: string]: unknown;
}

/** Device info row structure */
export interface DeviceInfoRow {
  device_serial?: string;
  comms_serial?: string;
  mac_address?: string;
  firmware_version?: string;
  localtime?: string;
  [key: string]: unknown;
}

/** ADX API response structure */
export interface AdxResponse<T = AdxRow> {
  data: T[];
  columns?: string[];
  error?: string;
}

// ============================================================================
// Widget Types
// ============================================================================

/** Common props for all ADX-based widgets */
export interface BaseWidgetProps {
  /** Device serial number for queries */
  serial: string;
  /** Whether to show internal controls (auto-fetch checkbox, fetch button) */
  showControls?: boolean;
  /** Parent-controlled auto-fetch state */
  autoFetchProp?: boolean;
  /** Callback when auto-fetch state changes */
  onAutoFetchChange?: (value: boolean) => void;
  /** Increment to trigger a fetch from parent */
  fetchSignal?: number;
}

/** Time range for date pickers */
export interface DateRange {
  fromDT: Date | null;
  toDT: Date | null;
}

/** Widget state for data fetching */
export interface WidgetFetchState<T = AdxRow> {
  rows: T[];
  loading: boolean;
  error: string;
}

// ============================================================================
// Chart Types
// ============================================================================

/** Point styling configuration */
export interface PointStyle {
  radius: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  hoverRadius: number;
  hoverBackgroundColor: string;
  hoverBorderColor: string;
  hoverBorderWidth: number;
  style?: 'circle' | 'crossRot' | 'cross' | 'rect' | 'triangle' | 'star';
}

/** Chart color scheme */
export interface ChartColorScheme {
  line: string;
  fill: string;
  point: PointStyle;
  /** Optional special point style (e.g., for offline indicators) */
  specialPoint?: PointStyle;
}

/** Time series chart configuration */
export interface TimeSeriesChartConfig {
  label: string;
  colorScheme: ChartColorScheme;
  /** Y-axis unit suffix (e.g., 'dBm', 'V', '°C') */
  unit: string;
  /** Function to determine if a value should use special styling */
  isSpecialValue?: (value: number) => boolean;
  /** Label for special values in tooltip */
  specialValueLabel?: string;
}

/** Chart.js typed data for line charts */
export type LineChartData = ChartData<'line', ScatterDataPoint[]>;
export type LineChartOptions = ChartOptions<'line'>;

// ============================================================================
// KQL Query Types
// ============================================================================

/** Parameters for building KQL queries */
export interface KqlQueryParams {
  serial: string;
  startDate: Date;
  endDate: Date;
  /** Telemetry name filter (e.g., '/SCC/WIFI/STAT/SIGNAL_STRENGTH') */
  telemetryName: string;
  /** Additional where clauses */
  additionalFilters?: string[];
  /** Columns to project (default: ['localtime', 'value_double']) */
  projectColumns?: string[];
  /** Order by column (default: 'localtime asc') */
  orderBy?: string;
}

/** Widget configuration for KQL-based widgets */
export interface TelemetryWidgetConfig {
  /** Unique identifier for the widget type */
  id: string;
  /** Display title */
  title: string;
  /** Telemetry name pattern for KQL query */
  telemetryName: string;
  /** Chart configuration */
  chart: TimeSeriesChartConfig;
  /** Optional: function to detect special values (e.g., -127 for offline) */
  detectSpecialValue?: (value: number) => boolean;
}

// ============================================================================
// CSV Export Types
// ============================================================================

/** CSV column definition */
export interface CsvColumn {
  header: string;
  accessor: string | ((row: AdxRow) => string | number);
}

/** CSV export configuration */
export interface CsvExportConfig {
  filename: string;
  columns: CsvColumn[];
}

// ============================================================================
// Component State Types
// ============================================================================

/** Auth context state */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { username: string } | null;
  isAuthenticated: boolean;
}

/** Serial context state */
export interface SerialState {
  serial: string;
  hasSerial: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Makes specified keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Extract value type from const object */
export type ValueOf<T> = T[keyof T];
