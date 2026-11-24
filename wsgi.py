"""Root WSGI entrypoint for Render and production WSGI servers."""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
backend_path = BASE_DIR / 'backend'
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
