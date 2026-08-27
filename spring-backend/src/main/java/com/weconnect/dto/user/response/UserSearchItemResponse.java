package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.entity.User;

import java.util.List;

public record UserSearchItemResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl,
        @JsonProperty("japanese_level") String japaneseLevel,
        String location,
        List<String> hobbies,
        @JsonProperty("friendship_status") FriendshipStatus friendshipStatus
) {
    public static UserSearchItemResponse from(User user, FriendshipStatus friendshipStatus) {
        List<String> hobbyNames = user.getHobbies() == null
                ? List.of()
                : user.getHobbies().stream().map(hobby -> hobby.getName()).toList();

        return new UserSearchItemResponse(
                user.getUserId(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getJapaneseLevel(),
                user.getLocation(),
                hobbyNames,
                friendshipStatus
        );
    }
}
