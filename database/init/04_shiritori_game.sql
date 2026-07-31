-- Migration: Shiritori (Japanese word chain) game.
-- Safe to re-run: uses IF NOT EXISTS / ON DUPLICATE KEY UPDATE.

-- 1. Room settings & runtime state ----------------------------------------
ALTER TABLE GAME_ROOMS ADD COLUMN room_settings JSON NULL;
ALTER TABLE GAME_ROOMS ADD COLUMN game_state JSON NULL;

-- 2. Word bank ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS GAME_WORDS (
    word_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    hiragana    VARCHAR(50)  NOT NULL,
    katakana    VARCHAR(50)  NOT NULL,
    meaning_vi  VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    jlpt_level  TINYINT      NULL,
    mora_count  TINYINT      NOT NULL,
    first_kana  VARCHAR(3)   NOT NULL,
    last_kana   VARCHAR(3)   NOT NULL,
    difficulty  TINYINT      DEFAULT 1,
    UNIQUE KEY uq_game_words_hiragana (hiragana),
    KEY idx_game_words_category   (category),
    KEY idx_game_words_first_kana (first_kana),
    KEY idx_game_words_last_kana  (last_kana),
    KEY idx_game_words_mora       (mora_count)
);

-- 3. Lobby entry ----------------------------------------------------------
INSERT INTO GAMES (game_id, name, description, game_type, icon_bg, badge_bg, badge_text) VALUES
('shiritori', 'Nối từ tiếng Nhật', 'しりとり • 2-8 người', 'SHIRITORI', 'bg-teal-100', 'bg-teal-50', 'text-teal-600')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon_bg = VALUES(icon_bg),
    badge_bg = VALUES(badge_bg),
    badge_text = VALUES(badge_text);