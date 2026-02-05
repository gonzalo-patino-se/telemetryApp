from django.shortcuts import render
from rest_framework.response import Response
from .adx_service import query_adx
from django.conf import settings

from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .permissions import IsAdminGroup
from django.contrib.auth import authenticate


from rest_framework import viewsets
from .models import Telemetry
from .serializers import TelemetrySerializer, RegisterSerializer

from django.contrib.auth.models import User
from rest_framework import status

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny

from django.views.decorators.csrf import csrf_exempt


# =============================================================================
# Cookie Configuration for JWT tokens
# =============================================================================
def get_cookie_settings():
    """Get secure cookie settings based on environment."""
    is_production = getattr(settings, 'IS_PRODUCTION', False)
    
    if is_production:
        # Production: Secure cookies with Lax SameSite
        return {
            'httponly': True,
            'secure': True,  # HTTPS only
            'samesite': 'Lax',
            'path': '/',
        }
    else:
        # Development: Allow cross-origin cookies between localhost ports
        # SameSite=None requires Secure in modern browsers, but we're on localhost
        # So we use Lax with domain explicitly set
        return {
            'httponly': True,
            'secure': False,
            'samesite': 'Lax',
            'path': '/',
        }


def set_auth_cookies(response, access_token, refresh_token):
    """Set httpOnly cookies for JWT tokens."""
    cookie_settings = get_cookie_settings()
    
    # Access token - shorter lived
    response.set_cookie(
        key='access_token',
        value=str(access_token),
        max_age=60 * 10,  # 10 minutes (match ACCESS_TOKEN_LIFETIME)
        **cookie_settings
    )
    
    # Refresh token - longer lived
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=60 * 60 * 24,  # 1 day (match REFRESH_TOKEN_LIFETIME)
        **cookie_settings
    )
    
    return response


def clear_auth_cookies(response):
    """Clear JWT cookies on logout."""
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


#Registration endpoint

@api_view(['POST'])
@permission_classes([AllowAny]) 
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "User registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#Custom Login - returns JWT in httpOnly cookies (XSS-safe)
@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user is not None:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        # Create response with user info (but NOT the tokens in body)
        response = Response({
            'detail': 'Login successful',
            'user': {
                'username': user.username,
                'email': user.email,
            }
        })
        
        # Set tokens in httpOnly cookies (not accessible via JavaScript)
        set_auth_cookies(response, access, refresh)
        
        return response
    else:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# Logout (blacklist refresh token and clear cookies)
@api_view(['POST'])
@permission_classes([AllowAny])  # Allow logout even with expired token
def logout_view(request):
    try:
        # Get refresh token from cookie (preferred) or request body (fallback)
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get("refresh")
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Always clear cookies
        response = Response({"detail": "Logout successful"}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        
        return response
    except Exception as e:
        # Even on error, clear cookies
        response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


# Token refresh endpoint - reads from cookie, returns new tokens in cookies
@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Refresh access token using refresh token from httpOnly cookie."""
    refresh_token = request.COOKIES.get('refresh_token')
    
    if not refresh_token:
        return Response(
            {"error": "No refresh token found"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        access = refresh.access_token
        
        # Create new refresh token if rotation is enabled
        if getattr(settings, 'SIMPLE_JWT', {}).get('ROTATE_REFRESH_TOKENS', False):
            refresh.blacklist()
            refresh = RefreshToken.for_user(refresh.payload.get('user_id'))
        
        response = Response({"detail": "Token refreshed"})
        set_auth_cookies(response, access, refresh)
        
        return response
    except Exception as e:
        response = Response(
            {"error": "Invalid or expired refresh token"},
            status=status.HTTP_401_UNAUTHORIZED
        )
        clear_auth_cookies(response)
        return response


# Get current authenticated user info (for checking auth status on page load)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me_view(request):
    """Return current user information. Used to verify authentication on page load."""
    return Response({
        'user': {
            'username': request.user.username,
            'email': request.user.email,
        }
    })


#JWT-protected ADX endpoints: authentication plus roled-based authorization
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminGroup])
def adx_telemetry(request):
    kql_query = "DevInfo | limit 2"  # Example KQL query
    data = query_adx(kql_query)
    return Response(data)


# Telemetry ViewSet
class TelemetryViewSet(viewsets.ModelViewSet):
    queryset = Telemetry.objects.all().order_by('-created_at')
    serializer_class = TelemetrySerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_serial(request):
    serial = request.data.get('serial')
    
    if not serial:
        return Response ({"error": "Serial number is required"}, status=400)

    # Call ADX query
    serial = request.data.get('serial').strip()
    

    kql_query = f"DevInfo | where comms_serial contains '{serial}' | limit 1"

    
    try:
        print(f"Executing KQL Query: {kql_query}")
        data = query_adx(kql_query)
        print(f"Query Response: {data}")
        if not data:
            return Response({"message": "No serial number found"}, status=404)
        return Response(data)
        
    except Exception as e:
        return Response({"Error querying ADX": str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query_adx_view(request):
    kql_query = request.data.get('kql')
    
    if not kql_query:
        return Response({"error": "KQL query is required"}, status=400)

    try:
        # Reduced logging - only log errors, not every query
        data = query_adx(kql_query)
        return Response(data)
    except Exception as e:
        print(f"KQL Query Error: {str(e)}")
        return Response({"error querying KQL": str(e)}, status=500)


# =============================================================================
# OPTIMIZED Batch Telemetry Endpoint (Cost-Efficient)
# =============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_telemetry_view(request):
    """
    Fetch multiple telemetry metrics in a SINGLE optimized ADX query.
    
    This endpoint reduces ADX costs by:
    1. Combining multiple metric requests into one query
    2. Server-side caching (30 second TTL by default)
    3. Rate limiting to prevent query storms
    
    Request body:
    {
        "serial": "device_serial_number",
        "telemetry_names": ["/INV/DCPORT/STAT/PV1/V", "/BMS/MODULE1/STAT/V", ...],
        "alarm_names": ["/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR", ...]  // optional
    }
    
    Response:
    {
        "telemetry": {
            "/INV/DCPORT/STAT/PV1/V": {"value": 123.45, "localtime": "2024-..."},
            ...
        },
        "alarms": {
            "/BMS/CLUSTER/EVENT/ALARM/MAIN_RELAY_ERROR": {"value": 0, "localtime": "..."},
            ...
        },
        "meta": {
            "cached": false,
            "query_count": 2,
            "rate_limit_remaining": 58
        }
    }
    """
    from .adx_optimized import (
        query_latest_telemetry_batch,
        query_latest_alarms_batch,
        get_query_stats
    )
    
    serial = request.data.get('serial')
    telemetry_names = request.data.get('telemetry_names', [])
    alarm_names = request.data.get('alarm_names', [])
    
    if not serial:
        return Response({"error": "Serial number is required"}, status=400)
    
    if not telemetry_names and not alarm_names:
        return Response({"error": "At least one telemetry_names or alarm_names required"}, status=400)
    
    try:
        result = {
            'telemetry': {},
            'alarms': {},
            'meta': {}
        }
        
        query_count = 0
        
        # Fetch telemetry batch (single query for all metrics)
        if telemetry_names:
            result['telemetry'] = query_latest_telemetry_batch(serial, telemetry_names)
            query_count += 1
        
        # Fetch alarms batch (single query for all alarms)
        if alarm_names:
            result['alarms'] = query_latest_alarms_batch(serial, alarm_names)
            query_count += 1
        
        # Add metadata
        stats = get_query_stats()
        result['meta'] = {
            'query_count': query_count,
            'queries_last_minute': stats['queries_last_minute'],
            'rate_limit_max': stats['max_queries_per_minute'],
        }
        
        return Response(result)
        
    except Exception as e:
        import traceback
        print(f"ERROR in batch_telemetry_view: {str(e)}")
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adx_stats_view(request):
    """
    Get ADX query statistics for monitoring costs.
    """
    from .adx_optimized import get_query_stats
    
    stats = get_query_stats()
    return Response(stats)


# =============================================================================
# Health Check Endpoint
# =============================================================================
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for load balancers, monitoring, and container orchestration.
    Returns status of critical services (database, cache, etc.)
    """
    from django.db import connection
    import os
    
    health_status = {
        'status': 'healthy',
        'environment': os.getenv('DJANGO_ENVIRONMENT', 'development'),
        'checks': {}
    }
    
    # Database connectivity check
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['checks']['database'] = 'ok'
    except Exception as e:
        health_status['checks']['database'] = f'error: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Redis check (optional)
    redis_url = os.getenv('REDIS_URL')
    if redis_url:
        try:
            import redis
            r = redis.from_url(redis_url)
            r.ping()
            health_status['checks']['redis'] = 'ok'
        except ImportError:
            health_status['checks']['redis'] = 'not installed'
        except Exception as e:
            health_status['checks']['redis'] = f'error: {str(e)}'
            # Redis failure is not critical, don't mark as unhealthy
    
    # ADX connectivity check (optional, lightweight)
    adx_url = os.getenv('ADX_CLUSTER_URL')
    if adx_url:
        health_status['checks']['adx'] = 'configured'
    else:
        health_status['checks']['adx'] = 'not configured'
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return Response(health_status, status=status_code)