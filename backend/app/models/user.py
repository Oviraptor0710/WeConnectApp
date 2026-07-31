from sqlalchemy import BigInteger, Boolean, Column, Date, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Hobby(Base):
    __tablename__ = "HOBBIES"

    hobby_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(100))

    users = relationship("User", secondary="USER_HOBBIES", back_populates="hobbies")


class UserHobby(Base):
    __tablename__ = "USER_HOBBIES"

    user_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), primary_key=True)
    hobby_id = Column(Integer, ForeignKey("HOBBIES.hobby_id", ondelete="CASCADE"), primary_key=True)


class User(Base):
    __tablename__ = "USERS"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    phone_number = Column(String(20), unique=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date)
    gender = Column(String(20))
    avatar_url = Column(String(500))
    cover_url = Column(String(500))
    bio = Column(Text)
    location = Column(String(255))
    japanese_level = Column(String(50))
    job_title = Column(String(255))
    education = Column(String(255))
    relationship_status = Column(String(50))
    preferred_language = Column(String(10), default="vi")
    role = Column(String(20), default="USER")
    is_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    hobbies = relationship("Hobby", secondary="USER_HOBBIES", back_populates="users")
    organized_events = relationship("Event", foreign_keys="Event.organizer_id", back_populates="organizer")


class OTP(Base):
    __tablename__ = "OTPS"

    otp_id = Column(BigInteger, primary_key=True, autoincrement=True)
    identifier = Column(String(255), nullable=False)
    code = Column(String(10), nullable=False)
    purpose = Column(String(50), nullable=False)
    expire_at = Column(TIMESTAMP, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
