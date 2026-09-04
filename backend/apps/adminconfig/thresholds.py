"""Shared threshold resolution and evaluation logic.

Every consumer (history charts, PDF report, validation report) must classify
values the same way, so the rules live here once.
"""

import math

from django.db.models import Q

from .metrics_catalog import METRICS, METRICS_BY_KEY, state_labels
from .models import MetricThreshold, ReportSetting, SecurityPolicy, UserProfile

PASSED = 'passed'
FAILED = 'failed'
UNKNOWN = 'unknown'

MISSING_THRESHOLD_TEXT = 'Threshold needs to be defined.'


def classify(value, lower, upper):
    """Return 'passed', 'failed' or 'unknown' for a value against a threshold."""
    if lower is None and upper is None:
        return UNKNOWN
    if value is None:
        return UNKNOWN
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return UNKNOWN
    if math.isnan(numeric) or math.isinf(numeric):
        return UNKNOWN
    if lower is not None and numeric < lower:
        return FAILED
    if upper is not None and numeric > upper:
        return FAILED
    return PASSED


def classify_state(value, passed_states, failed_states):
    """Classify an enumerated value; states listed in neither set are unknown."""
    if not passed_states and not failed_states:
        return UNKNOWN
    if value is None:
        return UNKNOWN
    try:
        state = int(float(value))
    except (TypeError, ValueError):
        return UNKNOWN
    if state in set(passed_states or []):
        return PASSED
    if state in set(failed_states or []):
        return FAILED
    return UNKNOWN


def classify_against(threshold, value):
    """Classify a value against a resolved threshold payload of either kind."""
    if threshold is None:
        return UNKNOWN
    if threshold.get('kind') == 'state':
        return classify_state(value, threshold.get('passed_states'), threshold.get('failed_states'))
    return classify(value, threshold.get('lower_limit'), threshold.get('upper_limit'))


def resolve_tenant(user):
    """Tenant a user belongs to, or None for the platform-wide scope."""
    if user is None or not user.is_authenticated:
        return None
    profile = UserProfile.objects.filter(user=user).select_related('tenant').first()
    return profile.tenant if profile else None


def is_platform_admin(user):
    if user is None or not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    return user.groups.filter(name='AdminGroup').exists()


def effective_thresholds(tenant=None):
    """Merge platform defaults with tenant overrides, keyed by metric_key."""
    scope = Q(tenant__isnull=True) if tenant is None else Q(tenant__isnull=True) | Q(tenant=tenant)
    resolved = {}
    rows = MetricThreshold.objects.filter(scope).select_related('tenant')
    # Global rows first so tenant rows overwrite them.
    for row in sorted(rows, key=lambda r: (r.tenant_id is not None,)):
        resolved[row.metric_key] = threshold_payload(row)
    return resolved


def threshold_payload(row):
    metric = METRICS_BY_KEY.get(row.metric_key, {})
    return {
        'metric_key': row.metric_key,
        'label': metric.get('label', row.metric_key),
        'unit': metric.get('unit', ''),
        'subsystem': metric.get('subsystem', ''),
        'kind': metric.get('kind', 'numeric'),
        'states': metric.get('states', []),
        'lower_limit': row.lower_limit,
        'upper_limit': row.upper_limit,
        'passed_states': row.passed_states or [],
        'failed_states': row.failed_states or [],
        'enabled': row.enabled,
        'is_protected': row.is_protected,
        'scope': row.tenant.slug if row.tenant else 'global',
        'notes': row.notes,
        'updated_at': row.updated_at.isoformat() if row.updated_at else None,
    }


def evaluate_metric(metric_key, value, thresholds):
    """Evaluate a single value, returning a report-ready dict."""
    metric = METRICS_BY_KEY.get(metric_key, {})
    threshold = thresholds.get(metric_key)
    if threshold is None:
        return {
            'metric_key': metric_key,
            'label': metric.get('label', metric_key),
            'unit': metric.get('unit', ''),
            'subsystem': metric.get('subsystem', ''),
            'lower_limit': None,
            'upper_limit': None,
            'kind': metric.get('kind', 'numeric'),
            'passed_states': [],
            'failed_states': [],
            'threshold_display': MISSING_THRESHOLD_TEXT,
            'status': UNKNOWN,
        }
    status = classify_against(threshold, value)
    return {
        'metric_key': metric_key,
        'label': threshold['label'],
        'unit': threshold['unit'],
        'subsystem': threshold['subsystem'],
        'kind': threshold['kind'],
        'lower_limit': threshold['lower_limit'],
        'upper_limit': threshold['upper_limit'],
        'passed_states': threshold['passed_states'],
        'failed_states': threshold['failed_states'],
        'threshold_display': describe_threshold(threshold),
        'status': status,
    }


def describe_threshold(threshold):
    """Human-readable threshold for a resolved payload of either kind."""
    if threshold is None:
        return MISSING_THRESHOLD_TEXT
    if threshold.get('kind') == 'state':
        return format_state_threshold(
            threshold['metric_key'], threshold.get('passed_states'), threshold.get('failed_states'))
    return format_threshold(threshold.get('lower_limit'), threshold.get('upper_limit'), threshold.get('unit', ''))


def format_state_threshold(metric_key, passed_states, failed_states):
    """Render 'Passed: A, B / Failed: C' using the catalog's state labels."""
    labels = state_labels(metric_key)

    def names(values):
        return ', '.join(labels.get(v, str(v)) for v in values or [])

    parts = []
    if passed_states:
        parts.append(f'Passed: {names(passed_states)}')
    if failed_states:
        parts.append(f'Failed: {names(failed_states)}')
    return ' / '.join(parts) if parts else MISSING_THRESHOLD_TEXT


def format_threshold(lower, upper, unit=''):
    suffix = f" {unit}" if unit else ''
    if lower is not None and upper is not None:
        return f"{lower} to {upper}{suffix}"
    if lower is not None:
        return f"\u2265 {lower}{suffix}"
    if upper is not None:
        return f"\u2264 {upper}{suffix}"
    return MISSING_THRESHOLD_TEXT


def get_security_policy(tenant=None):
    policy = SecurityPolicy.objects.filter(tenant=tenant).first()
    if policy is None and tenant is not None:
        policy = SecurityPolicy.objects.filter(tenant__isnull=True).first()
    if policy is None:
        policy = SecurityPolicy.objects.create(tenant=None)
    return policy


def get_report_setting(tenant=None):
    setting = ReportSetting.objects.filter(tenant=tenant).first()
    if setting is None and tenant is not None:
        setting = ReportSetting.objects.filter(tenant__isnull=True).first()
    if setting is None:
        setting = ReportSetting.objects.create(tenant=None)
    return setting


def catalog_payload():
    return [dict(metric) for metric in METRICS]
