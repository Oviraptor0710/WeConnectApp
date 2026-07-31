from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date


class HobbyOut(BaseModel):
    hobby_id: int
    name: str
    category: Optional[str] = None

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    user_id: int
    email: str
    phone_number: Optional[str] = None
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    japanese_level: Optional[str] = None
    job_title: Optional[str] = None
    education: Optional[str] = None
    relationship_status: Optional[str] = None
    preferred_language: Optional[str] = None
    role: str
    is_verified: bool
    hobbies: List[HobbyOut] = []

    model_config = {"from_attributes": True}


class UserPublicOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    japanese_level: Optional[str] = None
    job_title: Optional[str] = None
    education: Optional[str] = None
    relationship_status: Optional[str] = None
    role: str
    hobbies: List[HobbyOut] = []

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    japanese_level: Optional[str] = None
    job_title: Optional[str] = None
    education: Optional[str] = None
    relationship_status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None

    @field_validator("bio")
    @classmethod
    def bio_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("Bio không được vượt quá 500 ký tự")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Họ tên không được để trống")
        return v.strip() if v else v


class UpdateHobbiesRequest(BaseModel):
    hobby_ids: List[int]


class UpdateLanguageRequest(BaseModel):
    language: str

    @field_validator("language")
    @classmethod
    def valid_language(cls, v: str) -> str:
        if v not in ("vi", "ja", "VI", "JA"):
            raise ValueError("Ngôn ngữ phải là 'vi' hoặc 'ja'")
        return v.lower()


class MediaUploadOut(BaseModel):
    url: str
