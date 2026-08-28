-- Spring trở thành owner duy nhất của signaling và LiveKit token cho video call.
-- Giữ dữ liệu CALLS cũ, bổ sung room ngẫu nhiên và state-machine timestamps.

ALTER TABLE CALLS
    ADD COLUMN room_name VARCHAR(255) NULL AFTER status,
    ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER room_name,
    ADD COLUMN accepted_at TIMESTAMP NULL AFTER created_at,
    ADD COLUMN ended_at TIMESTAMP NULL AFTER accepted_at,
    ADD COLUMN expires_at TIMESTAMP NULL AFTER ended_at;

UPDATE CALLS
SET room_name = CONCAT('legacy-call-', call_id)
WHERE room_name IS NULL;

UPDATE CALLS
SET created_at = COALESCE(start_time, CURRENT_TIMESTAMP),
    accepted_at = COALESCE(accepted_at, start_time),
    ended_at = COALESCE(ended_at, end_time)
WHERE created_at IS NULL OR accepted_at IS NULL OR ended_at IS NULL;

UPDATE CALLS
SET expires_at = DATE_ADD(created_at, INTERVAL 35 SECOND)
WHERE expires_at IS NULL;

UPDATE CALLS SET call_type = 'VIDEO' WHERE call_type IS NULL;
UPDATE CALLS SET status = 'MISSED' WHERE status IS NULL;

ALTER TABLE CALLS
    DROP COLUMN start_time,
    DROP COLUMN end_time,
    MODIFY COLUMN call_type VARCHAR(10) NOT NULL DEFAULT 'VIDEO',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'RINGING',
    MODIFY COLUMN room_name VARCHAR(255) NOT NULL,
    MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY COLUMN expires_at TIMESTAMP NOT NULL;

ALTER TABLE CALLS ADD CONSTRAINT uq_call_room UNIQUE (room_name);
CREATE INDEX idx_calls_caller_status ON CALLS(caller_id, status, expires_at);
CREATE INDEX idx_calls_receiver_status ON CALLS(receiver_id, status, expires_at);
