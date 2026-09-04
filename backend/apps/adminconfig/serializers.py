from django.contrib.auth.models import Group, User
from rest_framework import serializers

from .metrics_catalog import METRICS_BY_KEY, is_state_metric
from .models import (
    AccessControlRule,
    AuditLog,
    FeatureFlag,
    MetricThreshold,
    ReportSetting,
    SSHPermission,
    SecurityPolicy,
    Tenant,
    UserProfile,
)


class TenantSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'description', 'default_timezone',
            'is_active', 'member_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class MetricThresholdSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    subsystem = serializers.SerializerMethodField()
    kind = serializers.SerializerMethodField()
    states = serializers.SerializerMethodField()
    scope = serializers.SerializerMethodField()
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = MetricThreshold
        fields = [
            'id', 'tenant', 'scope', 'metric_key', 'label', 'unit', 'subsystem',
            'kind', 'states', 'lower_limit', 'upper_limit',
            'passed_states', 'failed_states', 'enabled', 'is_protected', 'notes',
            'updated_by_username', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_label(self, obj):
        return METRICS_BY_KEY.get(obj.metric_key, {}).get('label', obj.metric_key)

    def get_unit(self, obj):
        return METRICS_BY_KEY.get(obj.metric_key, {}).get('unit', '')

    def get_subsystem(self, obj):
        return METRICS_BY_KEY.get(obj.metric_key, {}).get('subsystem', '')

    def get_kind(self, obj):
        return METRICS_BY_KEY.get(obj.metric_key, {}).get('kind', 'numeric')

    def get_states(self, obj):
        return METRICS_BY_KEY.get(obj.metric_key, {}).get('states', [])

    def get_scope(self, obj):
        return obj.tenant.slug if obj.tenant else 'global'

    def validate_metric_key(self, value):
        if value not in METRICS_BY_KEY:
            raise serializers.ValidationError(f"'{value}' is not a supported metric.")
        return value

    def validate(self, attrs):
        metric_key = attrs.get('metric_key', getattr(self.instance, 'metric_key', None))
        if is_state_metric(metric_key):
            self._validate_states(attrs, metric_key)
        else:
            self._validate_limits(attrs)

        tenant = attrs.get('tenant', getattr(self.instance, 'tenant', None))
        clash = MetricThreshold.objects.filter(tenant=tenant, metric_key=metric_key)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError(
                {'metric_key': 'A threshold for this metric already exists in that scope.'}
            )
        return attrs

    def save(self, **kwargs):
        request = self.context.get('request')
        if request is not None and request.user.is_authenticated:
            kwargs.setdefault('updated_by', request.user)
        return super().save(**kwargs)


class FeatureFlagSerializer(serializers.ModelSerializer):
    scope = serializers.SerializerMethodField()

    class Meta:
        model = FeatureFlag
        fields = ['id', 'tenant', 'scope', 'key', 'name', 'description', 'is_enabled', 'updated_at']
        read_only_fields = ['updated_at']

    def get_scope(self, obj):
        return obj.tenant.slug if obj.tenant else 'global'

    def validate(self, attrs):
        tenant = attrs.get('tenant', getattr(self.instance, 'tenant', None))
        key = attrs.get('key', getattr(self.instance, 'key', None))
        clash = FeatureFlag.objects.filter(tenant=tenant, key=key)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError({'key': 'This flag already exists in that scope.'})
        return attrs


class SecurityPolicySerializer(serializers.ModelSerializer):
    scope = serializers.SerializerMethodField()

    class Meta:
        model = SecurityPolicy
        fields = [
            'id', 'tenant', 'scope', 'max_concurrent_sessions', 'session_lifetime_minutes',
            'inactivity_timeout_minutes', 'refresh_token_lifetime_days', 'max_failed_logins',
            'lockout_minutes', 'enforce_ip_allowlist', 'allowed_ip_cidrs', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def get_scope(self, obj):
        return obj.tenant.slug if obj.tenant else 'global'


class AccessControlRuleSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    scope = serializers.SerializerMethodField()

    class Meta:
        model = AccessControlRule
        fields = [
            'id', 'tenant', 'scope', 'group', 'group_name', 'resource',
            'can_view', 'can_export', 'can_manage', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def get_scope(self, obj):
        return obj.tenant.slug if obj.tenant else 'global'


class ReportSettingSerializer(serializers.ModelSerializer):
    scope = serializers.SerializerMethodField()

    class Meta:
        model = ReportSetting
        fields = [
            'id', 'tenant', 'scope', 'header_title', 'footer_note', 'include_thresholds',
            'include_charts', 'include_validation_summary', 'timestamp_mode',
            'stale_data_minutes', 'missing_threshold_text', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def get_scope(self, obj):
        return obj.tenant.slug if obj.tenant else 'global'


class SSHPermissionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)

    class Meta:
        model = SSHPermission
        fields = [
            'id', 'user', 'username', 'tenant', 'host_pattern', 'remote_username',
            'access_level', 'is_enabled', 'expires_at', 'notes',
            'granted_by_username', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        user = attrs.get('user', getattr(self.instance, 'user', None))
        host = attrs.get('host_pattern', getattr(self.instance, 'host_pattern', None))
        clash = SSHPermission.objects.filter(user=user, host_pattern=host)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError({'host_pattern': 'This user already has a rule for that host.'})
        return attrs

    def save(self, **kwargs):
        request = self.context.get('request')
        if request is not None and request.user.is_authenticated:
            kwargs.setdefault('granted_by', request.user)
        return super().save(**kwargs)


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default='system')

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor_username', 'action', 'model_name', 'object_id',
            'object_repr', 'changes', 'ip_address', 'created_at',
        ]


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


class AdminUserSerializer(serializers.ModelSerializer):
    tenant = serializers.SerializerMethodField()
    tenant_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(), allow_null=True, required=False, write_only=True,
    )
    groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser',
            'groups', 'tenant', 'tenant_id', 'last_login', 'date_joined',
        ]
        read_only_fields = ['username', 'last_login', 'date_joined', 'is_superuser']

    def get_tenant(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.tenant_id if profile else None

    def update(self, instance, validated_data):
        has_tenant = 'tenant_id' in validated_data
        tenant = validated_data.pop('tenant_id', None)
        groups = validated_data.pop('groups', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        if has_tenant:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            profile.tenant = tenant
            profile.save(update_fields=['tenant', 'updated_at'])
        return instance
