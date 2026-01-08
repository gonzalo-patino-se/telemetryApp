// src/components/widgets/GridVoltageL2Widget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridVoltageL2Config } from './widgetConfigs';

export interface GridVoltageL2WidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridVoltageL2Widget: React.FC<GridVoltageL2WidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridVoltageL2Config} />;
};

export default GridVoltageL2Widget;
