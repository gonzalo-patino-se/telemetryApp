// src/components/widgets/Battery2TempWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery2TempConfig } from './widgetConfigs';

export interface Battery2TempWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery2TempWidget: React.FC<Battery2TempWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery2TempConfig} />;
};

export default Battery2TempWidget;
