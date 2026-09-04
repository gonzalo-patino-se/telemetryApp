"""Canonical registry of every metric that supports thresholds.

The ``key`` values match the ``csvPrefix`` used by the frontend widget configs,
so a history-chart card can resolve its threshold without extra plumbing.
``telemetry_name`` is the ADX signal path used by the Validation Report and the
PDF report to fetch the latest cloud value.
"""

# source: 'telemetry' -> ADX Telemetry table, 'alarms' -> ADX Alarms table,
# 'computed' -> derived from other signals (no single ADX signal to sample).
# kind: 'numeric' -> lower/upper limits, 'state' -> enumerated values that are
# classified by listing which states pass and which fail.
INVERTER_STATES = [
    {'value': -1, 'label': 'INVALID'},
    {'value': 0, 'label': 'UNDEFINED'},
    {'value': 1, 'label': 'OFFLINE'},
    {'value': 2, 'label': 'DISABLED'},
    {'value': 3, 'label': 'STANDBY'},
    {'value': 4, 'label': 'NORMAL'},
    {'value': 5, 'label': 'LIMP MODE'},
    {'value': 6, 'label': 'FAULT (AUTO)'},
    {'value': 7, 'label': 'FAULT (MANUAL)'},
    {'value': 8, 'label': 'FW UPDATE'},
    {'value': 9, 'label': 'SELF TEST'},
]

ETP_STATES = [
    {'value': 0, 'label': 'CONNECTION_OK'},
    {'value': 1, 'label': 'EXPIRED_SAS_TOKEN'},
    {'value': 2, 'label': 'DEVICE_DISABLED'},
    {'value': 3, 'label': 'BAD_CREDENTIALS'},
    {'value': 4, 'label': 'RETRY_EXPIRED'},
    {'value': 5, 'label': 'NO_NETWORK'},
    {'value': 6, 'label': 'COMMUNICATION_ERROR'},
    {'value': 7, 'label': 'UNKNOWN'},
]

BGCS_RELAY_STATES = [
    {'value': -1, 'label': 'INVALID'},
    {'value': 0, 'label': 'UNDEFINED'},
    {'value': 1, 'label': 'OPEN'},
    {'value': 2, 'label': 'CLOSED'},
    {'value': 3, 'label': 'FAULTED_OPEN'},
    {'value': 4, 'label': 'FAULTED_CLOSED'},
    {'value': 5, 'label': 'OVERRIDE_OPEN'},
    {'value': 6, 'label': 'OVERRIDE_CLOSED'},
    {'value': 7, 'label': 'ESTOP_OPEN'},
    {'value': 8, 'label': 'ESTOP_CLOSED'},
]

CELLULAR_STATES = [
    {'value': 0, 'label': 'OK'},
    {'value': 1, 'label': 'LOW SIGNAL'},
]

RELAY_ERROR_STATES = [
    {'value': 0, 'label': 'NO ERROR'},
    {'value': 1, 'label': 'RELAY ERROR'},
]

HEATER_STATES = [
    {'value': 0, 'label': 'OFF'},
    {'value': 1, 'label': 'ON'},
]

METRICS = [
    # --- Connectivity -------------------------------------------------------
    {'key': 'wifi_signal', 'label': 'Wi-Fi Signal Strength', 'unit': 'dBm',
     'subsystem': 'SCC', 'telemetry_name': '/SCC/WIFI/STAT/SIGNAL_STRENGTH', 'source': 'telemetry'},
    {'key': 'cellular_signal_strength', 'label': 'Cellular Signal Strength', 'unit': 'State',
     'subsystem': 'SCC', 'telemetry_name': '/CCM/DEV/EVENT/WARNING/LOW_SIGNAL_STRENGTH', 'source': 'alarms',
     'kind': 'state', 'states': CELLULAR_STATES},
    {'key': 'etp_connection_status', 'label': 'ETP Connection Status', 'unit': 'Status',
     'subsystem': 'ETP', 'telemetry_name': 'SCC/CLOUD/STAT/ETP/CONN_STATUS', 'source': 'telemetry',
     'kind': 'state', 'states': ETP_STATES},

    # --- Inverter -----------------------------------------------------------
    {'key': 'inverter_operating_state', 'label': 'Inverter Operating State', 'unit': 'State',
     'subsystem': 'INV', 'telemetry_name': 'INV/DEV/STAT/OPERATING_STATE', 'source': 'telemetry',
     'kind': 'state', 'states': INVERTER_STATES},

    # --- BGCS ---------------------------------------------------------------
    {'key': 'bgcs_relay_status', 'label': 'BGCS Grid Relay Status', 'unit': 'Status',
     'subsystem': 'BGCS', 'telemetry_name': '/BGCS/GRID/STAT/RELAY_STATUS', 'source': 'telemetry',
     'kind': 'state', 'states': BGCS_RELAY_STATES},

    # --- Solar PV -----------------------------------------------------------
    {'key': 'pv1_voltage', 'label': 'PV1 Voltage', 'unit': 'V', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV1/V', 'source': 'telemetry'},
    {'key': 'pv2_voltage', 'label': 'PV2 Voltage', 'unit': 'V', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV2/V', 'source': 'telemetry'},
    {'key': 'pv3_voltage', 'label': 'PV3 Voltage', 'unit': 'V', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV3/V', 'source': 'telemetry'},
    {'key': 'pv4_voltage', 'label': 'PV4 Voltage', 'unit': 'V', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV4/V', 'source': 'telemetry'},
    {'key': 'pv1_current', 'label': 'PV1 Current', 'unit': 'A', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV1/I', 'source': 'telemetry'},
    {'key': 'pv2_current', 'label': 'PV2 Current', 'unit': 'A', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV2/I', 'source': 'telemetry'},
    {'key': 'pv3_current', 'label': 'PV3 Current', 'unit': 'A', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV3/I', 'source': 'telemetry'},
    {'key': 'pv4_current', 'label': 'PV4 Current', 'unit': 'A', 'subsystem': 'PV',
     'telemetry_name': '/INV/DCPORT/STAT/PV4/I', 'source': 'telemetry'},
    {'key': 'pv1_power', 'label': 'PV1 Power', 'unit': 'W', 'subsystem': 'PV',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'pv2_power', 'label': 'PV2 Power', 'unit': 'W', 'subsystem': 'PV',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'pv3_power', 'label': 'PV3 Power', 'unit': 'W', 'subsystem': 'PV',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'pv4_power', 'label': 'PV4 Power', 'unit': 'W', 'subsystem': 'PV',
     'telemetry_name': None, 'source': 'computed'},

    # --- Grid ---------------------------------------------------------------
    {'key': 'grid_voltage_l1', 'label': 'Grid Voltage RMS L1', 'unit': 'V', 'subsystem': 'GRID',
     'telemetry_name': '/SYS/MEAS/STAT/GRID/VRMS_L1N', 'source': 'telemetry'},
    {'key': 'grid_voltage_l2', 'label': 'Grid Voltage RMS L2', 'unit': 'V', 'subsystem': 'GRID',
     'telemetry_name': '/SYS/MEAS/STAT/GRID/VRMS_L2N', 'source': 'telemetry'},
    {'key': 'grid_current_l1', 'label': 'Grid Current RMS L1', 'unit': 'A', 'subsystem': 'GRID',
     'telemetry_name': '/SYS/MEAS/STAT/GRID/IRMS_L1', 'source': 'telemetry'},
    {'key': 'grid_current_l2', 'label': 'Grid Current RMS L2', 'unit': 'A', 'subsystem': 'GRID',
     'telemetry_name': '/SYS/MEAS/STAT/GRID/IRMS_L2', 'source': 'telemetry'},
    {'key': 'grid_frequency_total', 'label': 'Grid Frequency Total', 'unit': 'Hz', 'subsystem': 'GRID',
     'telemetry_name': '/SYS/MEAS/STAT/GRID/FREQ_TOTAL', 'source': 'telemetry'},
    {'key': 'grid_power', 'label': 'Grid Power', 'unit': 'W', 'subsystem': 'GRID',
     'telemetry_name': None, 'source': 'computed'},

    # --- Load ---------------------------------------------------------------
    {'key': 'load_voltage_l1', 'label': 'Load Voltage RMS L1', 'unit': 'V', 'subsystem': 'LOAD',
     'telemetry_name': '/INV/ACPORT/STAT/VRMS_L1N', 'source': 'telemetry'},
    {'key': 'load_voltage_l2', 'label': 'Load Voltage RMS L2', 'unit': 'V', 'subsystem': 'LOAD',
     'telemetry_name': '/INV/ACPORT/STAT/VRMS_L2N', 'source': 'telemetry'},
    {'key': 'load_current_l1', 'label': 'Load Current RMS L1', 'unit': 'A', 'subsystem': 'LOAD',
     'telemetry_name': '/SYS/MEAS/STAT/LOAD/IRMS_L1', 'source': 'telemetry'},
    {'key': 'load_current_l2', 'label': 'Load Current RMS L2', 'unit': 'A', 'subsystem': 'LOAD',
     'telemetry_name': '/SYS/MEAS/STAT/LOAD/IRMS_L2', 'source': 'telemetry'},
    {'key': 'load_frequency_total', 'label': 'Load Frequency Total', 'unit': 'Hz', 'subsystem': 'LOAD',
     'telemetry_name': '/INV/ACPORT/STAT/FREQ_TOTAL', 'source': 'telemetry'},
    {'key': 'load_power', 'label': 'Load Power', 'unit': 'W', 'subsystem': 'LOAD',
     'telemetry_name': None, 'source': 'computed'},

    # --- Battery ------------------------------------------------------------
    {'key': 'battery_voltage', 'label': 'Battery Voltage (DC bus)', 'unit': 'V', 'subsystem': 'BMS',
     'telemetry_name': '/INV/DCPORT/STAT/BATTERY/V', 'source': 'telemetry'},
    {'key': 'battery1_voltage', 'label': 'Battery 1 Voltage', 'unit': 'V', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE1/STAT/V', 'source': 'telemetry'},
    {'key': 'battery2_voltage', 'label': 'Battery 2 Voltage', 'unit': 'V', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE2/STAT/V', 'source': 'telemetry'},
    {'key': 'battery3_voltage', 'label': 'Battery 3 Voltage', 'unit': 'V', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE3/STAT/V', 'source': 'telemetry'},
    {'key': 'battery1_current', 'label': 'Battery 1 Current', 'unit': 'A', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE1/STAT/I', 'source': 'telemetry'},
    {'key': 'battery2_current', 'label': 'Battery 2 Current', 'unit': 'A', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE2/STAT/I', 'source': 'telemetry'},
    {'key': 'battery3_current', 'label': 'Battery 3 Current', 'unit': 'A', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE3/STAT/I', 'source': 'telemetry'},
    {'key': 'battery1_soc', 'label': 'Battery 1 State of Charge', 'unit': '%', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE1/STAT/USER_SOC', 'source': 'telemetry'},
    {'key': 'battery2_soc', 'label': 'Battery 2 State of Charge', 'unit': '%', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE2/STAT/USER_SOC', 'source': 'telemetry'},
    {'key': 'battery3_soc', 'label': 'Battery 3 State of Charge', 'unit': '%', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE3/STAT/USER_SOC', 'source': 'telemetry'},
    {'key': 'battery1_temp', 'label': 'Battery 1 Temperature', 'unit': '\u00b0C', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE1/STAT/TEMP', 'source': 'telemetry'},
    {'key': 'battery2_temp', 'label': 'Battery 2 Temperature', 'unit': '\u00b0C', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE2/STAT/TEMP', 'source': 'telemetry'},
    {'key': 'battery3_temp', 'label': 'Battery 3 Temperature', 'unit': '\u00b0C', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/MODULE3/STAT/TEMP', 'source': 'telemetry'},
    {'key': 'battery1_power', 'label': 'Battery 1 Power', 'unit': 'W', 'subsystem': 'BMS',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'battery2_power', 'label': 'Battery 2 Power', 'unit': 'W', 'subsystem': 'BMS',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'battery3_power', 'label': 'Battery 3 Power', 'unit': 'W', 'subsystem': 'BMS',
     'telemetry_name': None, 'source': 'computed'},
    {'key': 'battery_main_relay', 'label': 'Battery Main Relay Error', 'unit': 'State', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR', 'source': 'alarms',
     'kind': 'state', 'states': RELAY_ERROR_STATES},
    {'key': 'battery_heater_status', 'label': 'Battery Heater Status', 'unit': 'State', 'subsystem': 'BMS',
     'telemetry_name': '/BMS/CLUSTER/EVENT/INFO/HEATER_FUNCTION_STATUS', 'source': 'alarms',
     'kind': 'state', 'states': HEATER_STATES},
]

for _metric in METRICS:
    _metric.setdefault('kind', 'numeric')
    _metric.setdefault('states', [])

METRICS_BY_KEY = {m['key']: m for m in METRICS}

METRIC_KEY_CHOICES = [(m['key'], f"{m['subsystem']} - {m['label']}") for m in METRICS]

SUBSYSTEMS = sorted({m['subsystem'] for m in METRICS})

STATE_METRIC_KEYS = {m['key'] for m in METRICS if m['kind'] == 'state'}


def get_metric(key):
    return METRICS_BY_KEY.get(key)


def is_state_metric(key):
    return key in STATE_METRIC_KEYS


def state_labels(key):
    """Map of state value -> label for a state metric."""
    return {s['value']: s['label'] for s in METRICS_BY_KEY.get(key, {}).get('states', [])}
