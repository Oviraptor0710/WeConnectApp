package com.weconnect.dto.friend.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.friend.FriendRequestStatus;

public record AcceptFriendRequestResponse(
        FriendRequestStatus status,
        @JsonProperty("friendship_id") Long friendshipId
) {
}
