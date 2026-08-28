package com.weconnect.dto.call.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CallConnectionResponse(
        CallResponse call,
        CallUserResponse partner,
        @JsonProperty("server_url") String serverUrl,
        @JsonProperty("participant_token") String participantToken
) {
}
