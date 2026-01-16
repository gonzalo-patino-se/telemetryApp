// src/components/widgets/LoadCurrentL1Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadCurrentL1Config } from './widgetConfigs';

export interface LoadCurrentL1WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const loadCurrentL1Widget: React.FC<LoadCurrentL1WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadCurrentL1Config} />;
};

export default loadCurrentL1Widget;

