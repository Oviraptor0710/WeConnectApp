from sqlalchemy import BigInteger, Column, ForeignKey, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FriendRequest(Base):
    __tablename__ = "FRIEND_REQUESTS"

    request_id = Column(BigInteger, primary_key=True, autoincrement=True)
    sender_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="PENDING")
    created_at = Column(TIMESTAMP, server_default=func.now())
    responded_at = Column(TIMESTAMP, nullable=True)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class Friendship(Base):
    __tablename__ = "FRIENDSHIPS"

    friendship_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user1_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(BigInteger, ForeignKey("USERS.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
