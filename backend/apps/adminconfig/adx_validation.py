"""ADX helpers for the Validation Report (FR-018).

Fetches the latest valid cloud value for every catalogued metric plus the
device firmware / last-seen record.
"""

import logging
import re
from datetime import datetime, timezone

from telemetryapp.adx_service import query_adx

from .metrics_catalog import METRICS

logger = logging.getLogger(__name__)

_SERIAL_RE = re.compile(r'^[A-Za-z0-9._:\- ]{1,64}$')


class InvalidSerialError(ValueError):
    pass


def validate_serial(serial):
    serial = (serial or '').strip()
    if not _SERIAL_RE.match(serial):
        raise InvalidSerialError('Serial number contains unsupported characters.')
    return serial


def _rows(result):
    if isinstance(result, dict):
        return result.get('data', []) or []
    if isinstance(result, list):
        return result
    return []


def _kql_array(names):
    quoted = ', '.join("'{}'".format(n.replace("'", "''")) for n in names)
    return f'dynamic([{quoted}])'


def _latest_by_name(table, value_column, serial, names, lookback_days):
    if not names:
        return {}
    kql = f"""
        let s = '{serial}';
        {table}
        | where comms_serial contains s
        | where localtime > ago({lookback_days}d)
        | where name has_any ({_kql_array(names)})
        | where isnotnull({value_column})
        | summarize arg_max(localtime, {value_column}) by name
        | project name, localtime, value_double = {value_column}
    """.strip()
    try:
        return {str(r.get('name', '')): r for r in _rows(query_adx(kql))}
    except Exception as exc:  # noqa: BLE001 - ADX outage must not break the report
        logger.error('Validation report %s query failed: %s', table, exc)
        return {}


def _device_record(serial):
    kql = f"""
        let s = '{serial}';
        DevInfo
        | where comms_serial contains s
        | top 1 by localtime desc
        | project localtime, utctime, name, modelName, firmware_version
    """.strip()
    try:
        rows = _rows(query_adx(kql))
        return rows[0] if rows else {}
    except Exception as exc:  # noqa: BLE001
        logger.error('Validation report DevInfo query failed: %s', exc)
        return {}


def _match(signal_name, index):
    """Resolve an ADX signal name to the row returned for that signal."""
    if not signal_name:
        return None
    needle = signal_name.lstrip('/').lower()
    for name, row in index.items():
        if needle in name.lstrip('/').lower():
            return row
    return None


def _to_iso_utc(value):
    if value is None or value == '':
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    return str(value)


def collect_latest_values(serial, lookback_days=7):
    """Return ``{metric_key: {'value', 'timestamp', 'signal'}}`` plus device info."""
    serial = validate_serial(serial).replace("'", "''")

    telemetry_names = [m['telemetry_name'] for m in METRICS if m['source'] == 'telemetry' and m['telemetry_name']]
    alarm_names = [m['telemetry_name'] for m in METRICS if m['source'] == 'alarms' and m['telemetry_name']]

    telemetry_index = _latest_by_name('Telemetry', 'value_double', serial, telemetry_names, lookback_days)
    alarm_index = _latest_by_name('Alarms', 'value', serial, alarm_names, lookback_days)

    samples = {}
    for metric in METRICS:
        if metric['source'] == 'computed' or not metric['telemetry_name']:
            continue
        index = alarm_index if metric['source'] == 'alarms' else telemetry_index
        row = _match(metric['telemetry_name'], index)
        if row is None:
            samples[metric['key']] = {'value': None, 'timestamp': None, 'signal': metric['telemetry_name']}
            continue
        samples[metric['key']] = {
            'value': row.get('value_double'),
            'timestamp': _to_iso_utc(row.get('localtime')),
            'signal': str(row.get('name') or metric['telemetry_name']),
        }

    device = _device_record(serial)
    return samples, {
        'serial': serial,
        'model': device.get('modelName'),
        'firmware_version': device.get('firmware_version'),
        'last_seen': _to_iso_utc(device.get('utctime') or device.get('localtime')),
    }
