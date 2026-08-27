package com.weconnect.dto.user.response;

import com.weconnect.dto.common.response.PaginationResponse;

import java.util.List;

public record UserSearchResponse(
        List<UserSearchItemResponse> data,
        PaginationResponse pagination
) {
}
