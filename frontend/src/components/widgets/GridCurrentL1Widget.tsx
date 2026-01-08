// src/components/widgets/GridCurrentL1Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridCurrentL1Config } from './widgetConfigs';

export interface GridCurrentL1WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridCurrentL1Widget: React.FC<GridCurrentL1WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridCurrentL1Config} />;
};

export default GridCurrentL1Widget;
