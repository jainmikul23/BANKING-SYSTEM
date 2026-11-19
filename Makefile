# Atheria Reserve Bank - Master Build & Run Orchestrator

PYTHON = ./venv/bin/python

.PHONY: help start build test test-backend test-frontend migrate seed clean

help:
	@echo "Atheria Reserve Bank - Command Reference:"
	@echo "  make start          Start the full-stack server (http://127.0.0.1:8000)"
	@echo "  make build          Build and collect static assets"
	@echo "  make test           Run both backend (Django) and frontend (Puppeteer) test suites"
	@echo "  make test-backend   Run Django backend unit tests (ACID, row-locks, auth)"
	@echo "  make test-frontend  Run Puppeteer frontend UI, theme, and lens tests"
	@echo "  make migrate        Apply database migrations"
	@echo "  make seed           Seed initial test data"

start:
	$(PYTHON) manage.py runserver 127.0.0.1:8000

build:
	$(PYTHON) manage.py collectstatic --noinput

test: test-backend test-frontend

test-backend:
	$(PYTHON) manage.py test --verbosity=1

test-frontend:
	node frontend/scripts/verify_theme_and_buttons.js

migrate:
	$(PYTHON) manage.py migrate

seed:
	$(PYTHON) manage.py seed_data
