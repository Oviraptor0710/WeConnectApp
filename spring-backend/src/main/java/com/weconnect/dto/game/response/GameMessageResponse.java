package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.GameMessage;

import java.time.LocalDateTime;

public record GameMessageResponse(
        @JsonProperty("message_id") Long messageId,
        @JsonProperty("room_id") Long roomId,
        @JsonProperty("sender_id") Long senderId,
        @JsonProperty("sender_name") String senderName,
        String content,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    public static GameMessageResponse from(GameMessage message) {
        return new GameMessageResponse(message.getMessageId(), message.getRoom().getRoomId(),
                message.getSender().getUserId(), message.getSender().getFullName(), message.getContent(), message.getCreatedAt());
    }
}
