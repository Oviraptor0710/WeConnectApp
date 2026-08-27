package com.weconnect.dto.user.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateHobbiesRequest(
        @JsonProperty("hobby_ids")
        @NotNull(message = "Danh sách sở thích không được để trống")
        List<Integer> hobbyIds
) {
}
