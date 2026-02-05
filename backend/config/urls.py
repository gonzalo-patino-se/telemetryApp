

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView
from telemetryapp.views import register_view, logout_view, login_view, token_refresh_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/login/', login_view, name='login'), # Custom login with httpOnly cookies
    path('api/logout/', logout_view, name='logout'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Legacy endpoint
    path('api/token/refresh/', token_refresh_view, name='token_refresh'),  # Cookie-based refresh
    path('api/', include('telemetryapp.urls')),  # include app routes
]
