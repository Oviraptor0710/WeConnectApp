package com.weconnect.dto.friend.response;

import com.weconnect.dto.common.response.PaginationResponse;

import java.util.List;

public record FriendRequestListResponse(
        List<FriendRequestListItemResponse> data,
        PaginationResponse pagination
) {
}
