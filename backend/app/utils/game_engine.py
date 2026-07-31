"""Pure timing + scoring logic for multiplayer quiz rooms.

No database access. Mirrored on the frontend in
frontend/client/lib/gameClock.ts — keep the constants identical.
"""
from __future__ import annotations

from datetime import datetime

ANSWER_WINDOW_SECONDS = 10
REVEAL_SECONDS = 3
CYCLE_SECONDS = ANSWER_WINDOW_SECONDS + REVEAL_SECONDS  # 13
TOTAL_QUESTIONS = 10
BASE_POINTS = 10
MATCH_SECONDS = CYCLE_SECONDS * TOTAL_QUESTIONS  # 130


def elapsed_seconds(started_at: datetime, paused_at: datetime | None, now: datetime) -> int:
    reference = paused_at if paused_at is not None else now
    return max(0, int((reference - started_at).total_seconds()))


def question_index(elapsed: int) -> int:
    return elapsed // CYCLE_SECONDS


def match_ended(elapsed: int) -> bool:
    return elapsed >= MATCH_SECONDS


def seconds_into_cycle(elapsed: int) -> int:
    return elapsed % CYCLE_SECONDS


def is_answer_window_open(elapsed: int) -> bool:
    return seconds_into_cycle(elapsed) < ANSWER_WINDOW_SECONDS


def score_for_answer(is_correct: bool, seconds_into_cycle: int) -> int:
    if not is_correct:
        return 0
    if seconds_into_cycle >= ANSWER_WINDOW_SECONDS:
        return BASE_POINTS
    return BASE_POINTS + (ANSWER_WINDOW_SECONDS - seconds_into_cycle)


def resume_started_at(started_at: datetime, paused_at: datetime, now: datetime) -> datetime:
    return started_at + (now - paused_at)
