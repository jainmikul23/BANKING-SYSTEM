import time
from django.contrib.auth import logout
from django.contrib import messages
from django.shortcuts import redirect
from django.conf import settings

class BankingSecurityHeadersMiddleware:
    """Injects high-security banking headers into all HTTP responses and enables cross-origin API access."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get('Origin')

        # Handle CORS preflight for frontend cross-origin API requests
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse(status=200)
            if origin:
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken, X-Requested-With, Authorization'
            return response

        response = self.get_response(request)

        # CORS response headers for API requests
        if origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken, X-Requested-With, Authorization'

        # Anti-Clickjacking & Anti-MIME Sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=()'

        # Content Security Policy (strict script/style/font whitelists + live API connect-src)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://banking-system-1-0ae4.onrender.com https://*.vercel.app https://atheria-reserve.vercel.app; "
            "frame-ancestors 'none';"
        )

        return response


class SessionInactivityTimeoutMiddleware:
    """Terminates session after 15 minutes of user inactivity (Banking standard)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            now = time.time()
            last_activity = request.session.get('last_activity')

            timeout = getattr(settings, 'SESSION_COOKIE_AGE', 900) # 15 minutes

            if last_activity and (now - last_activity > timeout):
                logout(request)
                request.session.flush()
                messages.warning(request, "Session timed out after 15 minutes of inactivity for your security.")
                return redirect('accounts:login')

            # Performance: Throttle session writes so we don't query/update MySQL on every single click
            if not last_activity or (now - last_activity > 60):
                request.session['last_activity'] = now
                request.session.modified = True

        return self.get_response(request)

