-- Migration: game multiplayer. Apply once to an existing weconnect DB.
-- Safe to run against a DB where GAME_ROOMS.started_at already exists
-- (the ADD COLUMN for started_at is wrapped to ignore "duplicate column").

-- 1. Columns -----------------------------------------------------------
ALTER TABLE GAME_ROOMS  ADD COLUMN paused_at    TIMESTAMP NULL;
ALTER TABLE GAME_ROOMS  ADD COLUMN ended_at     TIMESTAMP NULL;
ALTER TABLE GAME_ROOMS  ADD COLUMN question_ids JSON      NULL;
ALTER TABLE GAME_PARTICIPANTS ADD COLUMN is_ready BOOLEAN DEFAULT FALSE;

-- 2. New tables --------------------------------------------------------
CREATE TABLE IF NOT EXISTS GAME_QUESTIONS (
    question_id   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    game_type     VARCHAR(50)  NOT NULL,
    category      VARCHAR(100) NOT NULL,
    question      TEXT         NOT NULL,
    description   VARCHAR(255),
    options       JSON         NOT NULL,
    correct_index TINYINT      NOT NULL,
    hint          VARCHAR(255),
    difficulty    TINYINT      DEFAULT 1
);
CREATE INDEX idx_game_questions_type ON GAME_QUESTIONS(game_type);

CREATE TABLE IF NOT EXISTS GAME_ANSWERS (
    answer_id      BIGINT    AUTO_INCREMENT PRIMARY KEY,
    room_id        BIGINT    NOT NULL,
    user_id        BIGINT    NOT NULL,
    question_index INT       NOT NULL,
    selected_index TINYINT   NOT NULL,
    is_correct     BOOLEAN   NOT NULL,
    points         INT       NOT NULL DEFAULT 0,
    answered_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_answer_room_user_q (room_id, user_id, question_index),
    FOREIGN KEY (room_id) REFERENCES GAME_ROOMS(room_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)     ON DELETE CASCADE
);

-- 3. KANJI game row (so it appears in the lobby) -----------------------
INSERT INTO GAMES (game_id, name, description, game_type, icon_bg, badge_bg, badge_text) VALUES
('kanji', 'Luyện đọc Kanji', 'Trắc nghiệm Kanji • 2-4 người', 'KANJI', 'bg-orange-100', 'bg-orange-50', 'text-orange-500')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. Question bank -----------------------------------------------------
INSERT INTO GAME_QUESTIONS (game_type, category, question, description, options, correct_index, hint, difficulty) VALUES
('QUIZ','Văn hóa Nhật Bản','Thủ đô của Nhật Bản hiện nay là thành phố nào?','Trung tâm chính trị và kinh tế của Nhật',JSON_ARRAY('A. Osaka','B. Kyoto','C. Tokyo','D. Nagoya'),2,'Thành phố lớn nhất Nhật Bản.',1),
('QUIZ','Văn hóa Nhật Bản','Ngọn núi cao nhất và là biểu tượng của Nhật Bản tên là gì?','Cao 3.776 mét',JSON_ARRAY('A. Núi Phú Sĩ','B. Núi Aso','C. Núi Tate','D. Núi Kita'),0,'Một ngọn núi lửa đang ngủ yên.',1),
('QUIZ','Văn hóa Nhật Bản','Món ăn truyền thống ngày Tết dương lịch ở Nhật là gì?','Đựng trong hộp gỗ sơn mài Jubako',JSON_ARRAY('A. Sushi','B. Osechi Ryori','C. Tempura','D. Ramen'),1,'Mang ý nghĩa may mắn cả năm.',2),
('QUIZ','Giao tiếp','Câu đáp lại lịch sự "Không có chi" trong tiếng Nhật là gì?','Dùng khi được cảm ơn',JSON_ARRAY('A. Arigatou','B. Douitashimashite','C. Sumimasen','D. Shitsurei'),1,'Câu trả lời tiêu chuẩn khi được cảm ơn.',2),
('QUIZ','Văn hóa Nhật Bản','Trang phục truyền thống của Nhật Bản tên là gì?','Thường mặc trong dịp lễ',JSON_ARRAY('A. Hanbok','B. Áo dài','C. Kimono','D. Sườn xám'),2,'Có đai lưng obi.',1),
('QUIZ','Địa lý','Nhật Bản gồm bao nhiêu hòn đảo chính lớn?','Honshu, Hokkaido, Kyushu, Shikoku',JSON_ARRAY('A. 2','B. 3','C. 4','D. 5'),2,'Đảo lớn nhất là Honshu.',2),
('QUIZ','Văn hóa Nhật Bản','Loài hoa biểu tượng của Nhật Bản nở vào mùa xuân là gì?','Lễ hội ngắm hoa Hanami',JSON_ARRAY('A. Hoa anh đào','B. Hoa cúc','C. Hoa mơ','D. Hoa tử đằng'),0,'Tiếng Nhật gọi là Sakura.',1),
('QUIZ','Lịch sử','Thời kỳ các Samurai và Mạc phủ Tokugawa cai trị gọi là thời kỳ nào?','1603–1868',JSON_ARRAY('A. Heian','B. Edo','C. Meiji','D. Showa'),1,'Tên cũ của Tokyo.',3),
('QUIZ','Ẩm thực','Loại rượu truyền thống của Nhật nấu từ gạo lên men tên là gì?','Phục vụ nóng hoặc lạnh',JSON_ARRAY('A. Soju','B. Sake','C. Shochu','D. Umeshu'),1,'Đồng âm gần với "cá hồi" trong tiếng Anh.',1),
('QUIZ','Văn hóa Nhật Bản','Nghệ thuật gấp giấy của Nhật Bản tên là gì?','Tạo hình hạc giấy nổi tiếng',JSON_ARRAY('A. Ikebana','B. Origami','C. Bonsai','D. Kintsugi'),1,'"Ori" nghĩa là gấp, "kami" là giấy.',1),
('QUIZ','Đời sống','Tàu cao tốc nổi tiếng của Nhật Bản tên là gì?','Tốc độ trên 300 km/h',JSON_ARRAY('A. Shinkansen','B. Maglev','C. Express','D. Yamanote'),0,'Còn gọi là "tàu viên đạn".',2),
('QUIZ','Văn hóa Nhật Bản','Bộ môn đấu vật truyền thống của Nhật Bản tên là gì?','Võ sĩ có thân hình to lớn',JSON_ARRAY('A. Judo','B. Karate','C. Sumo','D. Aikido'),2,'Thi đấu trên vòng tròn dohyo.',1);

INSERT INTO GAME_QUESTIONS (game_type, category, question, description, options, correct_index, hint, difficulty) VALUES
('KANJI','Kanji N5','Cách đọc Hiragana của 水 (nước) là gì?','Một trong ngũ hành',JSON_ARRAY('A. ひ (hi)','B. みず (mizu)','C. き (ki)','D. つち (tsuchi)'),1,'Liên quan đến đồ uống.',1),
('KANJI','Kanji N5','Cách đọc Hiragana của 火 (lửa) là gì?','Thứ Ba trong tuần dùng chữ này',JSON_ARRAY('A. ひ (hi)','B. みず (mizu)','C. やま (yama)','D. かわ (kawa)'),0,'Hỏa.',1),
('KANJI','Kanji N5','Chữ 山 có nghĩa là gì?','Một dạng địa hình',JSON_ARRAY('A. Sông','B. Biển','C. Núi','D. Rừng'),2,'Đọc là やま (yama).',1),
('KANJI','Kanji N5','Cách đọc của 日本 (Nhật Bản) là gì?','Tên quốc gia',JSON_ARRAY('A. にほん (nihon)','B. にちよう (nichiyou)','C. ほんじつ (honjitsu)','D. にっき (nikki)'),0,'Đất nước mặt trời mọc.',1),
('KANJI','Kanji N4','Chữ 食 trong 食べる có nghĩa liên quan đến gì?','Hoạt động hằng ngày',JSON_ARRAY('A. Uống','B. Ăn','C. Ngủ','D. Đi'),1,'たべる (taberu).',2),
('KANJI','Kanji N4','Cách đọc của 学校 (trường học) là gì?','Nơi học tập',JSON_ARRAY('A. がっこう (gakkou)','B. かいしゃ (kaisha)','C. びょういん (byouin)','D. としょかん (toshokan)'),0,'Học sinh đến đây mỗi ngày.',2),
('KANJI','Kanji N4','Chữ 大 có nghĩa là gì?','Trái nghĩa với 小',JSON_ARRAY('A. Nhỏ','B. Lớn','C. Trung bình','D. Cao'),1,'おおきい (ookii).',1),
('KANJI','Kanji N3','Cách đọc Hiragana của 試験 (kỳ thi) là gì?','Lưu ý âm đục và âm ngắt',JSON_ARRAY('A. しけん (shiken)','B. じけん (jiken)','C. しっけん (shikken)','D. ちけん (chiken)'),0,'Sinh viên rất sợ điều này.',3),
('KANJI','Kanji N3','Cách đọc của 経済 (kinh tế) là gì?','Lĩnh vực tài chính',JSON_ARRAY('A. けいざい (keizai)','B. せいじ (seiji)','C. しゃかい (shakai)','D. ぶんか (bunka)'),0,'Gắn với tiền bạc, thị trường.',3),
('KANJI','Kanji N4','Chữ 時間 có nghĩa là gì?','Thứ ta đo bằng đồng hồ',JSON_ARRAY('A. Không gian','B. Thời gian','C. Con người','D. Tiền bạc'),1,'じかん (jikan).',2),
('KANJI','Kanji N5','Cách đọc của 人 (người) khi đứng một mình là gì?','Bộ thủ cơ bản',JSON_ARRAY('A. ひと (hito)','B. いぬ (inu)','C. ねこ (neko)','D. とり (tori)'),0,'Nghĩa là con người.',1);
