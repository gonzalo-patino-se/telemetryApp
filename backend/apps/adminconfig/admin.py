from django.contrib import admin

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


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'default_timezone', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'tenant')
    list_filter = ('tenant',)
    search_fields = ('user__username',)
    autocomplete_fields = ('user',)


@admin.register(MetricThreshold)
class MetricThresholdAdmin(admin.ModelAdmin):
    list_display = ('metric_key', 'tenant', 'lower_limit', 'upper_limit', 'enabled', 'is_protected', 'updated_at')
    list_filter = ('tenant', 'enabled', 'is_protected')
    search_fields = ('metric_key', 'notes')
    readonly_fields = ('updated_by', 'created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'tenant', 'is_enabled')
    list_filter = ('is_enabled', 'tenant')
    search_fields = ('key', 'name')


@admin.register(SecurityPolicy)
class SecurityPolicyAdmin(admin.ModelAdmin):
    list_display = (
        'tenant', 'max_concurrent_sessions', 'session_lifetime_minutes',
        'inactivity_timeout_minutes', 'enforce_ip_allowlist',
    )


@admin.register(AccessControlRule)
class AccessControlRuleAdmin(admin.ModelAdmin):
    list_display = ('group', 'resource', 'tenant', 'can_view', 'can_export', 'can_manage')
    list_filter = ('resource', 'tenant', 'group')


@admin.register(ReportSetting)
class ReportSettingAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'header_title', 'include_thresholds', 'timestamp_mode', 'stale_data_minutes')


@admin.register(SSHPermission)
class SSHPermissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'host_pattern', 'access_level', 'is_enabled', 'expires_at')
    list_filter = ('access_level', 'is_enabled', 'tenant')
    search_fields = ('user__username', 'host_pattern')
    autocomplete_fields = ('user',)

    def save_model(self, request, obj, form, change):
        if obj.granted_by is None:
            obj.granted_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor', 'action', 'model_name', 'object_repr')
    list_filter = ('action', 'model_name')
    search_fields = ('object_repr', 'actor__username')
    readonly_fields = tuple(f.name for f in AuditLog._meta.fields)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
