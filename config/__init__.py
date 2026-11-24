import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
backend_path = BASE_DIR / 'backend'
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
