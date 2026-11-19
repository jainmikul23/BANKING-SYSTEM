from django.urls import path
from . import views

app_name = 'adminpanel'

urlpatterns = [
    path('', views.admin_dashboard, name='dashboard'),
    path('customers/', views.admin_customers_view, name='customers'),
    path('customers/<int:customer_id>/kyc/', views.admin_update_kyc, name='update_kyc'),
    path('accounts/', views.admin_accounts_view, name='accounts'),
    path('accounts/<int:account_id>/status/', views.admin_update_account_status, name='update_account_status'),
    path('transactions/', views.admin_transactions_view, name='transactions'),
    path('loans/', views.admin_loans_view, name='loans'),
    path('reports/', views.admin_reports_view, name='reports'),
    path('audit-log/', views.admin_audit_log_view, name='audit_log'),
]

