from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def health_check(request):
    """
    Lightweight health check and keep-alive heartbeat endpoint.
    Executes in <1ms without touching database, sessions, or authentication.
    Safe for external uptime monitors (UptimeRobot, GitHub Actions cron).
    """
    response = JsonResponse({
        'status': 'ok',
        'service': 'atheria-reserve-core'
    }, status=200)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['X-Health-Check'] = 'pass'
    return response
