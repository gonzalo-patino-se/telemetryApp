"""Seed the platform-wide administration defaults.

Idempotent: existing rows are left untouched.
"""

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from adminconfig.models import (
    AccessControlRule,
    FeatureFlag,
    MetricThreshold,
    ReportSetting,
    SecurityPolicy,
)

# Nominal operating envelopes for a 240 V / 60 Hz split-phase residential site.
DEFAULT_THRESHOLDS = {
    'wifi_signal': (-75, -30),
    'grid_voltage_l1': (108, 132),
    'grid_voltage_l2': (108, 132),
    'grid_current_l1': (0, 100),
    'grid_current_l2': (0, 100),
    'grid_frequency_total': (59.3, 60.5),
    'load_voltage_l1': (108, 132),
    'load_voltage_l2': (108, 132),
    'load_current_l1': (0, 100),
    'load_current_l2': (0, 100),
    'load_frequency_total': (59.3, 60.5),
    'pv1_voltage': (0, 600),
    'pv2_voltage': (0, 600),
    'pv3_voltage': (0, 600),
    'pv4_voltage': (0, 600),
    'pv1_current': (0, 20),
    'pv2_current': (0, 20),
    'pv3_current': (0, 20),
    'pv4_current': (0, 20),
    'battery_voltage': (40, 60),
    'battery1_voltage': (40, 60),
    'battery2_voltage': (40, 60),
    'battery3_voltage': (40, 60),
    'battery1_current': (-60, 60),
    'battery2_current': (-60, 60),
    'battery3_current': (-60, 60),
    'battery1_soc': (10, 100),
    'battery2_soc': (10, 100),
    'battery3_soc': (10, 100),
    'battery1_temp': (0, 45),
    'battery2_temp': (0, 45),
    'battery3_temp': (0, 45),
    'battery_main_relay': (0, 0),
    'battery_heater_status': (0, 1),
    'cellular_signal_strength': (0, 0),
    'inverter_operating_state': (3, 4),
    'etp_connection_status': (0, 0),
    'bgcs_relay_status': (1, 2),
}

DEFAULT_FLAGS = [
    ('history_thresholds', 'History chart thresholds', 'Draw threshold reference lines on history cards.', True),
    ('validation_report', 'Validation report', 'Expose the validation report page.', True),
    ('pdf_threshold_column', 'PDF threshold column', 'Include threshold evaluation in the PDF report.', True),
    ('fast_telemetry', 'Fast telemetry (15 s)', 'Allow the 15-second sampling toggle.', True),
    ('ssh_console', 'SSH console', 'Expose SSH permission management.', False),
]

DEFAULT_ACCESS = [
    ('AdminGroup', 'admin_console', True, True, True),
    ('AdminGroup', 'thresholds', True, True, True),
    ('AdminGroup', 'ssh', True, True, True),
    ('AdminGroup', 'adx_query', True, True, True),
]


class Command(BaseCommand):
    help = 'Create the platform-wide security policy, report settings, feature flags and threshold defaults.'

    def handle(self, *args, **options):
        policy, created = SecurityPolicy.objects.get_or_create(tenant=None)
        self.stdout.write(f"Security policy: {'created' if created else 'already present'}")

        setting, created = ReportSetting.objects.get_or_create(tenant=None)
        self.stdout.write(f"Report settings: {'created' if created else 'already present'}")

        added = 0
        for key, name, description, enabled in DEFAULT_FLAGS:
            _, was_created = FeatureFlag.objects.get_or_create(
                tenant=None, key=key,
                defaults={'name': name, 'description': description, 'is_enabled': enabled},
            )
            added += int(was_created)
        self.stdout.write(f'Feature flags: {added} created')

        added = 0
        for metric_key, (lower, upper) in DEFAULT_THRESHOLDS.items():
            _, was_created = MetricThreshold.objects.get_or_create(
                tenant=None, metric_key=metric_key,
                defaults={'lower_limit': lower, 'upper_limit': upper, 'enabled': True, 'is_protected': True},
            )
            added += int(was_created)
        self.stdout.write(f'Thresholds: {added} created')

        admin_group, _ = Group.objects.get_or_create(name='AdminGroup')
        added = 0
        for group_name, resource, can_view, can_export, can_manage in DEFAULT_ACCESS:
            group = admin_group if group_name == 'AdminGroup' else Group.objects.get_or_create(name=group_name)[0]
            _, was_created = AccessControlRule.objects.get_or_create(
                tenant=None, group=group, resource=resource,
                defaults={'can_view': can_view, 'can_export': can_export, 'can_manage': can_manage},
            )
            added += int(was_created)
        self.stdout.write(f'Access rules: {added} created')

        self.stdout.write(self.style.SUCCESS('Administration defaults are in place.'))
