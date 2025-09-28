# Makefile for Chatbot Project

.PHONY: help install run backend-install frontend-install backend-run frontend-run clean

# Default target
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install          Install all dependencies for backend and frontend"
	@echo "  run              Run backend and frontend servers concurrently (requires two terminals)"
	@echo "  backend-install  Install backend dependencies (Python)"
	@echo "  frontend-install Install frontend dependencies (Node.js)"
	@echo "  backend-run      Run backend server on http://localhost:8000"
	@echo "  frontend-run     Run frontend server on http://localhost:5173"
	@echo "  clean            Clean up project (removes venv, node_modules, etc.)"

# ==============================================================================
# INSTALL
# ==============================================================================

install: backend-install frontend-install

backend-install:
	@$(MAKE) -C backend install

frontend-install:
	@$(MAKE) -C frontend install

# ==============================================================================
# RUN
# ==============================================================================

run:
	@echo "Please run 'make backend-run' and 'make frontend-run' in separate terminals."

backend-run:
	@$(MAKE) -C backend run

frontend-run:
	@$(MAKE) -C frontend run

# ==============================================================================
# CLEAN
# ==============================================================================

clean:
	@echo "Cleaning up project (backend + frontend)..."
	@$(MAKE) -C backend clean
	@$(MAKE) -C frontend clean
	@echo "Cleanup complete."
