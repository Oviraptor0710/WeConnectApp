import math
import os
import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from app.dependencies import get_db, get_current_user
from app.models.user import User, Hobby, UserHobby
from app.models.friendship import FriendRequest, Friendship
from app.schemas.user import (
    UserOut, UserPublicOut, HobbyOut,
    UpdateProfileRequest, UpdateHobbiesRequest, UpdateLanguageRequest, MediaUploadOut,
)
from app.config import settings

router = APIRouter()

from app.utils.media import save_upload


# ── GET /hobbies ─────────────────────────────────────────────────────────────
@router.get("/hobbies", response_model=list[HobbyOut])
def list_hobbies(db: Session = Depends(get_db)):
    """Danh sách tất cả sở thích có sẵn."""
    return db.query(Hobby).order_by(Hobby.category, Hobby.name).all()


# ── GET /users/me ─────────────────────────────────────────────────────────────
@router.get("/users/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """SRS ID 6: Xem hồ sơ cá nhân của mình."""
    return current_user


# ── PUT /users/me ─────────────────────────────────────────────────────────────
@router.put("/users/me", response_model=UserOut)
def update_my_profile(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 6: Cập nhật hồ sơ cá nhân."""
    update_data = body.model_dump(exclude_unset=True)
    
    # Ignore fields that are explicitly set to None if we want to mimic exclude_none, 
    # but for bio, we want to allow empty string and None if they unset it.
    for field, value in update_data.items():
        if value is None and field not in ["bio", "location", "job_title", "education", "japanese_level", "relationship_status", "phone_number"]:
            continue
        setattr(current_user, field, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user


# ── PUT /users/me/avatar ──────────────────────────────────────────────────────
@router.put("/users/me/avatar", response_model=MediaUploadOut)
def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 6: Cập nhật ảnh đại diện (≤ 5MB)."""
    url = save_upload(file, "avatars", max_mb=5)
    current_user.avatar_url = url
    db.commit()
    return MediaUploadOut(url=url)


# ── PUT /users/me/cover ───────────────────────────────────────────────────────
@router.put("/users/me/cover", response_model=MediaUploadOut)
def update_cover(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 6: Cập nhật ảnh bìa (≤ 10MB)."""
    url = save_upload(file, "covers", max_mb=10)
    current_user.cover_url = url
    db.commit()
    return MediaUploadOut(url=url)


# ── PUT /users/me/language ────────────────────────────────────────────────────
@router.put("/users/me/language", status_code=status.HTTP_204_NO_CONTENT)
def update_language(
    body: UpdateLanguageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 14: Chuyển đổi ngôn ngữ hiển thị (vi/ja). Lưu trạng thái cho lần sau."""
    current_user.preferred_language = body.language
    db.commit()


# ── GET /users/me/hobbies ─────────────────────────────────────────────────────
@router.get("/users/me/hobbies", response_model=list[HobbyOut])
def get_my_hobbies(current_user: User = Depends(get_current_user)):
    """SRS ID 6: Xem danh sách sở thích của mình."""
    return current_user.hobbies


# ── PUT /users/me/hobbies ─────────────────────────────────────────────────────
@router.put("/users/me/hobbies", response_model=list[HobbyOut])
def update_my_hobbies(
    body: UpdateHobbiesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 6: Cập nhật danh sách sở thích. Thay thế toàn bộ danh sách cũ."""
    # Xoá hết sở thích cũ
    db.query(UserHobby).filter(UserHobby.user_id == current_user.user_id).delete()

    # Kiểm tra hobby_ids hợp lệ
    hobbies = db.query(Hobby).filter(Hobby.hobby_id.in_(body.hobby_ids)).all()
    found_ids = {h.hobby_id for h in hobbies}
    invalid = set(body.hobby_ids) - found_ids
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Sở thích không tồn tại: {list(invalid)}",
        )

    for hobby_id in body.hobby_ids:
        db.add(UserHobby(user_id=current_user.user_id, hobby_id=hobby_id))

    db.commit()
    db.refresh(current_user)
    return current_user.hobbies


# ── GET /users/search ─────────────────────────────────────────────────────────
@router.get("/users/search")
def search_users(
    q: Optional[str] = Query(None, description="Từ khoá tên"),
    gender: Optional[str] = Query(None),
    min_age: Optional[int] = Query(None, ge=1, le=120),
    max_age: Optional[int] = Query(None, ge=1, le=120),
    japanese_level: Optional[str] = Query(None),
    hobbies: Optional[str] = Query(None, description="Danh sách hobby_id cách nhau bởi dấu phẩy, ví dụ: 1,3,5"),
    location: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 9, 16: Tìm kiếm và lọc người dùng."""
    from sqlalchemy import or_, and_

    query = db.query(User).filter(
        User.user_id != current_user.user_id,
        User.is_verified == True,
        User.role == "USER",
    )

    if q:
        query = query.filter(User.full_name.ilike(f"%{q}%"))
    if gender:
        query = query.filter(User.gender == gender)
    if japanese_level:
        query = query.filter(User.japanese_level == japanese_level)
    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))

    today = date.today()
    if min_age is not None:
        try:
            cutoff = today.replace(year=today.year - min_age)
        except ValueError:
            cutoff = today.replace(year=today.year - min_age, day=28)
        query = query.filter(User.date_of_birth <= cutoff)
    if max_age is not None:
        try:
            cutoff = today.replace(year=today.year - max_age)
        except ValueError:
            cutoff = today.replace(year=today.year - max_age, day=28)
        query = query.filter(User.date_of_birth >= cutoff)

    if hobbies:
        hobby_ids = [int(h.strip()) for h in hobbies.split(",") if h.strip().isdigit()]
        if hobby_ids:
            hobby_user_ids = (
                db.query(UserHobby.user_id)
                .filter(UserHobby.hobby_id.in_(hobby_ids))
                .distinct()
            )
            query = query.filter(User.user_id.in_(hobby_user_ids))

    total = query.count()
    users = (
        query.options(joinedload(User.hobbies))
        .order_by(User.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    from app.routers.friends import get_friendship_status

    data = []
    for u in users:
        fs = get_friendship_status(db, current_user.user_id, u.user_id)
        data.append({
            "user_id": u.user_id,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "japanese_level": u.japanese_level,
            "location": u.location,
            "hobbies": [h.name for h in u.hobbies],
            "friendship_status": fs,
        })

    return {
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": math.ceil(total / page_size) if total > 0 else 0,
        },
    }


# ── GET /users/suggestions ────────────────────────────────────────────────────
@router.get("/users/suggestions")
def get_suggestions(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 15: Gợi ý kết bạn dựa trên sở thích, trình độ tiếng Nhật, địa điểm."""
    from sqlalchemy import or_, and_

    missing_fields = []
    if not current_user.japanese_level:
        missing_fields.append("japanese_level")
    if not current_user.hobbies:
        missing_fields.append("hobbies")

    if missing_fields:
        return {
            "data": [],
            "warning": {
                "code": "PROFILE_INCOMPLETE",
                "missing_fields": missing_fields,
            },
        }

    me = current_user.user_id
    my_hobby_ids = {h.hobby_id for h in current_user.hobbies}

    # IDs đã là bạn
    friendships = db.query(Friendship).filter(
        or_(Friendship.user1_id == me, Friendship.user2_id == me)
    ).all()
    friend_ids = {
        f.user2_id if f.user1_id == me else f.user1_id
        for f in friendships
    }

    # IDs có lời mời đang chờ
    pending_requests = db.query(FriendRequest).filter(
        FriendRequest.status == "PENDING",
        or_(FriendRequest.sender_id == me, FriendRequest.receiver_id == me),
    ).all()
    pending_ids = set()
    for r in pending_requests:
        pending_ids.add(r.receiver_id if r.sender_id == me else r.sender_id)

    excluded = friend_ids | pending_ids | {me}

    candidates = (
        db.query(User)
        .filter(
            User.user_id.notin_(excluded),
            User.is_verified == True,
            User.role == "USER",
        )
        .options(joinedload(User.hobbies))
        .all()
    )

    scored = []
    for u in candidates:
        their_hobby_ids = {h.hobby_id for h in u.hobbies}
        shared = len(my_hobby_ids & their_hobby_ids)
        score = (
            shared * 2
            + (3 if u.japanese_level == current_user.japanese_level else 0)
            + (1 if u.location and u.location == current_user.location else 0)
        )
        if score > 0:
            scored.append((score, u))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [u for _, u in scored[:limit]]

    return {
        "data": [
            {
                "user_id": u.user_id,
                "full_name": u.full_name,
                "avatar_url": u.avatar_url,
                "japanese_level": u.japanese_level,
                "location": u.location,
                "hobbies": [h.name for h in u.hobbies],
                "friendship_status": "NONE",
            }
            for u in top
        ],
    }


# ── GET /users/{user_id} ──────────────────────────────────────────────────────
@router.get("/users/{user_id}")
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xem hồ sơ công khai của người dùng khác (kèm friendship_status)."""
    from app.routers.friends import get_friendship_status

    user = db.query(User).options(joinedload(User.hobbies)).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại")

    fs = get_friendship_status(db, current_user.user_id, user_id)

    return {
        "data": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "cover_url": user.cover_url,
            "bio": user.bio,
            "location": user.location,
            "japanese_level": user.japanese_level,
            "role": user.role,
            "hobbies": [{"hobby_id": h.hobby_id, "name": h.name, "category": h.category} for h in user.hobbies],
            "friendship_status": fs,
        }
    }
