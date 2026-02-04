from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TelemetryViewSet, adx_telemetry, search_serial, query_adx_view, health_check

router = DefaultRouter()
router.register(r'telemetry', TelemetryViewSet, basename='telemetry')


urlpatterns = [
    path('', include(router.urls)),  # API routes for TelemetryViewSet
    path('adx/', adx_telemetry),     # Endpoint for ADX telemetry query
    path('search_serial/', search_serial), # Endpoint for serial number search
    path('query_adx/', query_adx_view), # Endpoint for generic KQL query
    path('health/', health_check),   # Health check endpoint for monitoring
]

