import time
from django.contrib.auth import logout
from django.contrib import messages
from django.shortcuts import redirect
from django.conf import settings

class BankingSecurityHeadersMiddleware:
    """Injects high-security banking headers into all HTTP responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Anti-Clickjacking & Anti-MIME Sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=()'

        # Content Security Policy (strict script/style/font whitelists)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self'; "
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

            request.session['last_activity'] = now

        return self.get_response(request)
