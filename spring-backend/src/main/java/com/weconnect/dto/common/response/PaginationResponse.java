package com.weconnect.dto.common.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PaginationResponse(
        int page,
        @JsonProperty("page_size") int pageSize,
        long total,
        @JsonProperty("total_pages") int totalPages
) {
}
