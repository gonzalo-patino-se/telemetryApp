// src/components/widgets/BgcsRelayStatusWidget.tsx
// BGCS Grid Relay Status History Widget
// Displays /BGCS/GRID/STAT/RELAY_STATUS over time
// Uses BaseTimeSeriesWidget with relay-specific configuration

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { bgcsRelayStatusConfig } from './widgetConfigs';

export interface BgcsRelayStatusWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const BgcsRelayStatusWidget: React.FC<BgcsRelayStatusWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={bgcsRelayStatusConfig} />;
};

export default BgcsRelayStatusWidget;
