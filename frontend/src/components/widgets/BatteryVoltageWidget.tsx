// src/components/widgets/BatteryVoltageWidget.tsx
// Battery Voltage Widget
// Uses BaseTimeSeriesWidget with Battery-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { batteryVoltageConfig } from './widgetConfigs';

export interface BatteryVoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const BatteryVoltageWidget: React.FC<BatteryVoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={batteryVoltageConfig} />;
};

export default BatteryVoltageWidget;
