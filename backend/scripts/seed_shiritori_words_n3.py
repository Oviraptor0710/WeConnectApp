#!/usr/bin/env python3
"""Generate SQL seed for JLPT N3 GAME_WORDS. Run: python backend/scripts/seed_shiritori_words_n3.py"""
from __future__ import annotations
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.data.shiritori_words_n3 import N3_WORDS, CATEGORY, JLPT_LEVEL  # noqa: E402
from app.utils.shiritori_engine import (  # noqa: E402
    hiragana_to_katakana,
    mora_count,
    first_kana,
    last_chain_kana,
)


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "''")


def build_sql(words: list[tuple[str, str, int]]) -> str:
    lines = [
        "-- ============================================================================",
        "-- Railway / DB: Ngân hàng từ Shiritori — JLPT N3 (hiragana)",
        "-- ============================================================================",
        "-- Import sau railway_shiritori_migration.sql (bảng GAME_WORDS đã tồn tại)",
        f"-- Total words: {len(words)}",
        "-- Tạo lại: python backend/scripts/seed_shiritori_words_n3.py",
        "-- ============================================================================",
        "",
        "INSERT INTO GAME_WORDS (hiragana, katakana, meaning_vi, category, jlpt_level, mora_count, first_kana, last_kana, difficulty) VALUES",
    ]
    rows = []
    seen: set[str] = set()
    for hira, meaning, diff in words:
        if hira in seen:
            continue
        if hira.endswith("ん"):
            continue
        seen.add(hira)
        kata = hiragana_to_katakana(hira)
        mc = mora_count(hira)
        fk = first_kana(hira)
        lk = last_chain_kana(hira)
        rows.append(
            f"('{esc(hira)}','{esc(kata)}','{esc(meaning)}','{CATEGORY}',{JLPT_LEVEL},{mc},'{esc(fk)}','{esc(lk)}',{diff})"
        )
    lines.append(",\n".join(rows))
    lines.append(
        "ON DUPLICATE KEY UPDATE katakana=VALUES(katakana), meaning_vi=VALUES(meaning_vi), "
        "category=VALUES(category), jlpt_level=VALUES(jlpt_level), mora_count=VALUES(mora_count), "
        "first_kana=VALUES(first_kana), last_kana=VALUES(last_kana), difficulty=VALUES(difficulty);"
    )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    sql = build_sql(N3_WORDS)
    paths = [
        root / "database" / "railway_shiritori_words_n3.sql",
        root / "database" / "init" / "04c_shiritori_words_n3.sql",
    ]
    for p in paths:
        p.write_text(sql, encoding="utf-8")
        print(f"Wrote {len(N3_WORDS)} N3 words to {p}")


if __name__ == "__main__":
    main()