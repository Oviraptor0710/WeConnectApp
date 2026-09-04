package com.weconnect.dto.event.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateFeedbackRequest(
        @NotNull(message = "Rating không được để trống")
        @Min(value = 1, message = "Rating phải từ 1 đến 5")
        @Max(value = 5, message = "Rating phải từ 1 đến 5") Integer rating,
        String comment
) {
}
