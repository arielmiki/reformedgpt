from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from .. import database as db_models
from .. import schemas as pydantic_schemas

def create_session(db: Session, title: Optional[str] = None) -> pydantic_schemas.ChatSession:
    session_id = str(uuid.uuid4())
    db_session = db_models.ChatSession(id=session_id, title=title or "New Chat")
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return pydantic_schemas.ChatSession.from_orm(db_session)

def list_sessions(db: Session) -> List[pydantic_schemas.ChatSession]:
    sessions = db.query(db_models.ChatSession).order_by(db_models.ChatSession.created_at.desc()).all()
    return [pydantic_schemas.ChatSession.from_orm(s) for s in sessions]

def get_session(db: Session, session_id: str) -> Optional[pydantic_schemas.ChatSession]:
    session = db.query(db_models.ChatSession).filter(db_models.ChatSession.id == session_id).first()
    if session:
        return pydantic_schemas.ChatSession.from_orm(session)
    return None

def add_message(db: Session, session_id: str, role: str, content: str) -> pydantic_schemas.Message:
    message_id = str(uuid.uuid4())
    db_message = db_models.Message(
        id=message_id, 
        session_id=session_id, 
        role=role, 
        content=content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return pydantic_schemas.Message.from_orm(db_message)

def list_messages(db: Session, session_id: str) -> List[pydantic_schemas.Message]:
    messages = db.query(db_models.Message).filter(db_models.Message.session_id == session_id).order_by(db_models.Message.timestamp.asc()).all()
    return [pydantic_schemas.Message.from_orm(m) for m in messages]
