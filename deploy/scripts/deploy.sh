#!/bin/bash
# =============================================================================
# Deployment Script for mysite
# =============================================================================
# Run this script to deploy updates to the application
# Usage: chmod +x deploy.sh && ./deploy.sh
# =============================================================================

set -e

echo "=============================================="
echo "  mysite - Deployment Script"
echo "=============================================="

APP_DIR="${APP_DIR:-/opt/mysite}"
cd $APP_DIR

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================
echo ""
echo ">>> Running pre-deployment checks..."

if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env from .env.template first."
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found!"
    exit 1
fi

print_status "Pre-deployment checks passed"

# =============================================================================
# Pull Latest Code (if using git)
# =============================================================================
if [ -d ".git" ]; then
    echo ""
    echo ">>> Pulling latest code..."
    git pull origin main || git pull origin master || print_warning "Git pull skipped"
    print_status "Code updated"
fi

# =============================================================================
# Build Containers
# =============================================================================
echo ""
echo ">>> Building containers..."
docker-compose build --no-cache
print_status "Containers built"

# =============================================================================
# Run Database Migrations
# =============================================================================
echo ""
echo ">>> Running database migrations..."
docker-compose exec backend python manage.py migrate --noinput
print_status "Migrations complete"

# =============================================================================
# Collect Static Files
# =============================================================================
echo ""
echo ">>> Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose run --rm backend python manage.py collectstatic --noinput
print_status "Static files collected"

# =============================================================================
# Restart Services
# =============================================================================
echo ""
echo ">>> Restarting services..."
docker-compose down
docker-compose up -d
print_status "Services restarted"

# =============================================================================
# Health Check
# =============================================================================
echo ""
echo ">>> Running health check..."
sleep 10  # Wait for services to start

HEALTH_URL="http://localhost/api/health/"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    print_status "Health check passed (HTTP $HTTP_STATUS)"
else
    print_warning "Health check returned HTTP $HTTP_STATUS"
    echo "Check logs with: docker-compose logs -f"
fi

# =============================================================================
# Cleanup
# =============================================================================
echo ""
echo ">>> Cleaning up unused Docker resources..."
docker system prune -f --volumes 2>/dev/null || true
print_status "Cleanup complete"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Check status:  docker-compose ps"
echo "  Restart:       docker-compose restart"
echo "  Stop:          docker-compose down"
echo ""
