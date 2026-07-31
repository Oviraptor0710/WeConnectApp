from fastapi import APIRouter, Depends, HTTPException, status
from livekit.api import AccessToken, VideoGrants

from app.config import settings
from app.dependencies import get_current_user
from app.schemas.video import (
    CallInviteRequest,
    CallInviteResponse,
    CallRejectRequest,
    CallRejectResponse,
    VideoTokenRequest,
    VideoTokenResponse,
)
from app.utils.pusher import trigger_event

router = APIRouter()


@router.post(
    "/token",
    # ... giữ nguyên code cũ ...
)
def get_video_token(
    request: VideoTokenRequest,
    current_user=Depends(get_current_user),
) -> VideoTokenResponse:
    # ... giữ nguyên code cũ ...
    missing: list[str] = [var for var, val in {"LIVEKIT_API_KEY": settings.LIVEKIT_API_KEY, "LIVEKIT_API_SECRET": settings.LIVEKIT_API_SECRET, "LIVEKIT_URL": settings.LIVEKIT_URL}.items() if not val]
    if missing:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"LiveKit is not configured. Missing: {', '.join(missing)}")
    try:
        identity: str = str(current_user.user_id)
        grants = VideoGrants(room_join=True, room=request.room_name)
        token: str = (AccessToken(api_key=settings.LIVEKIT_API_KEY, api_secret=settings.LIVEKIT_API_SECRET).with_identity(identity).with_name(current_user.full_name or identity).with_grants(grants).to_jwt())
        return VideoTokenResponse(token=token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate LiveKit token: {exc}") from exc


@router.post(
    "/call/invite",
    response_model=CallInviteResponse,
    summary="Send incoming-call notification",
)
def send_call_invite(
    request: CallInviteRequest,
    current_user=Depends(get_current_user),
) -> CallInviteResponse:
    if request.callee_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot call yourself.")

    payload: dict = {
        "room_name": request.room_name,
        "caller_id": current_user.user_id,
        "caller_name": request.caller_name,
        # Backend tự lấy avatar từ DB — không phụ thuộc vào frontend gửi lên
        "caller_avatar": current_user.avatar_url,
    }

    sent = trigger_event(
        channel=f"private-user-{request.callee_id}",
        event="video:incoming-call",
        data=payload,
    )

    return CallInviteResponse(sent=sent)


@router.post(
    "/call/reject",
    response_model=CallRejectResponse,
    summary="Notify caller that call was rejected",
)
def reject_call(
    request: CallRejectRequest,
    current_user=Depends(get_current_user),
) -> CallRejectResponse:
    """
    Push a `video:call-rejected` event to the caller's private channel.
    """
    sent = trigger_event(
        channel=f"private-user-{request.caller_id}",
        event="video:call-rejected",
        data={"reason": request.reason, "callee_id": current_user.user_id},
    )
    return CallRejectResponse(sent=sent)
