"""Administration API (FR-010) plus threshold, PDF and validation endpoints."""

from datetime import datetime, timedelta, timezone

from django.contrib.auth.models import Group, User
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .adx_validation import InvalidSerialError, collect_latest_values, validate_serial
from .audit import AuditedModelViewSetMixin
from .metrics_catalog import METRICS, SUBSYSTEMS
from .models import (
    AccessControlRule,
    AuditLog,
    FeatureFlag,
    MetricThreshold,
    ReportSetting,
    SSHPermission,
    SecurityPolicy,
    Tenant,
)
from .permissions import IsPlatformAdmin, IsPlatformAdminOrReadOnly
from .serializers import (
    AccessControlRuleSerializer,
    AdminUserSerializer,
    AuditLogSerializer,
    FeatureFlagSerializer,
    GroupSerializer,
    MetricThresholdSerializer,
    ReportSettingSerializer,
    SSHPermissionSerializer,
    SecurityPolicySerializer,
    TenantSerializer,
)
from .thresholds import (
    MISSING_THRESHOLD_TEXT,
    UNKNOWN,
    catalog_payload,
    effective_thresholds,
    evaluate_metric,
    get_report_setting,
    get_security_policy,
    is_platform_admin,
    resolve_tenant,
)


class TenantViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdminOrReadOnly]


class MetricThresholdViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    """Regular users may read thresholds; only administrators may change them."""

    queryset = MetricThreshold.objects.select_related('tenant', 'updated_by')
    serializer_class = MetricThresholdSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        if is_platform_admin(self.request.user):
            tenant_param = self.request.query_params.get('tenant')
            if tenant_param == 'global':
                return queryset.filter(tenant__isnull=True)
            if tenant_param:
                return queryset.filter(tenant_id=tenant_param)
            return queryset
        tenant = resolve_tenant(self.request.user)
        if tenant is None:
            return queryset.filter(tenant__isnull=True)
        return queryset.filter(tenant__isnull=True) | queryset.filter(tenant=tenant)


class FeatureFlagViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = FeatureFlag.objects.select_related('tenant')
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdminOrReadOnly]


class SecurityPolicyViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = SecurityPolicy.objects.select_related('tenant')
    serializer_class = SecurityPolicySerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]


class AccessControlRuleViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AccessControlRule.objects.select_related('tenant', 'group')
    serializer_class = AccessControlRuleSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]


class ReportSettingViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = ReportSetting.objects.select_related('tenant')
    serializer_class = ReportSettingSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdminOrReadOnly]


class SSHPermissionViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = SSHPermission.objects.select_related('user', 'tenant', 'granted_by')
    serializer_class = SSHPermissionSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]


class AdminUserViewSet(AuditedModelViewSetMixin, viewsets.ModelViewSet):
    queryset = User.objects.select_related('profile__tenant').prefetch_related('groups').order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    http_method_names = ['get', 'patch', 'put', 'head', 'options']


class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        model_name = self.request.query_params.get('model')
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        return queryset[:500]


# =============================================================================
# Read endpoints used by the dashboard
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def metric_catalog_view(request):
    """Every metric that supports a threshold (FR-015)."""
    return Response({'metrics': catalog_payload(), 'subsystems': SUBSYSTEMS})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def effective_thresholds_view(request):
    """Thresholds resolved for the caller's tenant, keyed by metric."""
    tenant = resolve_tenant(request.user)
    report_setting = get_report_setting(tenant)
    return Response({
        'tenant': tenant.slug if tenant else None,
        'is_admin': is_platform_admin(request.user),
        'thresholds': effective_thresholds(tenant),
        'missing_threshold_text': report_setting.missing_threshold_text,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_policy_view(request):
    """Session limits, inactivity timeout and feature flags for the client."""
    tenant = resolve_tenant(request.user)
    policy = get_security_policy(tenant)
    flags = {}
    for flag in FeatureFlag.objects.filter(tenant__isnull=True):
        flags[flag.key] = flag.is_enabled
    if tenant is not None:
        for flag in FeatureFlag.objects.filter(tenant=tenant):
            flags[flag.key] = flag.is_enabled
    return Response({
        'tenant': tenant.slug if tenant else None,
        'is_admin': is_platform_admin(request.user),
        'session': {
            'max_concurrent_sessions': policy.max_concurrent_sessions,
            'session_lifetime_minutes': policy.session_lifetime_minutes,
            'inactivity_timeout_minutes': policy.inactivity_timeout_minutes,
        },
        'feature_flags': flags,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_bootstrap_view(request):
    """Single payload that hydrates the admin console."""
    tenants = Tenant.objects.all()
    return Response({
        'metrics': catalog_payload(),
        'subsystems': SUBSYSTEMS,
        'tenants': TenantSerializer(tenants, many=True).data,
        'groups': GroupSerializer(Group.objects.all().order_by('name'), many=True).data,
        'users': AdminUserSerializer(
            User.objects.select_related('profile__tenant').prefetch_related('groups').order_by('username'),
            many=True,
        ).data,
        'thresholds': MetricThresholdSerializer(
            MetricThreshold.objects.select_related('tenant', 'updated_by'), many=True,
        ).data,
        'feature_flags': FeatureFlagSerializer(FeatureFlag.objects.select_related('tenant'), many=True).data,
        'security_policies': SecurityPolicySerializer(SecurityPolicy.objects.select_related('tenant'), many=True).data,
        'access_rules': AccessControlRuleSerializer(
            AccessControlRule.objects.select_related('tenant', 'group'), many=True,
        ).data,
        'report_settings': ReportSettingSerializer(ReportSetting.objects.select_related('tenant'), many=True).data,
        'ssh_permissions': SSHPermissionSerializer(
            SSHPermission.objects.select_related('user', 'tenant', 'granted_by'), many=True,
        ).data,
        'audit_log': AuditLogSerializer(AuditLog.objects.select_related('actor')[:100], many=True).data,
    })


# =============================================================================
# Validation Report (FR-018)
# =============================================================================

def _data_quality(timestamp_iso, stale_minutes):
    if not timestamp_iso:
        return 'missing'
    try:
        parsed = datetime.fromisoformat(str(timestamp_iso).replace('Z', '+00:00'))
    except ValueError:
        return 'unverified'
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - parsed
    if age > timedelta(minutes=stale_minutes):
        return 'stale'
    if age < timedelta(0):
        return 'unverified'
    return 'good'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validation_report_view(request):
    """Latest valid cloud value per subsystem with its threshold evaluation."""
    try:
        serial = validate_serial(request.data.get('serial'))
    except InvalidSerialError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lookback_days = max(1, min(int(request.data.get('lookback_days', 7)), 30))
    except (TypeError, ValueError):
        lookback_days = 7

    tenant = resolve_tenant(request.user)
    thresholds = effective_thresholds(tenant)
    report_setting = get_report_setting(tenant)
    samples, device = collect_latest_values(serial, lookback_days=lookback_days)

    results = []
    counts = {'passed': 0, 'failed': 0, 'unknown': 0}
    for metric in METRICS:
        sample = samples.get(metric['key'])
        if sample is None:
            continue
        evaluation = evaluate_metric(metric['key'], sample['value'], thresholds)
        if evaluation['threshold_display'] == MISSING_THRESHOLD_TEXT:
            evaluation['threshold_display'] = report_setting.missing_threshold_text
        quality = _data_quality(sample['timestamp'], report_setting.stale_data_minutes)
        if quality in ('missing', 'unverified'):
            evaluation['status'] = UNKNOWN
        counts[evaluation['status']] = counts.get(evaluation['status'], 0) + 1
        results.append({
            **evaluation,
            'signal': sample['signal'],
            'value': sample['value'],
            'utc_timestamp': sample['timestamp'],
            'data_quality': quality,
            'last_seen': sample['timestamp'] or device.get('last_seen'),
            'firmware_version': device.get('firmware_version'),
        })

    return Response({
        'device': device,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'lookback_days': lookback_days,
        'missing_threshold_text': report_setting.missing_threshold_text,
        'stale_data_minutes': report_setting.stale_data_minutes,
        'summary': counts,
        'results': results,
    })
