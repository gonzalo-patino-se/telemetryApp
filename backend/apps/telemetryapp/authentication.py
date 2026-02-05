"""
Custom JWT Authentication that reads tokens from httpOnly cookies.

This provides XSS protection by keeping tokens inaccessible to JavaScript.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that extracts tokens from httpOnly cookies.
    
    Falls back to Authorization header for backward compatibility and API testing.
    """
    
    def authenticate(self, request):
        # First, try to get the token from the cookie
        raw_token = request.COOKIES.get('access_token')
        
        # If no cookie, fall back to Authorization header (for API testing)
        if raw_token is None:
            header = self.get_header(request)
            if header is not None:
                raw_token = self.get_raw_token(header)
        
        if raw_token is None:
            return None
        
        # Validate the token
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
