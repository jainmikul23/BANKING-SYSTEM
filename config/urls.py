from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views
from accounts import seo_views
from banking import views as banking_views
from loans import views as loans_views
from adminpanel import views as adminpanel_views

urlpatterns = [
    # SEO & Security Standards (XML Sitemap, Robots, RFC 9116, Favicons)
    path('favicon.ico', seo_views.favicon_ico, name='favicon_ico'),
    path('apple-touch-icon.png', seo_views.apple_touch_icon, name='apple_touch_icon'),
    path('apple-touch-icon-precomposed.png', seo_views.apple_touch_icon, name='apple_touch_icon_precomposed'),
    path('sitemap.xml', seo_views.sitemap_xml, name='sitemap_xml'),
    path('robots.txt', seo_views.robots_txt, name='robots_txt'),
    path('.well-known/security.txt', seo_views.security_txt, name='security_txt'),

    # Landing Page
    path('', accounts_views.landing_page, name='landing'),

    # Modular App URLs
    path('accounts/', include('accounts.urls')),
    path('banking/', include('banking.urls')),
    path('loans/', include('loans.urls')),
    path('portal-admin/', include('adminpanel.urls')),
    path('django-admin/', admin.site.urls),

    # JSON API Endpoints (Section 7 Specification)
    path('api/deposit/', banking_views.api_deposit, name='api_deposit'),
    path('api/withdraw/', banking_views.api_withdraw, name='api_withdraw'),
    path('api/transfer/', banking_views.api_transfer, name='api_transfer'),
    path('api/transactions/', banking_views.api_transactions, name='api_transactions'),
    path('api/balance/<str:acc_no>/', banking_views.api_balance, name='api_balance'),
    path('api/loan/apply/', loans_views.api_loan_apply, name='api_loan_apply'),
    path('api/loan/emi/', loans_views.api_loan_emi, name='api_loan_emi'),
    path('api/admin/loan/<int:loan_id>/decision/', loans_views.api_admin_loan_decision, name='api_admin_loan_decision'),
    path('api/admin/account/<int:account_id>/status/', adminpanel_views.api_admin_account_status, name='api_admin_account_status'),
]

