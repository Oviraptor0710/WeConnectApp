from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, field_validator


MessageType = Literal["TEXT", "IMAGE", "FILE", "GAME_INVITE"]
Direction = Literal["before", "after"]


class ConversationCreate(BaseModel):
    receiver_id: int


class MessageCreate(BaseModel):
    content: str
    type: MessageType = "TEXT"

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nội dung tin nhắn không được để trống")
        return value

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        return value.upper() if isinstance(value, str) else value


class MessageReadRequest(BaseModel):
    last_read_message_id: Optional[int] = None


class MessageTranslateRequest(BaseModel):
    target_language: Literal["VI", "JA", "EN"] = "VI"

    @field_validator("target_language", mode="before")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        return value.upper() if isinstance(value, str) else value


class TypingRequest(BaseModel):
    is_typing: bool


class UserBriefOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None


class MessageOut(BaseModel):
    message_id: int
    conversation_id: int
    sender_id: int
    content: str
    type: str
    translated_content: Optional[str] = None
    created_at: datetime
    is_read: bool


class LastMessageOut(BaseModel):
    message_id: int
    content: str
    type: str
    created_at: datetime
    sender_id: int


class ConversationOut(BaseModel):
    conversation_id: int
    participant: UserBriefOut
    last_message: Optional[LastMessageOut] = None
    unread_count: int
    last_message_at: Optional[datetime] = None
    created_at: datetime
