from fastapi import APIRouter
from fastapi.responses import StreamingResponse, FileResponse
import json

from app import schemas
from app.services import llm_service, rag_service

router = APIRouter()

@router.post("/chat")
async def create_message(req: schemas.CreateMessageRequest):
    response_generator = llm_service.generate_assistant_reply(req.messages)

    async def event_stream():
        async for event in response_generator:
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/static/{filename:path}")
async def get_static(filename: str):
    return FileResponse(rag_service.get_static_file(filename), media_type="text/html")
