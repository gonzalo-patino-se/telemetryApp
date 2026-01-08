// src/components/widgets/LoadPowerWidget.tsx
// Load Power Widget
// Uses BaseTimeSeriesWidget with Load-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadPowerConfig } from './widgetConfigs';

export interface LoadPowerWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const LoadPowerWidget: React.FC<LoadPowerWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadPowerConfig} />;
};

export default LoadPowerWidget;
