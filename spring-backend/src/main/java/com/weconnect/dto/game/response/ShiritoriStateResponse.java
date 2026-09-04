package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ShiritoriStateResponse(
        @JsonProperty("room_id") Long roomId,
        String code,
        String status,
        @JsonProperty("host_id") Long hostId,
        @JsonProperty("started_at") LocalDateTime startedAt,
        @JsonProperty("paused_at") LocalDateTime pausedAt,
        @JsonProperty("ended_at") LocalDateTime endedAt,
        @JsonProperty("server_now") LocalDateTime serverNow,
        Map<String, Object> settings,
        @JsonProperty("required_kana") String requiredKana,
        @JsonProperty("current_turn_user_id") Long currentTurnUserId,
        @JsonProperty("turn_started_at") LocalDateTime turnStartedAt,
        @JsonProperty("turn_seconds_left") int turnSecondsLeft,
        @JsonProperty("match_seconds_left") int matchSecondsLeft,
        @JsonProperty("used_words") List<String> usedWords,
        List<HistoryEntry> history,
        List<LeaderboardEntryResponse> leaderboard,
        @JsonProperty("is_my_turn") boolean isMyTurn
) {
    public record HistoryEntry(
            @JsonProperty("user_id") Long userId,
            @JsonProperty("full_name") String fullName,
            String word,
            String meaning,
            int points,
            @JsonProperty("played_at") LocalDateTime playedAt
    ) {
    }
}
