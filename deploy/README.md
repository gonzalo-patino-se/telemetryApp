# mysite - Deployment Guide

This guide covers deploying the mysite application to an AWS Virtual Machine.

## ⚠️ Network Requirements

**IMPORTANT: All access to this application requires VPN connection.**

| Requirement | Details |
|-------------|---------|
| VPN | `saturnvpnconfig` - Required for all access |
| Network | Private AWS VPC |
| Ports | 80 (HTTP), 443 (HTTPS) internal only |

### Before You Begin

1. Ensure you have VPN access to `saturnvpnconfig`
2. Obtain SSH key for AWS EC2 instance
3. Have Azure AD service principal credentials for ADX access

## 📁 Project Structure

```
mysite/
├── .env.example            # Environment template
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # Multi-stage Docker build
│
├── backend/                # Django REST API
│   ├── apps/
│   │   └── telemetryapp/   # Main Django app
│   ├── config/
│   │   ├── settings.py     # Django settings (env-aware)
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── staticfiles/        # Collected static files
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/               # React/Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── deploy/                 # Deployment configs
│   ├── config/
│   │   ├── gunicorn.conf.py
│   │   ├── nginx.conf
│   │   ├── nginx-docker.conf
│   │   └── supervisord.conf
│   └── scripts/
│       ├── setup-azure-vm.sh
│       ├── deploy.sh
│       └── backup.sh
│
└── docs/                   # Documentation
```

## 🚀 Quick Start (Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/mysite.git
cd mysite
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit with your values
```

### 3. Build and Run
```bash
docker-compose build
docker-compose up -d
```

### 4. Run Migrations
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the Application
- **Frontend**: http://localhost
- **API**: http://localhost/api/
- **Admin**: http://localhost/admin/
- **Health**: http://localhost/api/health/

---

## ☁️ AWS EC2 Deployment

### Prerequisites
- AWS EC2 Instance (Ubuntu 22.04 LTS recommended)
- Minimum: 2 vCPUs, 4GB RAM
- Security Group: SSH (22) from VPN CIDR only
- **VPN**: Connected to `saturnvpnconfig`

### Network Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Client (VPN)   │────▶│   AWS EC2 (VM)   │────▶│   Azure ADX      │
│ saturnvpnconfig  │     │   Private VPC    │     │   Telemetry DB   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Step 1: Connect to AWS Instance

```bash
# Ensure VPN is connected first!
# Then SSH into the EC2 instance
ssh -i /path/to/your-key.pem ubuntu@<private-ip-address>
```

### Step 2: Initial VM Setup

SSH into your VM and run the setup script:

```bash
# Download setup script
curl -O https://raw.githubusercontent.com/your-org/mysite/main/deploy/scripts/setup-azure-vm.sh

# Make executable and run
chmod +x setup-azure-vm.sh
sudo ./setup-azure-vm.sh
```

This script will:
- ✅ Update system packages
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Setup Fail2Ban for security
- ✅ Create application directory
- ✅ Create systemd service

### Step 2: Deploy Application

```bash
cd /opt/mysite

# Clone your repository
git clone https://github.com/your-org/mysite.git .

# Configure environment
cp .env.example .env
nano .env  # Update with production values
```

### Step 3: Required Environment Variables

Edit `.env` and set these values:

```env
# CRITICAL - Change these!
DJANGO_SECRET_KEY=<generate-secure-random-string>
JWT_SIGNING_KEY=<generate-secure-random-string>
DB_PASSWORD=<secure-database-password>

# Domain Configuration
DJANGO_ALLOWED_HOSTS=your-vm-ip,your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com

# Azure ADX (if using)
ADX_CLUSTER_URL=https://your-cluster.region.kusto.windows.net
ADX_DATABASE=your-database
ADX_CLIENT_ID=your-client-id
ADX_CLIENT_SECRET=your-client-secret
ADX_TENANT_ID=your-tenant-id
```

Generate secure keys:
```bash
# Generate Django secret key
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# Generate JWT key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Start the Application

```bash
# Build and start
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Check status
docker-compose ps
```

### Step 5: Setup SSL (Recommended)

```bash
# Install certificate
sudo certbot --nginx -d your-domain.com

# Enable auto-renewal
sudo systemctl enable certbot.timer
```

---

## 🔧 Management Commands

### Service Control
```bash
# Using Docker Compose
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose restart      # Restart
docker-compose logs -f      # View logs

# Using Systemd
sudo systemctl start mysite
sudo systemctl stop mysite
sudo systemctl restart mysite
sudo systemctl status mysite
```

### Database
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Database shell
docker-compose exec db psql -U mysite_user -d mysite_db
```

### Backups
```bash
# Run backup
./deploy/scripts/backup.sh

# Backups are stored in /opt/mysite/backups/
```

### Deploy Updates
```bash
./deploy/scripts/deploy.sh
```

---

## 📊 Monitoring

### Health Check Endpoint
```bash
curl http://localhost/api/health/
```

Response:
```json
{
  "status": "healthy",
  "environment": "production",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "adx": "configured"
  }
}
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f db
```

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong `DJANGO_SECRET_KEY` and `JWT_SIGNING_KEY`
- [ ] Enable SSL/HTTPS
- [ ] Set `DJANGO_DEBUG=False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Enable firewall (UFW)
- [ ] Setup Fail2Ban
- [ ] Regular backups
- [ ] Keep packages updated

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose logs db
```

### Database connection issues
```bash
# Check if DB is running
docker-compose ps db

# Check DB logs
docker-compose logs db
```

### Static files not loading
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### Permission issues
```bash
sudo chown -R $USER:$USER /opt/mysite
```

---

## 📚 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
