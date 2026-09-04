package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public record ShiritoriSubmitResponse(
        boolean valid,
        String reason,
        @JsonProperty("reason_params") Map<String, Object> reasonParams,
        String word,
        String meaning,
        int points,
        @JsonProperty("new_score") int newScore,
        @JsonProperty("next_kana") String nextKana,
        @JsonProperty("next_turn_user_id") Long nextTurnUserId
) {
    public static ShiritoriSubmitResponse invalid(String reason, Map<String, Object> params, int score) {
        return new ShiritoriSubmitResponse(false, reason, params, null, null, 0, score, null, null);
    }
}
