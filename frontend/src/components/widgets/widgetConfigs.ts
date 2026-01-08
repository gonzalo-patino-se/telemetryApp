// src/components/widgets/widgetConfigs.ts
// Widget configuration definitions for all telemetry widgets
// Each config provides the settings for BaseTimeSeriesWidget

import { buildWifiSignalQuery, buildPV1VoltageQuery, buildPV2VoltageQuery, buildPV3VoltageQuery, buildPV4VoltageQuery, buildBatteryVoltageQuery, buildGridPowerQuery, buildLoadPowerQuery, buildGridVoltageL1Query, buildGridVoltageL2Query, buildGridCurrentL1Query, buildGridCurrentL2Query, buildGridFrequencyTotalQuery } from '../../utils/kqlBuilders';
// ============================================================================
// Grid Voltage RMS L1 Widget
// ============================================================================
export const gridVoltageL1Config: WidgetConfig = {
  label: 'Grid Voltage RMS L1',
  unit: 'V',
  colorScheme: 'orange',
  csvPrefix: 'grid_voltage_l1',
  buildQuery: buildGridVoltageL1Query,
};

// ============================================================================
// Grid Voltage RMS L2 Widget
// ============================================================================
export const gridVoltageL2Config: WidgetConfig = {
  label: 'Grid Voltage RMS L2',
  unit: 'V',
  colorScheme: 'orange',
  csvPrefix: 'grid_voltage_l2',
  buildQuery: buildGridVoltageL2Query,
};

// ============================================================================
// Grid Current RMS L1 Widget
// ============================================================================
export const gridCurrentL1Config: WidgetConfig = {
  label: 'Grid Current RMS L1',
  unit: 'A',
  colorScheme: 'green',
  csvPrefix: 'grid_current_l1',
  buildQuery: buildGridCurrentL1Query,
};

// ============================================================================
// Grid Current RMS L2 Widget
// ============================================================================
export const gridCurrentL2Config: WidgetConfig = {
  label: 'Grid Current RMS L2',
  unit: 'A',
  colorScheme: 'green',
  csvPrefix: 'grid_current_l2',
  buildQuery: buildGridCurrentL2Query,
};

// ============================================================================
// Grid Frequency Total Widget
// ============================================================================
export const gridFrequencyTotalConfig: WidgetConfig = {
  label: 'Grid Frequency Total',
  unit: 'Hz',
  colorScheme: 'blue',
  csvPrefix: 'grid_frequency_total',
  buildQuery: buildGridFrequencyTotalQuery,
};
import type { WidgetConfig } from './BaseTimeSeriesWidget';

// ============================================================================
// WiFi Signal Widget
// ============================================================================

export const wifiSignalConfig: WidgetConfig = {
  label: 'Wi‑Fi Signal Strength',
  unit: 'dBm',
  colorScheme: 'blue',
  offlineValue: -127,
  offlineLabel: 'Device Offline',
  csvPrefix: 'wifi_signal',
  buildQuery: buildWifiSignalQuery,
};

// ============================================================================
// PV1 Voltage Widget
// ============================================================================

export const pv1VoltageConfig: WidgetConfig = {
  label: 'PV1 Voltage',
  unit: 'V',
  colorScheme: 'green',
  csvPrefix: 'pv1_voltage',
  buildQuery: buildPV1VoltageQuery,
};

// ============================================================================
// PV2 Voltage Widget
// ============================================================================

export const pv2VoltageConfig: WidgetConfig = {
  label: 'PV2 Voltage',
  unit: 'V',
  colorScheme: 'green',
  csvPrefix: 'pv2_voltage',
  buildQuery: buildPV2VoltageQuery,
};

// ============================================================================
// PV3 Voltage Widget
// ============================================================================

export const pv3VoltageConfig: WidgetConfig = {
  label: 'PV3 Voltage',
  unit: 'V',
  colorScheme: 'green',
  csvPrefix: 'pv3_voltage',
  buildQuery: buildPV3VoltageQuery,
};

// ============================================================================
// PV4 Voltage Widget
// ============================================================================

export const pv4VoltageConfig: WidgetConfig = {
  label: 'PV4 Voltage',
  unit: 'V',
  colorScheme: 'green',
  csvPrefix: 'pv4_voltage',
  buildQuery: buildPV4VoltageQuery,
};

// ============================================================================
// Battery Voltage Widget
// ============================================================================

export const batteryVoltageConfig: WidgetConfig = {
  label: 'Battery Voltage',
  unit: 'V',
  colorScheme: 'purple',
  csvPrefix: 'battery_voltage',
  buildQuery: buildBatteryVoltageQuery,
};

// ============================================================================
// Grid Power Widget
// ============================================================================

export const gridPowerConfig: WidgetConfig = {
  label: 'Grid Power',
  unit: 'W',
  colorScheme: 'orange',
  csvPrefix: 'grid_power',
  buildQuery: buildGridPowerQuery,
};

// ============================================================================
// Load Power Widget
// ============================================================================

export const loadPowerConfig: WidgetConfig = {
  label: 'Load Power',
  unit: 'W',
  colorScheme: 'purple',
  csvPrefix: 'load_power',
  buildQuery: buildLoadPowerQuery,
};

// ============================================================================
// All Widget Configs (for dynamic rendering)
// ============================================================================


export const allWidgetConfigs = {
  wifiSignal: wifiSignalConfig,
  pv1Voltage: pv1VoltageConfig,
  pv2Voltage: pv2VoltageConfig,
  pv3Voltage: pv3VoltageConfig,
  pv4Voltage: pv4VoltageConfig,
  gridVoltageL1: gridVoltageL1Config,
  gridVoltageL2: gridVoltageL2Config,
  gridCurrentL1: gridCurrentL1Config,
  gridCurrentL2: gridCurrentL2Config,
  gridFrequencyTotal: gridFrequencyTotalConfig,
  batteryVoltage: batteryVoltageConfig,
  gridPower: gridPowerConfig,
  loadPower: loadPowerConfig,
} as const;

export type WidgetType = keyof typeof allWidgetConfigs;
