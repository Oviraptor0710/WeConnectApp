package com.weconnect.dto.friend.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.entity.FriendRequest;
import com.weconnect.entity.User;

public record FriendRequestListItemResponse(
        @JsonProperty("request_id") Long requestId,
        FriendRequestStatus status,
        @JsonProperty("created_at") String createdAt,
        UserBriefResponse user
) {
    public static FriendRequestListItemResponse from(FriendRequest request, User otherUser) {
        return new FriendRequestListItemResponse(
                request.getRequestId(),
                request.getStatus(),
                request.getCreatedAt().toString(),
                UserBriefResponse.from(otherUser)
        );
    }
}
