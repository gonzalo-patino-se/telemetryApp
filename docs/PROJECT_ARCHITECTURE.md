# MysSite Project - Complete Architecture Documentation

## Project Overview

**MysSite** is a full-stack web application for telemetry data management and device monitoring with Azure Data Explorer (ADX) integration. The project consists of a Django REST API backend and a React + TypeScript frontend.

---

## Technology Stack

### Backend (Django)
- **Framework**: Django 5.2.7
- **API Framework**: Django REST Framework 3.16.1
- **Authentication**: JWT (djangorestframework-simplejwt 5.5.1)
- **Database**: SQLite (development)
- **Admin Interface**: Django Jazzmin 3.0.1
- **Cloud Integration**: Azure Kusto (ADX) for telemetry data querying
- **CORS**: django-cors-headers 4.9.0

### Frontend (React + TypeScript)
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: TypeScript 5.9.3
- **Routing**: React Router DOM 7.9.6
- **UI Framework**: Tailwind CSS 4.1.17
- **HTTP Client**: Axios
- **Charts**: Chart.js, Recharts, React-Chartjs-2
- **Date Handling**: date-fns, react-datepicker

### Data & Analytics
- **Azure Data Explorer (Kusto)**: Query engine for device telemetry
- **Data Processing**: pandas, numpy, pyarrow
- **ML Libraries**: scikit-learn, transformers, datasets

---

## Project Structure

```
mysite/
├── mysite/                      # Django project configuration
│   ├── __init__.py
│   ├── settings.py              # Main settings (auth, CORS, JWT, apps)
│   ├── urls.py                  # Root URL routing
│   ├── wsgi.py                  # WSGI entry point
│   └── asgi.py                  # ASGI entry point
│
├── telemetryapp/                # Main Django app
│   ├── models.py                # Telemetry data model
│   ├── views.py                 # API endpoints (register, login, logout, ADX queries)
│   ├── serializers.py           # DRF serializers (Telemetry, User registration)
│   ├── permissions.py           # Custom permissions (IsAdminGroup)
│   ├── urls.py                  # App-level URL routing
│   ├── adx_service.py           # Azure Data Explorer integration
│   ├── admin.py                 # Django admin configuration
│   └── migrations/              # Database migrations
│
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Main app component with routing
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Dashboard.jsx    # Main dashboard with widgets
│   │   │   ├── LoginForm.jsx    # User login
│   │   │   ├── RegisterForm.jsx # User registration
│   │   │   ├── LogoutButton.jsx # Logout functionality
│   │   │   ├── ProtectedRoute.tsx # Route protection
│   │   │   ├── SearchBar.jsx    # Device search
│   │   │   ├── DeviceCard.jsx   # Device info display
│   │   │   ├── DeviceInfoWidget.jsx
│   │   │   ├── DevicePV1Widget.jsx
│   │   │   ├── DevicePV1Chart.jsx
│   │   │   ├── AdxSearchWifiSignalWidget.tsx
│   │   │   ├── AdxSearchPV1Widget.tsx
│   │   │   └── layout/          # Layout components
│   │   │       ├── DashboardLayout.jsx
│   │   │       ├── ProtectedAppShell.jsx
│   │   │       └── WidgetCard.jsx
│   │   ├── pages/               # Page-level components
│   │   │   ├── History.jsx      # Historical data view
│   │   │   ├── Events.jsx       # Events log
│   │   │   ├── Firmware.jsx     # Firmware management
│   │   │   ├── Settings.jsx     # App settings
│   │   │   └── About.tsx        # About page
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Authentication state management
│   │   ├── services/
│   │   │   └── api.ts           # Axios API client configuration
│   │   └── utils/               # Utility functions
│   ├── public/                  # Static assets
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Frontend dependencies
│
├── staticfiles/                 # Collected static files (Django)
├── db.sqlite3                   # SQLite database
├── manage.py                    # Django management script
├── requirements.txt             # Python dependencies
├── package.json                 # Root package.json
└── .env                         # Environment variables
```

---

## Core Features

### 1. **Authentication & Authorization**
- **JWT-based authentication** with access/refresh token rotation
- Token blacklisting on logout
- User registration and login endpoints
- Custom permission classes (IsAdminGroup)
- Auto token expiry handling in frontend

### 2. **Telemetry Data Management**
- **Telemetry Model** stores:
  - Inverter Grid Measurements (L1/L2 voltage & current)
  - Relay status (BGCS_RELAY_STATUS)
  - Container status (ETP_CONTAINER_STATUS)
  - Wi-Fi signal strength and frequency band
  - Timestamps

### 3. **Azure Data Explorer (ADX) Integration**
- Real-time KQL query execution
- Device serial number search
- Custom KQL query endpoint
- ADX telemetry retrieval
- Authentication via Azure Service Principal

### 4. **Dashboard & Widgets**
- Device search by serial number
- Wi-Fi signal monitoring widget (ADX-powered)
- PV1 data widget with auto-fetch capability
- Device information display
- Interactive charts (Chart.js, Recharts)
- Responsive grid layout

### 5. **Frontend Architecture**
- **Context API** for global auth state
- **Protected routes** with ProtectedRoute wrapper
- **Lazy loading** of page components
- **Axios interceptors** for auto-logout on 401
- **Auto token expiry** timer

---

## API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - Custom login (returns JWT tokens)
- `POST /api/logout/` - Logout (blacklist refresh token)
- `POST /api/token/` - Get JWT token pair
- `POST /api/token/refresh/` - Refresh access token

### Telemetry
- `GET /api/telemetry/` - List all telemetry records
- `POST /api/telemetry/` - Create telemetry record
- `GET /api/telemetry/{id}/` - Get specific telemetry record
- `PUT /api/telemetry/{id}/` - Update telemetry record
- `DELETE /api/telemetry/{id}/` - Delete telemetry record

### Azure Data Explorer
- `GET /api/adx/` - Execute predefined ADX query (Admin only)
- `POST /api/search_serial/` - Search device by serial number
- `POST /api/query_adx/` - Execute custom KQL query

---

## Frontend Routes

```tsx
/login              → LoginForm (public)
/register           → RegisterForm (public)
/dashboard          → Dashboard (protected)
/history            → History (protected)
/events             → Events (protected)
/firmware           → Firmware (protected)
/settings           → Settings (protected)
/about              → About (protected)
```

---

## Environment Variables

### Django (.env)
```bash
# Django Core
DJANGO_SECRET_KEY=<secret-key>
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# CORS & CSRF
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# JWT
JWT_SIGNING_KEY=<jwt-secret>

# Azure Data Explorer (ADX)
ADX_CLUSTER_URI=https://<cluster>.kusto.windows.net
ADX_DATABASE=<database-name>
ADX_CLIENT_ID=<service-principal-client-id>
ADX_CLIENT_SECRET=<service-principal-secret>
ADX_TENANT_ID=<tenant-id>
```

### Frontend (src/services/api.ts)
```typescript
baseURL: 'http://127.0.0.1:8000/api'
```

---

## Database Schema

### Telemetry Model
```python
class Telemetry(models.Model):
    inverter_grid_L1_V_RMS: float      # L1 Voltage RMS (V)
    inverter_grid_L2_V_RMS: float      # L2 Voltage RMS (V)
    inverter_grid_L1_I_RMS: float      # L1 Current RMS (A)
    BGCS_RELAY_STATUS: str             # Relay status
    ETP_CONTAINER_STATUS: str          # Container status
    WIFI_SIGNAL_STRENGTH: int          # Signal strength (dBm)
    WIFI_FREQ_BAND: str                # Wi-Fi band (2.4GHz/5GHz)
    created_at: datetime               # Auto timestamp
```

---

## Authentication Flow

### Login Flow
1. User submits credentials to `/api/login/`
2. Backend validates with Django's `authenticate()`
3. If valid, generate JWT tokens using SimpleJWT
4. Return `access` and `refresh` tokens
5. Frontend stores tokens in AuthContext
6. Set Authorization header: `Bearer <access_token>`
7. Start token expiry timer

### Logout Flow
1. User clicks logout
2. Frontend sends `POST /api/logout/` with refresh token
3. Backend blacklists the refresh token
4. Frontend clears tokens and redirects to login

### Token Refresh (Auto-handled by SimpleJWT)
- Access token lifetime: 10 minutes
- Refresh token lifetime: 1 day
- Tokens rotate on refresh
- Old refresh token blacklisted after rotation

---

## ADX Query Integration

### Service Implementation (`adx_service.py`)
```python
def query_adx(kql_query):
    # Executes KQL against Azure Data Explorer
    # Returns list of row dictionaries
```

### Example KQL Queries
```kql
# Device info by serial
DevInfo | where comms_serial contains '12345' | limit 1

# All device info (limited)
DevInfo | limit 2
```

---

## Key Dependencies

### Python (Backend)
- `Django==5.2.7` - Web framework
- `djangorestframework==3.16.1` - REST API
- `djangorestframework-simplejwt==5.5.1` - JWT auth
- `django-cors-headers==4.9.0` - CORS handling
- `django-jazzmin==3.0.1` - Modern admin UI
- `django-colorfield==0.14.0` - Color picker field
- `azure-kusto-data==5.0.3` - ADX client
- `azure-identity==1.23.0` - Azure authentication
- `python-dotenv==1.1.0` - Environment variables
- `pandas==2.3.0` - Data manipulation
- `numpy==2.2.5` - Numerical operations

### JavaScript (Frontend)
- `react==19.1.1` - UI framework
- `react-router-dom==7.9.6` - Routing
- `axios` - HTTP client
- `jwt-decode==4.0.0` - JWT token decoding
- `chart.js==4.5.1` - Charts
- `react-chartjs-2==5.3.1` - React Chart.js wrapper
- `recharts==3.3.0` - Alternative charting
- `react-datepicker==8.9.0` - Date picker component
- `tailwindcss==4.1.17` - CSS framework
- `vite==7.1.7` - Build tool

---

## Security Features

1. **JWT Token Security**
   - Tokens stored in memory (not localStorage)
   - Auto-expiry with timer
   - Token blacklisting on logout
   - Rotation on refresh

2. **CORS Protection**
   - Whitelist only trusted origins
   - Credentials allowed for cookie support

3. **CSRF Protection**
   - Django CSRF middleware enabled
   - Trusted origins configured

4. **Permission System**
   - Custom `IsAdminGroup` permission
   - Protected endpoints require authentication
   - Group-based authorization

5. **Environment Variables**
   - Secrets stored in `.env`
   - Not committed to version control

---

## Development Workflow

### Backend Setup
```bash
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Run development server
python manage.py runserver
```

### Frontend Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

### Access Points
- **Backend**: http://127.0.0.1:8000
- **Admin Panel**: http://127.0.0.1:8000/admin
- **Frontend**: http://localhost:5173

---

## Deployment Considerations

### Production Checklist
- [ ] Set `DJANGO_DEBUG=False`
- [ ] Use PostgreSQL/MySQL instead of SQLite
- [ ] Enable `SECURE_SSL_REDIRECT=True`
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use environment-specific `.env` files
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Use production WSGI server (Gunicorn, uWSGI)
- [ ] Configure reverse proxy (Nginx, Apache)
- [ ] Build frontend: `npm run build`
- [ ] Serve built frontend via CDN or static hosting

---

## Testing

### Backend Tests
```bash
python manage.py test telemetryapp
```

### Frontend Tests
```bash
cd frontend
npm run lint
```

---

## Known Issues & Future Enhancements

### Current Limitations
- SQLite database (not suitable for production)
- No background task queue (consider Celery)
- No caching layer (consider Redis)
- Limited error handling in ADX queries

### Planned Features
- Real-time WebSocket updates for telemetry
- Advanced filtering and search
- Export data to CSV/Excel
- User profile management
- Multi-language support (i18n)
- Email notifications
- Advanced analytics dashboard

---

## Support & Maintenance

### Common Commands
```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Update requirements
pip freeze > requirements.txt
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App.tsx (Router)                                    │  │
│  │    ├─ LoginForm                                      │  │
│  │    ├─ RegisterForm                                   │  │
│  │    └─ ProtectedRoute (AuthContext)                   │  │
│  │         ├─ Dashboard (Widgets)                       │  │
│  │         ├─ History                                    │  │
│  │         ├─ Events                                     │  │
│  │         ├─ Firmware                                   │  │
│  │         ├─ Settings                                   │  │
│  │         └─ About                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕ HTTP (Axios)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Django)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  mysite.urls                                         │  │
│  │    ├─ /api/register/  → register_view               │  │
│  │    ├─ /api/login/     → login_view                  │  │
│  │    ├─ /api/logout/    → logout_view                 │  │
│  │    ├─ /api/token/     → TokenObtainPairView         │  │
│  │    └─ /api/           → telemetryapp.urls           │  │
│  │         ├─ telemetry/ → TelemetryViewSet            │  │
│  │         ├─ adx/       → adx_telemetry               │  │
│  │         ├─ search_serial/ → search_serial           │  │
│  │         └─ query_adx/ → query_adx_view              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────┐    ┌───────────────────────────┐    │
│  │   SQLite DB      │    │  Azure Data Explorer      │    │
│  │  (Telemetry)     │    │  (KQL Queries)            │    │
│  └──────────────────┘    └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Conclusion

The MysSite project is a robust, modern full-stack application designed for telemetry data management with cloud integration. It follows best practices for authentication, API design, and frontend architecture, making it scalable and maintainable for future enhancements.
