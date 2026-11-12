import random
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from banking.models import Account, Transaction, AuditLog

class BankingServiceError(Exception):
    """Custom exception for banking business logic failures."""
    pass


def perform_deposit(account_id: int, amount: Decimal, description: str = '', user=None) -> Transaction:
    """Perform deposit into an account within an atomic transaction."""
    if amount <= Decimal('0.00'):
        raise BankingServiceError("Deposit amount must be greater than zero.")

    with transaction.atomic():
        # Lock account row
        account = Account.objects.select_for_update().get(id=account_id)

        if account.status != 'active':
            raise BankingServiceError(f"Account is {account.status}. Deposits cannot be processed.")

        new_balance = account.balance + amount
        account.balance = new_balance
        account.save(update_fields=['balance'])

        ref_no = f"DEP{timezone.now().strftime('%y%m%d%H%M')}{random.randint(1000, 9999)}"
        txn = Transaction.objects.create(
            account=account,
            type='deposit',
            amount=amount,
            balance_after=new_balance,
            reference_no=ref_no,
            description=description or 'Cash / Online Deposit'
        )

        AuditLog.objects.create(
            user=user,
            action='DEPOSIT',
            table_name='accounts',
            record_id=str(account.id),
            new_value={'amount': str(amount), 'balance_after': str(new_balance), 'ref': ref_no}
        )

    return txn


def perform_withdraw(account_id: int, amount: Decimal, description: str = '', user=None) -> Transaction:
    """Perform withdrawal from an account with minimum balance verification."""
    if amount <= Decimal('0.00'):
        raise BankingServiceError("Withdrawal amount must be greater than zero.")

    with transaction.atomic():
        # Lock account row
        account = Account.objects.select_for_update().get(id=account_id)

        if account.status != 'active':
            raise BankingServiceError(f"Account is {account.status}. Withdrawals are prohibited.")

        if (account.balance - amount) < account.min_balance:
            raise BankingServiceError(
                f"Insufficient balance. Account balance cannot fall below minimum required ₹{account.min_balance}."
            )

        new_balance = account.balance - amount
        account.balance = new_balance
        account.save(update_fields=['balance'])

        ref_no = f"WTH{timezone.now().strftime('%y%m%d%H%M')}{random.randint(1000, 9999)}"
        txn = Transaction.objects.create(
            account=account,
            type='withdraw',
            amount=amount,
            balance_after=new_balance,
            reference_no=ref_no,
            description=description or 'Cash / ATM Withdrawal'
        )

        AuditLog.objects.create(
            user=user,
            action='WITHDRAWAL',
            table_name='accounts',
            record_id=str(account.id),
            new_value={'amount': str(amount), 'balance_after': str(new_balance), 'ref': ref_no}
        )

    return txn


def perform_transfer(from_account_number: str, to_account_number: str, amount: Decimal, description: str = '', user=None):
    """
    Perform atomic transfer between accounts.
    Uses select_for_update() on both accounts, checks daily transfer limit,
    verifies minimum balance and active statuses, and records two matching transaction rows.
    """
    if amount <= Decimal('0.00'):
        raise BankingServiceError("Transfer amount must be greater than zero.")

    if from_account_number == to_account_number:
        raise BankingServiceError("Sender and beneficiary accounts cannot be identical.")

    with transaction.atomic():
        # Lock both accounts in deterministic order to prevent deadlocks
        ordered_numbers = sorted([from_account_number, to_account_number])
        locked_accounts = {
            acc.account_number: acc
            for acc in Account.objects.select_for_update().filter(account_number__in=ordered_numbers)
        }

        if from_account_number not in locked_accounts:
            raise BankingServiceError("Source account not found.")
        if to_account_number not in locked_accounts:
            raise BankingServiceError("Destination account not found.")

        sender = locked_accounts[from_account_number]
        receiver = locked_accounts[to_account_number]

        if sender.status != 'active':
            raise BankingServiceError(f"Sender account is {sender.status}. Outbound transfers are blocked.")

        if receiver.status != 'active':
            raise BankingServiceError(f"Destination account is {receiver.status}. Inbound transfers cannot be accepted.")

        # Check Daily Transfer Limit
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_transfers_sum = Transaction.objects.filter(
            account=sender,
            type='transfer_out',
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        if (daily_transfers_sum + amount) > settings.DAILY_TRANSFER_LIMIT:
            raise BankingServiceError(
                f"Transfer exceeds daily limit of ₹{settings.DAILY_TRANSFER_LIMIT:,.2f}. "
                f"Transferred today: ₹{daily_transfers_sum:,.2f}"
            )

        # Check Minimum Balance
        if (sender.balance - amount) < sender.min_balance:
            raise BankingServiceError(
                f"Insufficient funds. Transfer would breach the minimum required balance of ₹{sender.min_balance:,.2f}."
            )

        # Update Balances
        sender_bal_after = sender.balance - amount
        receiver_bal_after = receiver.balance + amount

        sender.balance = sender_bal_after
        receiver.balance = receiver_bal_after

        sender.save(update_fields=['balance'])
        receiver.save(update_fields=['balance'])

        # Reference numbers with matching prefix
        timestamp_prefix = timezone.now().strftime('%y%m%d%H%M')
        rand_suffix = f"{random.randint(1000, 9999)}"
        ref_prefix = f"TRF{timestamp_prefix}{rand_suffix}"

        txn_out = Transaction.objects.create(
            account=sender,
            type='transfer_out',
            amount=amount,
            balance_after=sender_bal_after,
            reference_no=f"{ref_prefix}D",
            description=description or f"Transfer to A/C {receiver.account_number}",
            related_account=receiver
        )

        txn_in = Transaction.objects.create(
            account=receiver,
            type='transfer_in',
            amount=amount,
            balance_after=receiver_bal_after,
            reference_no=f"{ref_prefix}C",
            description=description or f"Transfer from A/C {sender.account_number}",
            related_account=sender
        )

        AuditLog.objects.create(
            user=user,
            action='TRANSFER',
            table_name='transactions',
            record_id=ref_prefix,
            new_value={
                'from': sender.account_number,
                'to': receiver.account_number,
                'amount': str(amount),
                'sender_balance_after': str(sender_bal_after),
                'receiver_balance_after': str(receiver_bal_after),
            }
        )

    return txn_out, txn_in

