import random
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

def generate_account_number():
    """Generate a unique 12-digit account number starting with 50."""
    return f"50{random.randint(1000000000, 9999999999)}"

class Branch(models.Model):
    name = models.CharField(max_length=100)
    ifsc_code = models.CharField(max_length=15, unique=True)
    city = models.CharField(max_length=100)

    class Meta:
        db_table = 'branches'
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'

    def __str__(self):
        return f"{self.name} ({self.ifsc_code})"


class Account(models.Model):
    TYPE_CHOICES = (
        ('savings', 'Savings'),
        ('current', 'Current'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('frozen', 'Frozen'),
        ('closed', 'Closed'),
    )

    account_number = models.CharField(max_length=20, unique=True, default=generate_account_number)
    customer = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='accounts')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='accounts')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='savings')
    balance = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('500.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    opened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'accounts'
        indexes = [
            models.Index(fields=['customer'], name='idx_accounts_customer'),
            models.Index(fields=['account_number'], name='idx_accounts_acc_num'),
        ]
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'

    def __str__(self):
        return f"{self.account_number} ({self.get_type_display()} - ₹{self.balance})"

    @property
    def min_balance(self):
        if self.type == 'savings':
            return settings.MIN_SAVINGS_BALANCE
        return settings.MIN_CURRENT_BALANCE


class Transaction(models.Model):
    TYPE_CHOICES = (
        ('deposit', 'Deposit'),
        ('withdraw', 'Withdrawal'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out'),
        ('loan_credit', 'Loan Disbursement'),
        ('emi_debit', 'EMI Payment'),
    )

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    reference_no = models.CharField(max_length=64, unique=True)
    description = models.CharField(max_length=255, blank=True)
    related_account = models.ForeignKey(
        Account, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='related_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['account'], name='idx_txn_account'),
            models.Index(fields=['created_at'], name='idx_txn_created_at'),
            models.Index(fields=['reference_no'], name='idx_txn_reference_no'),
        ]
        ordering = ['-created_at']
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    def __str__(self):
        return f"{self.reference_no} | {self.get_type_display()} | ₹{self.amount}"


class Beneficiary(models.Model):
    customer = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='beneficiaries')
    beneficiary_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='favored_by')
    nickname = models.CharField(max_length=100)

    class Meta:
        db_table = 'beneficiaries'
        unique_together = ('customer', 'beneficiary_account')
        verbose_name = 'Beneficiary'
        verbose_name_plural = 'Beneficiaries'

    def __str__(self):
        return f"{self.nickname} ({self.beneficiary_account.account_number})"


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)
    table_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        ordering = ['-created_at']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.action} on {self.table_name} #{self.record_id}"

