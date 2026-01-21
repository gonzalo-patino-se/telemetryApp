// src/components/widgets/PV4VoltageWidget.tsx
// PV4 Voltage Widget
// Uses BaseTimeSeriesWidget with PV3-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv4CurrentConfig } from './widgetConfigs';

export interface PV4CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV4CurrentWidget: React.FC<PV4CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv4CurrentConfig} />;
};

export default PV4CurrentWidget;
