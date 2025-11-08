

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from telemetryapp.views import register_view, logout_view, login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/login/', login_view, name='login'), # Custom login
    path('api/logout/', logout_view, name='logout'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('telemetryapp.urls')),  # include app routes
]
