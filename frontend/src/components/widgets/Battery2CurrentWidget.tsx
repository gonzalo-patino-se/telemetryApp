// src/components/widgets/Battery2CurrentWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery2CurrentConfig } from './widgetConfigs';

export interface Battery2CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery2CurrentWidget: React.FC<Battery2CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery2CurrentConfig} />;
};

export default Battery2CurrentWidget;
