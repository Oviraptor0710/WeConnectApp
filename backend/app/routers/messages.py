import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.encoders import jsonable_encoder
from google import genai
from google.genai.errors import APIError
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.friendship import Friendship
from app.models.message import Conversation, Message
from app.models.user import User
from app.schemas.message import (
    ConversationCreate,
    Direction,
    MessageCreate,
    MessageReadRequest,
    MessageTranslateRequest,
    TypingRequest,
)
from app.utils.media import save_chat_file
from app.utils.pusher import authenticate_channel, trigger_event

logger = logging.getLogger(__name__)
router = APIRouter()


def _pagination(page: int, page_size: int, total: int) -> dict:
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"page": page, "page_size": page_size, "total": total, "total_pages": total_pages}


def _conversation_channel(conversation_id: int) -> str:
    return f"private-conversation-{conversation_id}"


def _user_channel(user_id: int) -> str:
    return f"private-user-{user_id}"


def _ordered_pair(user_a: int, user_b: int) -> tuple[int, int]:
    return (min(user_a, user_b), max(user_a, user_b))


def _ensure_friends(db: Session, user_a: int, user_b: int) -> None:
    user1_id, user2_id = _ordered_pair(user_a, user_b)
    friendship = db.query(Friendship).filter(
        Friendship.user1_id == user1_id,
        Friendship.user2_id == user2_id,
    ).first()
    if not friendship:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="NOT_FRIENDS")


def _get_conversation_for_user(db: Session, conversation_id: int, user_id: int) -> Conversation:
    conversation = (
        db.query(Conversation)
        .options(joinedload(Conversation.user1), joinedload(Conversation.user2))
        .filter(
            Conversation.conversation_id == conversation_id,
            or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id),
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuộc trò chuyện không tồn tại")
    return conversation


def _get_message_for_user(db: Session, message_id: int, user_id: int) -> Message:
    message = (
        db.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.conversation_id)
        .filter(
            Message.message_id == message_id,
            or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id),
        )
        .first()
    )
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tin nhắn không tồn tại")
    return message


def _other_user_id(conversation: Conversation, user_id: int) -> int:
    return conversation.user2_id if conversation.user1_id == user_id else conversation.user1_id


def _user_to_dict(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
    }


def _message_to_dict(message: Message) -> dict:
    return {
        "message_id": message.message_id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "content": message.content,
        "type": message.message_type,
        "translated_content": message.translated_content,
        "created_at": message.created_at,
        "is_read": message.is_read,
    }


def _last_message_to_dict(message: Message | None) -> dict | None:
    if not message:
        return None
    return {
        "message_id": message.message_id,
        "content": message.content,
        "type": message.message_type,
        "created_at": message.created_at,
        "sender_id": message.sender_id,
    }


def _conversation_to_dict(db: Session, conversation: Conversation, viewer_id: int) -> dict:
    participant = conversation.user2 if conversation.user1_id == viewer_id else conversation.user1
    last_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.conversation_id)
        .order_by(Message.message_id.desc())
        .first()
    )
    unread_count = db.query(Message).filter(
        Message.conversation_id == conversation.conversation_id,
        Message.sender_id != viewer_id,
        Message.is_read.is_(False),
    ).count()

    return {
        "conversation_id": conversation.conversation_id,
        "participant": _user_to_dict(participant),
        "last_message": _last_message_to_dict(last_message),
        "unread_count": unread_count,
        "last_message_at": conversation.last_message_at,
        "created_at": conversation.created_at,
    }


def _publish_conversation_update(db: Session, conversation: Conversation) -> None:
    for user_id in (conversation.user1_id, conversation.user2_id):
        trigger_event(
            _user_channel(user_id),
            "conversation:updated",
            jsonable_encoder(_conversation_to_dict(db, conversation, user_id)),
        )


def _publish_message_created(db: Session, conversation: Conversation, message: Message) -> None:
    trigger_event(
        _conversation_channel(conversation.conversation_id),
        "chat:new",
        jsonable_encoder(_message_to_dict(message)),
    )
    _publish_conversation_update(db, conversation)


def _parse_channel_id(channel_name: str, prefix: str) -> int | None:
    if not channel_name.startswith(prefix):
        return None
    raw_id = channel_name.removeprefix(prefix)
    return int(raw_id) if raw_id.isdigit() else None


@router.get("/pusher/config")
def get_pusher_config(current_user: User = Depends(get_current_user)):
    if not settings.PUSHER_KEY or not settings.PUSHER_CLUSTER:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Pusher chưa được cấu hình")
    return {
        "data": {
            "key": settings.PUSHER_KEY,
            "cluster": settings.PUSHER_CLUSTER,
            "auth_endpoint": "/api/v1/pusher/auth",
        }
    }


@router.post("/pusher/auth")
def authorize_pusher_channel(
    socket_id: str = Form(...),
    channel_name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation_id = _parse_channel_id(channel_name, "private-conversation-")
    user_id = _parse_channel_id(channel_name, "private-user-")
    game_room_id = _parse_channel_id(channel_name, "private-game-room-")

    if conversation_id is not None:
        _get_conversation_for_user(db, conversation_id, current_user.user_id)
    elif user_id is not None and user_id == current_user.user_id:
        pass
    elif game_room_id is not None:
        from app.models.game import GameParticipant
        member = db.query(GameParticipant).filter(
            GameParticipant.room_id == game_room_id,
            GameParticipant.user_id == current_user.user_id,
            GameParticipant.left_at.is_(None),
        ).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập kênh game")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền truy cập kênh Pusher")

    auth = authenticate_channel(channel_name, socket_id)
    if auth is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Pusher chưa được cấu hình")
    return auth


@router.get("/conversations")
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Conversation).options(
        joinedload(Conversation.user1),
        joinedload(Conversation.user2),
    ).filter(
        or_(Conversation.user1_id == current_user.user_id, Conversation.user2_id == current_user.user_id)
    )
    total = query.count()
    conversations = (
        query.order_by(func.coalesce(Conversation.last_message_at, Conversation.created_at).desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "data": [_conversation_to_dict(db, conversation, current_user.user_id) for conversation in conversations],
        "pagination": _pagination(page, page_size, total),
    }


@router.post("/conversations", status_code=status.HTTP_201_CREATED)
def create_or_get_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.receiver_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tự nhắn tin cho chính mình")

    receiver = db.query(User).filter(User.user_id == body.receiver_id, User.is_verified.is_(True)).first()
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người nhận không tồn tại")

    _ensure_friends(db, current_user.user_id, body.receiver_id)

    user1_id, user2_id = _ordered_pair(current_user.user_id, body.receiver_id)
    conversation = (
        db.query(Conversation)
        .options(joinedload(Conversation.user1), joinedload(Conversation.user2))
        .filter(Conversation.user1_id == user1_id, Conversation.user2_id == user2_id)
        .first()
    )

    if not conversation:
        conversation = Conversation(user1_id=user1_id, user2_id=user2_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return {"data": _conversation_to_dict(db, conversation, current_user.user_id)}


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    cursor: int | None = Query(None),
    limit: int = Query(30, ge=1, le=100),
    direction: Direction = Query("before"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_conversation_for_user(db, conversation_id, current_user.user_id)

    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    if cursor is not None:
        if direction == "before":
            query = query.filter(Message.message_id < cursor)
        else:
            query = query.filter(Message.message_id > cursor)

    if direction == "after":
        messages = query.order_by(Message.message_id.asc()).limit(limit).all()
        data = [_message_to_dict(message) for message in messages]
        next_cursor = data[-1]["message_id"] if len(data) == limit else None
    else:
        messages = query.order_by(Message.message_id.desc()).limit(limit).all()
        data = [_message_to_dict(message) for message in reversed(messages)]
        next_cursor = data[0]["message_id"] if len(data) == limit else None

    return {"data": data, "next_cursor": next_cursor}


@router.post("/conversations/{conversation_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = _get_conversation_for_user(db, conversation_id, current_user.user_id)
    receiver_id = conversation.user2_id if conversation.user1_id == current_user.user_id else conversation.user1_id
    _ensure_friends(db, current_user.user_id, receiver_id)

    message = Message(
        conversation_id=conversation.conversation_id,
        sender_id=current_user.user_id,
        content=body.content,
        message_type=body.type,
    )
    db.add(message)
    conversation.last_message_at = func.now()
    db.commit()
    db.refresh(message)
    db.refresh(conversation)

    _publish_message_created(db, conversation, message)

    return {"data": _message_to_dict(message)}


@router.post("/conversations/{conversation_id}/typing", status_code=status.HTTP_204_NO_CONTENT)
def send_typing_status(
    conversation_id: int,
    body: TypingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = _get_conversation_for_user(db, conversation_id, current_user.user_id)
    trigger_event(
        _conversation_channel(conversation.conversation_id),
        "chat:typing",
        {
            "conversation_id": conversation.conversation_id,
            "user_id": current_user.user_id,
            "is_typing": body.is_typing,
        },
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/conversations/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_conversation_read(
    conversation_id: int,
    body: MessageReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = _get_conversation_for_user(db, conversation_id, current_user.user_id)

    query = db.query(Message).filter(
        Message.conversation_id == conversation.conversation_id,
        Message.sender_id != current_user.user_id,
        Message.is_read.is_(False),
    )

    if body.last_read_message_id is not None:
        exists = db.query(Message).filter(
            Message.conversation_id == conversation.conversation_id,
            Message.message_id == body.last_read_message_id,
        ).first()
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tin nhắn đã đọc không tồn tại")
        query = query.filter(Message.message_id <= body.last_read_message_id)

    query.update({Message.is_read: True}, synchronize_session=False)
    db.commit()

    payload = {
        "conversation_id": conversation.conversation_id,
        "user_id": current_user.user_id,
        "last_read_message_id": body.last_read_message_id,
    }
    trigger_event(_conversation_channel(conversation.conversation_id), "chat:read", payload)
    _publish_conversation_update(db, conversation)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/messages/{message_id}/translate")
def translate_message(
    message_id: int,
    body: MessageTranslateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = _get_message_for_user(db, message_id, current_user.user_id)
    # Dịch lại nếu chưa có bản dịch hoặc nếu bản dịch trùng với nội dung gốc (bản dịch lỗi/cũ)
    if not message.translated_content or message.translated_content.strip() == message.content.strip():
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API key is not configured.",
            )

        target_language_map = {"VI": "Vietnamese", "JA": "Japanese", "EN": "English"}
        fallback_lang = target_language_map.get(body.target_language, "Vietnamese")
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = (
                f"You are a translation assistant for a language learning community between Vietnamese and Japanese.\n"
                f"Your task is to detect the primary language of the text below:\n"
                f"1. If the text is primarily in Vietnamese, translate it to Japanese.\n"
                f"2. If the text is primarily in Japanese, translate it to Vietnamese.\n"
                f"3. If the text is in another language, translate it to {fallback_lang}.\n\n"
                f"Return ONLY the translation, without any notes, explanations, quotes, or markdown formatting.\n\n"
                f"Text to translate:\n{message.content}"
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            message.translated_content = (response.text or "").strip()
            db.commit()
            db.refresh(message)
        except APIError as exc:
            logger.exception("Gemini API error during translation")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error communicating with Gemini API: {str(exc)}",
            )
        except Exception as exc:
            logger.exception("Unexpected error during translation")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred during translation: {str(exc)}",
            )

    payload = {
        "message_id": message.message_id,
        "translated_content": message.translated_content,
        "target_language": body.target_language,
    }
    trigger_event(_conversation_channel(message.conversation_id), "chat:translated", payload)

    return {
        "data": {
            "message_id": message.message_id,
            "original_content": message.content,
            "translated_content": message.translated_content,
            "target_language": body.target_language,
        }
    }


# ── POST /upload — Upload file chung (chat, v.v.) ────────────────────────────
@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload file chung cho chat và các tính năng khác (≤ 50MB)."""
    url = save_chat_file(file, "chat", max_mb=50)
    return {"data": {"url": url}}
