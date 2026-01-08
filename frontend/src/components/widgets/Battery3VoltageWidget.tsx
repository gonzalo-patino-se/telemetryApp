// src/components/widgets/Battery3VoltageWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery3VoltageConfig } from './widgetConfigs';

export interface Battery3VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery3VoltageWidget: React.FC<Battery3VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery3VoltageConfig} />;
};

export default Battery3VoltageWidget;
