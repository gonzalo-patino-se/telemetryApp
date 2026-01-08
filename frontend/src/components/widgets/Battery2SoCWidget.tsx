// src/components/widgets/Battery2SoCWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery2SoCConfig } from './widgetConfigs';

export interface Battery2SoCWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery2SoCWidget: React.FC<Battery2SoCWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery2SoCConfig} />;
};

export default Battery2SoCWidget;
