#!/bin/sh
# =============================================================================
# Container entrypoint for the Django backend
# Waits for the database, applies migrations, refreshes static files,
# then hands off to the CMD (gunicorn).
# =============================================================================
set -e

cd /app/backend

echo "[entrypoint] Waiting for database at ${DB_HOST:-localhost}:${DB_PORT:-5432}..."
python <<'PY'
import os
import sys
import time

engine = os.getenv("DB_ENGINE", "django.db.backends.sqlite3")
if "postgresql" not in engine:
    sys.exit(0)

import socket

host = os.getenv("DB_HOST", "localhost")
port = int(os.getenv("DB_PORT", "5432"))
deadline = time.time() + 60

while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=3):
            print("[entrypoint] Database is reachable.")
            sys.exit(0)
    except OSError:
        time.sleep(2)

print(f"[entrypoint] ERROR: database {host}:{port} unreachable after 60s", file=sys.stderr)
sys.exit(1)
PY

echo "[entrypoint] Applying migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "[entrypoint] Starting: $*"
exec "$@"
