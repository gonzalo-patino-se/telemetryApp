// src/components/widgets/widgetConfigs.ts
// Widget configuration definitions for all telemetry widgets
// Each config provides the settings for BaseTimeSeriesWidget

import { 
  buildWifiSignalQuery, 
  buildPV1VoltageQuery, buildPV2VoltageQuery, buildPV3VoltageQuery, buildPV4VoltageQuery, 
  buildBatteryVoltageQuery, buildGridPowerQuery, buildLoadPowerQuery, 
  buildGridVoltageL1Query, buildGridVoltageL2Query, buildGridCurrentL1Query, buildGridCurrentL2Query, buildGridFrequencyTotalQuery,
  buildBattery1VoltageQuery, buildBattery2VoltageQuery, buildBattery3VoltageQuery,
  buildBattery1TempQuery, buildBattery2TempQuery, buildBattery3TempQuery,
  buildBattery1SoCQuery, buildBattery2SoCQuery, buildBattery3SoCQuery,
  buildBattery1CurrentQuery, buildBattery2CurrentQuery, buildBattery3CurrentQuery,
  buildBatteryMainRelayQuery,
  buildLoadVoltageL1Query
} from '../../utils/kqlBuilders';
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
// Battery Module 1 Widgets
// ============================================================================
export const battery1VoltageConfig: WidgetConfig = {
  label: 'Battery 1 Voltage',
  unit: 'V',
  colorScheme: 'purple',
  csvPrefix: 'battery1_voltage',
  buildQuery: buildBattery1VoltageQuery,
};

export const battery1TempConfig: WidgetConfig = {
  label: 'Battery 1 Temperature',
  unit: '°C',
  colorScheme: 'red',
  csvPrefix: 'battery1_temp',
  buildQuery: buildBattery1TempQuery,
};

export const battery1SoCConfig: WidgetConfig = {
  label: 'Battery 1 SoC',
  unit: '%',
  colorScheme: 'green',
  csvPrefix: 'battery1_soc',
  buildQuery: buildBattery1SoCQuery,
};

export const battery1CurrentConfig: WidgetConfig = {
  label: 'Battery 1 Current',
  unit: 'A',
  colorScheme: 'blue',
  csvPrefix: 'battery1_current',
  buildQuery: buildBattery1CurrentQuery,
};

// ============================================================================
// Battery Module 2 Widgets
// ============================================================================
export const battery2VoltageConfig: WidgetConfig = {
  label: 'Battery 2 Voltage',
  unit: 'V',
  colorScheme: 'purple',
  csvPrefix: 'battery2_voltage',
  buildQuery: buildBattery2VoltageQuery,
};

export const battery2TempConfig: WidgetConfig = {
  label: 'Battery 2 Temperature',
  unit: '°C',
  colorScheme: 'red',
  csvPrefix: 'battery2_temp',
  buildQuery: buildBattery2TempQuery,
};

export const battery2SoCConfig: WidgetConfig = {
  label: 'Battery 2 SoC',
  unit: '%',
  colorScheme: 'green',
  csvPrefix: 'battery2_soc',
  buildQuery: buildBattery2SoCQuery,
};

export const battery2CurrentConfig: WidgetConfig = {
  label: 'Battery 2 Current',
  unit: 'A',
  colorScheme: 'blue',
  csvPrefix: 'battery2_current',
  buildQuery: buildBattery2CurrentQuery,
};

// ============================================================================
// Battery Module 3 Widgets
// ============================================================================
export const battery3VoltageConfig: WidgetConfig = {
  label: 'Battery 3 Voltage',
  unit: 'V',
  colorScheme: 'purple',
  csvPrefix: 'battery3_voltage',
  buildQuery: buildBattery3VoltageQuery,
};

export const battery3TempConfig: WidgetConfig = {
  label: 'Battery 3 Temperature',
  unit: '°C',
  colorScheme: 'red',
  csvPrefix: 'battery3_temp',
  buildQuery: buildBattery3TempQuery,
};

export const battery3SoCConfig: WidgetConfig = {
  label: 'Battery 3 SoC',
  unit: '%',
  colorScheme: 'green',
  csvPrefix: 'battery3_soc',
  buildQuery: buildBattery3SoCQuery,
};

export const battery3CurrentConfig: WidgetConfig = {
  label: 'Battery 3 Current',
  unit: 'A',
  colorScheme: 'blue',
  csvPrefix: 'battery3_current',
  buildQuery: buildBattery3CurrentQuery,
};

// ============================================================================
// Battery Main Relay Status Widget
// ============================================================================

export const batteryMainRelayConfig: WidgetConfig = {
  label: 'Battery Main Relay Status',
  unit: '',
  colorScheme: 'orange',
  csvPrefix: 'battery_main_relay',
  buildQuery: buildBatteryMainRelayQuery,
};

// ============================================================================
// Load Measurements Widgets (Fast Telemetry)
// ============================================================================

export const loadVoltageL1Config: WidgetConfig = {
  label: 'Load Voltage L1 RMS',
  unit: 'V',
  colorScheme: 'purple',
  csvPrefix: 'load_voltage_l1',
  buildQuery: buildLoadVoltageL1Query,
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
  // Battery Module 1
  battery1Voltage: battery1VoltageConfig,
  battery1Temp: battery1TempConfig,
  battery1SoC: battery1SoCConfig,
  battery1Current: battery1CurrentConfig,
  // Battery Module 2
  battery2Voltage: battery2VoltageConfig,
  battery2Temp: battery2TempConfig,
  battery2SoC: battery2SoCConfig,
  battery2Current: battery2CurrentConfig,
  // Battery Module 3
  battery3Voltage: battery3VoltageConfig,
  battery3Temp: battery3TempConfig,
  battery3SoC: battery3SoCConfig,
  battery3Current: battery3CurrentConfig,
  // Battery Main Relay
  batteryMainRelay: batteryMainRelayConfig,
  // Load Measurements (Fast Telemetry)
  loadVoltageL1: loadVoltageL1Config,
} as const;

export type WidgetType = keyof typeof allWidgetConfigs;
