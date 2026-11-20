import json
from decimal import Decimal, InvalidOperation
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST, require_GET

from accounts.decorators import customer_required
from banking.models import Account, Transaction, Beneficiary, Branch
from banking.services import perform_deposit, perform_withdraw, perform_transfer, BankingServiceError
from banking.statements import generate_pdf_statement, generate_csv_statement

@customer_required
def accounts_list_view(request):
    """Stacked Apple Wallet style accounts view."""
    customer = request.user.customer_profile
    accounts = customer.accounts.select_related('branch').all()
    branches = Branch.objects.all()
    return render(request, 'customer/accounts.html', {
        'accounts': accounts,
        'branches': branches
    })


@customer_required
def open_account_view(request):
    """Open a new savings or current bank account."""
    customer = request.user.customer_profile

    if request.method == 'POST':
        account_type = request.POST.get('type', 'savings')
        branch_id = request.POST.get('branch_id')
        branch = get_object_or_404(Branch, id=branch_id)

        initial_bal = Decimal('1000.00') if account_type == 'savings' else Decimal('5000.00')

        account = Account.objects.create(
            customer=customer,
            branch=branch,
            type=account_type,
            balance=initial_bal,
            status='active'
        )

        Transaction.objects.create(
            account=account,
            type='deposit',
            amount=initial_bal,
            balance_after=initial_bal,
            reference_no=f"OPN{account.account_number[-6:]}",
            description=f"Initial Opening Deposit for {account.get_type_display()} Account"
        )

        messages.success(request, f"New {account.get_type_display()} Account {account.account_number} created!")
        return redirect('banking:accounts_list')

    branches = Branch.objects.all()
    return render(request, 'customer/open_account.html', {'branches': branches})


@customer_required
def deposit_view(request):
    """Deposit money page with quick chips and sheet confirmation."""
    customer = request.user.customer_profile
    accounts = customer.accounts.filter(status='active')

    if request.method == 'POST':
        account_id = request.POST.get('account_id')
        amount_raw = request.POST.get('amount', '0')
        desc = request.POST.get('description', '')

        try:
            amount = Decimal(amount_raw)
            account = accounts.get(id=account_id)
            txn = perform_deposit(account.id, amount, desc, user=request.user)
            messages.success(request, f"Successfully deposited ₹{amount:,.2f} into A/C {account.account_number}. Ref: {txn.reference_no}")
            return redirect('banking:accounts_list')
        except Account.DoesNotExist:
            messages.error(request, "Invalid account selected.")
        except (BankingServiceError, InvalidOperation, ValueError) as e:
            messages.error(request, str(e))

    return render(request, 'customer/deposit.html', {'accounts': accounts})


@customer_required
def withdraw_view(request):
    """Withdraw money page with minimum balance check."""
    customer = request.user.customer_profile
    accounts = customer.accounts.filter(status='active')

    if request.method == 'POST':
        account_id = request.POST.get('account_id')
        amount_raw = request.POST.get('amount', '0')
        desc = request.POST.get('description', '')

        try:
            amount = Decimal(amount_raw)
            account = accounts.get(id=account_id)
            txn = perform_withdraw(account.id, amount, desc, user=request.user)
            messages.success(request, f"Withdrew ₹{amount:,.2f} from A/C {account.account_number}. Ref: {txn.reference_no}")
            return redirect('banking:accounts_list')
        except Account.DoesNotExist:
            messages.error(request, "Invalid account selected.")
        except (BankingServiceError, InvalidOperation, ValueError) as e:
            messages.error(request, str(e))

    return render(request, 'customer/withdraw.html', {'accounts': accounts})


@customer_required
def transfer_view(request):
    """3-step transfer funds flow with beneficiary picker & confirmation."""
    customer = request.user.customer_profile
    accounts = customer.accounts.filter(status='active')
    beneficiaries = Beneficiary.objects.filter(customer=customer).select_related('beneficiary_account')

    if request.method == 'POST':
        from_acc_no = request.POST.get('from_account')
        to_acc_no = request.POST.get('to_account')
        amount_raw = request.POST.get('amount', '0')
        desc = request.POST.get('description', '')

        try:
            amount = Decimal(amount_raw)
            # Ensure sender account belongs to current customer
            if not accounts.filter(account_number=from_acc_no).exists():
                raise BankingServiceError("Source account does not belong to you.")

            txn_out, txn_in = perform_transfer(from_acc_no, to_acc_no, amount, desc, user=request.user)
            messages.success(
                request, 
                f"Transferred ₹{amount:,.2f} to A/C {to_acc_no}. Transaction Ref: {txn_out.reference_no}"
            )
            return redirect('banking:accounts_list')
        except (BankingServiceError, InvalidOperation, ValueError) as e:
            messages.error(request, str(e))

    return render(request, 'customer/transfer.html', {
        'accounts': accounts,
        'beneficiaries': beneficiaries
    })


@customer_required
def beneficiaries_view(request):
    """Manage saved beneficiaries."""
    customer = request.user.customer_profile
    beneficiaries = Beneficiary.objects.filter(customer=customer).select_related('beneficiary_account', 'beneficiary_account__customer')

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'add':
            acc_no = request.POST.get('account_number', '').strip()
            nickname = request.POST.get('nickname', '').strip()

            try:
                target_acc = Account.objects.get(account_number=acc_no)
                if target_acc.customer == customer:
                    messages.error(request, "You cannot add your own account as a third-party beneficiary.")
                else:
                    Beneficiary.objects.create(
                        customer=customer,
                        beneficiary_account=target_acc,
                        nickname=nickname or target_acc.customer.full_name
                    )
                    messages.success(request, f"Beneficiary '{nickname}' added successfully.")
            except Account.DoesNotExist:
                messages.error(request, "Account number not found.")
            except Exception as e:
                messages.error(request, f"Error adding beneficiary: {str(e)}")

        elif action == 'delete':
            b_id = request.POST.get('beneficiary_id')
            Beneficiary.objects.filter(id=b_id, customer=customer).delete()
            messages.info(request, "Beneficiary removed.")

        return redirect('banking:beneficiaries')

    return render(request, 'customer/beneficiaries.html', {'beneficiaries': beneficiaries})


@customer_required
def transaction_history_view(request):
    """Filterable, searchable and paginated transaction history."""
    customer = request.user.customer_profile
    accounts = list(customer.accounts.select_related('branch').all())

    txns = Transaction.objects.filter(account__in=accounts).select_related('account', 'related_account')

    # Filters
    acc_filter = request.GET.get('account')
    if acc_filter:
        txns = txns.filter(account__account_number=acc_filter)

    type_filter = request.GET.get('type')
    if type_filter:
        txns = txns.filter(type=type_filter)

    from_date = request.GET.get('from')
    if from_date:
        parsed_from = parse_date(from_date)
        if parsed_from:
            txns = txns.filter(created_at__date__gte=parsed_from)

    to_date = request.GET.get('to')
    if to_date:
        parsed_to = parse_date(to_date)
        if parsed_to:
            txns = txns.filter(created_at__date__lte=parsed_to)

    search_query = request.GET.get('q')
    if search_query:
        txns = txns.filter(Q(reference_no__icontains=search_query) | Q(description__icontains=search_query))

    paginator = Paginator(txns, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'customer/transactions.html', {
        'page_obj': page_obj,
        'accounts': accounts,
        'selected_account': acc_filter,
        'selected_type': type_filter,
        'from_date': from_date,
        'to_date': to_date,
        'search_query': search_query,
    })


@customer_required
def statement_view(request):
    """Account statement preview and PDF/CSV download."""
    customer = request.user.customer_profile
    accounts = customer.accounts.all()

    account_id = request.GET.get('account_id')
    account = accounts.filter(id=account_id).first() if account_id else accounts.first()

    from_date = request.GET.get('from')
    to_date = request.GET.get('to')
    export_format = request.GET.get('export')

    txns = Transaction.objects.none()
    if account:
        txns = Transaction.objects.filter(account=account).order_by('created_at')
        if from_date:
            parsed_from = parse_date(from_date)
            if parsed_from:
                txns = txns.filter(created_at__date__gte=parsed_from)
        if to_date:
            parsed_to = parse_date(to_date)
            if parsed_to:
                txns = txns.filter(created_at__date__lte=parsed_to)

        if export_format == 'pdf':
            return generate_pdf_statement(account, txns, from_date, to_date)
        elif export_format == 'csv':
            return generate_csv_statement(account, txns, from_date, to_date)

    return render(request, 'customer/statement.html', {
        'accounts': accounts,
        'selected_account': account,
        'transactions': txns,
        'from_date': from_date,
        'to_date': to_date,
    })


# =====================================================================
# JSON API ENDPOINTS (SECTION 7 SPECIFICATION)
# =====================================================================

@require_POST
@csrf_protect
def api_deposit(request):
    """POST /api/deposit/"""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        acc_no = data.get('account_number')
        amount = Decimal(str(data.get('amount', 0)))
        desc = data.get('description', 'API Deposit')

        account = get_object_or_404(Account, account_number=acc_no)
        # If customer, verify ownership
        if request.user.role == 'customer' and account.customer.user != request.user:
            return JsonResponse({'ok': False, 'message': 'Access denied: Not your account.'}, status=403)

        txn = perform_deposit(account.id, amount, desc, user=request.user)
        return JsonResponse({
            'ok': True,
            'message': f'Deposit of ₹{amount:,.2f} completed successfully.',
            'data': {
                'reference_no': txn.reference_no,
                'account_number': account.account_number,
                'balance_after': str(txn.balance_after),
                'created_at': txn.created_at.isoformat()
            }
        })
    except (BankingServiceError, InvalidOperation, ValueError) as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'ok': False, 'message': f'Server error: {str(e)}'}, status=500)


@require_POST
@csrf_protect
def api_withdraw(request):
    """POST /api/withdraw/"""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        acc_no = data.get('account_number')
        amount = Decimal(str(data.get('amount', 0)))
        desc = data.get('description', 'API Withdrawal')

        account = get_object_or_404(Account, account_number=acc_no)
        if request.user.role == 'customer' and account.customer.user != request.user:
            return JsonResponse({'ok': False, 'message': 'Access denied: Not your account.'}, status=403)

        txn = perform_withdraw(account.id, amount, desc, user=request.user)
        return JsonResponse({
            'ok': True,
            'message': f'Withdrawal of ₹{amount:,.2f} completed successfully.',
            'data': {
                'reference_no': txn.reference_no,
                'account_number': account.account_number,
                'balance_after': str(txn.balance_after),
                'created_at': txn.created_at.isoformat()
            }
        })
    except (BankingServiceError, InvalidOperation, ValueError) as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'ok': False, 'message': f'Server error: {str(e)}'}, status=500)


@require_POST
@csrf_protect
def api_transfer(request):
    """POST /api/transfer/"""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        from_acc = data.get('from_account')
        to_acc = data.get('to_account')
        amount = Decimal(str(data.get('amount', 0)))
        desc = data.get('description', '')

        sender_acc = get_object_or_404(Account, account_number=from_acc)
        if request.user.role == 'customer' and sender_acc.customer.user != request.user:
            return JsonResponse({'ok': False, 'message': 'Access denied: Not your account.'}, status=403)

        txn_out, txn_in = perform_transfer(from_acc, to_acc, amount, desc, user=request.user)
        return JsonResponse({
            'ok': True,
            'message': f'Transfer of ₹{amount:,.2f} completed successfully.',
            'data': {
                'reference_no': txn_out.reference_no,
                'from_account': from_acc,
                'to_account': to_acc,
                'amount': str(amount),
                'balance_after': str(txn_out.balance_after),
                'created_at': txn_out.created_at.isoformat()
            }
        })
    except (BankingServiceError, InvalidOperation, ValueError) as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'ok': False, 'message': f'Server error: {str(e)}'}, status=500)


@require_GET
def api_balance(request, acc_no):
    """GET /api/balance/<acc_no>/"""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    account = get_object_or_404(Account.objects.select_related('customer'), account_number=acc_no)
    if request.user.role == 'customer' and account.customer.user != request.user:
        return JsonResponse({'ok': False, 'message': 'Access denied: Not your account.'}, status=403)

    resp = JsonResponse({
        'ok': True,
        'data': {
            'account_number': account.account_number,
            'type': account.get_type_display(),
            'balance': str(account.balance),
            'status': account.status,
            'currency': 'INR'
        }
    })
    resp['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
    return resp


@require_GET
def api_transactions(request):
    """GET /api/transactions/?account=&from=&to=&type="""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    acc_no = request.GET.get('account')
    from_date = request.GET.get('from')
    to_date = request.GET.get('to')
    t_type = request.GET.get('type')

    if request.user.role == 'customer':
        accounts = request.user.customer_profile.accounts.all()
        txns = Transaction.objects.filter(account__in=accounts)
    else:
        txns = Transaction.objects.all()

    if acc_no:
        txns = txns.filter(account__account_number=acc_no)
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

    txns = txns.select_related('account').order_by('-created_at')[:50]

    data = [
        {
            'reference_no': t.reference_no,
            'account': t.account.account_number,
            'type': t.type,
            'type_display': t.get_type_display(),
            'amount': str(t.amount),
            'balance_after': str(t.balance_after),
            'description': t.description,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for t in txns
    ]

    resp = JsonResponse({'ok': True, 'count': len(data), 'data': data})
    resp['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
    return resp

