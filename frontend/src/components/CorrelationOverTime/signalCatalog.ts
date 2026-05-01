// src/components/CorrelationOverTime/signalCatalog.ts
// Registry of signals the user can overlay in the Correlation Over Time card.
//
// We deliberately *re-use* the existing widgetConfigs (same KQL, same palette)
// instead of redefining queries here. That guarantees the card shows exactly
// the same data as the standalone widget for that signal.

import { chartColorSchemes } from '../../utils/chartHelpers';
import {
  // PV
  pv1VoltageConfig, pv2VoltageConfig, pv3VoltageConfig, pv4VoltageConfig,
  pv1CurrentConfig, pv2CurrentConfig, pv3CurrentConfig, pv4CurrentConfig,
  // Grid
  gridVoltageL1Config, gridVoltageL2Config,
  gridCurrentL1Config, gridCurrentL2Config,
  gridFrequencyTotalConfig, gridPowerConfig,
  // Battery (module-level + aggregate)
  batteryVoltageConfig,
  battery1VoltageConfig, battery2VoltageConfig, battery3VoltageConfig,
  // Misc
  wifiSignalConfig, loadPowerConfig,
} from '../widgets/widgetConfigs';
import type { WidgetConfig } from '../widgets/BaseTimeSeriesWidget';
import type { SignalDef } from './types';

/** chartColorSchemes key -> resolved hex used by the overlay chart. */
function lineColor(schemeKey: keyof typeof chartColorSchemes): string {
  return chartColorSchemes[schemeKey].line;
}

/** Adapter: WidgetConfig -> SignalDef. */
function toSignal(
  id: string,
  group: string,
  cfg: WidgetConfig,
): SignalDef {
  return {
    id,
    label: cfg.label,
    unit: cfg.unit,
    color: lineColor(cfg.colorScheme),
    group,
    buildQuery: cfg.buildQuery,
  };
}

/**
 * Curated, ordered list of signals shown in the selector.
 * Order matters — the selector renders top-to-bottom in this order.
 */
export const SIGNAL_CATALOG: SignalDef[] = [
  // PV
  toSignal('pv1_v', 'PV', pv1VoltageConfig),
  toSignal('pv2_v', 'PV', pv2VoltageConfig),
  toSignal('pv3_v', 'PV', pv3VoltageConfig),
  toSignal('pv4_v', 'PV', pv4VoltageConfig),
  toSignal('pv1_i', 'PV', pv1CurrentConfig),
  toSignal('pv2_i', 'PV', pv2CurrentConfig),
  toSignal('pv3_i', 'PV', pv3CurrentConfig),
  toSignal('pv4_i', 'PV', pv4CurrentConfig),
  // Grid
  toSignal('grid_v_l1', 'Grid', gridVoltageL1Config),
  toSignal('grid_v_l2', 'Grid', gridVoltageL2Config),
  toSignal('grid_i_l1', 'Grid', gridCurrentL1Config),
  toSignal('grid_i_l2', 'Grid', gridCurrentL2Config),
  toSignal('grid_freq', 'Grid', gridFrequencyTotalConfig),
  toSignal('grid_p', 'Grid', gridPowerConfig),
  // Battery
  toSignal('batt_v', 'Battery', batteryVoltageConfig),
  toSignal('batt1_v', 'Battery', battery1VoltageConfig),
  toSignal('batt2_v', 'Battery', battery2VoltageConfig),
  toSignal('batt3_v', 'Battery', battery3VoltageConfig),
  // Misc
  toSignal('load_p', 'Load', loadPowerConfig),
  toSignal('wifi_rssi', 'Network', wifiSignalConfig),
];

/** O(1) lookup for selection ids. */
export const SIGNAL_BY_ID: Record<string, SignalDef> =
  SIGNAL_CATALOG.reduce<Record<string, SignalDef>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

/** Default selection on first card render — kept small for legibility. */
export const DEFAULT_SIGNAL_IDS: string[] = ['pv1_v', 'grid_v_l1', 'batt_v'];
