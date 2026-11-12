from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class Loan(models.Model):
    LOAN_TYPES = (
        ('home', 'Home Loan'),
        ('education', 'Education Loan'),
        ('personal', 'Personal Loan'),
        ('vehicle', 'Vehicle Loan'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    )

    customer = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='loans')
    account = models.ForeignKey('banking.Account', on_delete=models.PROTECT, related_name='loans')
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    principal = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('1000.00'))]
    )
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Annual interest rate in %"
    )
    tenure_months = models.PositiveIntegerField(help_text="Tenure in months")
    emi = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_loans'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'loans'
        ordering = ['-applied_at']
        verbose_name = 'Loan'
        verbose_name_plural = 'Loans'

    def __str__(self):
        return f"{self.get_loan_type_display()} - ₹{self.principal} ({self.get_status_display()})"

    @staticmethod
    def calculate_emi(principal: Decimal, annual_rate: Decimal, tenure_months: int) -> Decimal:
        """
        EMI = P × r × (1+r)^n / ((1+r)^n − 1)
        where r = monthly interest rate = (annual_rate / 12) / 100
        """
        if tenure_months <= 0:
            return Decimal('0.00')
        p = float(principal)
        r = float(annual_rate) / (12 * 100)
        n = int(tenure_months)
        if r == 0:
            emi = p / n
        else:
            emi = (p * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
        return Decimal(str(round(emi, 2)))


class LoanPayment(models.Model):
    STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    )

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    paid_on = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')

    class Meta:
        db_table = 'loan_payments'
        ordering = ['-paid_on']
        verbose_name = 'Loan Payment'
        verbose_name_plural = 'Loan Payments'

    def __str__(self):
        return f"Loan #{self.loan.id} Payment: ₹{self.amount} ({self.status})"

