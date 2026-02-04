from django.shortcuts import render
from rest_framework.response import Response
from .adx_service import query_adx


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


#Registration endpoint

@api_view(['POST'])
@permission_classes([AllowAny]) 
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "User registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#Custom Login is provided by SimpleJWT package
@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user is not None:
        # Delegate to simple JWT for token generation
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    else:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Logout (blacklist refresh token)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logout successful"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



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