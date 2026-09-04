from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccessControlRuleViewSet,
    AdminUserViewSet,
    AuditLogViewSet,
    FeatureFlagViewSet,
    GroupViewSet,
    MetricThresholdViewSet,
    ReportSettingViewSet,
    SSHPermissionViewSet,
    SecurityPolicyViewSet,
    TenantViewSet,
    admin_bootstrap_view,
    client_policy_view,
    effective_thresholds_view,
    metric_catalog_view,
    validation_report_view,
)

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'thresholds', MetricThresholdViewSet, basename='threshold')
router.register(r'feature-flags', FeatureFlagViewSet, basename='feature-flag')
router.register(r'security-policies', SecurityPolicyViewSet, basename='security-policy')
router.register(r'access-rules', AccessControlRuleViewSet, basename='access-rule')
router.register(r'report-settings', ReportSettingViewSet, basename='report-setting')
router.register(r'ssh-permissions', SSHPermissionViewSet, basename='ssh-permission')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'groups', GroupViewSet, basename='admin-group')
router.register(r'audit-log', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    # Read endpoints available to every authenticated user
    path('metrics/', metric_catalog_view, name='metric-catalog'),
    path('thresholds/effective/', effective_thresholds_view, name='effective-thresholds'),
    path('client-policy/', client_policy_view, name='client-policy'),
    path('validation_report/', validation_report_view, name='validation-report'),

    # Administrator console
    path('admin/bootstrap/', admin_bootstrap_view, name='admin-bootstrap'),
    path('admin/', include(router.urls)),
]
