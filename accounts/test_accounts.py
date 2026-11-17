import time
from django.test import TestCase, Client
from django.urls import reverse
from django.core.cache import cache
from accounts.models import User, Customer
from accounts.security import is_account_locked, record_failed_login, clear_failed_login
from banking.models import Branch, Account

class BankingSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()

        self.branch = Branch.objects.create(
            name='Nariman Flagship',
            ifsc_code='APEX0009999',
            city='Mumbai'
        )

        self.user = User.objects.create_user(
            username='secureuser',
            email='secure@example.in',
            password='Password@123',
            role='customer'
        )
        self.customer = Customer.objects.create(
            user=self.user,
            full_name='Secure Customer',
            phone='+91 99999 88888',
            city='Mumbai',
            kyc_status='verified'
        )

    def test_security_headers_present(self):
        """Verify institutional banking headers are applied to HTTP responses."""
        res = self.client.get(reverse('landing'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['X-Frame-Options'], 'DENY')
        self.assertEqual(res['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(res['X-XSS-Protection'], '1; mode=block')
        self.assertEqual(res['Referrer-Policy'], 'strict-origin-when-cross-origin')
        self.assertIn('Content-Security-Policy', res)
        self.assertIn('Permissions-Policy', res)

    def test_brute_force_lockout_after_five_failed_attempts(self):
        """Verify account lockout triggers after 5 failed login attempts."""
        class DummyRequest:
            META = {'REMOTE_ADDR': '192.168.1.100'}

        req = DummyRequest()
        for i in range(4):
            locked = record_failed_login('secureuser', req)
            self.assertFalse(locked)

        # 5th attempt locks the account
        locked = record_failed_login('secureuser', req)
        self.assertTrue(locked)

        is_locked, remaining = is_account_locked('secureuser', '192.168.1.100')
        self.assertTrue(is_locked)
        self.assertGreater(remaining, 0)

        # Clear on success
        clear_failed_login('secureuser', req)
        is_locked, _ = is_account_locked('secureuser', '192.168.1.100')
        self.assertFalse(is_locked)

    def test_sitemap_xml_endpoint(self):
        """Verify dynamic sitemap.xml returns valid XML."""
        res = self.client.get(reverse('sitemap_xml'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/xml')
        self.assertIn(b'<urlset', res.content)

    def test_robots_txt_protects_internal_routes(self):
        """Verify robots.txt disallows sensitive banking routes."""
        res = self.client.get(reverse('robots_txt'))
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Disallow: /banking/', res.content)
        self.assertIn(b'Disallow: /portal-admin/', res.content)

    def test_security_txt_endpoint(self):
        """Verify RFC 9116 security.txt exists and specifies contact."""
        res = self.client.get(reverse('security_txt'))
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Contact: security@aetheriareserve.in', res.content)

