from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FriendRequestCreate(BaseModel):
    receiver_id: int


class FriendRequestOut(BaseModel):
    request_id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBriefOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    japanese_level: Optional[str] = None
    location: Optional[str] = None

    model_config = {"from_attributes": True}


class FriendRequestWithUserOut(BaseModel):
    request_id: int
    status: str
    created_at: datetime
    user: UserBriefOut

    model_config = {"from_attributes": True}


class UserSearchOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    japanese_level: Optional[str] = None
    location: Optional[str] = None
    hobbies: List[str] = []
    friendship_status: str = "NONE"


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class UserSearchResponse(BaseModel):
    data: List[UserSearchOut]
    pagination: PaginationMeta


class UserSuggestionResponse(BaseModel):
    data: List[UserSearchOut]
    warning: Optional[dict] = None
