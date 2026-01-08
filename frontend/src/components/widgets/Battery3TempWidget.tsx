// src/components/widgets/Battery3TempWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery3TempConfig } from './widgetConfigs';

export interface Battery3TempWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery3TempWidget: React.FC<Battery3TempWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery3TempConfig} />;
};

export default Battery3TempWidget;
