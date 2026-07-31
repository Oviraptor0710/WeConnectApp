from sqlalchemy import BigInteger, CheckConstraint, Column, ForeignKey, Integer, String, Text, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Event(Base):
    __tablename__ = "EVENTS"

    event_id = Column(BigInteger, primary_key=True, autoincrement=True)
    organizer_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    start_time = Column(TIMESTAMP, nullable=False)
    end_time = Column(TIMESTAMP, nullable=False)
    location = Column(String(255))
    capacity = Column(Integer, default=50)
    image_url = Column(String(500))
    status = Column(String(20), default="UPCOMING")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", foreign_keys=[organizer_id], back_populates="organized_events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    feedback_list = relationship("EventFeedback", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(Base):
    __tablename__ = "EVENT_REGISTRATIONS"

    registration_id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("EVENTS.event_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_user"),)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User")


class EventFeedback(Base):
    __tablename__ = "EVENT_FEEDBACK"

    feedback_id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("EVENTS.event_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_feedback_user"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_rating"),
    )

    event = relationship("Event", back_populates="feedback_list")
    user = relationship("User")
