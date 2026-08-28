package com.weconnect.dto.chat.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.Conversation;
import com.weconnect.entity.Message;

public record ConversationResponse(
        @JsonProperty("conversation_id") Long conversationId,
        ChatUserResponse participant,
        @JsonProperty("last_message") LastMessageResponse lastMessage,
        @JsonProperty("unread_count") long unreadCount,
        @JsonProperty("last_message_at") String lastMessageAt,
        @JsonProperty("created_at") String createdAt
) {
    public static ConversationResponse from(
            Conversation conversation,
            Long viewerId,
            Message lastMessage,
            long unreadCount
    ) {
        return new ConversationResponse(
                conversation.getConversationId(),
                ChatUserResponse.from(conversation.otherParticipant(viewerId)),
                LastMessageResponse.from(lastMessage),
                unreadCount,
                conversation.getLastMessageAt() == null ? null : conversation.getLastMessageAt().toString(),
                conversation.getCreatedAt().toString()
        );
    }
}
