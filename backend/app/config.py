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
    qdrant_host: str = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", "6333"))
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "documents")
    qdrant_timeout: float = float(os.getenv("QDRANT_TIMEOUT", "60.0"))
    qdrant_batch_size: int = int(os.getenv("QDRANT_BATCH_SIZE", "200"))
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

settings = Settings()
