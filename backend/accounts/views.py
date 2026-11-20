from decimal import Decimal
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib import messages
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import User, Customer
from accounts.forms import LoginForm, CustomerRegistrationForm, CustomerProfileForm
from accounts.decorators import customer_required
from accounts.security import get_client_ip, is_account_locked, record_failed_login, clear_failed_login
from banking.models import Account, Transaction, Beneficiary, AuditLog
from loans.models import Loan

def landing_page(request):
    """Modern 3D Landing Page."""
    if request.user.is_authenticated:
        if request.user.role == 'admin' or request.user.is_superuser:
            return redirect('adminpanel:dashboard')
        return redirect('accounts:dashboard')
    return render(request, 'landing.html')


def login_view(request):
    """User Login with Brute-Force Rate Limiting & Account Lockout."""
    if request.user.is_authenticated:
        if request.user.role == 'admin' or request.user.is_superuser:
            return redirect('adminpanel:dashboard')
        return redirect('accounts:dashboard')

    if request.method == 'POST':
        raw_username = request.POST.get('username', '').strip()
        ip = get_client_ip(request)

        # Check if username or IP is currently locked out
        is_locked, remaining_secs = is_account_locked(raw_username, ip)
        if is_locked:
            minutes = max(1, remaining_secs // 60)
            messages.error(
                request,
                f"Security Lockout: Too many failed login attempts. Please wait {minutes} minute(s) before retrying."
            )
            return render(request, 'accounts/login.html', {'form': LoginForm(request.POST)})

        form = LoginForm(request.POST)
        if form.is_valid():
            user = form.cleaned_data['user']
            clear_failed_login(raw_username, request)

            # Prevent Session Fixation attack
            request.session.cycle_key()
            login(request, user)

            # Audit log success
            AuditLog.objects.create(
                user=user,
                action='LOGIN_SUCCESS',
                table_name='users',
                record_id=str(user.id),
                new_value={'ip': ip, 'agent': request.META.get('HTTP_USER_AGENT', '')[:100]}
            )

            messages.success(request, f"Welcome back, {user.first_name or user.username}!")
            if user.role == 'admin' or user.is_superuser:
                return redirect('adminpanel:dashboard')
            return redirect('accounts:dashboard')
        else:
            if raw_username:
                was_locked = record_failed_login(raw_username, request)
                if was_locked:
                    messages.error(request, "Account temporarily locked for 15 minutes due to 5 consecutive failed attempts.")
    else:
        form = LoginForm()

    return render(request, 'accounts/login.html', {'form': form})


def register_view(request):
    """Customer Registration with automatic opening of initial bank account."""
    if request.user.is_authenticated:
        return redirect('accounts:dashboard')

    if request.method == 'POST':
        form = CustomerRegistrationForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            try:
                with transaction.atomic():
                    # 1. Create User
                    user = User.objects.create_user(
                        username=data['username'],
                        email=data['email'],
                        password=data['password'],
                        first_name=data['full_name'].split()[0],
                        last_name=' '.join(data['full_name'].split()[1:]),
                        role='customer'
                    )

                    # 2. Create Customer Profile
                    customer = Customer.objects.create(
                        user=user,
                        full_name=data['full_name'],
                        dob=data['dob'],
                        phone=data['phone'],
                        address=data['address'],
                        city=data['city'],
                        kyc_status='pending'
                    )

                    # 3. Create Initial Bank Account
                    initial_bal = Decimal('1000.00') if data['account_type'] == 'savings' else Decimal('5000.00')
                    account = Account.objects.create(
                        customer=customer,
                        branch=data['branch'],
                        type=data['account_type'],
                        balance=initial_bal,
                        status='active'
                    )

                    # 4. Create Initial Deposit Transaction
                    Transaction.objects.create(
                        account=account,
                        type='deposit',
                        amount=initial_bal,
                        balance_after=initial_bal,
                        reference_no=f"REG{account.account_number[-6:]}",
                        description='Welcome Initial Deposit'
                    )

                    login(request, user)
                    messages.success(request, f"Welcome to Atheria Reserve! Account {account.account_number} has been created.")
                    return redirect('accounts:dashboard')
            except Exception as e:
                messages.error(request, f"Registration failed: {str(e)}")
    else:
        form = CustomerRegistrationForm()

    return render(request, 'accounts/register.html', {'form': form})


def logout_view(request):
    """Logout current user."""
    logout(request)
    messages.info(request, "You have been logged out securely.")
    return redirect('landing')


@customer_required
def customer_dashboard(request):
    """Customer Home Dashboard: balances, spending analytics, recent activity."""
    customer = request.user.customer_profile
    # Eager-load branches in 1 query to prevent N+1 queries in template
    accounts = list(customer.accounts.select_related('branch').all())
    
    # Calculate totals in memory from fetched accounts (saves 2 remote database roundtrips)
    total_balance = sum((a.balance for a in accounts), Decimal('0.00'))
    active_accounts_count = sum(1 for a in accounts if a.status == 'active')
    
    # Recent transactions across all customer accounts (uses composite index idx_txn_acc_created)
    recent_txns = Transaction.objects.filter(account__in=accounts).select_related('account', 'related_account')[:8]
    
    # Active loans with related account pre-loaded
    active_loans = Loan.objects.filter(customer=customer, status='active').select_related('account')
    
    # Monthly spending chart data (last 6 months) - only fetch required scalar fields
    today = timezone.now()
    six_months_ago = today - timedelta(days=180)
    monthly_txns = Transaction.objects.filter(
        account__in=accounts,
        created_at__gte=six_months_ago
    ).values('created_at', 'type', 'amount')
    
    # Group spending by month for Chart.js
    monthly_spending = {}
    for i in range(5, -1, -1):
        m_date = today - timedelta(days=i*30)
        m_key = m_date.strftime('%b %Y')
        monthly_spending[m_key] = {'credits': Decimal('0.00'), 'debits': Decimal('0.00')}
    
    for t in monthly_txns:
        m_key = t['created_at'].strftime('%b %Y')
        if m_key in monthly_spending:
            if t['type'] in ('deposit', 'transfer_in', 'loan_credit'):
                monthly_spending[m_key]['credits'] += t['amount']
            else:
                monthly_spending[m_key]['debits'] += t['amount']

    chart_labels = list(monthly_spending.keys())
    chart_credits = [float(val['credits']) for val in monthly_spending.values()]
    chart_debits = [float(val['debits']) for val in monthly_spending.values()]

    context = {
        'customer': customer,
        'accounts': accounts,
        'total_balance': total_balance,
        'active_accounts_count': active_accounts_count,
        'recent_transactions': recent_txns,
        'active_loans': active_loans,
        'chart_labels': chart_labels,
        'chart_credits': chart_credits,
        'chart_debits': chart_debits,
    }
    return render(request, 'customer/dashboard.html', context)


@customer_required
def profile_view(request):
    """Customer profile and KYC status view/update."""
    customer = request.user.customer_profile

    if request.method == 'POST':
        form = CustomerProfileForm(request.POST, instance=customer)
        if form.is_valid():
            customer = form.save()
            new_email = form.cleaned_data.get('email')
            if new_email and new_email != request.user.email:
                request.user.email = new_email
                request.user.save()
            messages.success(request, "Your profile details have been updated successfully.")
            return redirect('accounts:profile')
    else:
        form = CustomerProfileForm(instance=customer)

    return render(request, 'customer/profile.html', {
        'customer': customer,
        'form': form
    })


@customer_required
def change_password_view(request):
    """Change customer password."""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            AuditLog.objects.create(
                user=user,
                action='PASSWORD_CHANGED',
                table_name='users',
                record_id=str(user.id),
                new_value={'ip': get_client_ip(request), 'timestamp': timezone.now().isoformat()}
            )
            messages.success(request, "Your password has been changed successfully.")
            return redirect('accounts:profile')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'customer/change_password.html', {'form': form})

