// src/components/widgets/GridFrequencyTotalWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { gridFrequencyTotalConfig } from './widgetConfigs';

export interface GridFrequencyTotalWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const GridFrequencyTotalWidget: React.FC<GridFrequencyTotalWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={gridFrequencyTotalConfig} />;
};

export default GridFrequencyTotalWidget;
