// src/components/widgets/CellularSignalWidget.tsx
// Cellular Signal Strength Widget (history of LOW_SIGNAL_STRENGTH alarm).
// Reuses BaseTimeSeriesWidget with the Alarms-backed cellular config.

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { cellularSignalStrengthConfig } from './widgetConfigs';

export type CellularSignalWidgetProps = Omit<BaseTimeSeriesWidgetProps, 'config'>;

export const CellularSignalWidget: React.FC<CellularSignalWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={cellularSignalStrengthConfig} />;
};

export default CellularSignalWidget;
