package com.weconnect.dto.chat.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.User;

public record ChatUserResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl
) {
    public static ChatUserResponse from(User user) {
        return new ChatUserResponse(user.getUserId(), user.getFullName(), user.getAvatarUrl());
    }
}
