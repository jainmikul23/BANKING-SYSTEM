import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.core.paginator import Paginator
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

from accounts.decorators import admin_required
from accounts.models import User, Customer
from banking.models import Account, Transaction, Branch, AuditLog
from loans.models import Loan

@admin_required
def admin_dashboard(request):
    """Admin Executive Dashboard: System KPIs, Volume Charts, and Pending Action Queues."""
    total_customers = Customer.objects.count()
    total_accounts = Account.objects.count()
    total_deposits = Account.objects.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
    pending_loans_count = Loan.objects.filter(status='pending').count()
    active_loans_volume = Loan.objects.filter(status='active').aggregate(total=Sum('principal'))['total'] or Decimal('0.00')

    # Pending action items
    pending_loans = Loan.objects.filter(status='pending').select_related('customer', 'account')[:5]
    pending_kyc = Customer.objects.filter(kyc_status='pending').select_related('user')[:5]
    recent_transactions = Transaction.objects.select_related('account', 'related_account').order_by('-created_at')[:8]

    # Chart 1: Last 7 days transaction volume
    today = timezone.now().date()
    days_labels = []
    credits_data = []
    debits_data = []

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        days_labels.append(d.strftime('%a, %d %b'))
        day_txns = Transaction.objects.filter(created_at__date=d)
        c_amt = day_txns.filter(type__in=['deposit', 'transfer_in', 'loan_credit']).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        d_amt = day_txns.filter(type__in=['withdraw', 'transfer_out', 'emi_debit']).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        credits_data.append(float(c_amt))
        debits_data.append(float(d_amt))

    context = {
        'total_customers': total_customers,
        'total_accounts': total_accounts,
        'total_deposits': total_deposits,
        'pending_loans_count': pending_loans_count,
        'active_loans_volume': active_loans_volume,
        'pending_loans': pending_loans,
        'pending_kyc': pending_kyc,
        'recent_transactions': recent_transactions,
        'days_labels': days_labels,
        'credits_data': credits_data,
        'debits_data': debits_data,
    }
    return render(request, 'admin/dashboard.html', context)


@admin_required
def admin_customers_view(request):
    """Admin Customers table with KYC verify/reject and account status toggles."""
    customers = Customer.objects.select_related('user').all()

    search = request.GET.get('q')
    kyc_filter = request.GET.get('kyc')

    if search:
        customers = customers.filter(
            Q(full_name__icontains=search) | 
            Q(phone__icontains=search) | 
            Q(user__username__icontains=search) |
            Q(user__email__icontains=search)
        )
    if kyc_filter:
        customers = customers.filter(kyc_status=kyc_filter)

    paginator = Paginator(customers.order_by('-created_at'), 15)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'admin/customers.html', {
        'page_obj': page_obj,
        'search': search,
        'kyc_filter': kyc_filter
    })


@admin_required
def admin_update_kyc(request, customer_id):
    """Verify or reject customer KYC."""
    if request.method == 'POST':
        customer = get_object_or_404(Customer, id=customer_id)
        status = request.POST.get('status')
        if status in ('verified', 'rejected'):
            old_status = customer.kyc_status
            customer.kyc_status = status
            customer.save(update_fields=['kyc_status'])

            AuditLog.objects.create(
                user=request.user,
                action='KYC_STATUS_UPDATE',
                table_name='customers',
                record_id=str(customer.id),
                old_value={'kyc_status': old_status},
                new_value={'kyc_status': status}
            )
            messages.success(request, f"Customer {customer.full_name} KYC status updated to {status.upper()}.")
    return redirect('adminpanel:customers')


@admin_required
def admin_accounts_view(request):
    """Admin Accounts table with Freeze, Unfreeze, Close controls."""
    accounts = Account.objects.select_related('customer', 'branch').all()

    search = request.GET.get('q')
    status_filter = request.GET.get('status')
    type_filter = request.GET.get('type')

    if search:
        accounts = accounts.filter(
            Q(account_number__icontains=search) |
            Q(customer__full_name__icontains=search)
        )
    if status_filter:
        accounts = accounts.filter(status=status_filter)
    if type_filter:
        accounts = accounts.filter(type=type_filter)

    paginator = Paginator(accounts.order_by('-opened_at'), 15)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'admin/accounts.html', {
        'page_obj': page_obj,
        'search': search,
        'status_filter': status_filter,
        'type_filter': type_filter
    })


@admin_required
def admin_update_account_status(request, account_id):
    """Change account status to active, frozen or closed."""
    if request.method == 'POST':
        account = get_object_or_404(Account, id=account_id)
        new_status = request.POST.get('status')
        if new_status in ('active', 'frozen', 'closed'):
            old_status = account.status
            account.status = new_status
            account.save(update_fields=['status'])

            AuditLog.objects.create(
                user=request.user,
                action='ACCOUNT_STATUS_CHANGE',
                table_name='accounts',
                record_id=str(account.id),
                old_value={'status': old_status},
                new_value={'status': new_status}
            )
            messages.success(request, f"Account {account.account_number} status updated to {new_status.upper()}.")
    return redirect('adminpanel:accounts')


@admin_required
def admin_transactions_view(request):
    """Admin Global Transaction Ledger with search, date-range, and type filters."""
    txns = Transaction.objects.select_related('account', 'related_account').all()

    search = request.GET.get('q')
    t_type = request.GET.get('type')
    from_date = request.GET.get('from')
    to_date = request.GET.get('to')

    if search:
        txns = txns.filter(
            Q(reference_no__icontains=search) |
            Q(account__account_number__icontains=search) |
            Q(description__icontains=search)
        )
    if t_type:
        txns = txns.filter(type=t_type)
    if from_date:
        p_from = parse_date(from_date)
        if p_from:
            txns = txns.filter(created_at__date__gte=p_from)
    if to_date:
        p_to = parse_date(to_date)
        if p_to:
            txns = txns.filter(created_at__date__lte=p_to)

    paginator = Paginator(txns.order_by('-created_at'), 20)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'admin/transactions.html', {
        'page_obj': page_obj,
        'search': search,
        'selected_type': t_type,
        'from_date': from_date,
        'to_date': to_date
    })


@admin_required
def admin_loans_view(request):
    """Admin Loans management with quick approve / reject actions."""
    loans = Loan.objects.select_related('customer', 'account').all()

    status_filter = request.GET.get('status')
    if status_filter:
        loans = loans.filter(status=status_filter)

    paginator = Paginator(loans.order_by('-applied_at'), 15)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'admin/loans.html', {
        'page_obj': page_obj,
        'status_filter': status_filter
    })


@admin_required
def admin_reports_view(request):
    """Executive Reports & Analytics: daily volumes, top customers, loan portfolio."""
    # Top 5 customers by balance
    top_customers = Customer.objects.annotate(
        total_balance=Sum('accounts__balance')
    ).order_by('-total_balance')[:5]

    # Branch breakdown
    branch_stats = Branch.objects.annotate(
        acc_count=Count('accounts'),
        total_balance=Sum('accounts__balance')
    ).order_by('-total_balance')

    # Loan breakdown by type
    loan_types_stats = Loan.objects.values('loan_type').annotate(
        count=Count('id'),
        total_principal=Sum('principal')
    )

    return render(request, 'admin/reports.html', {
        'top_customers': top_customers,
        'branch_stats': branch_stats,
        'loan_types_stats': loan_types_stats,
    })


@admin_required
def admin_audit_log_view(request):
    """Admin Audit Log view."""
    logs = AuditLog.objects.select_related('user').all()

    action_filter = request.GET.get('action')
    if action_filter:
        logs = logs.filter(action=action_filter)

    paginator = Paginator(logs.order_by('-created_at'), 25)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'admin/audit_log.html', {
        'page_obj': page_obj,
        'action_filter': action_filter
    })


# =====================================================================
# API ENDPOINT FOR ACCOUNT STATUS
# =====================================================================

@require_POST
@csrf_protect
def api_admin_account_status(request, account_id):
    """POST /api/admin/account/<id>/status/"""
    if not request.user.is_authenticated or not (request.user.role == 'admin' or request.user.is_superuser):
        return JsonResponse({'ok': False, 'message': 'Admin privilege required.'}, status=403)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        new_status = data.get('status')
        if new_status not in ('active', 'frozen', 'closed'):
            return JsonResponse({'ok': False, 'message': 'Invalid status choice.'}, status=400)

        account = get_object_or_404(Account, id=account_id)
        old_status = account.status
        account.status = new_status
        account.save(update_fields=['status'])

        AuditLog.objects.create(
            user=request.user,
            action='ACCOUNT_STATUS_CHANGE',
            table_name='accounts',
            record_id=str(account.id),
            old_value={'status': old_status},
            new_value={'status': new_status}
        )

        return JsonResponse({
            'ok': True, 
            'message': f'Account {account.account_number} status set to {new_status}.',
            'data': {'status': account.status}
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=500)

