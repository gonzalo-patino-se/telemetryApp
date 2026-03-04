# mysite - Telemetry Dashboard

A full-stack web application for telemetry data visualization with Azure Data Explorer integration.

## 🎯 Key Features

### Dashboard
- **Real-time Telemetry** - Live monitoring of solar, grid, battery, and load metrics
- **Instantaneous Gauges** - Animated analog and digital gauges with auto-refresh (5-minute intervals)
- **Time-Series Charts** - Historical data visualization with customizable date ranges
- **Print-Optimized Views** - Professional PDF export with optimized styling

### Events & Analytics
- **Event Logs** - Comprehensive alarm/event tracking from Azure Data Explorer
- **Pareto Charts** - Event frequency analysis with cumulative percentage visualization
- **Top Events** - Bar chart showing most frequent events
- **Smart Filtering**:
  - **Severity Filter** - Filter by Critical, Warning, or Info levels
  - **Output Filter** - Filter by event state (Active=1, Inactive=0, or All)
  - **Search** - Full-text search across event names
  - **Time Range** - Global or local date range selection

### Device Monitoring
- **WiFi Signal Strength** - Real-time signal monitoring
- **Inverter Mode Display** - Operating state visualization
- **Battery Module Status** - SoC, voltage, temperature, and current for 3 modules
- **PV Channel Monitoring** - 4-channel solar input tracking

## ⚠️ Important: VPN Requirement

**All users must be connected to the `saturnvpnconfig` VPN to access this application.**

This application is deployed on a private AWS virtual machine and connects to Azure Data Explorer for telemetry data. VPN access is required for:
- Accessing the web dashboard
- API connectivity to Azure Data Explorer
- All backend services

Contact your IT administrator to obtain VPN credentials and configuration files.

## 📁 Project Structure

```
mysite/
├── backend/                    # Django REST API
│   ├── apps/                   # Django applications
│   │   └── telemetryapp/       # Main telemetry app
│   ├── config/                 # Django project configuration
│   │   ├── settings.py         # Settings (env-aware)
│   │   ├── urls.py             # Root URL configuration
│   │   ├── wsgi.py             # WSGI entry point
│   │   └── asgi.py             # ASGI entry point
│   ├── staticfiles/            # Collected static files
│   ├── manage.py               # Django CLI
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── App.tsx             # Root component
│   ├── package.json            # Node dependencies
│   └── vite.config.ts          # Vite configuration
│
├── deploy/                     # Deployment configurations
│   ├── config/                 # Server configs
│   │   ├── nginx.conf          # Nginx (VM)
│   │   ├── nginx-docker.conf   # Nginx (Docker)
│   │   ├── gunicorn.conf.py    # Gunicorn WSGI
│   │   └── supervisord.conf    # Process manager
│   ├── scripts/                # Automation scripts
│   │   ├── setup-azure-vm.sh   # VM initial setup
│   │   ├── deploy.sh           # Deployment script
│   │   └── backup.sh           # Backup script
│   └── README.md               # Deployment guide
│
├── docs/                       # Documentation
│   ├── PROJECT_ARCHITECTURE.md
│   └── DASHBOARD_REDESIGN_COMPLETE.md
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Container orchestration
├── Dockerfile                  # Multi-stage build
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)

### Development Setup

#### Backend (Django)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from template (in root directory)
cp ../.env.example ../.env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### Frontend (React)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Docker Deployment

```bash
# Copy environment template
cp .env.example .env
# Edit .env with production values

# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python manage.py createsuperuser
```

## 🔗 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | React dashboard |
| API | http://localhost/api/ | REST API endpoints |
| Admin | http://localhost/admin/ | Django admin panel |
| Health | http://localhost/api/health/ | Health check endpoint |

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,your-domain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mysite_db
DB_USER=mysite_user
DB_PASSWORD=secure-password

# Azure ADX
ADX_CLUSTER_URL=https://your-cluster.kusto.windows.net
ADX_DATABASE=your-database
ADX_CLIENT_ID=your-client-id
ADX_CLIENT_SECRET=your-client-secret
ADX_TENANT_ID=your-tenant-id
```

## 📦 Tech Stack

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - API toolkit
- **SimpleJWT** - JWT authentication
- **Azure Kusto SDK** - ADX integration
- **PostgreSQL** - Production database
- **Gunicorn** - WSGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Recharts** - Bar charts, Pareto charts, composed charts
- **Chart.js** - Time-series line charts with annotations
- **react-datepicker** - Date/time range selection

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Redis** - Caching (optional)

## 🔧 Common Commands

```bash
# Backend
cd backend
python manage.py makemigrations    # Create migrations
python manage.py migrate           # Apply migrations
python manage.py collectstatic     # Collect static files
python manage.py createsuperuser   # Create admin user
python manage.py shell             # Django shell

# Frontend
cd frontend
npm run dev                        # Development server
npm run build                      # Production build
npm run lint                       # Run linter
npm run preview                    # Preview production build

# Docker
docker-compose up -d               # Start services
docker-compose down                # Stop services
docker-compose logs -f             # View logs
docker-compose exec backend bash   # Shell into backend
```

## 📚 Documentation

- [**VPN Access Guide**](docs/VPN_ACCESS.md) - Required for all users
- [Deployment Guide](deploy/README.md)
- [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
- [Dashboard Design](docs/DASHBOARD_REDESIGN_COMPLETE.md)

## 🌐 AWS Deployment

### Current Production Environment

The application is deployed on an **AWS EC2 Virtual Machine** with the following setup:

| Component | Details |
|-----------|---------|
| Instance Type | AWS EC2 (Ubuntu 22.04 LTS) |
| Web Server | Nginx (reverse proxy) |
| App Server | Gunicorn (WSGI) |
| Process Manager | Supervisor |
| Database | SQLite (dev) / PostgreSQL (prod) |
| SSL | Let's Encrypt / AWS Certificate Manager |

### Network Requirements

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT ACCESS                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Connect to saturnvpnconfig VPN                              │
│  2. Access dashboard via internal IP/hostname                    │
│  3. All API calls route through VPN tunnel                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS EC2 INSTANCE                             │
├─────────────────────────────────────────────────────────────────┤
│  Nginx (Port 80/443) → Gunicorn → Django Backend                │
│                      → Static Files (Frontend Build)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AZURE DATA EXPLORER                            │
├─────────────────────────────────────────────────────────────────┤
│  Telemetry & Alarms Tables                                      │
│  (Requires Azure AD Service Principal)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Steps (AWS EC2)

#### 1. Initial Server Setup

```bash
# SSH into the EC2 instance (requires VPN)
ssh -i your-key.pem ubuntu@<ec2-private-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip nginx supervisor git

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Deploy Application

```bash
# Clone repository
cd /opt
sudo git clone <repository-url> mysite
sudo chown -R ubuntu:ubuntu mysite
cd mysite

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Configure environment
cp ../.env.example ../.env
nano ../.env  # Edit with production values

# Run migrations and collect static
python manage.py migrate
python manage.py collectstatic --noinput

# Frontend build
cd ../frontend
npm install
npm run build

# Copy build to backend static
cp -r dist/* ../backend/staticfiles/
```

#### 3. Configure Services

```bash
# Copy Nginx config
sudo cp deploy/config/nginx.conf /etc/nginx/sites-available/mysite
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Copy Supervisor config
sudo cp deploy/config/supervisord.conf /etc/supervisor/conf.d/mysite.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mysite:*
```

#### 4. Verify Deployment

```bash
# Check services
sudo systemctl status nginx
sudo supervisorctl status

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /opt/mysite/backend/logs/gunicorn.log
```

### Updating Production

```bash
# SSH into server (requires VPN)
ssh -i your-key.pem ubuntu@<ec2-private-ip>

cd /opt/mysite
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Update frontend
cd ../frontend
npm install
npm run build
cp -r dist/* ../backend/staticfiles/

# Restart services
sudo supervisorctl restart mysite:*
```

## 🔐 VPN Access (saturnvpnconfig)

### For End Users

1. **Obtain VPN Configuration**
   - Contact your IT administrator or team lead
   - Request access to `saturnvpnconfig` VPN profile
   - You will receive `.ovpn` configuration file or credentials

2. **Install VPN Client**
   - Windows: OpenVPN Connect or built-in VPN
   - macOS: Tunnelblick or OpenVPN Connect
   - Linux: OpenVPN (`sudo apt install openvpn`)

3. **Connect to VPN**
   ```bash
   # Linux/macOS
   sudo openvpn --config saturnvpnconfig.ovpn
   
   # Windows: Use OpenVPN GUI
   ```

4. **Access Dashboard**
   - Once connected, navigate to the internal dashboard URL
   - Login with your credentials

### For Developers (India Team)

To access the development environment and Azure resources:

1. Request VPN access from project administrator
2. Ensure your Azure AD account has appropriate permissions
3. Configure local `.env` with provided Azure credentials
4. Test connectivity:
   ```bash
   # Verify VPN connection
   ping <ec2-private-ip>
   
   # Verify API access
   curl http://<ec2-private-ip>/api/health/
   ```

### Troubleshooting VPN

| Issue | Solution |
|-------|----------|
| Cannot connect to VPN | Check credentials, firewall rules |
| Dashboard not loading | Verify VPN is connected, check DNS |
| API timeout errors | VPN may have disconnected, reconnect |
| Azure ADX errors | Check service principal permissions |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved.
