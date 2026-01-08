// src/components/widgets/Battery3SoCWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery3SoCConfig } from './widgetConfigs';

export interface Battery3SoCWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery3SoCWidget: React.FC<Battery3SoCWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery3SoCConfig} />;
};

export default Battery3SoCWidget;
