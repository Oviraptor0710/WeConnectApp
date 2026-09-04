package com.weconnect.dto.game.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AnswerRequest(
        @JsonProperty("question_index") int questionIndex,
        @JsonProperty("selected_index") int selectedIndex
) {
}
