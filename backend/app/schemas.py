from pydantic import BaseModel
from typing import List, Literal

Role = Literal["system", "user", "assistant"]

class Message(BaseModel):
    role: Role
    content: str

class CreateMessageRequest(BaseModel):
    messages: List[Message]
