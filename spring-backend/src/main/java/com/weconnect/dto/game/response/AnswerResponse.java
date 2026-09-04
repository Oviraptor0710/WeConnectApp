package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AnswerResponse(
        @JsonProperty("is_correct") boolean isCorrect,
        @JsonProperty("correct_index") int correctIndex,
        int points,
        @JsonProperty("new_score") int newScore
) {
}
