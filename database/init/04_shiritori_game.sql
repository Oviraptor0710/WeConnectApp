-- Seed Shiritori for a newly initialized database. Tables and columns are
-- owned by 01_schema.sql so this script can follow it without duplicate DDL.

-- 1. Lobby entry ----------------------------------------------------------
INSERT INTO GAMES (game_id, name, description, game_type, icon_bg, badge_bg, badge_text) VALUES
('shiritori', 'Nối từ tiếng Nhật', 'しりとり • 2-8 người', 'SHIRITORI', 'bg-teal-100', 'bg-teal-50', 'text-teal-600')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    icon_bg = VALUES(icon_bg),
    badge_bg = VALUES(badge_bg),
    badge_text = VALUES(badge_text);
