package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record RegistrationResponse(
        @JsonProperty("registration_id") Long registrationId,
        @JsonProperty("registered_at") LocalDateTime registeredAt
) {
}
