# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (better caching)
COPY frontend/package*.json ./
RUN npm ci 

# Copy source and build
COPY frontend/ ./
RUN npm run build

# =============================================================================
# Stage 2: Python Backend
# =============================================================================
FROM python:3.11-slim AS backend

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt gunicorn

# Copy backend code
COPY --chown=appuser:appgroup backend/ ./backend/

# Copy deployment configs
COPY --chown=appuser:appgroup deploy/ ./deploy/

# Copy built frontend from Stage 1
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /app/backend/logs /app/backend/media /app/backend/staticfiles && \
    chown -R appuser:appgroup /app

# Collect static files
WORKDIR /app/backend
RUN python manage.py collectstatic --noinput

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run gunicorn
CMD ["gunicorn", "config.wsgi:application", "-c", "/app/deploy/config/gunicorn.conf.py"]
