package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LeaderboardEntryResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl,
        int score,
        @JsonProperty("is_ready") boolean isReady
) {
}
