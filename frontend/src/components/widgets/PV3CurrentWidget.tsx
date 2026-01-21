// src/components/widgets/PV4VoltageWidget.tsx
// PV4 Voltage Widget
// Uses BaseTimeSeriesWidget with PV3-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv3CurrentConfig } from './widgetConfigs';

export interface PV3CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV3CurrentWidget: React.FC<PV3CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv3CurrentConfig} />;
};

export default PV3CurrentWidget;
