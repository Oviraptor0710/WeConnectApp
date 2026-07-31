import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.friendship import FriendRequest, Friendship
from app.schemas.friendship import FriendRequestCreate

router = APIRouter()


def get_friendship_status(db: Session, me: int, other: int) -> str:
    """Trả về friendship_status giữa current user và một user khác."""
    u1, u2 = min(me, other), max(me, other)
    if db.query(Friendship).filter(
        Friendship.user1_id == u1, Friendship.user2_id == u2
    ).first():
        return "FRIEND"

    req = db.query(FriendRequest).filter(
        FriendRequest.status == "PENDING",
        or_(
            and_(FriendRequest.sender_id == me, FriendRequest.receiver_id == other),
            and_(FriendRequest.sender_id == other, FriendRequest.receiver_id == me),
        ),
    ).first()

    if req:
        return "REQUEST_SENT" if req.sender_id == me else "REQUEST_RECEIVED"
    return "NONE"


def _user_to_dict(user: User, friendship_status: str) -> dict:
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "japanese_level": user.japanese_level,
        "location": user.location,
        "hobbies": [h.name for h in user.hobbies],
        "friendship_status": friendship_status,
    }


def _pagination(page: int, page_size: int, total: int) -> dict:
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0,
    }


# ── POST /friend-requests ─────────────────────────────────────────────────────
@router.post("/friend-requests", status_code=status.HTTP_201_CREATED)
def send_friend_request(
    body: FriendRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 10: Gửi lời mời kết bạn."""
    if body.receiver_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể gửi lời mời cho chính mình")

    if not db.query(User).filter(User.user_id == body.receiver_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại")

    u1, u2 = min(current_user.user_id, body.receiver_id), max(current_user.user_id, body.receiver_id)
    if db.query(Friendship).filter(Friendship.user1_id == u1, Friendship.user2_id == u2).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ALREADY_FRIENDS")

    existing = db.query(FriendRequest).filter(
        FriendRequest.status == "PENDING",
        or_(
            and_(FriendRequest.sender_id == current_user.user_id, FriendRequest.receiver_id == body.receiver_id),
            and_(FriendRequest.sender_id == body.receiver_id, FriendRequest.receiver_id == current_user.user_id),
        ),
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="REQUEST_ALREADY_EXISTS")

    req = FriendRequest(sender_id=current_user.user_id, receiver_id=body.receiver_id)
    db.add(req)
    db.commit()
    db.refresh(req)

    return {"data": {
        "request_id": req.request_id,
        "sender_id": req.sender_id,
        "receiver_id": req.receiver_id,
        "status": req.status,
        "created_at": req.created_at,
    }}


# ── GET /friend-requests/received ────────────────────────────────────────────
# NOTE: Các route cụ thể (received, sent) phải khai báo TRƯỚC /{request_id}
@router.get("/friend-requests/received")
def get_received_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 11: Danh sách lời mời kết bạn nhận được (đang chờ)."""
    query = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.user_id,
        FriendRequest.status == "PENDING",
    )
    total = query.count()
    requests = (
        query.options(joinedload(FriendRequest.sender).joinedload(User.hobbies))
        .order_by(FriendRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "data": [
            {
                "request_id": r.request_id,
                "status": r.status,
                "created_at": r.created_at,
                "user": {
                    "user_id": r.sender.user_id,
                    "full_name": r.sender.full_name,
                    "avatar_url": r.sender.avatar_url,
                    "japanese_level": r.sender.japanese_level,
                    "location": r.sender.location,
                },
            }
            for r in requests
        ],
        "pagination": _pagination(page, page_size, total),
    }


# ── GET /friend-requests/sent ─────────────────────────────────────────────────
@router.get("/friend-requests/sent")
def get_sent_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 10: Danh sách lời mời kết bạn đã gửi (đang chờ)."""
    query = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.user_id,
        FriendRequest.status == "PENDING",
    )
    total = query.count()
    requests = (
        query.options(joinedload(FriendRequest.receiver))
        .order_by(FriendRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "data": [
            {
                "request_id": r.request_id,
                "status": r.status,
                "created_at": r.created_at,
                "user": {
                    "user_id": r.receiver.user_id,
                    "full_name": r.receiver.full_name,
                    "avatar_url": r.receiver.avatar_url,
                    "japanese_level": r.receiver.japanese_level,
                    "location": r.receiver.location,
                },
            }
            for r in requests
        ],
        "pagination": _pagination(page, page_size, total),
    }


# ── DELETE /friend-requests/{request_id} ─────────────────────────────────────
@router.delete("/friend-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 10: Huỷ lời mời kết bạn đã gửi."""
    req = db.query(FriendRequest).filter(
        FriendRequest.request_id == request_id,
        FriendRequest.sender_id == current_user.user_id,
        FriendRequest.status == "PENDING",
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lời mời không tồn tại hoặc không có quyền huỷ")
    db.delete(req)
    db.commit()


# ── POST /friend-requests/{request_id}/accept ────────────────────────────────
@router.post("/friend-requests/{request_id}/accept")
def accept_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 11: Chấp nhận lời mời kết bạn → tạo Friendship."""
    req = db.query(FriendRequest).filter(
        FriendRequest.request_id == request_id,
        FriendRequest.receiver_id == current_user.user_id,
        FriendRequest.status == "PENDING",
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lời mời không tồn tại")

    req.status = "ACCEPTED"
    u1, u2 = min(req.sender_id, req.receiver_id), max(req.sender_id, req.receiver_id)
    friendship = Friendship(user1_id=u1, user2_id=u2)
    db.add(friendship)
    db.commit()
    db.refresh(friendship)

    return {"data": {"status": "ACCEPTED", "friendship_id": friendship.friendship_id}}


# ── POST /friend-requests/{request_id}/reject ────────────────────────────────
@router.post("/friend-requests/{request_id}/reject")
def reject_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 11: Từ chối lời mời kết bạn."""
    req = db.query(FriendRequest).filter(
        FriendRequest.request_id == request_id,
        FriendRequest.receiver_id == current_user.user_id,
        FriendRequest.status == "PENDING",
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lời mời không tồn tại")

    req.status = "REJECTED"
    db.commit()

    return {"data": {"status": "REJECTED"}}


# ── GET /friends ──────────────────────────────────────────────────────────────
@router.get("/friends")
def list_friends(
    q: Optional[str] = Query(None, description="Tìm theo tên"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 12: Danh sách bạn bè của tôi."""
    me = current_user.user_id
    friendships = db.query(Friendship).filter(
        or_(Friendship.user1_id == me, Friendship.user2_id == me)
    ).all()

    friend_ids = [
        f.user2_id if f.user1_id == me else f.user1_id
        for f in friendships
    ]

    if not friend_ids:
        return {"data": [], "pagination": _pagination(page, page_size, 0)}

    user_q = db.query(User).filter(User.user_id.in_(friend_ids))
    if q:
        user_q = user_q.filter(User.full_name.ilike(f"%{q}%"))

    total = user_q.count()
    friends = (
        user_q.options(joinedload(User.hobbies))
        .order_by(User.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "data": [_user_to_dict(u, "FRIEND") for u in friends],
        "pagination": _pagination(page, page_size, total),
    }


# ── DELETE /friends/{user_id} ─────────────────────────────────────────────────
@router.delete("/friends/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfriend(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 12: Huỷ kết bạn."""
    me = current_user.user_id
    u1, u2 = min(me, user_id), max(me, user_id)
    friendship = db.query(Friendship).filter(
        Friendship.user1_id == u1, Friendship.user2_id == u2
    ).first()
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hai người không phải là bạn bè")
    db.delete(friendship)
    db.commit()
