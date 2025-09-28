# Backend (FastAPI)

## Run locally

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000 --app-dir .
```

Docs: http://localhost:8000/docs

## Env

- `API_CORS_ORIGINS` (comma-separated origins, default: http://localhost:5173)
- `SYSTEM_PROMPT_PATH` (path to prompt file, default: app/prompts/system_prompt.txt)
