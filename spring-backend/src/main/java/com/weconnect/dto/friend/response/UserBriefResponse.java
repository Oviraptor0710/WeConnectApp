package com.weconnect.dto.friend.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.User;

public record UserBriefResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl,
        @JsonProperty("japanese_level") String japaneseLevel,
        String location
) {
    public static UserBriefResponse from(User user) {
        return new UserBriefResponse(
                user.getUserId(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getJapaneseLevel(),
                user.getLocation()
        );
    }
}
