package com.weconnect.dto.chat.request;

import com.weconnect.domain.chat.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank(message = "Nội dung tin nhắn không được để trống")
        @Size(max = 10000, message = "Nội dung tin nhắn không được vượt quá 10000 ký tự")
        String content,
        MessageType type
) {
    public MessageType normalizedType() {
        return type == null ? MessageType.TEXT : type;
    }
}
