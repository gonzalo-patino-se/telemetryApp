"""Audit trail helpers (FR-016: all administrative changes are audited)."""

from django.forms.models import model_to_dict

from .models import AuditLog

_SENSITIVE_KEYS = {'password', 'token', 'secret', 'key'}


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _serialize(instance):
    data = model_to_dict(instance)
    clean = {}
    for name, value in data.items():
        if any(token in name.lower() for token in _SENSITIVE_KEYS):
            continue
        clean[name] = value if isinstance(value, (str, int, float, bool, type(None))) else str(value)
    return clean


def diff(before, after):
    changed = {}
    for name, new_value in after.items():
        old_value = before.get(name)
        if old_value != new_value:
            changed[name] = {'from': old_value, 'to': new_value}
    return changed


def record(request, action, instance, changes=None):
    user = getattr(request, 'user', None)
    AuditLog.objects.create(
        actor=user if (user and user.is_authenticated) else None,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(getattr(instance, 'pk', '') or ''),
        object_repr=str(instance)[:200],
        changes=changes if changes is not None else _serialize(instance),
        ip_address=_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
    )


class AuditedModelViewSetMixin:
    """Writes an :class:`AuditLog` row for every create/update/delete."""

    def perform_create(self, serializer):
        instance = serializer.save()
        record(self.request, 'create', instance)

    def perform_update(self, serializer):
        before = _serialize(serializer.instance)
        instance = serializer.save()
        record(self.request, 'update', instance, changes=diff(before, _serialize(instance)))

    def perform_destroy(self, instance):
        snapshot = _serialize(instance)
        record(self.request, 'delete', instance, changes=snapshot)
        instance.delete()
