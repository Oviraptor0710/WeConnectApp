from typing import Optional

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    score: int
    is_ready: bool
