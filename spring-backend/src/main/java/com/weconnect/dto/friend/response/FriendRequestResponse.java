package com.weconnect.dto.friend.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.entity.FriendRequest;

public record FriendRequestResponse(
        @JsonProperty("request_id") Long requestId,
        @JsonProperty("sender_id") Long senderId,
        @JsonProperty("receiver_id") Long receiverId,
        FriendRequestStatus status,
        @JsonProperty("created_at") String createdAt
) {
    public static FriendRequestResponse from(FriendRequest request) {
        return new FriendRequestResponse(
                request.getRequestId(),
                request.getSender().getUserId(),
                request.getReceiver().getUserId(),
                request.getStatus(),
                request.getCreatedAt().toString()
        );
    }
}
