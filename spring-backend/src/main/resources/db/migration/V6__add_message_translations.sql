-- Cache bản dịch theo message và ngôn ngữ đích. Không migrate cột
-- MESSAGES.translated_content vì dữ liệu cũ không ghi lại ngôn ngữ đích.

CREATE TABLE IF NOT EXISTS MESSAGE_TRANSLATIONS (
    translation_id       BIGINT       AUTO_INCREMENT PRIMARY KEY,
    message_id           BIGINT       NOT NULL,
    source_language      VARCHAR(10)  NOT NULL,
    target_language      VARCHAR(10)  NOT NULL,
    translated_content   TEXT         NOT NULL,
    provider             VARCHAR(30)  NOT NULL,
    model_name           VARCHAR(100) NOT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_translation_message
        FOREIGN KEY (message_id) REFERENCES MESSAGES(message_id) ON DELETE CASCADE,
    CONSTRAINT uq_message_translation UNIQUE (message_id, target_language),
    CONSTRAINT chk_message_translation_source_language
        CHECK (source_language IN ('VI', 'JA')),
    CONSTRAINT chk_message_translation_target_language
        CHECK (target_language IN ('VI', 'JA'))
);
