// src/components/widgets/PV4VoltageWidget.tsx
// PV4 Voltage Widget
// Uses BaseTimeSeriesWidget with PV4-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { pv1CurrentConfig } from './widgetConfigs';

export interface PV1CurrentWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const PV1CurrentWidget: React.FC<PV1CurrentWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={pv1CurrentConfig} />;
};

export default PV1CurrentWidget;
