from django.urls import path
from . import views

app_name = 'banking'

urlpatterns = [
    path('accounts/', views.accounts_list_view, name='accounts_list'),
    path('accounts/', views.accounts_list_view, name='accounts'),
    path('accounts/open/', views.open_account_view, name='open_account'),
    path('deposit/', views.deposit_view, name='deposit'),
    path('withdraw/', views.withdraw_view, name='withdraw'),
    path('transfer/', views.transfer_view, name='transfer'),
    path('beneficiaries/', views.beneficiaries_view, name='beneficiaries'),
    path('transactions/', views.transaction_history_view, name='transactions'),
    path('statement/', views.statement_view, name='statement'),
]

