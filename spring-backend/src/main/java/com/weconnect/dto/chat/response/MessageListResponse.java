package com.weconnect.dto.chat.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record MessageListResponse(
        List<ChatMessageResponse> data,
        @JsonInclude(JsonInclude.Include.ALWAYS)
        @JsonProperty("next_cursor") Long nextCursor
) {
}
