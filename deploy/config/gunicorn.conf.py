"""
Gunicorn configuration file for mysite Django application.
https://docs.gunicorn.org/en/stable/settings.html
"""

import multiprocessing
import os

# ============================================================
# Server Socket
# ============================================================
bind = os.getenv('GUNICORN_BIND', '0.0.0.0:8000')
backlog = 2048

# ============================================================
# Worker Processes
# ============================================================
# Formula: (2 x num_cores) + 1
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'gthread'
threads = int(os.getenv('GUNICORN_THREADS', 2))
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# ============================================================
# Timeouts
# ============================================================
timeout = 60
graceful_timeout = 30
keepalive = 5

# ============================================================
# Logging
# ============================================================
accesslog = os.getenv('GUNICORN_ACCESS_LOG', '-')
errorlog = os.getenv('GUNICORN_ERROR_LOG', '-')
loglevel = os.getenv('GUNICORN_LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ============================================================
# Security
# ============================================================
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# ============================================================
# Process Naming
# ============================================================
proc_name = 'mysite'

# ============================================================
# Server Mechanics
# ============================================================
daemon = False
pidfile = os.getenv('GUNICORN_PID_FILE', None)
umask = 0
user = None
group = None
tmp_upload_dir = None

# ============================================================
# Hooks
# ============================================================
def on_starting(server):
    """Called just before the master process is initialized."""
    print("Starting Gunicorn server for mysite...")

def on_exit(server):
    """Called just before exiting Gunicorn."""
    print("Shutting down Gunicorn server...")

def worker_int(worker):
    """Called when a worker receives SIGINT or SIGQUIT."""
    print(f"Worker {worker.pid} received interrupt signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    print(f"Worker spawned (pid: {worker.pid})")
