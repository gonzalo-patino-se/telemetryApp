// src/components/widgets/GridPowerWidget.tsx
// Grid Power Widget
// Uses BaseTimeSeriesWidget with Grid-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridPowerConfig } from './widgetConfigs';

export interface GridPowerWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridPowerWidget: React.FC<GridPowerWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridPowerConfig} />;
};

export default GridPowerWidget;
