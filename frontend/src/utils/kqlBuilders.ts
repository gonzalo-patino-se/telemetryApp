// ============================================================================
// Grid Widgets Query Builders
// ============================================================================

export function buildGridVoltageL1Query(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L1N',
  });
}

export function buildGridVoltageL2Query(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L2N',
  });
}

export function buildGridCurrentL1Query(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/IRMS_L1',
  });
}

export function buildGridCurrentL2Query(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/IRMS_L2',
  });
}

export function buildGridFrequencyTotalQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/FREQ_TOTAL',
  });
}
// src/utils/kqlBuilders.ts
// KQL Query Builder utilities
// Factory functions for building Azure Data Explorer queries

import { formatDateForKql } from './dateHelpers';

// ============================================================================
// Query Escape Helpers
// ============================================================================

/**
 * Escape string for safe use in KQL queries
 * Prevents KQL injection attacks
 */
export function escapeKqlString(value: string): string {
  return (value ?? '').replace(/'/g, "''");
}

// ============================================================================
// Telemetry Query Builders
// ============================================================================

interface TelemetryQueryParams {
  serial: string;
  startDate: Date;
  endDate: Date;
  telemetryName: string;
  additionalFilters?: string[];
}

/**
 * Build KQL query for telemetry data
 * Standard query pattern for time-series telemetry values
 */
export function buildTelemetryQuery(params: TelemetryQueryParams): string {
  const { serial, startDate, endDate, telemetryName, additionalFilters = [] } = params;
  
  const escapedSerial = escapeKqlString(serial);
  const startLocal = formatDateForKql(startDate);
  const endLocal = formatDateForKql(endDate);

  const additionalWheres = additionalFilters.length > 0
    ? additionalFilters.map(f => `    | where ${f}`).join('\n')
    : '';

  return `
    let s = '${escapedSerial}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Telemetry
    | where comms_serial contains s
    | where name contains '${telemetryName}'
    | where localtime between (start .. finish)
    | where isnotnull(value_double)
${additionalWheres}
    | project localtime, value_double
    | order by localtime asc
  `.trim();
}

/**
 * Build query specifically for WiFi signal strength
 */
export function buildWifiSignalQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SCC/WIFI/STAT/SIGNAL_STRENGTH',
  });
}

/**
 * Build query specifically for PV1 voltage
 */
export function buildPV1VoltageQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV1/V',
  });
}

/**
 * Build query specifically for PV2 voltage
 */
export function buildPV2VoltageQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV2/V',
  });
}

/**
 * Build query specifically for PV3 voltage
 */
export function buildPV3VoltageQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV3/V',
  });
}

/**
 * Build query specifically for PV4 voltage
 */
export function buildPV4VoltageQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV4/V',
  });
}

/**
 * Build query specifically for battery voltage
 */
export function buildBatteryVoltageQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/BATTERY/V',
  });
}

/**
 * Build query specifically for grid power
 */
export function buildGridPowerQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/GRID/P',
  });
}

/**
 * Build query specifically for load power
 */
export function buildLoadPowerQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/LOAD/P',
  });
}

// ============================================================================
// Device Info Query Builder
// ============================================================================

/**
 * Build query for device info
 */
export function buildDeviceInfoQuery(serial: string): string {
  const escapedSerial = escapeKqlString(serial);
  return `DevInfo | where comms_serial contains '${escapedSerial}' | limit 1`;
}

// ============================================================================
// Generic Query Factory
// ============================================================================

export type TelemetryType = 
  | 'wifi_signal'
  | 'pv1_voltage'
  | 'pv2_voltage'
  | 'pv3_voltage'
  | 'pv4_voltage'
  | 'battery_voltage'
  | 'grid_power'
  | 'load_power';

const telemetryNameMap: Record<TelemetryType, string> = {
  wifi_signal: '/SCC/WIFI/STAT/SIGNAL_STRENGTH',
  pv1_voltage: '/INV/DCPORT/STAT/PV1/V',
  pv2_voltage: '/INV/DCPORT/STAT/PV2/V',
  pv3_voltage: '/INV/DCPORT/STAT/PV3/V',
  pv4_voltage: '/INV/DCPORT/STAT/PV4/V',
  battery_voltage: '/INV/DCPORT/STAT/BATTERY/V',
  grid_power: '/INV/ACPORT/STAT/GRID/P',
  load_power: '/INV/ACPORT/STAT/LOAD/P',
};

/**
 * Factory function to get query builder by telemetry type
 */
export function getTelemetryQueryBuilder(type: TelemetryType) {
  return (serial: string, startDate: Date, endDate: Date) =>
    buildTelemetryQuery({
      serial,
      startDate,
      endDate,
      telemetryName: telemetryNameMap[type],
    });
}

/**
 * Create a custom telemetry query builder for any telemetry name
 */
export function createCustomTelemetryQueryBuilder(telemetryName: string) {
  return (serial: string, startDate: Date, endDate: Date) =>
    buildTelemetryQuery({
      serial,
      startDate,
      endDate,
      telemetryName,
    });
}

// ============================================================================
// Battery Widgets Query Builders
// ============================================================================

// Battery Voltage (Modules 1-4)
export function buildBattery1VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/V' });
}

export function buildBattery2VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/V' });
}

export function buildBattery3VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/V' });
}

export function buildBattery4VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE4/STAT/V' });
}

// Battery Temperature (Modules 1-4)
export function buildBattery1TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/TEMP' });
}

export function buildBattery2TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/TEMP' });
}

export function buildBattery3TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/TEMP' });
}

export function buildBattery4TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE4/STAT/TEMP' });
}

// Battery State of Charge (Modules 1-4)
export function buildBattery1SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/USER_SOC' });
}

export function buildBattery2SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/USER_SOC' });
}

export function buildBattery3SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/USER_SOC' });
}

export function buildBattery4SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE4/STAT/USER_SOC' });
}

// Battery Current (Modules 1-4)
export function buildBattery1CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/I' });
}

export function buildBattery2CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/I' });
}

export function buildBattery3CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/I' });
}

export function buildBattery4CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE4/STAT/I' });
}
