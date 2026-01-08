// src/components/widgets/GridVoltageL1Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridVoltageL1Config } from './widgetConfigs';

export interface GridVoltageL1WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridVoltageL1Widget: React.FC<GridVoltageL1WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridVoltageL1Config} />;
};

export default GridVoltageL1Widget;
