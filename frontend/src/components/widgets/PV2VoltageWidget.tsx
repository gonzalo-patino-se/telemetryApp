// src/components/widgets/PV2VoltageWidget.tsx
// PV2 Voltage Widget
// Uses BaseTimeSeriesWidget with PV2-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv2VoltageConfig } from './widgetConfigs';

export interface PV2VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV2VoltageWidget: React.FC<PV2VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv2VoltageConfig} />;
};

export default PV2VoltageWidget;
