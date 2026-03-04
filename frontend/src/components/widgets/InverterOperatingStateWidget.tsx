// src/components/widgets/InverterOperatingStateWidget.tsx
// Inverter Operating State History Widget
// Displays INV/DEV/STAT/OPERATING_STATE over time
// Uses BaseTimeSeriesWidget with inverter-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { inverterOperatingStateConfig } from './widgetConfigs';

export interface InverterOperatingStateWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const InverterOperatingStateWidget: React.FC<InverterOperatingStateWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={inverterOperatingStateConfig} />;
};

export default InverterOperatingStateWidget;
