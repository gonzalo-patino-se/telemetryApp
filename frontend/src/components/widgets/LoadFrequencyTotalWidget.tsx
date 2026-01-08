// src/components/widgets/LoadFrequencyTotalWidget.tsx
// Load Frequency Total Widget (Fast Telemetry)
// Uses BaseTimeSeriesWidget with Load Frequency Total-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { loadFrequencyTotalConfig } from './widgetConfigs';

export interface LoadFrequencyTotalWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const LoadFrequencyTotalWidget: React.FC<LoadFrequencyTotalWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={loadFrequencyTotalConfig} />;
};

export default LoadFrequencyTotalWidget;
