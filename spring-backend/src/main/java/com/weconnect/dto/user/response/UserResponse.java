package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.User;

import java.time.LocalDate;
import java.util.List;

public record UserResponse(
        @JsonProperty("user_id") Long userId,
        String email,
        @JsonProperty("phone_number") String phoneNumber,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("date_of_birth") LocalDate dateOfBirth,
        String gender,
        @JsonProperty("avatar_url") String avatarUrl,
        @JsonProperty("cover_url") String coverUrl,
        String bio,
        String location,
        @JsonProperty("japanese_level") String japaneseLevel,
        @JsonProperty("job_title") String jobTitle,
        String education,
        @JsonProperty("relationship_status") String relationshipStatus,
        @JsonProperty("preferred_language") String preferredLanguage,
        String role,
        @JsonProperty("is_verified") boolean verified,
        List<HobbyResponse> hobbies
) {
    public static UserResponse from(User user) {
        List<HobbyResponse> hobbyResponses = user.getHobbies() == null
                ? List.of()
                : user.getHobbies().stream().map(HobbyResponse::from).toList();

        return new UserResponse(
                user.getUserId(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getFullName(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getAvatarUrl(),
                user.getCoverUrl(),
                user.getBio(),
                user.getLocation(),
                user.getJapaneseLevel(),
                user.getJobTitle(),
                user.getEducation(),
                user.getRelationshipStatus(),
                user.getPreferredLanguage(),
                user.getRole(),
                Boolean.TRUE.equals(user.getIsVerified()),
                hobbyResponses
        );
    }
}
