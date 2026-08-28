-- Spring trở thành owner duy nhất của Conversation/Message.
-- Chuẩn hóa dữ liệu cũ trước khi siết contract và thêm index cho cursor/unread.

UPDATE MESSAGES SET message_type = 'TEXT' WHERE message_type IS NULL;
UPDATE MESSAGES SET is_read = FALSE WHERE is_read IS NULL;

ALTER TABLE MESSAGES
    MODIFY COLUMN message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    MODIFY COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;

SET @has_messages_conv_id = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MESSAGES'
      AND INDEX_NAME = 'idx_messages_conv_id'
);
SET @add_messages_conv_id = IF(
    @has_messages_conv_id = 0,
    'CREATE INDEX idx_messages_conv_id ON MESSAGES(conversation_id, message_id)',
    'SELECT 1'
);
PREPARE statement_messages_conv_id FROM @add_messages_conv_id;
EXECUTE statement_messages_conv_id;
DEALLOCATE PREPARE statement_messages_conv_id;

SET @has_messages_unread = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MESSAGES'
      AND INDEX_NAME = 'idx_messages_unread'
);
SET @add_messages_unread = IF(
    @has_messages_unread = 0,
    'CREATE INDEX idx_messages_unread ON MESSAGES(conversation_id, is_read, sender_id, message_id)',
    'SELECT 1'
);
PREPARE statement_messages_unread FROM @add_messages_unread;
EXECUTE statement_messages_unread;
DEALLOCATE PREPARE statement_messages_unread;

SET @has_conversations_user1_last = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CONVERSATIONS'
      AND INDEX_NAME = 'idx_conversations_user1_last'
);
SET @add_conversations_user1_last = IF(
    @has_conversations_user1_last = 0,
    'CREATE INDEX idx_conversations_user1_last ON CONVERSATIONS(user1_id, last_message_at)',
    'SELECT 1'
);
PREPARE statement_conversations_user1_last FROM @add_conversations_user1_last;
EXECUTE statement_conversations_user1_last;
DEALLOCATE PREPARE statement_conversations_user1_last;

SET @has_conversations_user2_last = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CONVERSATIONS'
      AND INDEX_NAME = 'idx_conversations_user2_last'
);
SET @add_conversations_user2_last = IF(
    @has_conversations_user2_last = 0,
    'CREATE INDEX idx_conversations_user2_last ON CONVERSATIONS(user2_id, last_message_at)',
    'SELECT 1'
);
PREPARE statement_conversations_user2_last FROM @add_conversations_user2_last;
EXECUTE statement_conversations_user2_last;
DEALLOCATE PREPARE statement_conversations_user2_last;
