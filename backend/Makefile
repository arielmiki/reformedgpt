# Makefile for Backend (Python/FastAPI)

.PHONY: help install run clean

# Default target
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets (backend):"
	@echo "  install   Create venv, install Python deps, setup .env"
	@echo "  run       Run FastAPI with Uvicorn on http://localhost:8000"
	@echo "  clean     Remove venv and caches"

install:
	@echo "[BE] Setting up backend..."
	@if [ ! -d "env" ]; then python3 -m venv env; echo "[BE] Created Python virtual environment."; fi
	@env/bin/pip install -r requirements.txt
	@if [ ! -f ".env" ] && [ -f ".env.example" ]; then cp .env.example .env; echo "[BE] Created .env file."; fi
	@echo "[BE] Backend setup complete."

run:
	@echo "[BE] Starting backend server on http://localhost:8000"
	@./env/bin/uvicorn app.main:app --reload --port 8000

clean:
	@echo "[BE] Cleaning backend..."
	@rm -rf env
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@rm -rf .pytest_cache
	@echo "[BE] Clean complete."
