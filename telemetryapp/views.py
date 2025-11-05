from django.shortcuts import render
from rest_framework.response import Response
from .adx_service import query_adx


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .permissions import IsAdminGroup


from rest_framework import viewsets
from .models import Telemetry
from .serializers import TelemetrySerializer

from django.contrib.auth.models import User
from rest_framework import status



#Registration endpoint

@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if username and password:
        user = User.objects.create_user(username=username, password=password)
        return Response({"detail": "User registered"}, status=status.HTTP_201_CREATED)
    return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

#Login endpoint is provided by SimpleJWT package
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user is not None:
        # Delegate to simple JWT for token generation
        token_view = TokenObtainPairView.as_view()
        return token_view(request._request) # Pass the raw WSGI request
    else:
        return Response({"error": "Invalid credentials"}), status=status.HTTP_401_UNAUTHORIZED)



#JWT-protected ADX endpoints: authentication plus roled-based authorization
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminGroup])
def adx_telemetry(request):
    kql_query = "DevInfo | limit 2"  # Example KQL query
    data = query_adx(kql_query)
    return Response(data)



class TelemetryViewSet(viewsets.ModelViewSet):
    queryset = Telemetry.objects.all().order_by('-created_at')
    serializer_class = TelemetrySerializer
    permission_classes = [IsAuthenticated]

