// src/components/widgets/Battery4SoCWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery4SoCConfig } from './widgetConfigs';

export interface Battery4SoCWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery4SoCWidget: React.FC<Battery4SoCWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery4SoCConfig} />;
};

export default Battery4SoCWidget;
