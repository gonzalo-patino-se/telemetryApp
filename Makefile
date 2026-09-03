# =============================================================================
# mysite - Edge Telemetry Dashboard
# =============================================================================
# Single entry point for every command used across development, testing,
# containerisation, deployment and operations.
#
#   make help          list all targets
#   make setup         one-time local setup (backend venv + frontend deps)
#   make dev           reminder of the two dev servers to run
#
# Requirements: GNU Make. On Windows use Git Bash, WSL, or `choco install make`.
# =============================================================================

.DEFAULT_GOAL := help
SHELL := /bin/bash

# --- Paths -------------------------------------------------------------------
BACKEND      := backend
FRONTEND     := frontend
DEPLOY       := deploy
VENV         := $(BACKEND)/venv

# Windows (Git Bash / MSYS) puts executables in Scripts/, POSIX in bin/
ifeq ($(OS),Windows_NT)
  VENV_BIN := $(VENV)/Scripts
  PY_BOOT  := python
else
  VENV_BIN := $(VENV)/bin
  PY_BOOT  := python3
endif

PYTHON       := $(VENV_BIN)/python
PIP          := $(VENV_BIN)/pip
MANAGE       := cd $(BACKEND) && ../$(VENV_BIN)/python manage.py

# --- Runtime -----------------------------------------------------------------
COMPOSE      := docker compose
HEALTH_URL   ?= http://localhost/api/health/
DEV_HEALTH   ?= http://127.0.0.1:8000/api/health/
SERVICE      ?= backend
PROD_HOST    ?= ubuntu@<ec2-private-ip>
PROD_PATH    ?= /opt/mysite
SSH_KEY      ?= ~/.ssh/mysite.pem

.PHONY: help setup env venv install install-backend install-frontend \
        dev dev-backend dev-frontend \
        migrate makemigrations migrate-check superuser shell dbshell collectstatic \
        test test-backend lint lint-fix build build-frontend preview \
        check check-deploy security-check freeze outdated \
        up down restart rebuild ps logs logs-backend logs-nginx logs-db \
        sh sh-db docker-migrate docker-superuser docker-collectstatic docker-clean \
        deploy health health-dev adx-stats backup \
        vm-deploy vm-restart vm-status vm-logs vm-nginx-reload \
        clean clean-pyc clean-frontend

# =============================================================================
# Help
# =============================================================================

help: ## Show this help
	@echo ""
	@echo "  mysite - available targets"
	@echo "  ---------------------------------------------------------------"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Overrides: SERVICE=backend PROD_HOST=user@host SSH_KEY=path"
	@echo ""

# =============================================================================
# Setup
# =============================================================================

setup: env venv install ## One-time local setup (.env + venv + all dependencies)
	@echo "Setup complete. Next: make migrate && make superuser"

env: ## Create .env from .env.example if it does not exist
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env - edit it before running"; \
	else echo ".env already exists, leaving it untouched"; fi

venv: ## Create the backend virtual environment
	@if [ ! -d "$(VENV)" ]; then $(PY_BOOT) -m venv $(VENV); echo "Created $(VENV)"; \
	else echo "$(VENV) already exists"; fi

install: install-backend install-frontend ## Install backend and frontend dependencies

install-backend: venv ## Install Python dependencies
	$(PIP) install --upgrade pip
	$(PIP) install -r $(BACKEND)/requirements.txt

install-frontend: ## Install Node dependencies (clean, lockfile-exact)
	cd $(FRONTEND) && npm ci

# =============================================================================
# Development
# =============================================================================

dev: ## Show how to start both dev servers
	@echo "Run these in two terminals:"
	@echo "  make dev-backend    -> http://127.0.0.1:8000"
	@echo "  make dev-frontend   -> http://localhost:5173"

dev-backend: ## Run the Django development server
	$(MANAGE) runserver

dev-frontend: ## Run the Vite development server
	cd $(FRONTEND) && npm run dev

shell: ## Open the Django shell
	$(MANAGE) shell

dbshell: ## Open a database shell
	$(MANAGE) dbshell

# =============================================================================
# Database
# =============================================================================

makemigrations: ## Generate new migrations from model changes
	$(MANAGE) makemigrations

migrate: ## Apply database migrations
	$(MANAGE) migrate

migrate-check: ## Fail if there are model changes without migrations
	$(MANAGE) makemigrations --check --dry-run

superuser: ## Create a Django admin user
	$(MANAGE) createsuperuser

collectstatic: ## Collect static files into staticfiles/
	$(MANAGE) collectstatic --noinput

# =============================================================================
# Quality
# =============================================================================

test: test-backend ## Run all tests

test-backend: ## Run the Django test suite
	$(MANAGE) test

lint: ## Lint the frontend
	cd $(FRONTEND) && npm run lint

lint-fix: ## Lint the frontend and apply fixes
	cd $(FRONTEND) && npm run lint -- --fix

check: ## Run Django system checks
	$(MANAGE) check

check-deploy: ## Run Django production readiness checks
	$(MANAGE) check --deploy

security-check: check-deploy ## Production checks plus dependency audit
	cd $(FRONTEND) && npm audit --audit-level=high || true
	$(PIP) list --outdated || true

freeze: ## Write the resolved backend dependency set to requirements.freeze.txt
	$(PIP) freeze > $(BACKEND)/requirements.freeze.txt

outdated: ## List outdated dependencies on both sides
	$(PIP) list --outdated
	cd $(FRONTEND) && npm outdated || true

# =============================================================================
# Build
# =============================================================================

build: build-frontend collectstatic ## Produce the production frontend build and static assets

build-frontend: ## Type-check and build the SPA into frontend/dist
	cd $(FRONTEND) && npm run build

preview: ## Serve the production frontend build locally
	cd $(FRONTEND) && npm run preview

# =============================================================================
# Docker
# =============================================================================

up: ## Build and start all containers in the background
	$(COMPOSE) up -d --build

down: ## Stop and remove containers (volumes preserved)
	$(COMPOSE) down

restart: ## Restart a service (SERVICE=backend by default)
	$(COMPOSE) restart $(SERVICE)

rebuild: ## Rebuild images without cache and restart
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

ps: ## Show container status
	$(COMPOSE) ps

logs: ## Follow logs for all services
	$(COMPOSE) logs -f

logs-backend: ## Follow backend logs
	$(COMPOSE) logs -f backend

logs-nginx: ## Follow nginx logs
	$(COMPOSE) logs -f nginx

logs-db: ## Follow database logs
	$(COMPOSE) logs -f db

sh: ## Open a shell inside a container (SERVICE=backend by default)
	$(COMPOSE) exec $(SERVICE) bash

sh-db: ## Open a psql session in the database container
	$(COMPOSE) exec db psql -U $${DB_USER:-mysite_user} -d $${DB_NAME:-mysite_db}

docker-migrate: ## Apply migrations inside the backend container
	$(COMPOSE) exec backend python manage.py migrate --noinput

docker-superuser: ## Create an admin user inside the backend container
	$(COMPOSE) exec backend python manage.py createsuperuser

docker-collectstatic: ## Collect static files inside the backend container
	$(COMPOSE) exec backend python manage.py collectstatic --noinput

docker-clean: ## Remove dangling images and build cache (volumes preserved)
	docker image prune -f
	docker builder prune -f

# =============================================================================
# Deployment and operations
# =============================================================================

deploy: ## Run the scripted deployment (build, up, health check, prune)
	bash $(DEPLOY)/scripts/deploy.sh

backup: ## Run the backup script (database, media, logs)
	bash $(DEPLOY)/scripts/backup.sh

health: ## Check the containerised health endpoint
	@curl -fsS $(HEALTH_URL) && echo "" || (echo "UNHEALTHY: $(HEALTH_URL)"; exit 1)

health-dev: ## Check the local development health endpoint
	@curl -fsS $(DEV_HEALTH) && echo "" || (echo "UNHEALTHY: $(DEV_HEALTH)"; exit 1)

adx-stats: ## Print ADX cache and rate-limiter statistics (requires auth cookie in cookies.txt)
	@curl -fsS -b cookies.txt $(subst /health/,/adx_stats/,$(HEALTH_URL)) && echo ""

# --- Bare VM (Supervisor) targets, run from your workstation ------------------

vm-deploy: ## Pull, install, migrate, build and restart on the production VM
	ssh -i $(SSH_KEY) $(PROD_HOST) 'set -e; cd $(PROD_PATH) && git pull origin main && \
	  source venv/bin/activate && pip install -r backend/requirements.txt && \
	  cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput && \
	  cd ../frontend && npm ci && npm run build && \
	  sudo supervisorctl restart mysite:*'

vm-restart: ## Restart the application processes on the production VM
	ssh -i $(SSH_KEY) $(PROD_HOST) 'sudo supervisorctl restart mysite:*'

vm-status: ## Show Supervisor and Nginx status on the production VM
	ssh -i $(SSH_KEY) $(PROD_HOST) 'sudo supervisorctl status; systemctl is-active nginx'

vm-logs: ## Tail the Gunicorn log on the production VM
	ssh -i $(SSH_KEY) $(PROD_HOST) 'sudo tail -f /var/log/mysite/gunicorn.log'

vm-nginx-reload: ## Validate and reload the Nginx configuration on the production VM
	ssh -i $(SSH_KEY) $(PROD_HOST) 'sudo nginx -t && sudo systemctl reload nginx'

# =============================================================================
# Cleanup
# =============================================================================

clean: clean-pyc clean-frontend ## Remove build artefacts and caches

clean-pyc: ## Remove Python bytecode and pytest caches
	find $(BACKEND) -path '*/venv' -prune -o -name '__pycache__' -type d -print0 2>/dev/null | xargs -0 rm -rf 2>/dev/null || true
	find $(BACKEND) -path '*/venv' -prune -o -name '*.pyc' -print0 2>/dev/null | xargs -0 rm -f 2>/dev/null || true

clean-frontend: ## Remove the frontend build output and Vite cache
	rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules/.vite
