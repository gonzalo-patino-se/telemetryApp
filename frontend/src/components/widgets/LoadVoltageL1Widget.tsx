// src/components/widgets/LoadVoltageL1Widget.tsx
// Load Voltage L1 RMS Widget (Fast Telemetry)
// Uses BaseTimeSeriesWidget with Load Voltage L1-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadVoltageL1Config } from './widgetConfigs';

export interface LoadVoltageL1WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const LoadVoltageL1Widget: React.FC<LoadVoltageL1WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadVoltageL1Config} />;
};

export default LoadVoltageL1Widget;
