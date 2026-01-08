// src/components/widgets/Battery2VoltageWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery2VoltageConfig } from './widgetConfigs';

export interface Battery2VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery2VoltageWidget: React.FC<Battery2VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery2VoltageConfig} />;
};

export default Battery2VoltageWidget;
