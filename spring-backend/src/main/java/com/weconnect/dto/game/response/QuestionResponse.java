package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record QuestionResponse(
        @JsonProperty("question_index") int questionIndex,
        String category,
        String question,
        String description,
        List<String> options,
        String hint,
        @JsonProperty("correct_index") Integer correctIndex
) {
}
