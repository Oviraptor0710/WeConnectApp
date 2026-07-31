from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.dependencies import get_db, get_current_user, require_organizer
from app.models.user import User
from app.models.event import Event, EventRegistration, EventFeedback
from app.schemas.event import (
    EventCreate, EventUpdate, EventOut, FeedbackCreate, FeedbackOut,
    EventStatistics, EventOverviewStatistics, RatingDistribution,
    OrganizerBrief, UserBrief, ParticipantOut, EventImageUploadOut,
)

from app.utils.media import save_upload


router = APIRouter()


def _registered_count(db: Session, event_id: int) -> int:
    return db.query(func.count(EventRegistration.registration_id)).filter(
        EventRegistration.event_id == event_id
    ).scalar() or 0


def _build_event_out(event: Event, db: Session, current_user: User | None = None) -> dict:
    count = _registered_count(db, event.event_id)
    is_registered = False
    if current_user:
        is_registered = bool(
            db.query(EventRegistration).filter(
                EventRegistration.event_id == event.event_id,
                EventRegistration.user_id == current_user.user_id,
            ).first()
        )
    return {
        "event_id": event.event_id,
        "title": event.title,
        "category": event.category,
        "description": event.description,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,
        "capacity": event.capacity,
        "image_url": event.image_url,
        "status": event.status,
        "registered_count": count,
        "is_full": count >= event.capacity,
        "is_registered": is_registered,
        "organizer": {
            "user_id": event.organizer.user_id,
            "full_name": event.organizer.full_name,
            "avatar_url": event.organizer.avatar_url,
        },
    }


# ── GET / — Danh sách sự kiện công khai ─────────────────────────────────────
@router.get("", response_model=list[EventOut])
def list_events(
    q: Optional[str] = Query(None, description="Từ khoá tìm kiếm"),
    event_status: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 17: Danh sách sự kiện. Hỗ trợ tìm kiếm và lọc theo trạng thái."""
    query = db.query(Event)
    if q:
        query = query.filter(Event.title.ilike(f"%{q}%"))
    if event_status:
        query = query.filter(Event.status == event_status.upper())

    offset = (page - 1) * page_size
    events = query.order_by(Event.start_time.asc()).offset(offset).limit(page_size).all()
    return [_build_event_out(e, db, current_user) for e in events]


# ── GET /managed — Sự kiện của Organizer ────────────────────────────────────
@router.get("/managed", response_model=list[EventOut])
def list_my_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7: Organizer xem danh sách sự kiện do mình tổ chức."""
    offset = (page - 1) * page_size
    events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.user_id)
        .order_by(Event.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_build_event_out(e, db, current_user) for e in events]


# ── GET /statistics/overview — Tổng quan thống kê ───────────────────────────
@router.get("/statistics/overview", response_model=EventOverviewStatistics)
def event_statistics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7 (ID.15): Thống kê tổng quan tất cả sự kiện của Organizer."""
    base = db.query(Event).filter(Event.organizer_id == current_user.user_id)

    total = base.count()
    upcoming = base.filter(Event.status == "UPCOMING").count()
    ongoing = base.filter(Event.status == "ONGOING").count()
    finished = base.filter(Event.status == "ENDED").count()

    event_ids = [e.event_id for e in base.all()]
    total_regs = 0
    avg_rating = 0.0

    if event_ids:
        total_regs = db.query(func.count(EventRegistration.registration_id)).filter(
            EventRegistration.event_id.in_(event_ids)
        ).scalar() or 0

        avg = db.query(func.avg(EventFeedback.rating)).filter(
            EventFeedback.event_id.in_(event_ids)
        ).scalar()
        avg_rating = round(float(avg), 2) if avg else 0.0

    return EventOverviewStatistics(
        total_events=total,
        upcoming_events=upcoming,
        ongoing_events=ongoing,
        finished_events=finished,
        total_registrations=total_regs,
        average_satisfaction=avg_rating,
    )


# ── GET /{id} — Chi tiết sự kiện ─────────────────────────────────────────────
@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 17 (ID.17): Chi tiết một sự kiện."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")
    return _build_event_out(event, db, current_user)


# ── POST / — Tạo sự kiện (Organizer) ────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED, response_model=EventOut)
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7 (ID.20): Organizer tạo sự kiện mới."""
    event = Event(
        organizer_id=current_user.user_id,
        title=body.title,
        description=body.description,
        start_time=body.start_time,
        end_time=body.end_time,
        location=body.location,
        capacity=body.capacity,
        image_url=body.image_url,
        category=body.category,
        status="UPCOMING",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _build_event_out(event, db, current_user)


# ── PUT /{id} — Cập nhật sự kiện (Organizer) ─────────────────────────────────
@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7 (ID.19): Organizer cập nhật sự kiện của mình."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")
    if event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền chỉnh sửa sự kiện này")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _build_event_out(event, db, current_user)


# ── DELETE /{id} — Xoá sự kiện (Organizer) ───────────────────────────────────
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7: Organizer xoá sự kiện (FE phải hiển thị hộp thoại xác nhận trước khi gọi)."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")
    if event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xoá sự kiện này")
    db.delete(event)
    db.commit()


# ── POST /upload-image — Upload ảnh sự kiện (Organizer) ─────────────────────
@router.post("/upload-image", response_model=EventImageUploadOut)
def upload_event_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7: Organizer upload ảnh cho sự kiện (≤ 10MB)."""
    url = save_upload(file, "events", max_mb=10)
    return EventImageUploadOut(url=url)


# ── POST /{id}/register — Đăng ký tham gia ───────────────────────────────────
@router.post("/{event_id}/register", status_code=status.HTTP_201_CREATED)
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 17: Đăng ký tham gia sự kiện. Từ chối nếu hết chỗ."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")

    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bạn đã đăng ký sự kiện này")

    count = _registered_count(db, event_id)
    if count >= event.capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sự kiện đã hết chỗ")

    reg = EventRegistration(event_id=event_id, user_id=current_user.user_id)
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return {"data": {"registration_id": reg.registration_id, "registered_at": reg.registered_at}}


# ── DELETE /{id}/register — Huỷ đăng ký ─────────────────────────────────────
@router.delete("/{event_id}/register", status_code=status.HTTP_204_NO_CONTENT)
def cancel_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 17: Huỷ đăng ký tham gia sự kiện."""
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.user_id,
    ).first()
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bạn chưa đăng ký sự kiện này")
    db.delete(reg)
    db.commit()


# ── GET /{id}/feedback ────────────────────────────────────────────────────────
@router.get("/{event_id}/feedback", response_model=list[FeedbackOut])
def list_feedback(
    event_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """SRS ID 7: Danh sách feedback của sự kiện."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")

    offset = (page - 1) * page_size
    feedbacks = (
        db.query(EventFeedback)
        .filter(EventFeedback.event_id == event_id)
        .order_by(EventFeedback.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [
        {
            "feedback_id": f.feedback_id,
            "rating": f.rating,
            "comment": f.comment,
            "created_at": f.created_at,
            "user": {
                "user_id": f.user.user_id,
                "full_name": f.user.full_name,
                "avatar_url": f.user.avatar_url,
            },
        }
        for f in feedbacks
    ]


# ── POST /{id}/feedback ───────────────────────────────────────────────────────
@router.post("/{event_id}/feedback", status_code=status.HTTP_201_CREATED)
def create_feedback(
    event_id: int,
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """SRS ID 7: Gửi feedback cho sự kiện (chỉ user đã đăng ký, mỗi người một lần)."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")

    registered = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.user_id,
    ).first()
    if not registered:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ người đã đăng ký mới được gửi feedback")

    existing = db.query(EventFeedback).filter(
        EventFeedback.event_id == event_id,
        EventFeedback.user_id == current_user.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bạn đã gửi feedback cho sự kiện này")

    fb = EventFeedback(
        event_id=event_id,
        user_id=current_user.user_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"data": {"feedback_id": fb.feedback_id, "rating": fb.rating}}


# ── GET /{id}/statistics — Thống kê chi tiết ─────────────────────────────────
@router.get("/{event_id}/statistics", response_model=EventStatistics)
def event_statistics(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7 (ID.18): Thống kê chi tiết một sự kiện: đăng ký, rating, phân phối điểm."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")
    if event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xem thống kê sự kiện này")

    total_regs = _registered_count(db, event_id)
    reg_rate = round(total_regs / event.capacity, 4) if event.capacity > 0 else 0.0

    feedbacks = db.query(EventFeedback).filter(EventFeedback.event_id == event_id).all()
    feedback_count = len(feedbacks)
    avg_rating = round(sum(f.rating for f in feedbacks) / feedback_count, 2) if feedback_count else 0.0

    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for f in feedbacks:
        dist[f.rating] += 1

    return EventStatistics(
        event_id=event.event_id,
        title=event.title,
        total_registrations=total_regs,
        capacity=event.capacity,
        registration_rate=reg_rate,
        average_rating=avg_rating,
        feedback_count=feedback_count,
        rating_distribution=RatingDistribution(
            one=dist[1], two=dist[2], three=dist[3], four=dist[4], five=dist[5]
        ),
    )


# ── GET /{id}/participants — Danh sách tham gia (Organizer) ──────────────────
@router.get("/{event_id}/participants", response_model=list[ParticipantOut])
def list_event_participants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    """SRS ID 7: Organizer xem danh sách người dùng đã đăng ký tham gia sự kiện."""
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sự kiện không tồn tại")
    if event.organizer_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xem danh sách tham gia sự kiện này")

    registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).all()
    return [
        {
            "user_id": r.user.user_id,
            "full_name": r.user.full_name,
            "avatar_url": r.user.avatar_url,
            "registered_at": r.registered_at,
        }
        for r in registrations
    ]
