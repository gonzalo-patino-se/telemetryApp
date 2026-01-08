// src/components/widgets/GridCurrentL2Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridCurrentL2Config } from './widgetConfigs';

export interface GridCurrentL2WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridCurrentL2Widget: React.FC<GridCurrentL2WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridCurrentL2Config} />;
};

export default GridCurrentL2Widget;
