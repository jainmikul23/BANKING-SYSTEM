from django.test import TestCase, Client
from decimal import Decimal
from django.contrib.auth import get_user_model
from accounts.models import Customer
from banking.models import Branch, Account
from loans.models import Loan, LoanPayment

User = get_user_model()

class LoanModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='loantester',
            email='loan@example.com',
            password='TestPassword@123',
            role='customer'
        )
        self.customer = Customer.objects.create(
            user=self.user,
            full_name='Loan Tester',
            phone='9876543299',
            address='123 Test Street',
            city='Mumbai',
            kyc_status='verified'
        )
        self.branch = Branch.objects.create(
            name='Test Branch',
            ifsc_code='TEST0000001',
            city='Mumbai'
        )
        self.account = Account.objects.create(
            account_number='501009999999',
            customer=self.customer,
            branch=self.branch,
            type='savings',
            balance=Decimal('50000.00'),
            status='active'
        )

    def test_emi_calculation(self):
        """Verify standard monthly EMI calculation formula."""
        principal = Decimal('100000.00')
        rate = Decimal('10.0') # 10% annual
        tenure = 12 # 12 months
        emi = Loan.calculate_emi(principal, rate, tenure)
        # Expected EMI around ~8791.59
        self.assertGreater(emi, Decimal('8700.00'))
        self.assertLess(emi, Decimal('8900.00'))

    def test_zero_interest_emi(self):
        """Verify zero interest rate divides principal equally."""
        emi = Loan.calculate_emi(Decimal('12000.00'), Decimal('0.0'), 12)
        self.assertEqual(emi, Decimal('1000.00'))

    def test_loan_creation(self):
        """Verify loan creation with pending status."""
        emi = Loan.calculate_emi(Decimal('50000.00'), Decimal('8.5'), 24)
        loan = Loan.objects.create(
            customer=self.customer,
            account=self.account,
            loan_type='personal',
            principal=Decimal('50000.00'),
            interest_rate=Decimal('8.5'),
            tenure_months=24,
            emi=emi,
            status='pending'
        )
        self.assertEqual(loan.status, 'pending')
        self.assertEqual(loan.principal, Decimal('50000.00'))

    def test_api_loan_emi(self):
        """Test GET and POST on /api/loan/emi/"""
        c = Client()
        c.force_login(self.user)
        # GET test
        resp_get = c.get('/api/loan/emi/?p=200000&r=9.0&n=24')
        self.assertEqual(resp_get.status_code, 200)
        data = resp_get.json()
        self.assertTrue(data['ok'])
        self.assertIn('monthly_emi', data['data'])

        # POST test
        resp_post = c.post('/api/loan/emi/', data='{"principal": 200000, "interest_rate": 9.0, "tenure_months": 24}', content_type='application/json')
        self.assertEqual(resp_post.status_code, 200)
        self.assertTrue(resp_post.json()['ok'])
