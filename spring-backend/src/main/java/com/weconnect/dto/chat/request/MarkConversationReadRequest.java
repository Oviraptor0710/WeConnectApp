package com.weconnect.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Positive;

public record MarkConversationReadRequest(
        @JsonProperty("last_read_message_id")
        @Positive(message = "Tin nhắn đã đọc không hợp lệ")
        Long lastReadMessageId
) {
}
