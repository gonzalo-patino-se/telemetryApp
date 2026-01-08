// src/components/widgets/PV1VoltageWidget.tsx
// PV1 Voltage Widget
// Uses BaseTimeSeriesWidget with PV1-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv1VoltageConfig } from './widgetConfigs';

export interface PV1VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV1VoltageWidget: React.FC<PV1VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv1VoltageConfig} />;
};

export default PV1VoltageWidget;
