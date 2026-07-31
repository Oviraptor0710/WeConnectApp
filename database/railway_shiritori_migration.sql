-- ============================================================================
-- Railway migration: Game Shiritori (Nối từ tiếng Nhật)
-- ============================================================================
-- Cách import trên Railway:
--   1. Vào Railway → MySQL service → tab "Data" hoặc Connect → Query
--   2. Chọn database weconnect (hoặc tên DB của bạn)
--   3. Import / paste & chạy file này TRƯỚC
--   4. Sau đó import file: database/railway_shiritori_words.sql
--
-- File này an toàn chạy lại: bỏ qua cột/bảng đã tồn tại.
-- ============================================================================

-- 1. Thêm cột cấu hình phòng & trạng thái game (nếu chưa có) ---------------
SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'GAME_ROOMS' AND COLUMN_NAME = 'room_settings') = 0,
  'ALTER TABLE GAME_ROOMS ADD COLUMN room_settings JSON NULL',
  'SELECT ''room_settings already exists'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'GAME_ROOMS' AND COLUMN_NAME = 'game_state') = 0,
  'ALTER TABLE GAME_ROOMS ADD COLUMN game_state JSON NULL',
  'SELECT ''game_state already exists'' AS note'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Bảng ngân hàng từ ------------------------------------------------------
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

-- 3. Thêm game vào lobby ----------------------------------------------------
INSERT INTO GAMES (game_id, name, description, game_type, icon_bg, badge_bg, badge_text) VALUES
('shiritori', 'Nối từ tiếng Nhật', 'しりとり • 2-8 người', 'SHIRITORI', 'bg-teal-100', 'bg-teal-50', 'text-teal-600')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    game_type = VALUES(game_type),
    icon_bg = VALUES(icon_bg),
    badge_bg = VALUES(badge_bg),
    badge_text = VALUES(badge_text);

-- Hoàn tất phần schema. Tiếp theo import railway_shiritori_words.sql
SELECT 'Shiritori schema OK. Import railway_shiritori_words.sql để nạp 594 từ.' AS next_step;