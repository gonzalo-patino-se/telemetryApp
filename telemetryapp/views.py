from django.shortcuts import render
from rest_framework.response import Response
from .adx_service import query_adx


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

