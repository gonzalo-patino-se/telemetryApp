// src/components/widgets/Battery3CurrentWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery3CurrentConfig } from './widgetConfigs';

export interface Battery3CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery3CurrentWidget: React.FC<Battery3CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery3CurrentConfig} />;
};

export default Battery3CurrentWidget;
