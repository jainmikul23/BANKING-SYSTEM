from django.test.runner import DiscoverRunner

class ApexTestRunner(DiscoverRunner):
    """Custom test runner that defaults to testing all project apps when no labels are passed."""
    def build_suite(self, test_labels=None, extra_tests=None, **kwargs):
        if not test_labels:
            test_labels = ['accounts', 'banking', 'loans', 'adminpanel']
        return super().build_suite(test_labels, extra_tests=extra_tests, **kwargs)
