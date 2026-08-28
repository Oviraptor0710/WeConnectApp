package com.weconnect.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weconnect.domain.call.CallStatus;
import com.weconnect.domain.call.CallType;
import com.weconnect.dto.call.request.CreateCallRequest;
import com.weconnect.dto.call.response.CallResponse;
import com.weconnect.dto.call.response.CallUserResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CallContractTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void createRequestReadsSnakeCaseAndDefaultsToVideo() throws Exception {
        CreateCallRequest request = objectMapper.readValue(
                "{\"callee_id\":22}", CreateCallRequest.class
        );
        assertThat(request.calleeId()).isEqualTo(22L);
        assertThat(request.normalizedType()).isEqualTo(CallType.VIDEO);
    }

    @Test
    void responseNeverExposesRoomName() throws Exception {
        CallUserResponse caller = new CallUserResponse(1L, "Caller", null);
        CallUserResponse receiver = new CallUserResponse(2L, "Receiver", null);
        CallResponse response = new CallResponse(
                7L, caller, receiver, CallType.VIDEO, CallStatus.RINGING,
                "2026-08-27T10:00:00", null, null, "2026-08-27T10:00:35"
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));
        assertThat(json.get("call_id").asLong()).isEqualTo(7L);
        assertThat(json.get("call_type").asText()).isEqualTo("VIDEO");
        assertThat(json.get("expires_at").asText()).endsWith("10:00:35");
        assertThat(json.has("room_name")).isFalse();
        assertThat(json.has("roomName")).isFalse();
    }
}
