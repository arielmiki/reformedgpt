from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.chat import router as chat_router
from .api.static import router as static_router
from .config import settings

app = FastAPI(
    title="Chatbot API",
    description="A simple chatbot API with RAG capabilities.",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # Explicitly list dev frontend origins to ensure ACAO header is set
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(static_router, prefix="/static", tags=["static"])
