# Makefile for Frontend (Vite/React)

.PHONY: help install run build clean

# Default target
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets (frontend):"
	@echo "  install   Install npm deps and setup .env"
	@echo "  run       Start Vite dev server on http://localhost:5173"
	@echo "  build     Build production assets"
	@echo "  clean     Remove node_modules and dist"

install:
	@echo "[FE] Setting up frontend..."
	@npm install
	@if [ ! -f ".env" ] && [ -f ".env.example" ]; then cp .env.example .env; echo "[FE] Created .env file."; fi
	@echo "[FE] Frontend setup complete."

run:
	@echo "[FE] Starting frontend server on http://localhost:5173"
	@npm run dev

build:
	@echo "[FE] Building frontend..."
	@npm run build

clean:
	@echo "[FE] Cleaning frontend..."
	@rm -rf node_modules dist
	@echo "[FE] Clean complete."
