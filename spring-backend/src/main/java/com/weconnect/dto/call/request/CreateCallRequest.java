package com.weconnect.dto.call.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.call.CallType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateCallRequest(
        @JsonProperty("callee_id")
        @NotNull(message = "Người nhận không được để trống")
        @Positive(message = "Người nhận không hợp lệ")
        Long calleeId,
        CallType type
) {
    public CallType normalizedType() {
        return type == null ? CallType.VIDEO : type;
    }
}
