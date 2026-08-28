package com.weconnect.dto.call.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.call.CallType;
import com.weconnect.entity.Call;

public record IncomingCallResponse(
        @JsonProperty("call_id") Long callId,
        CallUserResponse caller,
        @JsonProperty("call_type") CallType callType,
        @JsonProperty("expires_at") String expiresAt
) {
    public static IncomingCallResponse from(Call call) {
        return new IncomingCallResponse(
                call.getCallId(),
                CallUserResponse.from(call.getCaller()),
                call.getCallType(),
                CallResponse.utc(call.getExpiresAt())
        );
    }
}
