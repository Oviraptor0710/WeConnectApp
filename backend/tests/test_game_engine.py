from datetime import datetime, timedelta

from app.utils import game_engine as ge


def test_constants():
    assert ge.CYCLE_SECONDS == ge.ANSWER_WINDOW_SECONDS + ge.REVEAL_SECONDS
    assert ge.TOTAL_QUESTIONS == 10


def test_elapsed_uses_now_when_not_paused():
    start = datetime(2026, 1, 1, 12, 0, 0)
    now = start + timedelta(seconds=25)
    assert ge.elapsed_seconds(start, None, now) == 25


def test_elapsed_freezes_when_paused():
    start = datetime(2026, 1, 1, 12, 0, 0)
    paused = start + timedelta(seconds=18)
    now = start + timedelta(seconds=40)
    assert ge.elapsed_seconds(start, paused, now) == 18


def test_question_index_progression():
    assert ge.question_index(0) == 0
    assert ge.question_index(12) == 0
    assert ge.question_index(13) == 1
    assert ge.question_index(129) == 9


def test_match_ended_after_all_questions():
    assert ge.match_ended(129) is False
    assert ge.match_ended(130) is True


def test_seconds_into_cycle_and_window():
    assert ge.seconds_into_cycle(13 + 4) == 4
    assert ge.is_answer_window_open(13 + 4) is True
    assert ge.is_answer_window_open(13 + 10) is False  # in reveal gap


def test_score_correct_with_speed_bonus():
    # answered 4s into the window -> 10 base + (10 - 4) = 16
    assert ge.score_for_answer(True, seconds_into_cycle=4) == 16


def test_score_correct_at_window_edge():
    # answered at second 9 -> 10 + 1 = 11
    assert ge.score_for_answer(True, seconds_into_cycle=9) == 11


def test_score_wrong_is_zero():
    assert ge.score_for_answer(False, seconds_into_cycle=2) == 0


def test_resume_shifts_started_at_by_paused_duration():
    start = datetime(2026, 1, 1, 12, 0, 0)
    paused = start + timedelta(seconds=18)
    now = paused + timedelta(seconds=30)
    new_start = ge.resume_started_at(start, paused, now)
    # after resume, elapsed at `now` must equal the frozen 18s
    assert ge.elapsed_seconds(new_start, None, now) == 18
