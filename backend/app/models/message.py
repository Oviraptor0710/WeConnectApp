from sqlalchemy import BigInteger, Boolean, Column, ForeignKey, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Conversation(Base):
    __tablename__ = "CONVERSATIONS"

    conversation_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user1_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    last_message_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "MESSAGES"

    message_id = Column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id = Column(
        BigInteger,
        ForeignKey("CONVERSATIONS.conversation_id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="TEXT")
    translated_content = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_read = Column(Boolean, default=False)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
