from django.urls import path
from . import views

app_name = 'loans'

urlpatterns = [
    path('', views.loans_dashboard_view, name='dashboard'),
    path('apply/', views.apply_loan_view, name='apply'),
    path('<int:loan_id>/pay-emi/', views.pay_emi_view, name='pay_emi'),
]

