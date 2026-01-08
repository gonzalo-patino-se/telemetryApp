// src/components/widgets/Battery1CurrentWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery1CurrentConfig } from './widgetConfigs';

export interface Battery1CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery1CurrentWidget: React.FC<Battery1CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery1CurrentConfig} />;
};

export default Battery1CurrentWidget;
