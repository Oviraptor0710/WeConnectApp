from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class OrganizerBrief(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class EventCreate(BaseModel):
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    capacity: int = 50
    image_url: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Tiêu đề không được để trống")
        return v.strip()

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Sức chứa phải lớn hơn 0")
        return v

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("Thời gian kết thúc phải sau thời gian bắt đầu")
        return v


class EventUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None


class EventOut(BaseModel):
    event_id: int
    title: str
    category: Optional[str] = None
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    capacity: int
    image_url: Optional[str] = None
    status: str
    registered_count: int = 0
    is_full: bool = False
    is_registered: bool = False
    organizer: OrganizerBrief

    model_config = {"from_attributes": True}


class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating phải từ 1 đến 5")
        return v


class FeedbackOut(BaseModel):
    feedback_id: int
    rating: int
    comment: Optional[str] = None
    user: UserBrief
    created_at: datetime

    model_config = {"from_attributes": True}


class RatingDistribution(BaseModel):
    one: int = 0
    two: int = 0
    three: int = 0
    four: int = 0
    five: int = 0


class EventStatistics(BaseModel):
    event_id: int
    title: str
    total_registrations: int
    capacity: int
    registration_rate: float
    average_rating: float
    feedback_count: int
    rating_distribution: RatingDistribution


class EventOverviewStatistics(BaseModel):
    total_events: int
    upcoming_events: int
    ongoing_events: int
    finished_events: int
    total_registrations: int
    average_satisfaction: float


class ParticipantOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    registered_at: datetime

    model_config = {"from_attributes": True}

class EventImageUploadOut(BaseModel):
    url: str
