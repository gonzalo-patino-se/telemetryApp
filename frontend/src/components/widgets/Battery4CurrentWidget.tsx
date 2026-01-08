// src/components/widgets/Battery4CurrentWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery4CurrentConfig } from './widgetConfigs';

export interface Battery4CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery4CurrentWidget: React.FC<Battery4CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery4CurrentConfig} />;
};

export default Battery4CurrentWidget;
