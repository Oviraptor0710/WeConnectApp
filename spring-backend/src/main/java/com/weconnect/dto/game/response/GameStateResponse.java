package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public record GameStateResponse(
        @JsonProperty("room_id") Long roomId,
        String code,
        String status,
        @JsonProperty("host_id") Long hostId,
        @JsonProperty("started_at") LocalDateTime startedAt,
        @JsonProperty("paused_at") LocalDateTime pausedAt,
        @JsonProperty("server_now") LocalDateTime serverNow,
        @JsonProperty("total_questions") int totalQuestions,
        @JsonProperty("cycle_seconds") int cycleSeconds,
        @JsonProperty("answer_window_seconds") int answerWindowSeconds,
        @JsonProperty("current_index") int currentIndex,
        List<QuestionResponse> questions,
        @JsonProperty("my_answers") List<Integer> myAnswers,
        List<LeaderboardEntryResponse> leaderboard
) {
}
