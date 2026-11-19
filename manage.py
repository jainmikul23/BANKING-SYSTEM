#!/usr/bin/env python
"""Root Django launcher proxy: delegates directly to backend/."""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so config and apps resolve automatically
BASE_DIR = Path(__file__).resolve().parent
backend_path = BASE_DIR / 'backend'
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Set working directory to backend for seamless test discovery and execution
os.chdir(backend_path)

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()

