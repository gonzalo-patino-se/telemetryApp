// src/components/widgets/PV4VoltageWidget.tsx
// PV4 Voltage Widget
// Uses BaseTimeSeriesWidget with PV4-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv4VoltageConfig } from './widgetConfigs';

export interface PV4VoltageWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV4VoltageWidget: React.FC<PV4VoltageWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv4VoltageConfig} />;
};

export default PV4VoltageWidget;
