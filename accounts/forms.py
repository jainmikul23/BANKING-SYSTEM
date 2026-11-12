from django import forms
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from accounts.models import User, Customer
from banking.models import Branch

class LoginForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'Enter Username', 'autocomplete': 'username', 'class': 'form-input'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter Password', 'autocomplete': 'current-password', 'class': 'form-input'})
    )

    def clean(self):
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise ValidationError("Invalid username or password.")
            if not user.is_active:
                raise ValidationError("This account is currently inactive. Please contact administration.")
            cleaned_data['user'] = user
        return cleaned_data


class CustomerRegistrationForm(forms.Form):
    username = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'placeholder': 'Choose username', 'class': 'form-input'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'name@example.com', 'class': 'form-input'}))
    full_name = forms.CharField(max_length=150, widget=forms.TextInput(attrs={'placeholder': 'Full Name as per Aadhaar/PAN', 'class': 'form-input'}))
    dob = forms.DateField(widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-input'}))
    phone = forms.CharField(max_length=20, widget=forms.TextInput(attrs={'placeholder': '+91 98765 43210', 'class': 'form-input'}))
    address = forms.CharField(widget=forms.Textarea(attrs={'rows': 2, 'placeholder': 'Residential Address', 'class': 'form-input'}))
    city = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'placeholder': 'City', 'class': 'form-input'}))
    branch = forms.ModelChoiceField(queryset=Branch.objects.all(), empty_label="Select Branch", widget=forms.Select(attrs={'class': 'form-select'}))
    account_type = forms.ChoiceField(choices=[('savings', 'Savings Account (Min ₹500)'), ('current', 'Current Account (Min ₹0)')], widget=forms.Select(attrs={'class': 'form-select'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Create Strong Password', 'class': 'form-input'}))
    confirm_password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Confirm Password', 'class': 'form-input'}))

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise ValidationError("This username is already taken.")
        return username

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email=email).exists():
            raise ValidationError("An account with this email already exists.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        p1 = cleaned_data.get('password')
        p2 = cleaned_data.get('confirm_password')
        if p1 and p2 and p1 != p2:
            raise ValidationError("Passwords do not match.")
        return cleaned_data


class CustomerProfileForm(forms.ModelForm):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-input'}))

    class Meta:
        model = Customer
        fields = ['full_name', 'dob', 'phone', 'address', 'city']
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-input'}),
            'dob': forms.DateInput(attrs={'type': 'date', 'class': 'form-input'}),
            'phone': forms.TextInput(attrs={'class': 'form-input'}),
            'address': forms.Textarea(attrs={'rows': 2, 'class': 'form-input'}),
            'city': forms.TextInput(attrs={'class': 'form-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.user:
            self.fields['email'].initial = self.instance.user.email

