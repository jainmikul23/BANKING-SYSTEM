from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from accounts.models import Customer
from banking.models import Branch, Account
from decimal import Decimal

User = get_user_model()

class AdminPanelTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admintest',
            email='admin@apex.com',
            password='AdminPassword@123',
            role='admin'
        )
        self.regular_user = User.objects.create_user(
            username='reguser',
            email='reg@apex.com',
            password='UserPassword@123',
            role='customer'
        )
        self.customer = Customer.objects.create(
            user=self.regular_user,
            full_name='Regular User',
            phone='9876500000',
            address='123 Road',
            city='Delhi',
            kyc_status='verified'
        )
        self.branch = Branch.objects.create(
            name='Delhi Main',
            ifsc_code='APEX0000101',
            city='Delhi'
        )
        self.account = Account.objects.create(
            account_number='502000000111',
            customer=self.customer,
            branch=self.branch,
            type='savings',
            balance=Decimal('25000.00'),
            status='active'
        )

    def test_anonymous_access_denied(self):
        """Anonymous users must be redirected to login from admin dashboard."""
        c = Client()
        resp = c.get('/portal-admin/')
        self.assertEqual(resp.status_code, 302)

    def test_customer_access_forbidden(self):
        """Customers must not be able to access the admin portal."""
        c = Client()
        c.force_login(self.regular_user)
        resp = c.get('/portal-admin/')
        # Redirected or 403 Forbidden
        self.assertIn(resp.status_code, (302, 403))

    def test_admin_dashboard_accessible(self):
        """Admin users must be able to load the admin dashboard."""
        c = Client()
        c.force_login(self.admin)
        resp = c.get('/portal-admin/')
        self.assertEqual(resp.status_code, 200)

    def test_admin_account_status_api(self):
        """Admin can change account status to frozen."""
        c = Client()
        c.force_login(self.admin)
        resp = c.post(
            f'/api/admin/account/{self.account.id}/status/',
            data='{"status": "frozen"}',
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        self.account.refresh_from_db()
        self.assertEqual(self.account.status, 'frozen')
