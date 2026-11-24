from django.shortcuts import render
from django.middleware.csrf import get_token

def csrf_failure(request, reason=""):
    """
    Branded Atheria Reserve CSRF verification failure handler.
    Instead of showing a raw 403 debug screen, renders an institutional,
    recovery-oriented interface and refreshes the CSRF token.
    """
    # Issue a fresh CSRF token so next submission succeeds immediately
    fresh_token = get_token(request)
    
    context = {
        'reason': reason or 'Security session token expired or mismatched.',
        'path': request.path,
        'fresh_token': fresh_token,
    }
    return render(request, '403_csrf.html', context, status=403)
