import os
from pathlib import Path
from decimal import Decimal
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR points to backend/ (where config, apps, and manage.py live)
BASE_DIR = Path(__file__).resolve().parent.parent
# ROOT_DIR points to repository root (where .env, docs, frontend/ live)
ROOT_DIR = BASE_DIR.parent
# FRONTEND_DIR points to frontend/ (where static, templates, and UI assets live)
FRONTEND_DIR = ROOT_DIR / 'frontend'

# Load environment variables from .env file (root first, fallback to backend)
env_file = ROOT_DIR / '.env'
if not env_file.exists():
    env_file = BASE_DIR / '.env'
load_dotenv(env_file)

# Check WhiteNoise availability
try:
    import whitenoise
    HAS_WHITENOISE = True
except ImportError:
    HAS_WHITENOISE = False

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-banking-system-secret-key-change-in-production-123456')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = list(set(
    [h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()] +
    ['localhost', '127.0.0.1', 'testserver', '.railway.app', '.up.railway.app', '.onrender.com', '*']
))

CSRF_TRUSTED_ORIGINS = list(set(
    [o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()] +
    ['https://*.railway.app', 'https://*.up.railway.app', 'https://*.onrender.com', 'http://localhost:8000', 'http://127.0.0.1:8000']
))

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Custom apps
    'accounts.apps.AccountsConfig',
    'banking.apps.BankingConfig',
    'loans.apps.LoansConfig',
    'adminpanel.apps.AdminpanelConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    *(['whitenoise.middleware.WhiteNoiseMiddleware'] if HAS_WHITENOISE else []),
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Custom Banking Security & Inactivity Timeout Middleware
    'accounts.middleware.BankingSecurityHeadersMiddleware',
    'accounts.middleware.SessionInactivityTimeoutMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            FRONTEND_DIR / 'templates',
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'accounts.context_processors.user_role_context',
                'config.context_processors.brand_constants',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database configuration (MySQL 8 with Railway/Render environment fallbacks, SQLite for quick local test)
DB_NAME = os.getenv('DB_NAME') or os.getenv('MYSQLDATABASE', 'banking_system')
DB_USER = os.getenv('DB_USER') or os.getenv('MYSQLUSER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD') or os.getenv('MYSQLPASSWORD', '')
DB_HOST = os.getenv('DB_HOST') or os.getenv('MYSQLHOST', '127.0.0.1')
DB_PORT = os.getenv('DB_PORT') or os.getenv('MYSQLPORT', '3306')

if os.getenv('USE_SQLITE', 'false').lower() in ('true', '1') or os.getenv('DB_ENGINE', '').lower() == 'sqlite':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ROOT_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES', time_zone='+05:30';",
            },
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    FRONTEND_DIR / 'static',
]
STATIC_ROOT = FRONTEND_DIR / 'staticfiles'
if HAS_WHITENOISE:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = ROOT_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Authentication redirects
LOGIN_URL = 'accounts:login'
LOGIN_REDIRECT_URL = 'accounts:dashboard'
LOGOUT_REDIRECT_URL = 'landing'

# Session settings - 15 minutes timeout
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', 900))
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True

# Banking Business Configuration
DAILY_TRANSFER_LIMIT = Decimal(os.getenv('DAILY_TRANSFER_LIMIT', '100000.00'))
MIN_SAVINGS_BALANCE = Decimal('500.00')
MIN_CURRENT_BALANCE = Decimal('0.00')

# Enterprise Banking Security Hardening
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Custom Test Runner (defaults to discovering all project apps)
TEST_RUNNER = 'config.runner.ApexTestRunner'



