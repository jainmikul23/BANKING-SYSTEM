import json
from decimal import Decimal, InvalidOperation
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST, require_GET

from accounts.decorators import customer_required, admin_required
from banking.models import Account, Transaction, AuditLog
from loans.models import Loan, LoanPayment

# Standard Annual Interest Rates
INTEREST_RATES = {
    'home': Decimal('8.50'),
    'education': Decimal('9.25'),
    'vehicle': Decimal('9.75'),
    'personal': Decimal('11.50'),
}

@customer_required
def loans_dashboard_view(request):
    """Customer Loans overview: active loans, repayment schedule, calculator, apply form."""
    customer = request.user.customer_profile
    customer_loans = Loan.objects.filter(customer=customer).select_related('account')
    active_accounts = customer.accounts.filter(status='active')

    return render(request, 'customer/loans.html', {
        'loans': customer_loans,
        'accounts': active_accounts,
        'rates': INTEREST_RATES,
    })


@customer_required
def apply_loan_view(request):
    """Apply for a new bank loan."""
    customer = request.user.customer_profile
    accounts = customer.accounts.filter(status='active')

    if request.method == 'POST':
        account_id = request.POST.get('account_id')
        loan_type = request.POST.get('loan_type')
        principal_raw = request.POST.get('principal', '0')
        tenure_raw = request.POST.get('tenure_months', '12')

        try:
            principal = Decimal(principal_raw)
            tenure = int(tenure_raw)
            account = accounts.get(id=account_id)

            if loan_type not in INTEREST_RATES:
                raise ValueError("Invalid loan type selected.")
            if principal < Decimal('10000.00'):
                raise ValueError("Minimum loan principal is ₹10,000.")
            if tenure < 6 or tenure > 360:
                raise ValueError("Tenure must be between 6 and 360 months.")

            rate = INTEREST_RATES[loan_type]
            emi = Loan.calculate_emi(principal, rate, tenure)

            loan = Loan.objects.create(
                customer=customer,
                account=account,
                loan_type=loan_type,
                principal=principal,
                interest_rate=rate,
                tenure_months=tenure,
                emi=emi,
                status='pending'
            )

            messages.success(request, f"Loan application #{loan.id} for ₹{principal:,.2f} submitted for approval!")
            return redirect('loans:dashboard')
        except (Account.DoesNotExist, ValueError, InvalidOperation) as e:
            messages.error(request, str(e))

    return redirect('loans:dashboard')


@customer_required
def pay_emi_view(request, loan_id):
    """Pay upcoming EMI from the linked account."""
    customer = request.user.customer_profile
    loan = get_object_or_404(Loan, id=loan_id, customer=customer, status='active')

    if request.method == 'POST':
        try:
            with transaction.atomic():
                account = Account.objects.select_for_update().get(id=loan.account.id)
                emi_amount = loan.emi

                if (account.balance - emi_amount) < account.min_balance:
                    messages.error(request, f"Insufficient funds in linked account {account.account_number} to pay EMI of ₹{emi_amount:,.2f}.")
                    return redirect('loans:dashboard')

                account.balance -= emi_amount
                account.save(update_fields=['balance'])

                ref = f"EMI{loan.id}{timezone.now().strftime('%y%m%d%H%M')}"
                Transaction.objects.create(
                    account=account,
                    type='emi_debit',
                    amount=emi_amount,
                    balance_after=account.balance,
                    reference_no=ref,
                    description=f"Monthly EMI Payment for Loan #{loan.id}"
                )

                payment = LoanPayment.objects.create(
                    loan=loan,
                    amount=emi_amount,
                    status='paid'
                )

                # Check if all EMIs have been paid
                total_paid_count = loan.payments.filter(status='paid').count()
                if total_paid_count >= loan.tenure_months:
                    loan.status = 'closed'
                    loan.save(update_fields=['status'])
                    messages.success(request, f"Congratulations! Loan #{loan.id} is fully repaid and closed.")
                else:
                    messages.success(request, f"EMI payment of ₹{emi_amount:,.2f} processed. Remaining EMIs: {loan.tenure_months - total_paid_count}.")

                return redirect('loans:dashboard')
        except Exception as e:
            messages.error(request, f"Payment error: {str(e)}")

    return redirect('loans:dashboard')


# =====================================================================
# LOANS API (SECTION 7 SPECIFICATION)
# =====================================================================

@require_GET
def api_loan_emi(request):
    """GET /api/loan/emi/?p=&r=&n="""
    try:
        principal = Decimal(request.GET.get('p', '100000'))
        annual_rate = Decimal(request.GET.get('r', '10.0'))
        tenure = int(request.GET.get('n', '12'))

        emi = Loan.calculate_emi(principal, annual_rate, tenure)
        total_repayable = emi * tenure
        total_interest = total_repayable - principal

        return JsonResponse({
            'ok': True,
            'data': {
                'principal': str(principal),
                'annual_rate': str(annual_rate),
                'tenure_months': tenure,
                'monthly_emi': str(emi),
                'total_interest': str(round(total_interest, 2)),
                'total_repayable': str(round(total_repayable, 2))
            }
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=400)


@require_POST
@csrf_protect
def api_loan_apply(request):
    """POST /api/loan/apply/"""
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'message': 'Authentication required.'}, status=401)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        customer = request.user.customer_profile
        acc_no = data.get('account_number')
        loan_type = data.get('loan_type')
        principal = Decimal(str(data.get('principal', 0)))
        tenure = int(data.get('tenure_months', 12))

        account = get_object_or_404(Account, account_number=acc_no, customer=customer)
        if loan_type not in INTEREST_RATES:
            return JsonResponse({'ok': False, 'message': 'Invalid loan type.'}, status=400)

        rate = INTEREST_RATES[loan_type]
        emi = Loan.calculate_emi(principal, rate, tenure)

        loan = Loan.objects.create(
            customer=customer,
            account=account,
            loan_type=loan_type,
            principal=principal,
            interest_rate=rate,
            tenure_months=tenure,
            emi=emi,
            status='pending'
        )

        return JsonResponse({
            'ok': True,
            'message': 'Loan application submitted successfully.',
            'data': {
                'loan_id': loan.id,
                'principal': str(loan.principal),
                'emi': str(loan.emi),
                'status': loan.status
            }
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=400)


@require_POST
@csrf_protect
def api_admin_loan_decision(request, loan_id):
    """POST /api/admin/loan/<id>/decision/"""
    if not request.user.is_authenticated or not (request.user.role == 'admin' or request.user.is_superuser):
        return JsonResponse({'ok': False, 'message': 'Admin privilege required.'}, status=403)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        decision = data.get('decision') # 'approve' or 'reject'

        loan = get_object_or_404(Loan, id=loan_id)
        if loan.status != 'pending':
            return JsonResponse({'ok': False, 'message': f'Loan is already {loan.status}.'}, status=400)

        with transaction.atomic():
            if decision == 'approve':
                account = Account.objects.select_for_update().get(id=loan.account.id)
                account.balance += loan.principal
                account.save(update_fields=['balance'])

                ref = f"LNC{loan.id}{timezone.now().strftime('%y%m%d%H%M')}"
                Transaction.objects.create(
                    account=account,
                    type='loan_credit',
                    amount=loan.principal,
                    balance_after=account.balance,
                    reference_no=ref,
                    description=f"Loan Disbursement for Loan #{loan.id} ({loan.get_loan_type_display()})"
                )

                loan.status = 'active'
                loan.approved_by = request.user
                loan.approved_at = timezone.now()
                loan.save()

                AuditLog.objects.create(
                    user=request.user,
                    action='LOAN_APPROVED',
                    table_name='loans',
                    record_id=str(loan.id),
                    old_value={'status': 'pending'},
                    new_value={'status': 'active', 'disbursed_amount': str(loan.principal)}
                )
                msg = f"Loan #{loan.id} approved and ₹{loan.principal:,.2f} disbursed to A/C {account.account_number}."
            elif decision == 'reject':
                loan.status = 'rejected'
                loan.approved_by = request.user
                loan.approved_at = timezone.now()
                loan.save()

                AuditLog.objects.create(
                    user=request.user,
                    action='LOAN_REJECTED',
                    table_name='loans',
                    record_id=str(loan.id),
                    old_value={'status': 'pending'},
                    new_value={'status': 'rejected'}
                )
                msg = f"Loan #{loan.id} has been rejected."
            else:
                return JsonResponse({'ok': False, 'message': 'Invalid decision value.'}, status=400)

        return JsonResponse({'ok': True, 'message': msg, 'data': {'status': loan.status}})
    except Exception as e:
        return JsonResponse({'ok': False, 'message': str(e)}, status=500)

