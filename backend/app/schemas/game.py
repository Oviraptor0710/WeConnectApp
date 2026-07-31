from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any
from app.schemas.event import UserBrief
from app.schemas.shiritori import ShiritoriRoomSettings
from app.schemas.game_common import LeaderboardEntry


class ParticipantBrief(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    role: str

    model_config = {"from_attributes": True}


class RoomParticipantOut(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    score: int

    model_config = {"from_attributes": True}


class GameRoomOut(BaseModel):
    room_id: int
    code: str
    host_id: int
    room_type: str
    max_players: int
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    room_settings: Optional[dict[str, Any]] = None
    participants_count: int
    participants: List[RoomParticipantOut]

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.strftime("%Y-%m-%dT%H:%M:%SZ") if v else None},
    }


class ScoreUpdateRequest(BaseModel):
    score: int


class GameRoomCreate(BaseModel):
    room_type: str = Field(default="QUIZ")
    max_players: int = Field(default=10)
    settings: Optional[ShiritoriRoomSettings] = None


class JoinRoomRequest(BaseModel):
    code: str


class GameOut(BaseModel):
    game_id: str
    name: str
    description: Optional[str] = None
    game_type: str
    icon_bg: Optional[str] = None
    badge_bg: Optional[str] = None
    badge_text: Optional[str] = None

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    question_index: int
    category: str
    question: str
    description: Optional[str] = None
    options: List[str]
    hint: Optional[str] = None
    correct_index: Optional[int] = None  # only present once the window has closed

    model_config = {"from_attributes": True}


class AnswerRequest(BaseModel):
    question_index: int
    selected_index: int


class AnswerResult(BaseModel):
    is_correct: bool
    correct_index: int
    points: int
    new_score: int


class GameStateOut(BaseModel):
    room_id: int
    code: str
    status: str
    host_id: int
    started_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    server_now: datetime
    total_questions: int
    cycle_seconds: int
    answer_window_seconds: int
    current_index: int
    questions: List[QuestionOut]          # only revealed-or-current questions
    my_answers: List[int]                 # question_index values this user has answered
    leaderboard: List[LeaderboardEntry]

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.strftime("%Y-%m-%dT%H:%M:%SZ") if v else None},
    }


class GameMessageCreate(BaseModel):
    content: str


class GameMessageOut(BaseModel):
    message_id: int
    room_id: int
    sender_id: int
    sender_name: str
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.strftime("%Y-%m-%dT%H:%M:%SZ") if v else None},
    }
