#!/bin/bash
# =============================================================================
# Azure VM Setup Script for mysite
# =============================================================================
# Run this script on a fresh Ubuntu 22.04 LTS Azure VM
# Usage: chmod +x setup-azure-vm.sh && sudo ./setup-azure-vm.sh
# =============================================================================

set -e

echo "=============================================="
echo "  mysite - Azure VM Setup Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# =============================================================================
# System Update
# =============================================================================
echo ""
echo ">>> Updating system packages..."
apt-get update && apt-get upgrade -y
print_status "System updated"

# =============================================================================
# Install Docker
# =============================================================================
echo ""
echo ">>> Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_status "Docker installed"
else
    print_warning "Docker already installed"
fi

# Add current user to docker group
usermod -aG docker $SUDO_USER 2>/dev/null || true

# =============================================================================
# Install Docker Compose
# =============================================================================
echo ""
echo ">>> Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed"
else
    print_warning "Docker Compose already installed"
fi

# =============================================================================
# Install Additional Tools
# =============================================================================
echo ""
echo ">>> Installing additional tools..."
apt-get install -y \
    git \
    curl \
    htop \
    nano \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban
print_status "Additional tools installed"

# =============================================================================
# Configure Firewall
# =============================================================================
echo ""
echo ">>> Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
print_status "Firewall configured"

# =============================================================================
# Configure Fail2Ban
# =============================================================================
echo ""
echo ">>> Configuring Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban
print_status "Fail2Ban configured"

# =============================================================================
# Create Application Directory
# =============================================================================
echo ""
echo ">>> Creating application directory..."
APP_DIR="/opt/mysite"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/media
chown -R $SUDO_USER:$SUDO_USER $APP_DIR
print_status "Application directory created at $APP_DIR"

# =============================================================================
# Create Environment File Template
# =============================================================================
echo ""
echo ">>> Creating environment file template..."
cat > $APP_DIR/.env.template << 'EOF'
# =============================================================================
# mysite Production Environment Configuration
# =============================================================================
# IMPORTANT: Copy this file to .env and update all values before deploying!
# =============================================================================

# Django Core
DJANGO_SECRET_KEY=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING
DJANGO_DEBUG=False
DJANGO_ENVIRONMENT=production
DJANGO_ALLOWED_HOSTS=YOUR_VM_IP,YOUR_DOMAIN.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mysite_db
DB_USER=mysite_user
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_HOST=db
DB_PORT=5432

# Security
DJANGO_SECURE_SSL_REDIRECT=True
DJANGO_SESSION_COOKIE_SECURE=True
DJANGO_CSRF_COOKIE_SECURE=True
CSRF_TRUSTED_ORIGINS=https://YOUR_DOMAIN.com

# JWT
JWT_SIGNING_KEY=CHANGE_THIS_TO_A_SECURE_KEY

# CORS
CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN.com

# Azure ADX
ADX_CLUSTER_URL=https://your-cluster.region.kusto.windows.net
ADX_DATABASE=your-database
ADX_CLIENT_ID=your-client-id
ADX_CLIENT_SECRET=your-client-secret
ADX_TENANT_ID=your-tenant-id
EOF
print_status "Environment template created"

# =============================================================================
# Create Systemd Service
# =============================================================================
echo ""
echo ">>> Creating systemd service..."
cat > /etc/systemd/system/mysite.service << 'EOF'
[Unit]
Description=mysite Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/mysite
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mysite
print_status "Systemd service created"

# =============================================================================
# Print Next Steps
# =============================================================================
echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Clone your repository to /opt/mysite"
echo "     cd /opt/mysite"
echo "     git clone https://your-repo-url.git ."
echo ""
echo "  2. Copy and configure environment file:"
echo "     cp .env.template .env"
echo "     nano .env"
echo ""
echo "  3. Build and start the application:"
echo "     docker-compose build"
echo "     docker-compose up -d"
echo ""
echo "  4. (Optional) Setup SSL with Let's Encrypt:"
echo "     certbot --nginx -d your-domain.com"
echo ""
echo "  5. Check status:"
echo "     docker-compose ps"
echo "     docker-compose logs -f"
echo ""
echo "  6. Manage the service:"
echo "     sudo systemctl start mysite"
echo "     sudo systemctl stop mysite"
echo "     sudo systemctl restart mysite"
echo ""
print_status "Don't forget to log out and back in for Docker permissions!"
