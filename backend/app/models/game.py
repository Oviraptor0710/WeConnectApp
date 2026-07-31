from sqlalchemy import Column, BigInteger, Integer, SmallInteger, Boolean, String, Text, JSON, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Game(Base):
    __tablename__ = "GAMES"

    game_id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    game_type = Column(String(50), nullable=False, unique=True)
    icon_bg = Column(String(50), nullable=True)
    badge_bg = Column(String(50), nullable=True)
    badge_text = Column(String(50), nullable=True)


class GameRoom(Base):
    __tablename__ = "GAME_ROOMS"

    room_id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(10), nullable=False, unique=True)
    host_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    room_type = Column(String(50), default="QUIZ")
    max_players = Column(Integer, default=10)
    status = Column(String(20), default="WAITING")  # WAITING | PLAYING | ENDED
    created_at = Column(TIMESTAMP, server_default=func.now())
    started_at = Column(TIMESTAMP, nullable=True)
    paused_at = Column(TIMESTAMP, nullable=True)
    ended_at = Column(TIMESTAMP, nullable=True)
    question_ids = Column(JSON, nullable=True)  # ordered list of GAME_QUESTIONS.question_id for this match
    room_settings = Column(JSON, nullable=True)  # Shiritori / future per-room config
    game_state = Column(JSON, nullable=True)  # Shiritori runtime state

    host = relationship("User", foreign_keys=[host_id])
    participants = relationship("GameParticipant", back_populates="room", cascade="all, delete-orphan")


class GameParticipant(Base):
    __tablename__ = "GAME_PARTICIPANTS"

    participant_id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(BigInteger, ForeignKey("GAME_ROOMS.room_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    left_at = Column(TIMESTAMP, nullable=True)
    score = Column(Integer, default=0)
    is_ready = Column(Boolean, default=False)

    room = relationship("GameRoom", back_populates="participants")
    user = relationship("User")


class GameMessage(Base):
    __tablename__ = "GAME_MESSAGES"

    message_id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(BigInteger, ForeignKey("GAME_ROOMS.room_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    room = relationship("GameRoom")
    sender = relationship("User")


class GameQuestion(Base):
    __tablename__ = "GAME_QUESTIONS"

    question_id = Column(BigInteger, primary_key=True, autoincrement=True)
    game_type = Column(String(50), nullable=False)  # QUIZ | KANJI
    category = Column(String(100), nullable=False)
    question = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    options = Column(JSON, nullable=False)  # list[str], length 4
    correct_index = Column(SmallInteger, nullable=False)  # 0..3
    hint = Column(String(255), nullable=True)
    difficulty = Column(SmallInteger, default=1)


class GameAnswer(Base):
    __tablename__ = "GAME_ANSWERS"
    __table_args__ = (
        UniqueConstraint("room_id", "user_id", "question_index", name="uq_answer_room_user_q"),
    )

    answer_id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(BigInteger, ForeignKey("GAME_ROOMS.room_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    question_index = Column(Integer, nullable=False)
    selected_index = Column(SmallInteger, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points = Column(Integer, nullable=False, default=0)
    answered_at = Column(TIMESTAMP, server_default=func.now())


class GameWord(Base):
    __tablename__ = "GAME_WORDS"

    word_id = Column(BigInteger, primary_key=True, autoincrement=True)
    hiragana = Column(String(50), nullable=False, unique=True)
    katakana = Column(String(50), nullable=False)
    meaning_vi = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    jlpt_level = Column(SmallInteger, nullable=True)
    mora_count = Column(SmallInteger, nullable=False)
    first_kana = Column(String(3), nullable=False)
    last_kana = Column(String(3), nullable=False)
    difficulty = Column(SmallInteger, default=1)
