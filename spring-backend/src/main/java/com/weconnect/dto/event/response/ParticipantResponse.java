package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.EventRegistration;

import java.time.LocalDateTime;

public record ParticipantResponse(
        @JsonProperty("user_id") Long userId,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("avatar_url") String avatarUrl,
        @JsonProperty("registered_at") LocalDateTime registeredAt
) {
    public static ParticipantResponse from(EventRegistration registration) {
        return new ParticipantResponse(
                registration.getUser().getUserId(), registration.getUser().getFullName(),
                registration.getUser().getAvatarUrl(), registration.getRegisteredAt()
        );
    }
}
