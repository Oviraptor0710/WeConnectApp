-- ============================================================
--  WeConnect – Schema
--  File: 01_schema.sql
--  Chạy tự động khi container MySQL khởi động lần đầu
-- ============================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS weconnect
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE weconnect;

-- ── 1. HOBBIES ───────────────────────────────────────────────
CREATE TABLE HOBBIES (
    hobby_id   INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    category   VARCHAR(100)
);

-- ── 2. USERS ─────────────────────────────────────────────────
CREATE TABLE USERS (
    user_id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    phone_number       VARCHAR(20)  UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    full_name          VARCHAR(255) NOT NULL,
    date_of_birth      DATE,
    gender             VARCHAR(20),
    avatar_url         VARCHAR(500),
    cover_url          VARCHAR(500),
    bio                TEXT,
    location           VARCHAR(255),
    japanese_level     VARCHAR(50),
    job_title          VARCHAR(255),
    education          VARCHAR(255),
    relationship_status VARCHAR(50),
    preferred_language VARCHAR(10)  DEFAULT 'vi',
    role               VARCHAR(20)  DEFAULT 'USER',
    is_verified        BOOLEAN      DEFAULT FALSE,
    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 3. USER_HOBBIES (M-N) ────────────────────────────────────
CREATE TABLE USER_HOBBIES (
    user_id  BIGINT NOT NULL,
    hobby_id INT    NOT NULL,
    PRIMARY KEY (user_id, hobby_id),
    FOREIGN KEY (user_id)  REFERENCES USERS(user_id)  ON DELETE CASCADE,
    FOREIGN KEY (hobby_id) REFERENCES HOBBIES(hobby_id) ON DELETE CASCADE
);

-- ── 4. FRIEND_REQUESTS ───────────────────────────────────────
CREATE TABLE FRIEND_REQUESTS (
    request_id   BIGINT      AUTO_INCREMENT PRIMARY KEY,
    sender_id    BIGINT      NOT NULL,
    receiver_id  BIGINT      NOT NULL,
    status       VARCHAR(20) DEFAULT 'PENDING',   -- PENDING | ACCEPTED | REJECTED | CANCELLED
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP   NULL,
    FOREIGN KEY (sender_id)   REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    UNIQUE KEY uq_friend_request (sender_id, receiver_id)
);

-- ── 5. FRIENDSHIPS ───────────────────────────────────────────
CREATE TABLE FRIENDSHIPS (
    friendship_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    user1_id      BIGINT    NOT NULL,
    user2_id      BIGINT    NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    CHECK (user1_id < user2_id),
    UNIQUE KEY uq_friendship (user1_id, user2_id)
);

-- ── 6. CONVERSATIONS ─────────────────────────────────────────
CREATE TABLE CONVERSATIONS (
    conversation_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    user1_id        BIGINT    NOT NULL,
    user2_id        BIGINT    NOT NULL,
    last_message_at TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    CHECK (user1_id < user2_id),
    UNIQUE KEY uq_conversation (user1_id, user2_id)
);

-- ── 7. MESSAGES ──────────────────────────────────────────────
CREATE TABLE MESSAGES (
    message_id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
    conversation_id     BIGINT      NOT NULL,
    sender_id           BIGINT      NOT NULL,
    content             TEXT        NOT NULL,
    message_type        VARCHAR(20) DEFAULT 'TEXT',   -- TEXT | IMAGE | FILE
    translated_content  TEXT        NULL,
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    is_read             BOOLEAN     DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)       REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- ── 8. CALLS ─────────────────────────────────────────────────
CREATE TABLE CALLS (
    call_id     BIGINT      AUTO_INCREMENT PRIMARY KEY,
    caller_id   BIGINT      NOT NULL,
    receiver_id BIGINT      NOT NULL,
    call_type   VARCHAR(10) DEFAULT 'AUDIO',  -- AUDIO | VIDEO
    status      VARCHAR(20) DEFAULT 'MISSED', -- MISSED | ACCEPTED | REJECTED
    start_time  TIMESTAMP   NULL,
    end_time    TIMESTAMP   NULL,
    FOREIGN KEY (caller_id)   REFERENCES USERS(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- ── 9. EVENTS ────────────────────────────────────────────────
CREATE TABLE EVENTS (
    event_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    organizer_id BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    category     VARCHAR(100),
    description  TEXT,
    start_time   TIMESTAMP    NOT NULL,
    end_time     TIMESTAMP    NOT NULL,
    location     VARCHAR(255),
    capacity     INT          DEFAULT 50,
    image_url    VARCHAR(500),
    status       VARCHAR(20)  DEFAULT 'UPCOMING', -- UPCOMING | ONGOING | ENDED | CANCELLED
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- ── 10. EVENT_REGISTRATIONS ──────────────────────────────────
CREATE TABLE EVENT_REGISTRATIONS (
    registration_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    event_id        BIGINT    NOT NULL,
    user_id         BIGINT    NOT NULL,
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES USERS(user_id)  ON DELETE CASCADE,
    UNIQUE KEY uq_event_user (event_id, user_id)
);

-- ── 11. EVENT_FEEDBACK ───────────────────────────────────────
CREATE TABLE EVENT_FEEDBACK (
    feedback_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    event_id    BIGINT    NOT NULL,
    user_id     BIGINT    NOT NULL,
    rating      INT       NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES USERS(user_id)  ON DELETE CASCADE,
    UNIQUE KEY uq_feedback_user (event_id, user_id),
    CHECK (rating BETWEEN 1 AND 5)
);

-- ── 12. GAME_ROOMS ───────────────────────────────────────────
CREATE TABLE GAME_ROOMS (
    room_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    host_id     BIGINT       NOT NULL,
    room_type   VARCHAR(50)  DEFAULT 'QUIZ',    -- QUIZ | TRIVIA | CUSTOM
    max_players INT          DEFAULT 10,
    status      VARCHAR(20)  DEFAULT 'WAITING', -- WAITING | PLAYING | ENDED
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    started_at  TIMESTAMP    NULL,
    paused_at   TIMESTAMP    NULL,
    ended_at    TIMESTAMP    NULL,
    question_ids JSON        NULL,
    room_settings JSON       NULL,
    game_state JSON          NULL,
    FOREIGN KEY (host_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

-- ── 12b. GAME_WORDS (Shiritori word bank) ────────────────────
CREATE TABLE GAME_WORDS (
    word_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    hiragana    VARCHAR(50)  NOT NULL UNIQUE,
    katakana    VARCHAR(50)  NOT NULL,
    meaning_vi  VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    jlpt_level  TINYINT      NULL,
    mora_count  TINYINT      NOT NULL,
    first_kana  VARCHAR(3)   NOT NULL,
    last_kana   VARCHAR(3)   NOT NULL,
    difficulty  TINYINT      DEFAULT 1
);
CREATE INDEX idx_game_words_category   ON GAME_WORDS(category);
CREATE INDEX idx_game_words_first_kana ON GAME_WORDS(first_kana);
CREATE INDEX idx_game_words_last_kana  ON GAME_WORDS(last_kana);
CREATE INDEX idx_game_words_mora       ON GAME_WORDS(mora_count);

-- ── 13. GAME_PARTICIPANTS ────────────────────────────────────
CREATE TABLE GAME_PARTICIPANTS (
    participant_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    room_id        BIGINT    NOT NULL,
    user_id        BIGINT    NOT NULL,
    joined_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at        TIMESTAMP NULL,
    score          INT       DEFAULT 0,
    is_ready       BOOLEAN   DEFAULT FALSE,
    FOREIGN KEY (room_id)  REFERENCES GAME_ROOMS(room_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES USERS(user_id)     ON DELETE CASCADE
);

-- ── 14. GAME_MESSAGES ────────────────────────────────────────
CREATE TABLE GAME_MESSAGES (
    message_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT    NOT NULL,
    sender_id  BIGINT    NOT NULL,
    content    TEXT      NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id)   REFERENCES GAME_ROOMS(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES USERS(user_id)     ON DELETE CASCADE
);

-- ── 15. OTPS ─────────────────────────────────────────────────
CREATE TABLE OTPS (
    otp_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,  -- email hoặc phone (chưa có user_id)
    code       VARCHAR(10)  NOT NULL,
    purpose    VARCHAR(50)  NOT NULL,  -- REGISTER | FORGOT_PASSWORD
    expire_at  TIMESTAMP    NOT NULL,
    used       BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── 16. GAMES ─────────────────────────────────────────────────
CREATE TABLE GAMES (
    game_id     VARCHAR(50)  PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    game_type   VARCHAR(50)  NOT NULL UNIQUE,
    icon_bg     VARCHAR(50),
    badge_bg    VARCHAR(50),
    badge_text  VARCHAR(50)
);

-- ── 17. GAME_QUESTIONS ───────────────────────────────────────
CREATE TABLE GAME_QUESTIONS (
    question_id   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    game_type     VARCHAR(50)  NOT NULL,        -- QUIZ | KANJI
    category      VARCHAR(100) NOT NULL,
    question      TEXT         NOT NULL,
    description   VARCHAR(255),
    options       JSON         NOT NULL,
    correct_index TINYINT      NOT NULL,
    hint          VARCHAR(255),
    difficulty    TINYINT      DEFAULT 1
);
CREATE INDEX idx_game_questions_type ON GAME_QUESTIONS(game_type);

-- ── 18. GAME_ANSWERS ─────────────────────────────────────────
CREATE TABLE GAME_ANSWERS (
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

-- ============================================================
--  Indexes (hiệu năng)
-- ============================================================

CREATE INDEX idx_users_role           ON USERS(role);
CREATE INDEX idx_users_japanese_level ON USERS(japanese_level);

CREATE INDEX idx_messages_conv_time   ON MESSAGES(conversation_id, created_at DESC);

CREATE INDEX idx_friend_req_receiver  ON FRIEND_REQUESTS(receiver_id, status);
CREATE INDEX idx_friendships_user1    ON FRIENDSHIPS(user1_id);
CREATE INDEX idx_friendships_user2    ON FRIENDSHIPS(user2_id);

CREATE INDEX idx_events_start         ON EVENTS(start_time);
CREATE INDEX idx_events_status        ON EVENTS(status);

CREATE INDEX idx_event_reg_event      ON EVENT_REGISTRATIONS(event_id);
CREATE INDEX idx_event_reg_user       ON EVENT_REGISTRATIONS(user_id);

CREATE INDEX idx_game_rooms_status    ON GAME_ROOMS(status);

CREATE INDEX idx_otps_lookup          ON OTPS(identifier, code, used);
