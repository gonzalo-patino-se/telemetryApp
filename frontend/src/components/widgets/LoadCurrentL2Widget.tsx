// src/components/widgets/LoadCurrentL1Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadCurrentL2Config } from './widgetConfigs';

export interface LoadCurrentL2WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const loadCurrentL2Widget: React.FC<LoadCurrentL2WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadCurrentL2Config} />;
};

export default loadCurrentL2Widget;

