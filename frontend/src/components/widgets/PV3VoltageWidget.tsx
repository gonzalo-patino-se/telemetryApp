// src/components/widgets/PV3VoltageWidget.tsx
// PV3 Voltage Widget
// Uses BaseTimeSeriesWidget with PV3-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv3VoltageConfig } from './widgetConfigs';

export interface PV3VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV3VoltageWidget: React.FC<PV3VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv3VoltageConfig} />;
};

export default PV3VoltageWidget;
