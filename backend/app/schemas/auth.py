from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum


class IdentifierType(str, Enum):
    EMAIL = "EMAIL"
    PHONE = "PHONE"


class OTPPurpose(str, Enum):
    REGISTER = "REGISTER"
    FORGOT_PASSWORD = "FORGOT_PASSWORD"


class RegisterRequest(BaseModel):
    identifier: str
    identifier_type: IdentifierType
    password: str
    full_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Họ tên không được để trống")
        return v.strip()


class OTPSendRequest(BaseModel):
    identifier: str
    purpose: OTPPurpose


class OTPVerifyRequest(BaseModel):
    identifier: str
    code: str
    purpose: OTPPurpose


class LoginRequest(BaseModel):
    identifier: str
    password: str


class ForgotPasswordRequest(BaseModel):
    identifier: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Mật khẩu phải có ít nhất 8 ký tự")
        return v


class RefreshRequest(BaseModel):
    refresh_token: str


class UserBrief(BaseModel):
    user_id: int
    full_name: str
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserBrief
