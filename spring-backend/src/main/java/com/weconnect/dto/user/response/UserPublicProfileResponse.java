package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.entity.User;

import java.util.List;

public record UserPublicProfileResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl,
        @JsonProperty("cover_url") String coverUrl,
        String bio,
        String location,
        @JsonProperty("japanese_level") String japaneseLevel,
        String role,
        List<HobbyResponse> hobbies,
        @JsonProperty("friendship_status") FriendshipStatus friendshipStatus
) {
    public static UserPublicProfileResponse from(User user, FriendshipStatus friendshipStatus) {
        List<HobbyResponse> hobbyResponses = user.getHobbies() == null
                ? List.of()
                : user.getHobbies().stream().map(HobbyResponse::from).toList();

        return new UserPublicProfileResponse(
                user.getUserId(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getCoverUrl(),
                user.getBio(),
                user.getLocation(),
                user.getJapaneseLevel(),
                user.getRole(),
                hobbyResponses,
                friendshipStatus
        );
    }
}
