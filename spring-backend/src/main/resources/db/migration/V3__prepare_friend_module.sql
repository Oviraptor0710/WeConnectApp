-- Spring trở thành owner duy nhất của Friends vertical slice.
-- Giữ dữ liệu cũ nhưng chuẩn hóa status và bổ sung index cho danh sách đã gửi.

UPDATE FRIEND_REQUESTS
SET status = 'PENDING'
WHERE status IS NULL;

ALTER TABLE FRIEND_REQUESTS
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

SET @has_friend_sender_index = (
    SELECT COUNT(*)
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'FRIEND_REQUESTS'
       AND INDEX_NAME = 'idx_friend_req_sender'
);
SET @add_friend_sender_index = IF(
    @has_friend_sender_index = 0,
    'CREATE INDEX idx_friend_req_sender ON FRIEND_REQUESTS(sender_id, status)',
    'SELECT 1'
);
PREPARE add_friend_sender_index_statement FROM @add_friend_sender_index;
EXECUTE add_friend_sender_index_statement;
DEALLOCATE PREPARE add_friend_sender_index_statement;
