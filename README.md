# Chatbot Project (FastAPI + React + Tailwind)

This repository contains a minimal full‑stack scaffold for a chatbot application.

- Backend: FastAPI (Python), prompts separated from code for easy tuning
- Frontend: React + Vite + Tailwind CSS

## Structure

```
backend/
  app/
    api/
      chat.py
    prompts/
      system_prompt.txt
    services/
      llm_stub.py
    storage/
      memory_store.py
    schemas.py
    config.py
    main.py
  requirements.txt
  .env.example
  README.md

frontend/
  index.html
  package.json
  vite.config.js
  postcss.config.js
  tailwind.config.js
  .env.example
  src/
    main.jsx
    App.jsx
    index.css
    api.js
    components/
      Sidebar.jsx
      ChatWindow.jsx
      Message.jsx
  README.md
```

## Makefile Quickstart (Recommended)

This project includes a `Makefile` to simplify setup and execution.

1.  **Install dependencies:**

    ```sh
    make install
    ```

2.  **Run the servers:**

    Open two separate terminals:

    -   Terminal 1 (Backend): `make backend-run`
    -   Terminal 2 (Frontend): `make frontend-run`

    The frontend will be available at `http://localhost:5173`.

## Manual Quickstart

### 1) Backend

- Python 3.10+
- Create a virtual environment and install deps:

```
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r backend/requirements.txt
```

- Copy env file and run the API:

```
cp backend/.env.example backend/.env
uvicorn app.main:app --reload --port 8000 --app-dir backend
```

API docs at http://localhost:8000/docs

### 2) Frontend

- Node 18+
- Install deps and run dev server:

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Connecting to a real LLM later

- Replace the stub in `backend/app/services/llm_stub.py` with your provider integration (OpenAI, Anthropic, etc.).
- Keep/edit prompt text in `backend/app/prompts/system_prompt.txt`.
- The backend API surface is already wired for chat sessions and message streaming extension later.
