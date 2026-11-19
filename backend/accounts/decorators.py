from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.http import JsonResponse

def customer_required(view_func):
    """Ensure current user is authenticated and has customer role."""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.path.startswith('/api/'):
                return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)
            messages.warning(request, "Please log in to access your banking portal.")
            return redirect('accounts:login')
        
        if request.user.role == 'admin' and not request.user.is_superuser:
            messages.error(request, "Admins cannot access customer portal.")
            return redirect('adminpanel:dashboard')
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def admin_required(view_func):
    """Ensure current user is authenticated and has admin or superuser role."""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.path.startswith('/api/'):
                return JsonResponse({'ok': False, 'message': 'Admin authentication required.'}, status=401)
            messages.warning(request, "Please log in with admin privileges.")
            return redirect('accounts:login')
        
        if not (request.user.role == 'admin' or request.user.is_superuser):
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.path.startswith('/api/'):
                return JsonResponse({'ok': False, 'message': 'Access denied: Admin role required.'}, status=403)
            messages.error(request, "Access denied. Administrator privileges required.")
            return redirect('accounts:dashboard')
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view

