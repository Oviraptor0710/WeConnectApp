from datetime import datetime, timedelta

from app.utils import shiritori_engine as se


def test_normalize_hiragana_only():
    assert se.normalize_input("  かばん  ", se.HIRAGANA) == "かばん"
    assert se.normalize_input("abcかばん123", se.HIRAGANA) == "かばん"


def test_last_chain_kana_long_vowel():
    assert se.last_chain_kana("きょう") == "う"
    assert se.last_chain_kana("こーひー") == "ひ"


def test_validate_rejects_n_ending():
    result = se.validate_submission(
        "さる", "さ", [], {"script_mode": se.HIRAGANA, "min_mora": 1, "max_mora": 8},
        "さる", 2,
    )
    assert result["valid"] is True

    bad = se.validate_submission(
        "さかな", "さ", ["さかな"], {"script_mode": se.HIRAGANA, "min_mora": 1, "max_mora": 8},
        "さかな", 3,
    )
    assert bad["valid"] is False


def test_next_turn_rotates():
    ids = [1, 2, 3]
    assert se.next_turn_user_id(ids, 1) == 2
    assert se.next_turn_user_id(ids, 3) == 1
    assert se.next_turn_user_id(ids, None) == 1


def test_turn_and_match_expiry():
    start = datetime(2026, 1, 1, 12, 0, 0)
    now = start + timedelta(seconds=31)
    assert se.turn_expired(start, 30, now) is True
    assert se.match_expired(start, 10, start + timedelta(minutes=11)) is True


def test_score_word_includes_bonuses():
    pts = se.score_word(mora=4, seconds_elapsed_in_turn=2, turn_seconds=30)
    assert pts > se.BASE_POINTS