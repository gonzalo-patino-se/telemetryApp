// src/components/widgets/Battery1VoltageWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery1VoltageConfig } from './widgetConfigs';

export interface Battery1VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery1VoltageWidget: React.FC<Battery1VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery1VoltageConfig} />;
};

export default Battery1VoltageWidget;
