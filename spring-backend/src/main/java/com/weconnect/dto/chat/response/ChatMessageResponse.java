package com.weconnect.dto.chat.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.entity.Message;

public record ChatMessageResponse(
        @JsonProperty("message_id") Long messageId,
        @JsonProperty("conversation_id") Long conversationId,
        @JsonProperty("sender_id") Long senderId,
        String content,
        MessageType type,
        @JsonProperty("translated_content") String translatedContent,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("is_read") boolean isRead
) {
    public static ChatMessageResponse from(Message message) {
        return from(message, message.getTranslatedContent());
    }

    public static ChatMessageResponse from(Message message, String translatedContent) {
        return new ChatMessageResponse(
                message.getMessageId(),
                message.getConversation().getConversationId(),
                message.getSender().getUserId(),
                message.getContent(),
                message.getMessageType(),
                translatedContent,
                message.getCreatedAt().toString(),
                Boolean.TRUE.equals(message.getIsRead())
        );
    }
}
