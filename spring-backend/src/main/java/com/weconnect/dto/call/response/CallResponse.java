package com.weconnect.dto.call.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.call.CallStatus;
import com.weconnect.domain.call.CallType;
import com.weconnect.entity.Call;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public record CallResponse(
        @JsonProperty("call_id") Long callId,
        CallUserResponse caller,
        CallUserResponse receiver,
        @JsonProperty("call_type") CallType callType,
        CallStatus status,
        @JsonProperty("created_at") String createdAt,
        @JsonProperty("accepted_at") String acceptedAt,
        @JsonProperty("ended_at") String endedAt,
        @JsonProperty("expires_at") String expiresAt
) {
    public static CallResponse from(Call call) {
        return new CallResponse(
                call.getCallId(),
                CallUserResponse.from(call.getCaller()),
                CallUserResponse.from(call.getReceiver()),
                call.getCallType(),
                call.getStatus(),
                utc(call.getCreatedAt()),
                utc(call.getAcceptedAt()),
                utc(call.getEndedAt()),
                utc(call.getExpiresAt())
        );
    }

    static String utc(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC).toString();
    }
}
