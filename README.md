# mysite - Telemetry Dashboard

A full-stack web application for telemetry data visualization with Azure Data Explorer integration.

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
- **Recharts** - Data visualization

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

- [Deployment Guide](deploy/README.md)
- [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
- [Dashboard Design](docs/DASHBOARD_REDESIGN_COMPLETE.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved.
