package com.weconnect.dto.game.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public record CreateGameRoomRequest(
        @JsonProperty("room_type") String roomType,
        @JsonProperty("max_players") Integer maxPlayers,
        Map<String, Object> settings
) {
    public String normalizedRoomType() {
        return roomType == null || roomType.isBlank() ? "QUIZ" : roomType.trim().toUpperCase();
    }

    public int normalizedMaxPlayers() {
        return maxPlayers == null ? 10 : maxPlayers;
    }
}
