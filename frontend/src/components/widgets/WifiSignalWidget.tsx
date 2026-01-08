// src/components/widgets/WifiSignalWidget.tsx
// WiFi Signal Strength Widget
// Uses BaseTimeSeriesWidget with WiFi-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { wifiSignalConfig } from './widgetConfigs';

export interface WifiSignalWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const WifiSignalWidget: React.FC<WifiSignalWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={wifiSignalConfig} />;
};

export default WifiSignalWidget;
