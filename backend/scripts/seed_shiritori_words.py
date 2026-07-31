#!/usr/bin/env python3
"""Generate SQL seed for GAME_WORDS. Run: python backend/scripts/seed_shiritori_words.py"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.data.shiritori_words import WORDS  # noqa: E402
from app.utils.shiritori_engine import (  # noqa: E402
    hiragana_to_katakana,
    mora_count,
    first_kana,
    last_chain_kana,
)


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "''")


def main() -> None:
    out = Path(__file__).resolve().parents[2] / "database" / "init" / "04b_shiritori_words_seed.sql"
    lines = [
        "-- Auto-generated Shiritori word bank. Re-run seed_shiritori_words.py to refresh.",
        f"-- Total words: {len(WORDS)}",
        "",
        "INSERT INTO GAME_WORDS (hiragana, katakana, meaning_vi, category, jlpt_level, mora_count, first_kana, last_kana, difficulty) VALUES",
    ]
    rows = []
    for hira, meaning, category, jlpt, diff in WORDS:
        kata = hiragana_to_katakana(hira)
        mc = mora_count(hira)
        fk = first_kana(hira)
        lk = last_chain_kana(hira)
        jlpt_sql = "NULL" if jlpt is None else str(jlpt)
        rows.append(
            f"('{esc(hira)}','{esc(kata)}','{esc(meaning)}','{esc(category)}',{jlpt_sql},{mc},'{esc(fk)}','{esc(lk)}',{diff})"
        )
    lines.append(",\n".join(rows))
    lines.append(
        "ON DUPLICATE KEY UPDATE katakana=VALUES(katakana), meaning_vi=VALUES(meaning_vi), "
        "category=VALUES(category), mora_count=VALUES(mora_count), first_kana=VALUES(first_kana), "
        "last_kana=VALUES(last_kana), difficulty=VALUES(difficulty);"
    )
    lines.append("")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(WORDS)} words to {out}")


if __name__ == "__main__":
    main()