// src/components/widgets/Battery1SoCWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery1SoCConfig } from './widgetConfigs';

export interface Battery1SoCWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery1SoCWidget: React.FC<Battery1SoCWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery1SoCConfig} />;
};

export default Battery1SoCWidget;
