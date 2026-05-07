// src/components/CorrelationOverTime/signalCatalog.ts
// Registry of every signal the user can overlay in the Correlation Over Time
// card. We re-use the existing widgetConfigs (their KQL is the proven, in-
// production source of truth) so the data here matches the standalone widget
// for that same signal exactly. Only color/dash are overridden — the original
// widgetConfigs assigns the same color to every PV (green), every grid signal
// (orange), every battery (purple), which collapses on an overlay chart.
//
// Coverage parity with the dashboard (Dashboard.jsx + widgetConfigs.ts):
//   - System status:  Wi-Fi · Inverter Op · ETP Conn · BGCS Relay
//   - PV:             PV1–PV4 Voltage, PV1–PV4 Current
//   - Grid:           V L1/L2 · I L1/L2 · Frequency · Power
//   - Load:           V L1/L2 · I L1/L2 · Frequency · Power
//   - Battery agg.:   Voltage
//   - Battery 1/2/3:  Voltage · Temperature · SoC · Current
//   - Battery Relay:  Status

import {
  // System status
  wifiSignalConfig,
  inverterOperatingStateConfig,
  etpConnectionStatusConfig,
  bgcsRelayStatusConfig,
  // PV
  pv1VoltageConfig, pv2VoltageConfig, pv3VoltageConfig, pv4VoltageConfig,
  pv1CurrentConfig, pv2CurrentConfig, pv3CurrentConfig, pv4CurrentConfig,
  // Grid
  gridVoltageL1Config, gridVoltageL2Config,
  gridCurrentL1Config, gridCurrentL2Config,
  gridFrequencyTotalConfig, gridPowerConfig,
  // Load
  loadVoltageL1Config, loadVoltageL2Config,
  loadCurrentL1Config, loadCurrentL2Config,
  loadFrequencyTotalConfig, loadPowerConfig,
  // Battery aggregate + per-module
  batteryVoltageConfig,
  battery1VoltageConfig, battery1TempConfig, battery1SoCConfig, battery1CurrentConfig,
  battery2VoltageConfig, battery2TempConfig, battery2SoCConfig, battery2CurrentConfig,
  battery3VoltageConfig, battery3TempConfig, battery3SoCConfig, battery3CurrentConfig,
  // Battery main relay
  batteryMainRelayConfig,
  batteryHeaterStatusConfig,
} from '../widgets/widgetConfigs';
import type { WidgetConfig } from '../widgets/BaseTimeSeriesWidget';
import type { SignalDef } from './types';

// ----------------------------------------------------------------------------
// Dash patterns
// ----------------------------------------------------------------------------
const DASH_SOLID = undefined;
const DASH_DASHED = '6 3';
const DASH_DOTTED = '2 3';
const DASH_DASHDOT = '8 3 2 3';

// ----------------------------------------------------------------------------
// Curated palette — unique (color, dash) signature per signal.
// ----------------------------------------------------------------------------
interface PaletteEntry {
  color: string;
  dash?: string;
}

const PALETTE: Record<string, PaletteEntry> = {
  // System status — distinct hues, all solid
  wifi_rssi:        { color: '#ec4899', dash: DASH_SOLID },   // pink
  inverter_op:      { color: '#64748b', dash: DASH_SOLID },   // slate
  etp_conn:         { color: '#1909f3ff', dash: DASH_SOLID },   // gray
  bgcs_relay:       { color: '#46efd3ff', dash: DASH_SOLID },   // fuchsia
  battery_relay:    { color: '#b0c20cff', dash: DASH_DASHED },  // burnt orange

  // PV Voltage  (4 distinct hues — no shared family color)
  pv1_v: { color: '#10b981', dash: DASH_SOLID },     // emerald
  pv2_v: { color: '#14b8a6', dash: DASH_SOLID },     // teal
  pv3_v: { color: '#a855f7', dash: DASH_SOLID },     // purple
  pv4_v: { color: '#db2777', dash: DASH_SOLID },     // magenta
  // PV Current  (4 distinct hues, separate from PV-Voltage colors)
  pv1_i: { color: '#ca8a04', dash: DASH_SOLID },     // gold
  pv2_i: { color: '#f97316', dash: DASH_SOLID },     // orange
  pv3_i: { color: '#15803d', dash: DASH_SOLID },     // forest green
  pv4_i: { color: '#be123c', dash: DASH_SOLID },     // crimson

  // Grid
  grid_v_l1: { color: '#f5130bff', dash: DASH_SOLID },   // amber solid
  grid_v_l2: { color: '#f59e0b', dash: DASH_DASHED },  // amber dashed
  grid_i_l1: { color: '#ef44d0ff', dash: DASH_SOLID },   // red solid
  grid_i_l2: { color: '#44ef5bff', dash: DASH_DASHED },  // red dashed
  grid_freq: { color: '#c8ff00ff', dash: DASH_SOLID },   // yellow solid
  grid_p:    { color: '#a16207', dash: DASH_SOLID },   // brown solid

  // Load
  load_v_l1: { color: '#6366f1', dash: DASH_SOLID },   // indigo solid
  load_v_l2: { color: '#f16371ff', dash: DASH_DASHED },  // indigo dashed
  load_i_l1: { color: '#e10786ff', dash: DASH_SOLID },   // rose solid
  load_i_l2: { color: '#3ff4a6ff', dash: DASH_DASHED },  // rose dashed
  load_freq: { color: '#06b6d4', dash: DASH_SOLID },   // cyan solid
  load_p:    { color: '#3b82f6', dash: DASH_SOLID },   // blue solid

  // Battery Voltage  (violet family)
  batt_v:  { color: '#5cf661ff', dash: DASH_SOLID },     // aggregate
  batt1_v: { color: '#8b5cf6', dash: DASH_DASHED },
  batt2_v: { color: '#5cf1f6ff', dash: DASH_DOTTED },
  batt3_v: { color: '#dc0a0aff', dash: DASH_DASHDOT },
  // Battery Temperature  (orange family)
  batt1_t: { color: '#3c55fbff', dash: DASH_SOLID },
  batt2_t: { color: '#de3cfbff', dash: DASH_DASHED },
  batt3_t: { color: '#fb923c', dash: DASH_DOTTED },
  // Battery SoC  (lime family)
  batt1_soc: { color: '#84cc16', dash: DASH_SOLID },
  batt2_soc: { color: '#3416ccff', dash: DASH_DASHED },
  batt3_soc: { color: '#cc163dff', dash: DASH_DOTTED },
  // Battery Current  (sky family)
  batt1_i: { color: '#d70ee9ff', dash: DASH_SOLID },
  batt2_i: { color: '#0ea5e9', dash: DASH_DASHED },
  batt3_i: { color: '#e9c10eff', dash: DASH_DOTTED },
  // Battery Heater Status (red-orange, solid)
  batt_heater: { color: '#f94016ff', dash: DASH_DOTTED },
};

/** Adapter: WidgetConfig + palette entry -> SignalDef. */
function toSignal(id: string, group: string, cfg: WidgetConfig): SignalDef {
  const p = PALETTE[id];
  if (!p) {
    return {
      id,
      label: cfg.label,
      unit: cfg.unit,
      color: '#94a3b8',
      group,
      buildQuery: cfg.buildQuery,
    };
  }
  return {
    id,
    label: cfg.label,
    unit: cfg.unit,
    color: p.color,
    dash: p.dash,
    group,
    buildQuery: cfg.buildQuery,
  };
}

/**
 * Curated, ordered list of signals shown in the selector.
 * Order matters — the selector renders top-to-bottom in this order.
 * The grouping mirrors the dashboard's CollapsibleSection layout.
 */
export const SIGNAL_CATALOG: SignalDef[] = [
  // ---- System Status ----
  toSignal('wifi_rssi',      'System Status', wifiSignalConfig),
  toSignal('inverter_op',    'System Status', inverterOperatingStateConfig),
  toSignal('etp_conn',       'System Status', etpConnectionStatusConfig),
  toSignal('bgcs_relay',     'System Status', bgcsRelayStatusConfig),

  // ---- PV ----
  toSignal('pv1_v', 'PV', pv1VoltageConfig),
  toSignal('pv2_v', 'PV', pv2VoltageConfig),
  toSignal('pv3_v', 'PV', pv3VoltageConfig),
  toSignal('pv4_v', 'PV', pv4VoltageConfig),
  toSignal('pv1_i', 'PV', pv1CurrentConfig),
  toSignal('pv2_i', 'PV', pv2CurrentConfig),
  toSignal('pv3_i', 'PV', pv3CurrentConfig),
  toSignal('pv4_i', 'PV', pv4CurrentConfig),

  // ---- Grid ----
  toSignal('grid_v_l1', 'Grid', gridVoltageL1Config),
  toSignal('grid_v_l2', 'Grid', gridVoltageL2Config),
  toSignal('grid_i_l1', 'Grid', gridCurrentL1Config),
  toSignal('grid_i_l2', 'Grid', gridCurrentL2Config),
  toSignal('grid_freq', 'Grid', gridFrequencyTotalConfig),
  toSignal('grid_p',    'Grid', gridPowerConfig),

  // ---- Load ----
  toSignal('load_v_l1', 'Load', loadVoltageL1Config),
  toSignal('load_v_l2', 'Load', loadVoltageL2Config),
  toSignal('load_i_l1', 'Load', loadCurrentL1Config),
  toSignal('load_i_l2', 'Load', loadCurrentL2Config),
  toSignal('load_freq', 'Load', loadFrequencyTotalConfig),
  toSignal('load_p',    'Load', loadPowerConfig),

  // ---- Battery (aggregate) ----
  toSignal('batt_v',        'Battery',  batteryVoltageConfig),
  toSignal('battery_relay', 'Battery',  batteryMainRelayConfig),

  // ---- Battery Module 1 ----
  toSignal('batt1_v',   'Battery Module 1', battery1VoltageConfig),
  toSignal('batt1_t',   'Battery Module 1', battery1TempConfig),
  toSignal('batt1_soc', 'Battery Module 1', battery1SoCConfig),
  toSignal('batt1_i',   'Battery Module 1', battery1CurrentConfig),

  // ---- Battery Module 2 ----
  toSignal('batt2_v',   'Battery Module 2', battery2VoltageConfig),
  toSignal('batt2_t',   'Battery Module 2', battery2TempConfig),
  toSignal('batt2_soc', 'Battery Module 2', battery2SoCConfig),
  toSignal('batt2_i',   'Battery Module 2', battery2CurrentConfig),

  // ---- Battery Module 3 ----
  toSignal('batt3_v',   'Battery Module 3', battery3VoltageConfig),
  toSignal('batt3_t',   'Battery Module 3', battery3TempConfig),
  toSignal('batt3_soc', 'Battery Module 3', battery3SoCConfig),
  toSignal('batt3_i',   'Battery Module 3', battery3CurrentConfig),
  toSignal('batt_heater', 'Battery', batteryHeaterStatusConfig),
];

/** O(1) lookup for selection ids. */
export const SIGNAL_BY_ID: Record<string, SignalDef> =
  SIGNAL_CATALOG.reduce<Record<string, SignalDef>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

/** Default selection on first card render — kept small for legibility. */
export const DEFAULT_SIGNAL_IDS: string[] = ['pv1_v', 'grid_v_l1', 'batt_v'];
