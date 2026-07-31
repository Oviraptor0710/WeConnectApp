"""Pure logic for Shiritori (Japanese word chain) multiplayer rooms."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, TypedDict

HIRAGANA = "HIRAGANA"
KATAKANA = "KATAKANA"

BASE_POINTS = 10
MORA_BONUS = 2
MAX_SPEED_BONUS = 10

_HIRAGANA_SET = set(chr(c) for c in range(0x3041, 0x3097))
_KATAKANA_SET = set(chr(c) for c in range(0x30A1, 0x30FA))
_KATAKANA_TO_HIRAGANA = {chr(0x30A1 + i): chr(0x3041 + i) for i in range(0x5B)}
_HIRAGANA_TO_KATAKANA = {v: k for k, v in _KATAKANA_TO_HIRAGANA.items()}


class ValidationResult(TypedDict, total=False):
    valid: bool
    reason: Optional[str]
    reason_params: Optional[dict[str, Any]]
    points: int


def normalize_input(text: str, script_mode: str) -> str:
    """Strip whitespace and keep only kana for the chosen script."""
    text = (text or "").strip()
    allowed = _HIRAGANA_SET if script_mode == HIRAGANA else _KATAKANA_SET
    return "".join(ch for ch in text if ch in allowed)


def hiragana_to_katakana(word: str) -> str:
    return "".join(_HIRAGANA_TO_KATAKANA.get(ch, ch) for ch in word)


def katakana_to_hiragana(word: str) -> str:
    rev = {v: k for k, v in _KATAKANA_TO_HIRAGANA.items()}
    return "".join(rev.get(ch, ch) for ch in word)


def to_script(word: str, script_mode: str) -> str:
    if script_mode == KATAKANA:
        return hiragana_to_katakana(word) if any(ch in _HIRAGANA_SET for ch in word) else word
    return katakana_to_hiragana(word) if any(ch in _KATAKANA_SET for ch in word) else word


def mora_count(word: str) -> int:
    """Approximate mora count for scoring/filtering."""
    count = 0
    i = 0
    while i < len(word):
        ch = word[i]
        if ch in ("ゃ", "ゅ", "ょ", "ャ", "ュ", "ョ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
                  "ァ", "ィ", "ゥ", "ェ", "ォ", "っ", "ッ"):
            i += 1
            continue
        if ch == "ー" and count > 0:
            i += 1
            continue
        count += 1
        i += 1
    return max(count, 1)


def first_kana(word: str) -> str:
    if not word:
        return ""
    return word[0]


def is_kana_char(ch: str) -> bool:
    return len(ch) == 1 and (ch in _HIRAGANA_SET or ch in _KATAKANA_SET)


def last_chain_kana(word: str, allow_long_vowel: bool = True) -> str:
    """Return the kana the next word must start with."""
    if not word:
        return ""
    w = word
    if w[-1] in ("ん", "ン"):
        return "ん"

    if allow_long_vowel and len(w) >= 2:
        prev, last = w[-2], w[-1]
        if last in ("う", "ウ") and prev in ("う", "く", "ぐ", "す", "ず", "つ", "づ", "ぬ", "ふ", "ぶ", "ぷ", "む",
                                             "ユ", "ク", "グ", "ス", "ズ", "ツ", "ヅ", "ヌ", "フ", "ブ", "プ", "ム"):
            return last
        if last in ("い", "イ") and prev in ("き", "ぎ", "し", "じ", "ち", "ぢ", "に", "ひ", "び", "ぴ", "み", "り",
                                             "キ", "ギ", "シ", "ジ", "チ", "ヂ", "ニ", "ヒ", "ビ", "ピ", "ミ", "リ"):
            return last
        if last in ("う", "ウ") and prev in ("き", "ぎ", "し", "じ", "ち", "に", "ひ", "び", "ぴ", "み", "り",
                                             "キ", "ギ", "シ", "ジ", "チ", "ニ", "ヒ", "ビ", "ピ", "ミ", "リ"):
            if prev in ("し", "シ", "ち", "チ"):
                return last
        if prev in ("ょ", "ョ") and last in ("う", "ウ"):
            return last

    if w[-1] == "ー":
        if len(w) >= 2:
            return w[-2]
        return "ー"

    return w[-1]


def score_word(mora: int, seconds_elapsed_in_turn: int, turn_seconds: int) -> int:
    speed_bonus = max(0, MAX_SPEED_BONUS - seconds_elapsed_in_turn)
    mora_bonus = max(0, mora - 2) * MORA_BONUS
    return BASE_POINTS + mora_bonus + min(speed_bonus, turn_seconds)


def validate_submission(
    word: str,
    required_kana: str,
    used_words: list[str],
    settings: dict[str, Any],
    bank_hiragana: Optional[str],
    bank_mora: Optional[int],
) -> ValidationResult:
    script_mode = settings.get("script_mode", HIRAGANA)
    normalized = normalize_input(word, script_mode)
    if not normalized:
        return {"valid": False, "reason": "invalid_script", "points": 0}

    if normalized in used_words:
        return {"valid": False, "reason": "already_used", "points": 0}

    if last_chain_kana(normalized) in ("ん", "ン"):
        return {"valid": False, "reason": "ends_with_n", "points": 0}

    if first_kana(normalized) != required_kana:
        return {
            "valid": False,
            "reason": "wrong_start",
            "reason_params": {"kana": required_kana},
            "points": 0,
        }

    mc = mora_count(normalized)
    min_mora = settings.get("min_mora", 1)
    max_mora = settings.get("max_mora", 12)
    if mc < min_mora or mc > max_mora:
        return {
            "valid": False,
            "reason": "wrong_length",
            "reason_params": {"min": min_mora, "max": max_mora},
            "points": 0,
        }

    if not bank_hiragana:
        return {"valid": False, "reason": "not_in_bank", "points": 0}

    bank_norm = to_script(bank_hiragana, script_mode)
    if normalized != bank_norm:
        return {"valid": False, "reason": "not_in_bank", "points": 0}

    return {"valid": True, "reason": None, "points": 0}


def compute_points(mora: int, turn_started_at: datetime, now: datetime, turn_seconds: int) -> int:
    elapsed = max(0, int((now - turn_started_at).total_seconds()))
    return score_word(mora, elapsed, turn_seconds)


def next_turn_user_id(participant_ids: list[int], current_id: Optional[int]) -> int:
    if not participant_ids:
        raise ValueError("no participants")
    if current_id is None:
        return participant_ids[0]
    try:
        idx = participant_ids.index(current_id)
        return participant_ids[(idx + 1) % len(participant_ids)]
    except ValueError:
        return participant_ids[0]


def turn_expired(turn_started_at: Optional[datetime], turn_seconds: int, now: datetime) -> bool:
    if not turn_started_at:
        return False
    return int((now - turn_started_at).total_seconds()) >= turn_seconds


def match_expired(started_at: Optional[datetime], match_minutes: int, now: datetime) -> bool:
    if not started_at:
        return False
    return int((now - started_at).total_seconds()) >= match_minutes * 60


def turn_seconds_left(turn_started_at: Optional[datetime], turn_seconds: int, now: datetime) -> int:
    if not turn_started_at:
        return turn_seconds
    elapsed = int((now - turn_started_at).total_seconds())
    return max(0, turn_seconds - elapsed)


def match_seconds_left(started_at: Optional[datetime], match_minutes: int, now: datetime) -> int:
    if not started_at:
        return match_minutes * 60
    elapsed = int((now - started_at).total_seconds())
    return max(0, match_minutes * 60 - elapsed)


def default_settings() -> dict[str, Any]:
    return {
        "script_mode": HIRAGANA,
        "min_mora": 2,
        "max_mora": 8,
        "start_kana": "RANDOM",
        "turn_seconds": 30,
        "match_minutes": 10,
        "allow_long_vowel_chain": True,
    }