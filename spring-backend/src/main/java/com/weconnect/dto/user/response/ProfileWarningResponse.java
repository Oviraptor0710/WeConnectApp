package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ProfileWarningResponse(
        String code,
        @JsonProperty("missing_fields") List<String> missingFields
) {
}
