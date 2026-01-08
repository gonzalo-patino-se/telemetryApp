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
