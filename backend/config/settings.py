import os
import importlib.util
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

# Check WhiteNoise availability cleanly without triggering editor linter missing-import errors
HAS_WHITENOISE = importlib.util.find_spec('whitenoise') is not None

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-banking-system-secret-key-change-in-production-123456')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = list(set(
    [h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()] +
    [
        'localhost',
        '127.0.0.1',
        'testserver',
        '.railway.app',
        '.up.railway.app',
        '.onrender.com',
        'banking-system-1-0ae4.onrender.com',
        '.vercel.app',
        'atheria-reserve.vercel.app',
        '*'
    ]
))

CSRF_TRUSTED_ORIGINS = list(set(
    [o.strip() for o in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()] +
    [
        'https://*.vercel.app',
        'http://*.vercel.app',
        'https://atheria-reserve.vercel.app',
        'http://atheria-reserve.vercel.app',
        'https://www.atheria-reserve.vercel.app',
        'http://www.atheria-reserve.vercel.app',
        'https://*.railway.app',
        'http://*.railway.app',
        'https://*.up.railway.app',
        'http://*.up.railway.app',
        'https://*.onrender.com',
        'http://*.onrender.com',
        'https://banking-system-1-0ae4.onrender.com',
        'http://banking-system-1-0ae4.onrender.com',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://localhost:5173',
    ]
))

# Institutional Branded CSRF Failure Recovery Handler
CSRF_FAILURE_VIEW = 'config.csrf_views.csrf_failure'

# Reverse Proxy SSL & Host Forwarding (Essential for Render & Vercel Proxies)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

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

TEMPLATES_DIRS = []
if (BASE_DIR / 'templates').exists():
    TEMPLATES_DIRS.append(BASE_DIR / 'templates')
if (FRONTEND_DIR / 'templates').exists():
    TEMPLATES_DIRS.append(FRONTEND_DIR / 'templates')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': TEMPLATES_DIRS,
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
db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')
if db_url and (db_url.startswith('mysql://') or db_url.startswith('mysqlclient://')):
    from urllib.parse import urlparse, unquote
    parsed = urlparse(db_url)
    DB_NAME = parsed.path.lstrip('/') or 'railway'
    DB_USER = unquote(parsed.username) if parsed.username else 'root'
    DB_PASSWORD = unquote(parsed.password) if parsed.password else ''
    DB_HOST = parsed.hostname or '127.0.0.1'
    DB_PORT = str(parsed.port or 3306)
else:
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
    # High-Performance Remote MySQL Connection with Persistent Connection Pooling
    # CONN_MAX_AGE keeps TCP & TLS connections warm between Render and Railway proxy,
    # eliminating the 150-400ms TCP/TLS handshake latency on every request.
    CONN_MAX_AGE = int(os.getenv('CONN_MAX_AGE', '60'))
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'CONN_MAX_AGE': CONN_MAX_AGE,
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {
                'charset': 'utf8mb4',
                'connect_timeout': 10,
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES', time_zone='+05:30';",
            },
        }
    }

# In-Memory High-Speed Application Cache (Zero Network Overhead)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'atheria-cache-cluster',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 2000,
        }
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
STATIC_DIRS = []
if (BASE_DIR / 'static').exists():
    STATIC_DIRS.append(BASE_DIR / 'static')
if (FRONTEND_DIR / 'static').exists():
    STATIC_DIRS.append(FRONTEND_DIR / 'static')

STATICFILES_DIRS = STATIC_DIRS
STATIC_ROOT = (BASE_DIR / 'staticfiles') if (BASE_DIR / 'static').exists() else (FRONTEND_DIR / 'staticfiles')
if HAS_WHITENOISE:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = ROOT_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Authentication redirects
LOGIN_URL = 'accounts:login'
LOGIN_REDIRECT_URL = 'accounts:dashboard'
LOGOUT_REDIRECT_URL = 'landing'

# Session settings - 15 minutes timeout with Cached DB for 0ms In-Memory Session Reads
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', 900))
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True

# Static files performance caching (1 year immutable for WhiteNoise compressed assets)
WHITENOISE_MAX_AGE = 31536000 if not DEBUG else 0

# Banking Business Configuration
DAILY_TRANSFER_LIMIT = Decimal(os.getenv('DAILY_TRANSFER_LIMIT', '100000.00'))
MIN_SAVINGS_BALANCE = Decimal('500.00')
MIN_CURRENT_BALANCE = Decimal('0.00')

# Enterprise Banking Security Hardening
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_HTTPONLY = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Modern browsers (Safari WebKit, Chrome, Firefox) work seamlessly with SameSite=Lax
# across Vercel reverse proxy rewrites and direct Render access without third-party cookie blocks.
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# In remote environments (Render/Railway/Vercel) or when not in local sqlite dev, enforce Secure cookies
is_remote_env = (
    os.getenv('RENDER') == 'true' or
    os.getenv('RAILWAY_ENVIRONMENT') is not None or
    not os.getenv('USE_SQLITE', 'false').lower() in ('true', '1')
)
if is_remote_env and not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    # Set to true when forwarded over HTTPS by reverse proxy
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Custom Test Runner (defaults to discovering all project apps)
TEST_RUNNER = 'config.runner.ApexTestRunner'



