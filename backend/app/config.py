from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    cors_origins: List[str] = [
        origin.strip()
        for origin in os.getenv("API_CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    system_prompt_path: str = os.getenv("SYSTEM_PROMPT_PATH", "app/prompts/system_prompt.txt")
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./chat.db")

settings = Settings()
