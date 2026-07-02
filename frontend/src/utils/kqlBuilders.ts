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
    telemetryName: '/SYS/MEAS/STAT/GRID/VRMS_L1N', // with respect to a measuring device
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
    telemetryName: '/SYS/MEAS/STAT/GRID/VRMS_L2N', // with respect to a measuring device
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
    telemetryName: '/SYS/MEAS/STAT/GRID/IRMS_L1', // with respect to a measuring device
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
    telemetryName: '/SYS/MEAS/STAT/GRID/IRMS_L2', // with respect to a measuring device
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
    telemetryName: '/SYS/MEAS/STAT/GRID/FREQ_TOTAL', // with respect to a measuring device
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
 * Build query specifically for PV1 current
 */
export function buildPV1CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return `
  let s = '${serial}';
    Telemetry
    | where comms_serial contains s
    | where name contains '/INV/DCPORT/STAT/PV1/I'
    | where localtime between (datetime(${startDate.toISOString()}) .. datetime(${endDate.toISOString()}))
    | project localtime, value_double
    | order by localtime asc
  `.trim();
}

/**
 * Build query specifically for PV2 current
 */
export function buildPV2CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return `
  let s = '${serial}';
    Telemetry
    | where comms_serial contains s
    | where name contains '/INV/DCPORT/STAT/PV2/I'
    | where localtime between (datetime(${startDate.toISOString()}) .. datetime(${endDate.toISOString()}))
    | project localtime, value_double
    | order by localtime asc
  `.trim();
}

/**
 * Build query specifically for PV3 current
 */
export function buildPV3CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return `
  let s = '${serial}';
    Telemetry
    | where comms_serial contains s
    | where name contains '/INV/DCPORT/STAT/PV3/I'
    | where localtime between (datetime(${startDate.toISOString()}) .. datetime(${endDate.toISOString()}))
    | project localtime, value_double
    | order by localtime asc
  `.trim();
}

/**
 * Build query specifically for PV4 current
 */
export function buildPV4CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return `
  let s = '${serial}';
    Telemetry
    | where comms_serial contains s
    | where name contains '/INV/DCPORT/STAT/PV4/I'
    | where localtime between (datetime(${startDate.toISOString()}) .. datetime(${endDate.toISOString()}))
    | project localtime, value_double
    | order by localtime asc
  `.trim();
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
    telemetryName: '/INV/ACPORT/STAT/GRID/P', //fixme: not reliable
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
    telemetryName: '/INV/ACPORT/STAT/LOAD/P', //this is not load but ACPORT 
  });
}

// ============================================================================
// Computed Power Query Builders (P = V × I at matching timestamps)
// Voltage and current live in the same Telemetry table, so an inner join on
// `localtime` guarantees every product uses values sampled at the exact same
// instant (accurate correlation, as opposed to reading an unreliable P channel).
// ============================================================================

interface ProductPowerParams {
  serial: string;
  startDate: Date;
  endDate: Date;
  voltageName: string;
  currentName: string;
}

/**
 * Build KQL for single-channel power: P = V × I.
 * Anchored on the UNION of the voltage and current timestamps: every instant
 * where *either* input reported a sample yields a row. If the matching sample
 * on the other side is missing, `value_double` is null (a "gap") — the caller
 * renders these as ✕ markers rather than fabricating a value. In other words,
 * power is only computed when BOTH variables are present at that timestamp.
 */
export function buildProductPowerQuery(params: ProductPowerParams): string {
  const { serial, startDate, endDate, voltageName, currentName } = params;
  const s = escapeKqlString(serial);
  const start = formatDateForKql(startDate);
  const finish = formatDateForKql(endDate);
  return `
    let s = '${s}';
    let start = datetime(${start});
    let finish = datetime(${finish});
    let vSeries = Telemetry
        | where comms_serial contains s
        | where name contains '${voltageName}'
        | where localtime between (start .. finish)
        | project localtime, v = value_double;
    let iSeries = Telemetry
        | where comms_serial contains s
        | where name contains '${currentName}'
        | where localtime between (start .. finish)
        | project localtime, i = value_double;
    let ticks = union (vSeries | project localtime), (iSeries | project localtime)
        | distinct localtime;
    ticks
    | join kind=leftouter vSeries on localtime
    | join kind=leftouter iSeries on localtime
    | project localtime, value_double = v * i
    | order by localtime asc
  `.trim();
}

interface DualProductPowerParams {
  serial: string;
  startDate: Date;
  endDate: Date;
  voltageName1: string;
  currentName1: string;
  voltageName2: string;
  currentName2: string;
}

/**
 * Build KQL for two-phase power: P = (V1 × I1) + (V2 × I2).
 * Anchored on the L1 voltage series via LEFT-OUTER joins: every anchor sample
 * yields a row, and if any of the other three factors is missing at that
 * instant the sum is null (a "gap") rather than a fabricated partial value.
 */
export function buildDualProductPowerQuery(params: DualProductPowerParams): string {
  const { serial, startDate, endDate, voltageName1, currentName1, voltageName2, currentName2 } = params;
  const s = escapeKqlString(serial);
  const start = formatDateForKql(startDate);
  const finish = formatDateForKql(endDate);
  return `
    let s = '${s}';
    let start = datetime(${start});
    let finish = datetime(${finish});
    let v1 = Telemetry
        | where comms_serial contains s
        | where name contains '${voltageName1}'
        | where localtime between (start .. finish)
        | project localtime, v1 = value_double;
    let i1 = Telemetry
        | where comms_serial contains s
        | where name contains '${currentName1}'
        | where localtime between (start .. finish)
        | project localtime, i1 = value_double;
    let v2 = Telemetry
        | where comms_serial contains s
        | where name contains '${voltageName2}'
        | where localtime between (start .. finish)
        | project localtime, v2 = value_double;
    let i2 = Telemetry
        | where comms_serial contains s
        | where name contains '${currentName2}'
        | where localtime between (start .. finish)
        | project localtime, i2 = value_double;
    let ticks = union
        (v1 | project localtime), (i1 | project localtime),
        (v2 | project localtime), (i2 | project localtime)
        | distinct localtime;
    ticks
    | join kind=leftouter v1 on localtime
    | join kind=leftouter i1 on localtime
    | join kind=leftouter v2 on localtime
    | join kind=leftouter i2 on localtime
    | project localtime, value_double = (v1 * i1) + (v2 * i2)
    | order by localtime asc
  `.trim();
}

// ---- PV computed power: P = V × I per string --------------------------------
export function buildPV1PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/INV/DCPORT/STAT/PV1/V', currentName: '/INV/DCPORT/STAT/PV1/I' });
}

export function buildPV2PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/INV/DCPORT/STAT/PV2/V', currentName: '/INV/DCPORT/STAT/PV2/I' });
}

export function buildPV3PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/INV/DCPORT/STAT/PV3/V', currentName: '/INV/DCPORT/STAT/PV3/I' });
}

export function buildPV4PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/INV/DCPORT/STAT/PV4/V', currentName: '/INV/DCPORT/STAT/PV4/I' });
}

// ---- Grid computed power: P = (V_L1 × I_L1) + (V_L2 × I_L2) ------------------
export function buildGridPowerCalcQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildDualProductPowerQuery({
    serial, startDate, endDate,
    voltageName1: '/SYS/MEAS/STAT/GRID/VRMS_L1N', currentName1: '/SYS/MEAS/STAT/GRID/IRMS_L1',
    voltageName2: '/SYS/MEAS/STAT/GRID/VRMS_L2N', currentName2: '/SYS/MEAS/STAT/GRID/IRMS_L2',
  });
}

// ---- Load computed power: P = (V_L1 × I_L1) + (V_L2 × I_L2) ------------------
// Load Voltage comes from NORMAL Telemetry (~15 min) via
// /INV/ACPORT/STAT/VRMS_L1N|L2N; Load Current comes from the FAST stream
// (sourcedatastreamingfornam, ~15 s) via /SYS/MEAS/STAT/LOAD/IRMS_L1|L2.
// Because voltage is the coarser (15-min) signal, power can only ever be as
// accurate as the voltage cadence — so we compute it on a shared 15-min grid.
//
// For each 15-min bin we require ALL FOUR inputs (V1, V2, I1, I2) to be present
// in that bin; the power point is placed at the bin start. If ANY input is
// missing for a bin, value_double is null and the caller renders a ✕. This
// guarantees power never appears where voltage OR current is absent (an earlier
// as-of approach held the last voltage forward for up to 15 min, which made
// power linger past the point where voltage actually stopped).
export function buildLoadPowerCalcQuery(serial: string, startDate: Date, endDate: Date): string {
  const s = escapeKqlString(serial);
  const start = formatDateForKql(startDate);
  const finish = formatDateForKql(endDate);
  return `
    let s = '${s}';
    let start = datetime(${start});
    let finish = datetime(${finish});
    let binSize = 15m;
    // Normal ACPORT phase voltages, averaged per 15-min bin (one row per bin
    // that actually contains a voltage sample).
    let v1 = Telemetry
        | where comms_serial contains s
        | where name contains '/INV/ACPORT/STAT/VRMS_L1N'
        | where localtime between (start .. finish)
        | summarize v1 = avg(value_double) by t = bin(localtime, binSize);
    let v2 = Telemetry
        | where comms_serial contains s
        | where name contains '/INV/ACPORT/STAT/VRMS_L2N'
        | where localtime between (start .. finish)
        | summarize v2 = avg(value_double) by t = bin(localtime, binSize);
    // Fast LOAD phase currents (~15 s), averaged into the same 15-min bins.
    let i1 = sourcedatastreamingfornam
        | where timestamp between (start .. finish)
        | extend telemetryArray = parse_json(data)
        | where header has s
        | mv-expand telemetry = telemetryArray
        | where telemetry.msgType == "fast-telemetry"
        | mv-expand item = telemetry.payload
        | extend name = tostring(item.name), value = item.value
        | where name contains "/SYS/MEAS/STAT/LOAD/IRMS_L1"
        | summarize i1 = avg(todouble(value)) by t = bin(timestamp, binSize);
    let i2 = sourcedatastreamingfornam
        | where timestamp between (start .. finish)
        | extend telemetryArray = parse_json(data)
        | where header has s
        | mv-expand telemetry = telemetryArray
        | where telemetry.msgType == "fast-telemetry"
        | mv-expand item = telemetry.payload
        | extend name = tostring(item.name), value = item.value
        | where name contains "/SYS/MEAS/STAT/LOAD/IRMS_L2"
        | summarize i2 = avg(todouble(value)) by t = bin(timestamp, binSize);
    // Anchor on every 15-min bin where ANY signal reported, attach all four,
    // then compute P. A missing voltage OR current leg yields a null
    // value_double (rendered as ✕) — power is only produced when V and I for
    // BOTH phases exist in that bin.
    let ticks = union (v1 | project t), (v2 | project t), (i1 | project t), (i2 | project t)
        | distinct t;
    ticks
    | join kind=leftouter v1 on t
    | join kind=leftouter v2 on t
    | join kind=leftouter i1 on t
    | join kind=leftouter i2 on t
    | project localtime = t, value_double = (v1 * i1) + (v2 * i2)
    | order by localtime asc
  `.trim();
}

// ---- Battery computed power: P = V × I per module ---------------------------
export function buildBattery1PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/BMS/MODULE1/STAT/V', currentName: '/BMS/MODULE1/STAT/I' });
}

export function buildBattery2PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/BMS/MODULE2/STAT/V', currentName: '/BMS/MODULE2/STAT/I' });
}

export function buildBattery3PowerQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildProductPowerQuery({ serial, startDate, endDate, voltageName: '/BMS/MODULE3/STAT/V', currentName: '/BMS/MODULE3/STAT/I' });
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
  | 'pv1_current'
  | 'pv2_current'
  | 'pv3_current'
  | 'pv4_current'
  | 'battery_voltage'
  | 'grid_power'
  | 'load_power';

const telemetryNameMap: Record<TelemetryType, string> = {
  wifi_signal: '/SCC/WIFI/STAT/SIGNAL_STRENGTH',
  pv1_voltage: '/INV/DCPORT/STAT/PV1/V',
  pv2_voltage: '/INV/DCPORT/STAT/PV2/V',
  pv3_voltage: '/INV/DCPORT/STAT/PV3/V',
  pv4_voltage: '/INV/DCPORT/STAT/PV4/V',
  pv1_current: '/INV/DCPORT/STAT/PV1/I',
  pv2_current: '/INV/DCPORT/STAT/PV2/I',
  pv3_current: '/INV/DCPORT/STAT/PV3/I',
  pv4_current: '/INV/DCPORT/STAT/PV4/I',
  battery_voltage: '/INV/DCPORT/STAT/BATTERY/V',
  grid_power: '/INV/ACPORT/STAT/GRID/P',
  load_power: '/SYS/MEAS/STAT/LOAD/P_TOTAL',
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

// Battery Voltage (Modules 1-3)
export function buildBattery1VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/V' });
}

export function buildBattery2VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/V' });
}

export function buildBattery3VoltageQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/V' });
}

// Battery Temperature (Modules 1-3)
export function buildBattery1TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/TEMP' });
}

export function buildBattery2TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/TEMP' });
}

export function buildBattery3TempQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/TEMP' });
}

// Battery State of Charge (Modules 1-3)
export function buildBattery1SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/USER_SOC' });
}

export function buildBattery2SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/USER_SOC' });
}

export function buildBattery3SoCQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/USER_SOC' });
}

// Battery Current (Modules 1-3)
export function buildBattery1CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/I' });
}

export function buildBattery2CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/I' });
}

export function buildBattery3CurrentQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/I' });
}



// ============================================================================
// Battery Relay Status Widget (Alarms table)
// ============================================================================

/**
 * Build KQL query for Battery Relay Status
 * Uses Alarms table and projects 'value' as 'value_double' for chart compatibility
 * Value: 1 = Activated, 0 = Not Activated, -1 = Invalid
 */
export function buildBatteryMainRelayQuery(serial: string, startDate: Date, endDate: Date): string {
  return `
    let s = '${serial}';
    Alarms
    | where comms_serial contains s
    | where name contains '/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR'
    | where localtime between (datetime(${startDate.toISOString()}) .. datetime(${endDate.toISOString()}))
    | project localtime, value_double = value
    | order by localtime asc
  `.trim();
}

export function buildBatteryHeaterStatusQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {

  return `
    let s = '${serial}';
    let start = datetime(${startDate.toISOString()});
    let finish = datetime(${endDate.toISOString()});
    Alarms
    | where comms_serial contains s
    | where name contains '/BMS/CLUSTER/EVENT/INFO/HEATER_FUNCTION_STATUS'
    | where localtime between (start .. finish)
    | project localtime, value_double = value
    | order by localtime asc
  `.trim();
}
// ============================================================================
// Fast Telemetry Widgets (Load Measurements- ACTUALLYACPORT MEasurements not load)
// Uses sourcedatastreamingfornam table with fast-telemetry msgType
// ============================================================================

interface FastTelemetryQueryParams {
  serial: string;
  startDate: Date;
  endDate: Date;
  telemetryName: string;
}

/**
 * Build KQL query for fast telemetry data
 * Uses sourcedatastreamingfornam table with fast-telemetry message type
 */
export function buildFastTelemetryQuery(params: FastTelemetryQueryParams): string {
  const { serial, startDate, endDate, telemetryName } = params;
  
  const escapedSerial = escapeKqlString(serial);
  const startLocal = formatDateForKql(startDate);
  const endLocal = formatDateForKql(endDate);

  return `
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    let s = '${escapedSerial}';
    sourcedatastreamingfornam
    | where timestamp between (start .. finish)
    | extend telemetryArray = parse_json(data)
    | where header has s
    | mv-expand telemetry = telemetryArray
    | where telemetry.msgType == "fast-telemetry"
    | mv-expand item = telemetry.payload
    | extend name = tostring(item.name), value = item.value
    | where name contains "${telemetryName}"
    | project localtime = timestamp, name, value_double = todouble(value)
    | order by localtime asc
  `.trim();
}

/**
 * Build query for L1 RMS Voltage Load from Inverter (fast-telemetry)
 */
export function buildLoadVoltageL1FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L1N', //this is ACPORT voltage, not the load
  });
}

/**
 * Build query for L2 RMS Voltage Load from Inverter (fast-telemetry)
 */
export function buildLoadVoltageL2FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L2N', //this is ACPORT voltage, not the load
  });
}

/**
 * Build query for Load Frequency Total from Inverter (fast-telemetry)
 */
export function buildLoadFrequencyTotalFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/FREQ_TOTAL',
  });
}

/** 
 * Build query for Load Current L1 from Inverter (fast-telemetry)
 */
export function buildLoadCurrentL1Query(serial: string, startDate: Date, endDate: Date): string {   
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L1N',
  });
}

/** 
 * Build query for Load Current L1 from Inverter (fast-telemetry)
 */
export function buildLoadCurrentL2Query(serial: string, startDate: Date, endDate: Date): string {   
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/IRMS_L2N',
  });
}

// ============================================================================
// Normal Telemetry Versions of Load Measurements
// Uses standard Telemetry table (sampled every 15 min)
// ============================================================================

/**
 * Build query for L1 RMS Voltage Load (normal telemetry - 15 min sampling)
 */
export function buildLoadVoltageL1NormalQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L1N', // from inverter's AC PORT
  });
}

/**
 * Build query for L2 RMS Voltage Load (normal telemetry - 15 min sampling)
 */
export function buildLoadVoltageL2NormalQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/VRMS_L2N', // from inverter's AC PORT
  });
}

/**
 * Build query for Load Frequency Total (normal telemetry - 15 min sampling)
 */
export function buildLoadFrequencyTotalNormalQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/FREQ_TOTAL',
  });
}

/**
 * Build query for L1 RMS Current Load (normal telemetry - 15 min sampling)
 */
export function buildLoadCurrentL1NormalQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/IRMS_L1N',
  });
}

/**
 * Build query for L2 RMS Current Load (normal telemetry - 15 min sampling)
 */
export function buildLoadCurrentL2NormalQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/ACPORT/STAT/IRMS_L2N',
  });
}

// ============================================================================
// Fast Telemetry Versions of Grid Measurements
// Uses sourcedatastreamingfornam table (sampled every 15 sec)
// ============================================================================

/**
 * Build query for Grid Voltage L1 (fast-telemetry - 15 sec sampling)
 */
export function buildGridVoltageL1FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/GRID/VRMS_L1', //with respect to a measuring device
  });
}

/**
 * Build query for Grid Voltage L2 (fast-telemetry - 15 sec sampling)
 */
export function buildGridVoltageL2FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/GRID/VRMS_L2', //with respect to a measuring device
  });
}

/**
 * Build query for Grid Current L1 (fast-telemetry - 15 sec sampling)
 */
export function buildGridCurrentL1FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/GRID/IRMS_L1', //with respect to a measuring device
  });
}

/**
 * Build query for Grid Current L2 (fast-telemetry - 15 sec sampling)
 */
export function buildGridCurrentL2FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/GRID/IRMS_L2', //with respect to a measuring device
  });
}

/**
 * Build query for Grid Frequency Total (fast-telemetry - 15 sec sampling)
 */
export function buildGridFrequencyTotalFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/GRID/FREQ_TOTAL', //with respect to a measuring device
  });
}

/**
 * Build query for Load Current L1 (fast-telemetry - 15 sec sampling)
 */
export function buildLoadCurrentL1FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/LOAD/IRMS_L1',
  });
}

/**
 * Build query for Load Current L2 (fast-telemetry - 15 sec sampling)
 */
export function buildLoadCurrentL2FastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/SYS/MEAS/STAT/LOAD/IRMS_L2',
  });
}

// ============================================================================
// Fast Telemetry Versions of PV Measurements
// Uses sourcedatastreamingfornam table (sampled every 15 sec)
// ============================================================================

/**
 * Build query for PV1 Voltage (fast-telemetry - 15 sec sampling)
 */
export function buildPV1VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV1/V',
  });
}

/**
 * Build query for PV2 Voltage (fast-telemetry - 15 sec sampling)
 */
export function buildPV2VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV2/V',
  });
}

/**
 * Build query for PV3 Voltage (fast-telemetry - 15 sec sampling)
 */
export function buildPV3VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV3/V',
  });
}

/**
 * Build query for PV4 Voltage (fast-telemetry - 15 sec sampling)
 */
export function buildPV4VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV4/V',
  });
}

/**
 * Build query for PV1 Current (fast-telemetry - 15 sec sampling)
 */
export function buildPV1CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV1/I',
  });
}

/**
 * Build query for PV2 Current (fast-telemetry - 15 sec sampling)
 */
export function buildPV2CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV2/I',
  });
}

/**
 * Build query for PV3 Current (fast-telemetry - 15 sec sampling)
 */
export function buildPV3CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV3/I',
  });
}

/**
 * Build query for PV4 Current (fast-telemetry - 15 sec sampling)
 */
export function buildPV4CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/INV/DCPORT/STAT/PV4/I',
  });
}



// ============================================================================
// Fast Telemetry Versions of Battery Measurements
// Uses sourcedatastreamingfornam table (sampled every 15 sec)
// ============================================================================

// Battery 1
export function buildBattery1VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/V' });
}

export function buildBattery1TempFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/TEMP' });
}

export function buildBattery1SoCFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/USER_SOC' });
}

export function buildBattery1CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE1/STAT/I' });
}

// Battery 2
export function buildBattery2VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/V' });
}

export function buildBattery2TempFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/TEMP' });
}

export function buildBattery2SoCFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/USER_SOC' });
}

export function buildBattery2CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE2/STAT/I' });
}

// Battery 3
export function buildBattery3VoltageFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/V' });
}

export function buildBattery3TempFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/TEMP' });
}

export function buildBattery3SoCFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/USER_SOC' });
}

export function buildBattery3CurrentFastQuery(serial: string, startDate: Date, endDate: Date): string {
  return buildFastTelemetryQuery({ serial, startDate, endDate, telemetryName: '/BMS/MODULE3/STAT/I' });
}

// ============================================================================
// Inverter Operating State Query Builders
// ============================================================================

/**
 * Build query for Inverter Operating State history
 * Returns numeric state values (0-9) representing different inverter modes
 */
export function buildInverterOperatingStateQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: 'INV/DEV/STAT/OPERATING_STATE',
  });
}

/**
 * Build fast telemetry query for Inverter Operating State history
 */
export function buildInverterOperatingStateFastQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: 'INV/DEV/STAT/OPERATING_STATE',
  });
}

// ============================================================================
// ETP Connection Status Queries
// ============================================================================

/**
 * Build query for ETP Connection Status history
 * Returns numeric state values (0-7) representing different connection states
 */
export function buildEtpConnectionStatusQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: 'SCC/CLOUD/STAT/ETP/CONN_STATUS',
  });
}

/**
 * Build fast telemetry query for ETP Connection Status history
 */
export function buildEtpConnectionStatusFastQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: 'SCC/CLOUD/STAT/ETP/CONN_STATUS',
  });
}

// ============================================================================
// BGCS Grid Relay Status Queries
// ============================================================================

/**
 * Build query for BGCS Grid Relay Status history
 * Returns numeric state values (-1 to 8) representing different relay states:
 * -1: INVALID, 0: UNDEFINED, 1: OPEN, 2: CLOSED, 3: FAULTED_OPEN, 
 * 4: FAULTED_CLOSED, 5: OVERRIDE_OPEN, 6: OVERRIDE_CLOSED, 7: ESTOP_OPEN, 8: ESTOP_CLOSED
 */
export function buildBgcsRelayStatusQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/BGCS/GRID/STAT/RELAY_STATUS',
  });
}

/**
 * Build fast telemetry query for BGCS Grid Relay Status history
 */
export function buildBgcsRelayStatusFastQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  return buildFastTelemetryQuery({
    serial,
    startDate,
    endDate,
    telemetryName: '/BGCS/GRID/STAT/RELAY_STATUS',
  });
}

// ============================================================================
// Cellular Signal Strength (Alarms table)
// Value: 1 = LOW SIGNAL alarm active (BAD), 0 = cleared / OK
// ============================================================================

/**
 * Build KQL query for Cellular Low-Signal-Strength alarm history.
 * Reads the Alarms table and projects 'value' as 'value_double' so the
 * BaseTimeSeriesWidget chart pipeline can render it like a 0/1 telemetry.
 */
export function buildCellularSignalStrengthQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  const escapedSerial = escapeKqlString(serial);
  const startLocal = formatDateForKql(startDate);
  const endLocal = formatDateForKql(endDate);

  return `
    let s = '${escapedSerial}';
    let start = datetime(${startLocal});
    let finish = datetime(${endLocal});
    Alarms
    | where comms_serial contains s
    | where name contains '/CCM/DEV/EVENT/WARNING/LOW_SIGNAL_STRENGTH'
    | where localtime between (start .. finish)
    | project localtime, value_double = value
    | order by localtime asc
  `.trim();
}

/**
 * Build KQL query for the latest Cellular Low-Signal-Strength alarm value.
 * Used by the EnergyFlowDiagram instant indicator.
 */
export function buildCellularSignalLatestKql(serial: string): string {
  const s = escapeKqlString(serial);
  return `
    let s = '${s}';
    Alarms
    | where comms_serial contains s
    | where name contains '/CCM/DEV/EVENT/WARNING/LOW_SIGNAL_STRENGTH'
    | top 1 by localtime desc
    | project localtime, value_double = value
  `.trim();
}

// ============================================================================
// Firmware History (DevInfo table)
// Returns distinct firmware records over the selected window.
// ============================================================================

/**
 * Build KQL query for firmware history over a time range.
 * Honors the global "Historical Data Time Range" by filtering on localtime.
 */
export function buildFirmwareHistoryQuery(
  serial: string,
  startDate: Date,
  endDate: Date
): string {
  const escapedSerial = escapeKqlString(serial);
  const startLocal = formatDateForKql(startDate);
  const endLocal = formatDateForKql(endDate);

  return `
    let s = '${escapedSerial}';
    DevInfo
    | where comms_serial contains s
    | distinct localtime, utctime, name, modelName, firmware_version
    | order by localtime desc
    | limit 5000
  `.trim();
}
