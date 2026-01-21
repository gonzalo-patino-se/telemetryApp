// src/components/widgets/PV4VoltageWidget.tsx
// PV4 Voltage Widget
// Uses BaseTimeSeriesWidget with PV4-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv2CurrentConfig } from './widgetConfigs';

export interface PV2CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV2CurrentWidget: React.FC<PV2CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv2CurrentConfig} />;
};

export default PV2CurrentWidget;
