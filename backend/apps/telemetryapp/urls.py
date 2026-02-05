from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TelemetryViewSet, 
    adx_telemetry, 
    search_serial, 
    query_adx_view, 
    health_check,
    batch_telemetry_view,  # NEW: Optimized batch endpoint
    adx_stats_view,        # NEW: Query statistics
    auth_me_view,          # Authentication status check
)

router = DefaultRouter()
router.register(r'telemetry', TelemetryViewSet, basename='telemetry')


urlpatterns = [
    path('', include(router.urls)),  # API routes for TelemetryViewSet
    path('adx/', adx_telemetry),     # Endpoint for ADX telemetry query
    path('search_serial/', search_serial), # Endpoint for serial number search
    path('query_adx/', query_adx_view), # Endpoint for generic KQL query (legacy)
    path('health/', health_check),   # Health check endpoint for monitoring
    
    # === AUTHENTICATION ===
    path('auth/me/', auth_me_view),  # Get current user info (verifies auth status)
    
    # === OPTIMIZED ENDPOINTS (Use these for cost efficiency) ===
    path('batch_telemetry/', batch_telemetry_view),  # Batch telemetry (RECOMMENDED)
    path('adx_stats/', adx_stats_view),              # Query statistics/monitoring
]

