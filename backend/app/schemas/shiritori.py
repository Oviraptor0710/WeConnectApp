from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.game_common import LeaderboardEntry
from app.utils import shiritori_engine as se

ScriptMode = Literal["HIRAGANA", "KATAKANA"]
TURN_SECONDS_MIN = 5
TURN_SECONDS_MAX = 300
MATCH_MINUTES_MIN = 1
MATCH_MINUTES_MAX = 120

class ShiritoriRoomSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    script_mode: ScriptMode = "HIRAGANA"
    min_mora: int = Field(default=2, ge=1, le=12)
    max_mora: int = Field(default=8, ge=1, le=12)
    start_kana: str = Field(default="RANDOM", description="Single kana or RANDOM")
    turn_seconds: int = Field(default=30, ge=TURN_SECONDS_MIN, le=TURN_SECONDS_MAX, description="Thời gian mỗi lượt (giây)")
    match_minutes: int = Field(default=10, ge=MATCH_MINUTES_MIN, le=MATCH_MINUTES_MAX, description="Thời gian một ván (phút)")
    allow_long_vowel_chain: bool = True

    @field_validator("start_kana")
    @classmethod
    def validate_start_kana(cls, v: str) -> str:
        v = (v or "").strip()
        if not v or v.upper() == "RANDOM":
            return "RANDOM"
        if len(v) != 1 or not se.is_kana_char(v):
            raise ValueError("start_kana must be one hiragana/katakana or RANDOM")
        return v

    @model_validator(mode="after")
    def normalize_start_kana_for_script(self) -> "ShiritoriRoomSettings":
        if self.start_kana != "RANDOM":
            self.start_kana = se.to_script(self.start_kana, self.script_mode)
        return self

    @field_validator("max_mora")
    @classmethod
    def max_gte_min(cls, v: int, info) -> int:
        min_mora = info.data.get("min_mora", 1)
        if v < min_mora:
            raise ValueError("max_mora must be >= min_mora")
        return v


class ShiritoriHistoryEntry(BaseModel):
    user_id: int
    full_name: str
    word: str
    meaning: str
    points: int
    played_at: datetime


class ShiritoriStateOut(BaseModel):
    room_id: int
    code: str
    status: str
    host_id: int
    started_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    server_now: datetime
    settings: ShiritoriRoomSettings
    required_kana: Optional[str] = None
    current_turn_user_id: Optional[int] = None
    turn_started_at: Optional[datetime] = None
    turn_seconds_left: int = 0
    match_seconds_left: int = 0
    used_words: List[str] = Field(default_factory=list)
    history: List[ShiritoriHistoryEntry] = Field(default_factory=list)
    leaderboard: List[LeaderboardEntry] = Field(default_factory=list)
    is_my_turn: bool = False

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.strftime("%Y-%m-%dT%H:%M:%SZ") if v else None},
    }


class ShiritoriSubmitRequest(BaseModel):
    word: str = Field(min_length=1, max_length=50)


class ShiritoriSubmitResult(BaseModel):
    valid: bool
    reason: Optional[str] = None
    reason_params: Optional[Dict[str, Any]] = None
    word: Optional[str] = None
    meaning: Optional[str] = None
    points: int = 0
    new_score: int = 0
    next_kana: Optional[str] = None
    next_turn_user_id: Optional[int] = None
