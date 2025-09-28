from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator
import json

from .. import schemas
from ..storage import db_store
from ..database import get_db
from ..services.llm_service import generate_assistant_reply

router = APIRouter()

@router.get("/sessions", response_model=List[schemas.ChatSession])
async def list_sessions(db: Session = Depends(get_db)):
    return db_store.list_sessions(db)

@router.post("/sessions", response_model=schemas.ChatSession)
async def create_session(payload: schemas.CreateSessionRequest, db: Session = Depends(get_db)):
    return db_store.create_session(db, title=payload.title)

@router.get("/sessions/{session_id}", response_model=schemas.ChatSession)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db_store.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/sessions/{session_id}/messages", response_model=List[schemas.Message])
async def list_messages(session_id: str, db: Session = Depends(get_db)):
    if not db_store.get_session(db, session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return db_store.list_messages(db, session_id)

@router.post("/sessions/{session_id}/messages")
async def create_message(session_id: str, payload: schemas.CreateMessageRequest, db: Session = Depends(get_db)):
    session = db_store.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    db_store.add_message(db, session_id=session_id, role="user", content=payload.content)

    # Get conversation history
    history = db_store.list_messages(db, session_id)

    async def stream_assistant_reply() -> AsyncGenerator[str, None]:
        assistant_text = ""
        # Generate and stream assistant reply
        async for chunk in generate_assistant_reply(history):
            assistant_text += chunk
            response_data = {"content": chunk, "type": "delta"}
            yield f"data: {json.dumps(response_data)}\n\n"
        
        # Send final message with more context
        final_message_orm = db_store.add_message(db, session_id=session_id, role="assistant", content=assistant_text)
        final_message_pydantic = schemas.Message.model_validate(final_message_orm)
        response_data = {"type": "final", "message": final_message_pydantic.model_dump()}
        yield f"data: {json.dumps(response_data, default=str)}\n\n"

    return StreamingResponse(stream_assistant_reply(), media_type="text/event-stream")
