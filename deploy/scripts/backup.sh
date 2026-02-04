#!/bin/bash
# =============================================================================
# Backup Script for mysite
# =============================================================================
# Creates backups of database and media files
# Usage: chmod +x backup.sh && ./backup.sh
# =============================================================================

set -e

APP_DIR="${APP_DIR:-/opt/mysite}"
BACKUP_DIR="${BACKUP_DIR:-/opt/mysite/backups}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=============================================="
echo "  mysite - Backup Script"
echo "=============================================="

# Create backup directory
mkdir -p $BACKUP_DIR

# =============================================================================
# Database Backup
# =============================================================================
echo ""
echo ">>> Backing up database..."

# Load environment variables
source $APP_DIR/.env

DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

docker-compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > $DB_BACKUP_FILE

echo "Database backed up to: $DB_BACKUP_FILE"

# =============================================================================
# Media Files Backup
# =============================================================================
echo ""
echo ">>> Backing up media files..."

MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_$DATE.tar.gz"

tar -czf $MEDIA_BACKUP_FILE -C $APP_DIR media/ 2>/dev/null || echo "No media files to backup"

echo "Media backed up to: $MEDIA_BACKUP_FILE"

# =============================================================================
# Cleanup Old Backups (keep last 7 days)
# =============================================================================
echo ""
echo ">>> Cleaning up old backups..."

find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "Old backups cleaned up"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo "  Backup Complete!"
echo "=============================================="
echo ""
echo "Backup files:"
ls -lh $BACKUP_DIR/*_$DATE* 2>/dev/null || echo "No backups found"
echo ""
