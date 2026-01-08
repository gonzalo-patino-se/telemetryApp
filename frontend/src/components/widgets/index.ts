// src/components/widgets/index.ts
// Barrel exports for widget components

// Base widget and types
export { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps, type WidgetConfig } from './BaseTimeSeriesWidget';

// Widget configurations
export * from './widgetConfigs';

// Specific widget components
export { WifiSignalWidget } from './WifiSignalWidget';
export { PV1VoltageWidget } from './PV1VoltageWidget';
export { PV2VoltageWidget } from './PV2VoltageWidget';
export { PV3VoltageWidget } from './PV3VoltageWidget';
export { PV4VoltageWidget } from './PV4VoltageWidget';
export { BatteryVoltageWidget } from './BatteryVoltageWidget';
export { GridPowerWidget } from './GridPowerWidget';
export { LoadPowerWidget } from './LoadPowerWidget';
export { GridVoltageL1Widget } from './GridVoltageL1Widget';
export { GridVoltageL2Widget } from './GridVoltageL2Widget';
export { GridCurrentL1Widget } from './GridCurrentL1Widget';
export { GridCurrentL2Widget } from './GridCurrentL2Widget';
export { GridFrequencyTotalWidget } from './GridFrequencyTotalWidget';

// Battery Module 1
export { Battery1VoltageWidget } from './Battery1VoltageWidget';
export { Battery1TempWidget } from './Battery1TempWidget';
export { Battery1SoCWidget } from './Battery1SoCWidget';
export { Battery1CurrentWidget } from './Battery1CurrentWidget';

// Battery Module 2
export { Battery2VoltageWidget } from './Battery2VoltageWidget';
export { Battery2TempWidget } from './Battery2TempWidget';
export { Battery2SoCWidget } from './Battery2SoCWidget';
export { Battery2CurrentWidget } from './Battery2CurrentWidget';

// Battery Module 3
export { Battery3VoltageWidget } from './Battery3VoltageWidget';
export { Battery3TempWidget } from './Battery3TempWidget';
export { Battery3SoCWidget } from './Battery3SoCWidget';
export { Battery3CurrentWidget } from './Battery3CurrentWidget';

// Battery Main Relay (Alarms table)
export { default as BatteryMainRelayWidget } from './BatteryMainRelayWidget';

// Load Measurements (Fast Telemetry)
export { LoadVoltageL1Widget } from './LoadVoltageL1Widget';
