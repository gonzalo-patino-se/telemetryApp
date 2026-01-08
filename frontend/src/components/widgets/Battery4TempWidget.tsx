// src/components/widgets/Battery4TempWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery4TempConfig } from './widgetConfigs';

export interface Battery4TempWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery4TempWidget: React.FC<Battery4TempWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery4TempConfig} />;
};

export default Battery4TempWidget;
