from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime

Role = Literal["system", "user", "assistant"]

class ChatSession(BaseModel):
    id: str
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}

class Message(BaseModel):
    id: str
    session_id: str
    role: Role
    content: str
    timestamp: datetime

    model_config = {"from_attributes": True}

class CreateSessionRequest(BaseModel):
    title: Optional[str] = None

class CreateMessageRequest(BaseModel):
    content: str
