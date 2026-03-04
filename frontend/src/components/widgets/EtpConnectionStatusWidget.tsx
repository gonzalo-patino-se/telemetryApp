// src/components/widgets/EtpConnectionStatusWidget.tsx
// Widget component for ETP Connection Status history
// Displays SCC/CLOUD/STAT/ETP/CONN_STATUS over time

import React from 'react';
import { BaseTimeSeriesWidget, type BaseTimeSeriesWidgetProps } from './BaseTimeSeriesWidget';
import { etpConnectionStatusConfig } from './widgetConfigs';

export interface EtpConnectionStatusWidgetProps extends Omit<BaseTimeSeriesWidgetProps, 'config'> {}

export const EtpConnectionStatusWidget: React.FC<EtpConnectionStatusWidgetProps> = (props) => {
  return <BaseTimeSeriesWidget {...props} config={etpConnectionStatusConfig} />;
};

export default EtpConnectionStatusWidget;
