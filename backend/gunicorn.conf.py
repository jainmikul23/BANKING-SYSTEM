# Gunicorn Production Configuration for Render
import os

bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
workers = int(os.getenv('WEB_CONCURRENCY', '2'))
threads = 4
worker_class = "gthread"
timeout = 120
keepalive = 65
capture_output = True
enable_stdio_inheritance = True
preload_app = False
