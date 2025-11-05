from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .adx_service import query_adx


from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from rest_framework import viewsets
from .models import Telemetry
from .serializers import TelemetrySerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adx_telemetry(request):
    kql_query = "DevInfo | limit 2"  # Example KQL query
    data = query_adx(kql_query)
    return Response(data)



class TelemetryViewSet(viewsets.ModelViewSet):
    queryset = Telemetry.objects.all().order_by('-created_at')
    serializer_class = TelemetrySerializer

