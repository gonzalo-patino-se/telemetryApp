// src/components/widgets/BatteryMainRelayWidget.tsx
// Battery Main Relay Status widget - uses Alarms table

import React from 'react';
import BaseTimeSeriesWidget, { type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { batteryMainRelayConfig } from './widgetConfigs';

type BatteryMainRelayWidgetProps = Omit<BaseTimeSeriesWidgetProps, 'config'>;

const BatteryMainRelayWidget: React.FC<BatteryMainRelayWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={batteryMainRelayConfig} />;
};

export default BatteryMainRelayWidget;
