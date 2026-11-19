def user_role_context(request):
    """Context processor providing user role and profile helpers."""
    if not request.user.is_authenticated:
        return {
            'is_admin': False,
            'is_customer': False,
            'customer_profile': None,
        }

    is_admin = request.user.is_superuser or request.user.role == 'admin'
    is_customer = request.user.role == 'customer'
    customer_profile = getattr(request.user, 'customer_profile', None)

    return {
        'is_admin': is_admin,
        'is_customer': is_customer,
        'customer_profile': customer_profile,
    }

