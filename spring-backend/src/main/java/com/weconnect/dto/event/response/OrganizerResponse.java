package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.User;

public record OrganizerResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl
) {
    public static OrganizerResponse from(User user) {
        return new OrganizerResponse(user.getUserId(), user.getFullName(), user.getAvatarUrl());
    }
}
