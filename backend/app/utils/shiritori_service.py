"""DB-backed helpers for Shiritori rooms."""
from __future__ import annotations

import random
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.game import GameRoom, GameParticipant, GameWord
from app.models.user import User
from app.utils import shiritori_engine as se
from app.schemas.shiritori import ShiritoriRoomSettings


def parse_settings(room: GameRoom) -> dict[str, Any]:
    raw = room.room_settings or se.default_settings()
    return ShiritoriRoomSettings.model_validate(raw).model_dump()


def participant_ids_ordered(room_id: int, db: Session) -> list[int]:
    rows = (
        db.query(GameParticipant.user_id)
        .filter(GameParticipant.room_id == room_id, GameParticipant.left_at.is_(None))
        .order_by(GameParticipant.joined_at.asc())
        .all()
    )
    return [r[0] for r in rows]


def query_word_pool(db: Session, settings: dict[str, Any]) -> list[GameWord]:
    q = db.query(GameWord)
    min_m = settings.get("min_mora", 1)
    max_m = settings.get("max_mora", 12)
    q = q.filter(GameWord.mora_count >= min_m, GameWord.mora_count <= max_m)
    return q.all()


def pick_start_kana(settings: dict[str, Any], pool: list[GameWord]) -> str:
    start = settings.get("start_kana", "RANDOM")
    if start != "RANDOM":
        return start
    if not pool:
        return "か"
    w = random.choice(pool)
    return w.first_kana


def lookup_word(db: Session, normalized: str, settings: dict[str, Any]) -> Optional[GameWord]:
    hira = se.katakana_to_hiragana(normalized) if settings.get("script_mode") == se.KATAKANA else normalized
    return db.query(GameWord).filter(GameWord.hiragana == hira).first()


def init_game_state(room: GameRoom, db: Session, now: datetime) -> dict[str, Any]:
    settings = parse_settings(room)
    pool = query_word_pool(db, settings)
    if not pool:
        raise ValueError("Không có từ nào phù hợp cấu hình phòng")

    required = pick_start_kana(settings, pool)
    pids = participant_ids_ordered(room.room_id, db)
    first = pids[0] if pids else room.host_id

    return {
        "required_kana": required,
        "current_turn_user_id": first,
        "turn_started_at": now.isoformat(),
        "used_words": [],
        "history": [],
        "starter_word": None,
    }


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    return datetime.fromisoformat(val.replace("Z", ""))


def advance_turn(state: dict[str, Any], pids: list[int], now: datetime) -> None:
    state["current_turn_user_id"] = se.next_turn_user_id(pids, state.get("current_turn_user_id"))
    state["turn_started_at"] = now.isoformat()


def maybe_end_match(room: GameRoom, settings: dict[str, Any], now: datetime) -> bool:
    if room.status != "PLAYING" or not room.started_at:
        return False
    if se.match_expired(room.started_at, settings["match_minutes"], now):
        room.status = "ENDED"
        room.ended_at = now
        return True
    return False


def maybe_skip_turn(room: GameRoom, state: dict[str, Any], settings: dict[str, Any], pids: list[int], now: datetime) -> bool:
    turn_at = _parse_dt(state.get("turn_started_at"))
    if not turn_at:
        return False
    if se.turn_expired(turn_at, settings["turn_seconds"], now):
        advance_turn(state, pids, now)
        return True
    return False


def build_history_entry(user: User, word: str, meaning: str, points: int, now: datetime) -> dict:
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "word": word,
        "meaning": meaning,
        "points": points,
        "played_at": now.isoformat(),
    }