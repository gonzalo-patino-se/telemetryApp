// src/components/widgets/LoadVoltageL2Widget.tsx
// Load Voltage L2 RMS Widget (Fast Telemetry)
// Uses BaseTimeSeriesWidget with Load Voltage L2-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadVoltageL2Config } from './widgetConfigs';

export interface LoadVoltageL2WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const LoadVoltageL2Widget: React.FC<LoadVoltageL2WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadVoltageL2Config} />;
};

export default LoadVoltageL2Widget;
