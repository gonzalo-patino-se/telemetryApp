// src/components/widgets/Battery1TempWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery1TempConfig } from './widgetConfigs';

export interface Battery1TempWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery1TempWidget: React.FC<Battery1TempWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery1TempConfig} />;
};

export default Battery1TempWidget;
