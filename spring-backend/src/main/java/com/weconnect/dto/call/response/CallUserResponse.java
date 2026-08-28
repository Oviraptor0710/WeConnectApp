package com.weconnect.dto.call.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.User;

public record CallUserResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl
) {
    public static CallUserResponse from(User user) {
        return new CallUserResponse(user.getUserId(), user.getFullName(), user.getAvatarUrl());
    }
}
