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
export { BatteryVoltageWidget } from './BatteryVoltageWidget';
export { GridPowerWidget } from './GridPowerWidget';
export { LoadPowerWidget } from './LoadPowerWidget';
