"""Administration, tenancy, threshold and audit models (FR-010, FR-015, FR-016)."""

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from .metrics_catalog import METRIC_KEY_CHOICES, is_state_metric


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tenant(TimeStampedModel):
    """Deployment scope that owns configuration defaults."""

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    description = models.CharField(max_length=255, blank=True)
    default_timezone = models.CharField(max_length=64, default='UTC')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserProfile(TimeStampedModel):
    """Associates a user with a tenant. Created on demand."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL, related_name='members')

    def __str__(self):
        return f"{self.user.username} @ {self.tenant or 'global'}"


class MetricThreshold(TimeStampedModel):
    """Lower/upper limits for a history-chart metric.

    ``tenant = NULL`` is the platform-wide default; a row with a tenant
    overrides that default for the tenant only.
    """

    tenant = models.ForeignKey(
        Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='thresholds',
        help_text='Leave empty for the platform-wide default.',
    )
    metric_key = models.CharField(max_length=80, choices=METRIC_KEY_CHOICES, db_index=True)
    lower_limit = models.FloatField(null=True, blank=True)
    upper_limit = models.FloatField(null=True, blank=True)
    passed_states = models.JSONField(
        default=list, blank=True,
        help_text='State metrics only: values classified as Passed.',
    )
    failed_states = models.JSONField(
        default=list, blank=True,
        help_text='State metrics only: values classified as Failed.',
    )
    enabled = models.BooleanField(default=True, help_text='Show the reference lines by default on the chart card.')
    is_protected = models.BooleanField(
        default=True,
        help_text='Protected defaults can only be changed by administrators.',
    )
    notes = models.CharField(max_length=255, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='updated_thresholds',
    )

    class Meta:
        ordering = ['metric_key']
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'metric_key'], name='uniq_threshold_tenant_metric'),
            models.UniqueConstraint(
                fields=['metric_key'], condition=models.Q(tenant__isnull=True),
                name='uniq_threshold_global_metric',
            ),
        ]

    def clean(self):
        if is_state_metric(self.metric_key):
            if self.lower_limit is not None or self.upper_limit is not None:
                raise ValidationError('State metrics are classified by state, not by numeric limits.')
            if not self.passed_states and not self.failed_states:
                raise ValidationError('Select at least one passing or failing state.')
            overlap = set(self.passed_states or []) & set(self.failed_states or [])
            if overlap:
                raise ValidationError(f'A state cannot be both passing and failing: {sorted(overlap)}.')
            return
        if self.passed_states or self.failed_states:
            raise ValidationError('Passing/failing states only apply to state metrics.')
        if self.lower_limit is None and self.upper_limit is None:
            raise ValidationError('Define at least one of lower limit or upper limit.')
        if (self.lower_limit is not None and self.upper_limit is not None
                and self.lower_limit > self.upper_limit):
            raise ValidationError({'lower_limit': 'Lower limit must not exceed the upper limit.'})

    def __str__(self):
        scope = self.tenant.slug if self.tenant else 'global'
        return f"{self.metric_key} [{scope}]"


class FeatureFlag(TimeStampedModel):
    key = models.SlugField(max_length=60, db_index=True)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    is_enabled = models.BooleanField(default=False)
    tenant = models.ForeignKey(
        Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='feature_flags',
        help_text='Leave empty for the platform-wide default.',
    )

    class Meta:
        ordering = ['key']
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'key'], name='uniq_flag_tenant_key'),
            models.UniqueConstraint(
                fields=['key'], condition=models.Q(tenant__isnull=True), name='uniq_flag_global_key',
            ),
        ]

    def __str__(self):
        return f"{self.key} [{self.tenant.slug if self.tenant else 'global'}]"


class SecurityPolicy(TimeStampedModel):
    """Session limits, inactivity timeout and access controls per scope."""

    tenant = models.OneToOneField(
        Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='security_policy',
        help_text='Leave empty for the platform-wide default.',
    )
    max_concurrent_sessions = models.PositiveSmallIntegerField(default=3, validators=[MinValueValidator(1)])
    session_lifetime_minutes = models.PositiveIntegerField(default=120, validators=[MinValueValidator(1)])
    inactivity_timeout_minutes = models.PositiveIntegerField(default=30, validators=[MinValueValidator(1)])
    refresh_token_lifetime_days = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1)])
    max_failed_logins = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1)])
    lockout_minutes = models.PositiveIntegerField(default=15, validators=[MinValueValidator(1)])
    enforce_ip_allowlist = models.BooleanField(default=False)
    allowed_ip_cidrs = models.TextField(blank=True, help_text='One CIDR per line. Only used when the allowlist is enforced.')

    class Meta:
        verbose_name_plural = 'Security policies'

    def __str__(self):
        return f"Security policy [{self.tenant.slug if self.tenant else 'global'}]"


class AccessControlRule(TimeStampedModel):
    RESOURCE_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('events', 'Events & analytics'),
        ('history', 'History charts'),
        ('validation_report', 'Validation report'),
        ('pdf_report', 'PDF report'),
        ('thresholds', 'Threshold configuration'),
        ('admin_console', 'Admin console'),
        ('adx_query', 'Raw ADX query'),
        ('ssh', 'SSH access'),
    ]

    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='access_rules')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='access_rules')
    resource = models.CharField(max_length=40, choices=RESOURCE_CHOICES)
    can_view = models.BooleanField(default=True)
    can_export = models.BooleanField(default=False)
    can_manage = models.BooleanField(default=False)

    class Meta:
        ordering = ['resource', 'group__name']
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'group', 'resource'], name='uniq_access_rule'),
        ]

    def __str__(self):
        return f"{self.group.name} -> {self.resource}"


class ReportSetting(TimeStampedModel):
    TIMESTAMP_MODES = [
        ('utc', 'UTC only'),
        ('local', 'Browser local only'),
        ('both', 'UTC and browser local'),
    ]

    tenant = models.OneToOneField(
        Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='report_setting',
        help_text='Leave empty for the platform-wide default.',
    )
    header_title = models.CharField(max_length=120, default='Edge Telemetry Diagnostic Report')
    footer_note = models.CharField(max_length=255, blank=True)
    include_thresholds = models.BooleanField(default=True)
    include_charts = models.BooleanField(default=True)
    include_validation_summary = models.BooleanField(default=True)
    timestamp_mode = models.CharField(max_length=10, choices=TIMESTAMP_MODES, default='both')
    stale_data_minutes = models.PositiveIntegerField(
        default=60, validators=[MinValueValidator(1)],
        help_text='A value older than this is reported with degraded data quality.',
    )
    missing_threshold_text = models.CharField(max_length=160, default='Threshold needs to be defined.')

    def __str__(self):
        return f"Report settings [{self.tenant.slug if self.tenant else 'global'}]"


class SSHPermission(TimeStampedModel):
    ACCESS_LEVELS = [
        ('none', 'No access'),
        ('read', 'Read only'),
        ('operate', 'Operate'),
        ('admin', 'Administrative'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ssh_permissions')
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.CASCADE, related_name='ssh_permissions')
    host_pattern = models.CharField(max_length=160, help_text='Host or glob pattern, e.g. edge-*.site.internal')
    remote_username = models.CharField(max_length=64, blank=True)
    access_level = models.CharField(max_length=10, choices=ACCESS_LEVELS, default='read')
    is_enabled = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='granted_ssh_permissions',
    )

    class Meta:
        ordering = ['user__username', 'host_pattern']
        constraints = [
            models.UniqueConstraint(fields=['user', 'host_pattern'], name='uniq_ssh_user_host'),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.host_pattern} ({self.access_level})"


class AuditLog(models.Model):
    ACTIONS = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_entries',
    )
    action = models.CharField(max_length=20, choices=ACTIONS)
    model_name = models.CharField(max_length=60)
    object_id = models.CharField(max_length=40, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor = self.actor.username if self.actor else 'system'
        return f"{self.created_at:%Y-%m-%d %H:%M} {actor} {self.action} {self.model_name}"
