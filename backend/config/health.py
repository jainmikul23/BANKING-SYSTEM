from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check(request):
    """
    Ultra-lightweight keep-alive heartbeat and health monitoring endpoint.
    Universally compatible with:
      - UptimeRobot (HEAD / GET)
      - Cron-job.org
      - BetterStack / BetterUptime
      - GitHub Actions cron runner
      - Render internal health checks
    Returns HTTP 200 in <1ms without touching database, session, or auth.
    """
    if request.method == 'HEAD':
        response = HttpResponse(status=200)
        response['Content-Type'] = 'application/json'
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['X-Health-Check'] = 'pass'
        return response

    response = JsonResponse({
        'status': 'ok',
        'service': 'atheria-reserve-core',
        'ping': 'pong'
    }, status=200)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['X-Health-Check'] = 'pass'
    return response
