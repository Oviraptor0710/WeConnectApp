package com.weconnect.dto.chat.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.entity.Message;

public record LastMessageResponse(
        @JsonProperty("message_id") Long messageId,
        String content,
        MessageType type,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("sender_id") Long senderId
) {
    public static LastMessageResponse from(Message message) {
        if (message == null) return null;
        return new LastMessageResponse(
                message.getMessageId(),
                message.getContent(),
                message.getMessageType(),
                message.getCreatedAt().toString(),
                message.getSender().getUserId()
        );
    }
}
