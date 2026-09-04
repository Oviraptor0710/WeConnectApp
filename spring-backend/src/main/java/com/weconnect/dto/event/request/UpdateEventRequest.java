package com.weconnect.dto.event.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record UpdateEventRequest(
        String title,
        String category,
        String description,
        @JsonProperty("start_time") LocalDateTime startTime,
        @JsonProperty("end_time") LocalDateTime endTime,
        String location,
        @Positive(message = "Sức chứa phải lớn hơn 0") Integer capacity,
        @JsonProperty("image_url") String imageUrl,
        String status
) {
}
