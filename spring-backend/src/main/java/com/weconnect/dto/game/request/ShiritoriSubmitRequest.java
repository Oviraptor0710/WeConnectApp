package com.weconnect.dto.game.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShiritoriSubmitRequest(
        @NotBlank @Size(max = 50) String word
) {
}
