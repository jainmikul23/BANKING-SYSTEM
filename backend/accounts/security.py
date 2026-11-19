import time
from django.utils import timezone
from django.core.cache import cache
from banking.models import AuditLog

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900 # 15 minutes

def get_client_ip(request):
    """Retrieve client real IP address safely."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def is_account_locked(username, ip):
    """Check if username or IP is temporarily locked due to excessive failed attempts."""
    user_lock_key = f"lockout:user:{username.lower()}"
    ip_lock_key = f"lockout:ip:{ip}"

    user_locked = cache.get(user_lock_key)
    ip_locked = cache.get(ip_lock_key)

    if user_locked:
        remaining = int(user_locked - time.time())
        if remaining > 0:
            return True, remaining
    if ip_locked:
        remaining = int(ip_locked - time.time())
        if remaining > 0:
            return True, remaining

    return False, 0


def record_failed_login(username, request):
    """Increment failed login counter and lock account if threshold reached."""
    ip = get_client_ip(request)
    u_key = f"failed_attempts:user:{username.lower()}"
    ip_key = f"failed_attempts:ip:{ip}"

    # Increment counter with 15 min expiry
    user_attempts = cache.get(u_key, 0) + 1
    ip_attempts = cache.get(ip_key, 0) + 1

    cache.set(u_key, user_attempts, LOCKOUT_DURATION_SECONDS)
    cache.set(ip_key, ip_attempts, LOCKOUT_DURATION_SECONDS)

    AuditLog.objects.create(
        user=None,
        action='FAILED_LOGIN_ATTEMPT',
        table_name='users',
        record_id=username[:50],
        new_value={'ip': ip, 'attempts': user_attempts, 'agent': request.META.get('HTTP_USER_AGENT', '')[:100]}
    )

    if user_attempts >= MAX_FAILED_ATTEMPTS or ip_attempts >= MAX_FAILED_ATTEMPTS:
        lock_until = time.time() + LOCKOUT_DURATION_SECONDS
        cache.set(f"lockout:user:{username.lower()}", lock_until, LOCKOUT_DURATION_SECONDS)
        cache.set(f"lockout:ip:{ip}", lock_until, LOCKOUT_DURATION_SECONDS)

        AuditLog.objects.create(
            user=None,
            action='ACCOUNT_LOCKOUT',
            table_name='users',
            record_id=username[:50],
            new_value={'ip': ip, 'reason': '5 consecutive failed attempts', 'lockout_seconds': LOCKOUT_DURATION_SECONDS}
        )
        return True

    return False


def clear_failed_login(username, request):
    """Clear failed login attempts upon successful authentication."""
    ip = get_client_ip(request)
    cache.delete(f"failed_attempts:user:{username.lower()}")
    cache.delete(f"failed_attempts:ip:{ip}")
    cache.delete(f"lockout:user:{username.lower()}")
    cache.delete(f"lockout:ip:{ip}")

