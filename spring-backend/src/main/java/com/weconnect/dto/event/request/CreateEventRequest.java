package com.weconnect.dto.event.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record CreateEventRequest(
        @NotBlank(message = "Tiêu đề không được để trống") String title,
        String category,
        String description,
        @NotNull(message = "Thời gian bắt đầu không được để trống")
        @JsonProperty("start_time") LocalDateTime startTime,
        @NotNull(message = "Thời gian kết thúc không được để trống")
        @JsonProperty("end_time") LocalDateTime endTime,
        String location,
        @Positive(message = "Sức chứa phải lớn hơn 0") Integer capacity,
        @JsonProperty("image_url") String imageUrl
) {
    public int normalizedCapacity() {
        return capacity == null ? 50 : capacity;
    }
}
