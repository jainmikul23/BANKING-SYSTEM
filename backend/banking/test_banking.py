from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from accounts.models import User, Customer
from banking.models import Branch, Account, Transaction
from banking.services import perform_deposit, perform_withdraw, perform_transfer, BankingServiceError
from loans.models import Loan

class BankingCoreLogicTests(TestCase):
    def setUp(self):
        # Create Branch
        self.branch = Branch.objects.create(
            name='Test Branch',
            ifsc_code='TEST0001001',
            city='Mumbai'
        )

        # Create Customer 1
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='Password@123',
            role='customer'
        )
        self.customer1 = Customer.objects.create(
            user=self.user1,
            full_name='Aarav Sharma',
            phone='+91 98201 11111',
            city='Mumbai',
            kyc_status='verified'
        )
        self.account1 = Account.objects.create(
            customer=self.customer1,
            branch=self.branch,
            type='savings',
            balance=Decimal('5000.00'),
            status='active'
        )

        # Create Customer 2
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='Password@123',
            role='customer'
        )
        self.customer2 = Customer.objects.create(
            user=self.user2,
            full_name='Priya Patel',
            phone='+91 98201 22222',
            city='Ahmedabad',
            kyc_status='verified'
        )
        self.account2 = Account.objects.create(
            customer=self.customer2,
            branch=self.branch,
            type='savings',
            balance=Decimal('2000.00'),
            status='active'
        )

    def test_deposit_success(self):
        """Test depositing money updates account balance and creates transaction record."""
        txn = perform_deposit(self.account1.id, Decimal('1500.00'), 'Test Deposit')
        self.account1.refresh_from_db()
        self.assertEqual(self.account1.balance, Decimal('6500.00'))
        self.assertEqual(txn.amount, Decimal('1500.00'))
        self.assertEqual(txn.balance_after, Decimal('6500.00'))
        self.assertEqual(txn.type, 'deposit')

    def test_withdraw_success(self):
        """Test valid withdrawal decreases balance."""
        txn = perform_withdraw(self.account1.id, Decimal('1000.00'), 'Test Withdrawal')
        self.account1.refresh_from_db()
        self.assertEqual(self.account1.balance, Decimal('4000.00'))
        self.assertEqual(txn.balance_after, Decimal('4000.00'))

    def test_withdraw_below_minimum_balance_fails(self):
        """Test withdrawal that would reduce balance below ₹500 raises error and does not deduct balance."""
        # Current balance is 5000, min is 500. Withdrawing 4600 leaves 400 < 500 -> must raise BankingServiceError
        with self.assertRaises(BankingServiceError):
            perform_withdraw(self.account1.id, Decimal('4600.00'), 'Overdraw')
        self.account1.refresh_from_db()
        self.assertEqual(self.account1.balance, Decimal('5000.00'))

    def test_atomic_transfer_success(self):
        """Test atomic transfer debits sender, credits receiver, and generates two linked transaction rows."""
        txn_out, txn_in = perform_transfer(
            self.account1.account_number,
            self.account2.account_number,
            Decimal('2000.00'),
            'Test Transfer'
        )
        self.account1.refresh_from_db()
        self.account2.refresh_from_db()

        self.assertEqual(self.account1.balance, Decimal('3000.00'))
        self.assertEqual(self.account2.balance, Decimal('4000.00'))
        self.assertEqual(txn_out.type, 'transfer_out')
        self.assertEqual(txn_in.type, 'transfer_in')
        self.assertEqual(txn_out.amount, Decimal('2000.00'))
        self.assertEqual(txn_in.amount, Decimal('2000.00'))
        # Both reference numbers share common prefix
        self.assertEqual(txn_out.reference_no[:-1], txn_in.reference_no[:-1])

    def test_transfer_to_same_account_fails(self):
        """Test transferring funds to the exact same account raises an error."""
        with self.assertRaises(BankingServiceError):
            perform_transfer(
                self.account1.account_number,
                self.account1.account_number,
                Decimal('500.00')
            )

    def test_transfer_from_frozen_account_fails(self):
        """Test that transfers originating from a frozen account are strictly prohibited."""
        self.account1.status = 'frozen'
        self.account1.save()

        with self.assertRaises(BankingServiceError):
            perform_transfer(
                self.account1.account_number,
                self.account2.account_number,
                Decimal('500.00')
            )

    def test_loan_emi_calculation(self):
        """Test standard EMI formula: P=100000, r=12% p.a. (1% p.m.), n=12 months => EMI ≈ 8884.88"""
        emi = Loan.calculate_emi(Decimal('100000.00'), Decimal('12.00'), 12)
        self.assertEqual(emi, Decimal('8884.88'))

