package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

public record SuggestionResponse(
        List<UserSearchItemResponse> data,
        @JsonInclude(JsonInclude.Include.NON_NULL) ProfileWarningResponse warning
) {
}
