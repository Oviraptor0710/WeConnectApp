package com.weconnect.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateConversationRequest(
        @JsonProperty("receiver_id")
        @NotNull(message = "Người nhận không được để trống")
        @Positive(message = "Người nhận không hợp lệ")
        Long receiverId
) {
}
