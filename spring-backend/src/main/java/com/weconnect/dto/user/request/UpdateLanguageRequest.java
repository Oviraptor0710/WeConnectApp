package com.weconnect.dto.user.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateLanguageRequest(
        @NotBlank(message = "Ngôn ngữ không được để trống")
        String language
) {
}
