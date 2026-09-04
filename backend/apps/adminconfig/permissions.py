from rest_framework.permissions import SAFE_METHODS, BasePermission

from .thresholds import is_platform_admin


class IsPlatformAdmin(BasePermission):
    """Full access for superusers, staff, or members of ``AdminGroup``."""

    message = 'Administrator privileges are required to change this setting.'

    def has_permission(self, request, view):
        return is_platform_admin(request.user)


class IsPlatformAdminOrReadOnly(BasePermission):
    """Any authenticated user may read; only administrators may write."""

    message = 'Administrator privileges are required to change this setting.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return is_platform_admin(user)
