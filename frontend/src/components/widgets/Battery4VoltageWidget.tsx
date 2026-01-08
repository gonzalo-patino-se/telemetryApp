// src/components/widgets/Battery4VoltageWidget.tsx
import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { battery4VoltageConfig } from './widgetConfigs';

export interface Battery4VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const Battery4VoltageWidget: React.FC<Battery4VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={battery4VoltageConfig} />;
};

export default Battery4VoltageWidget;
