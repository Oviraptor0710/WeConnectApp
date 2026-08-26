-- Spring trở thành owner duy nhất của auth trong giai đoạn Strangler.
-- Migration này chạy được cả với volume cũ dùng OTPS.identifier và schema mới dùng OTPS.email.

SET @has_identifier = (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'OTPS'
       AND COLUMN_NAME = 'identifier'
);
SET @has_email = (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'OTPS'
       AND COLUMN_NAME = 'email'
);
SET @rename_otp_column = IF(
    @has_identifier = 1 AND @has_email = 0,
    'ALTER TABLE OTPS CHANGE COLUMN identifier email VARCHAR(255) NOT NULL',
    'SELECT 1'
);
PREPARE rename_otp_statement FROM @rename_otp_column;
EXECUTE rename_otp_statement;
DEALLOCATE PREPARE rename_otp_statement;

SET @has_attempt_count = (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'OTPS'
       AND COLUMN_NAME = 'attempt_count'
);
SET @add_attempt_count = IF(
    @has_attempt_count = 0,
    'ALTER TABLE OTPS ADD COLUMN attempt_count INT NOT NULL DEFAULT 0 AFTER used',
    'SELECT 1'
);
PREPARE add_attempt_statement FROM @add_attempt_count;
EXECUTE add_attempt_statement;
DEALLOCATE PREPARE add_attempt_statement;

CREATE TABLE IF NOT EXISTS AUTH_SESSIONS (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    token_type VARCHAR(30) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_session_user
        FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
);

SET @has_auth_session_index = (
    SELECT COUNT(*)
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'AUTH_SESSIONS'
       AND INDEX_NAME = 'idx_auth_sessions_user_active'
);
SET @add_auth_session_index = IF(
    @has_auth_session_index = 0,
    'CREATE INDEX idx_auth_sessions_user_active ON AUTH_SESSIONS(user_id, revoked_at)',
    'SELECT 1'
);
PREPARE add_auth_session_index_statement FROM @add_auth_session_index;
EXECUTE add_auth_session_index_statement;
DEALLOCATE PREPARE add_auth_session_index_statement;
