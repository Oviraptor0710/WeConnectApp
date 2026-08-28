package com.weconnect.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record TypingRequest(
        @JsonProperty("is_typing")
        @NotNull(message = "Trạng thái nhập tin không được để trống")
        Boolean isTyping
) {
}
