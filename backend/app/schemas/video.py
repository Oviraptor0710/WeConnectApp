from pydantic import BaseModel, Field


class VideoTokenRequest(BaseModel):
    """Request body for generating a LiveKit access token."""

    room_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="The LiveKit room name the user wants to join.",
    )


class VideoTokenResponse(BaseModel):
    """Response containing the LiveKit access token."""

    token: str = Field(
        ...,
        description="A signed LiveKit access token granting room_join permission.",
    )


class CallInviteRequest(BaseModel):
    """Request body to send an incoming-call notification to another user."""

    callee_id: int = Field(..., description="User ID of the person being called.")
    room_name: str = Field(..., min_length=1, max_length=255)
    caller_name: str = Field(..., description="Display name of the caller.")
    caller_avatar: str | None = Field(None, description="Avatar URL of the caller.")


class CallInviteResponse(BaseModel):
    """Acknowledgement that the invite was sent."""

    sent: bool


class CallRejectRequest(BaseModel):
    """Request body to notify the caller that the call was rejected."""

    caller_id: int = Field(..., description="User ID of the person who initiated the call.")
    reason: str = Field("REJECTED", description="Reason for ending the call (REJECTED, TIMEOUT).")


class CallRejectResponse(BaseModel):
    """Acknowledgement that the rejection signal was sent."""

    sent: bool
