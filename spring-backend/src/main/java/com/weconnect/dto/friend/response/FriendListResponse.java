package com.weconnect.dto.friend.response;

import com.weconnect.dto.common.response.PaginationResponse;
import com.weconnect.dto.user.response.UserSearchItemResponse;

import java.util.List;

public record FriendListResponse(
        List<UserSearchItemResponse> data,
        PaginationResponse pagination
) {
}
