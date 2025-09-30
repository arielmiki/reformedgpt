# Frontend Makefile (Vite + React)

.PHONY: help install run build preview lint test clean

NODE := npm

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install   Install frontend dependencies"
	@echo "  run       Start dev server (Vite)"
	@echo "  build     Build production bundle"
	@echo "  preview   Preview production build"
	@echo "  lint      Run eslint"
	@echo "  test      Placeholder (no tests configured)"
	@echo "  clean     Remove node_modules and build artifacts"

# -----------------------------------------------------------------------------
# Install
# -----------------------------------------------------------------------------
install:
	@echo "Installing frontend dependencies..."
	@$(NODE) install

# -----------------------------------------------------------------------------
# Run / Build / Preview
# -----------------------------------------------------------------------------
run:
	@echo "Starting Vite dev server..."
	@$(NODE) run dev

build:
	@echo "Building frontend..."
	@$(NODE) run build

preview:
	@echo "Previewing production build..."
	@$(NODE) run preview

# -----------------------------------------------------------------------------
# Lint / Test
# -----------------------------------------------------------------------------
lint:
	@echo "Running eslint..."
	@$(NODE) run lint || true

test:
	@echo "No tests configured. Add your test runner and update this target."

# -----------------------------------------------------------------------------
# Clean
# -----------------------------------------------------------------------------
clean:
	@echo "Cleaning frontend artifacts..."
	rm -rf node_modules dist .vite
	@echo "Done."

