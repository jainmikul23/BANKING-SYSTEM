#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=========================================================="
echo "Starting Atheria Reserve Production Build on Render..."
echo "=========================================================="

# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Collect static assets for WhiteNoise CDN
python manage.py collectstatic --noinput

echo "Build complete. Ready for Gunicorn launch."
