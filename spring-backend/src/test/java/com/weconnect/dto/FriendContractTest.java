package com.weconnect.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.dto.common.response.PaginationResponse;
import com.weconnect.dto.friend.request.SendFriendRequestRequest;
import com.weconnect.dto.friend.response.FriendRequestListItemResponse;
import com.weconnect.dto.friend.response.FriendRequestListResponse;
import com.weconnect.dto.friend.response.UserBriefResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FriendContractTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void sendRequestReadsLegacySnakeCaseContract() throws Exception {
        SendFriendRequestRequest request = objectMapper.readValue(
                "{\"receiver_id\":12}",
                SendFriendRequestRequest.class
        );

        assertThat(request.receiverId()).isEqualTo(12L);
    }

    @Test
    void requestListKeepsLegacySnakeCaseContract() throws Exception {
        FriendRequestListResponse response = new FriendRequestListResponse(
                List.of(new FriendRequestListItemResponse(
                        81L,
                        FriendRequestStatus.PENDING,
                        "2026-08-27T10:00:00",
                        new UserBriefResponse(5L, "Nguyễn An", null, "N3", "Hà Nội")
                )),
                new PaginationResponse(1, 20, 1, 1)
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));
        JsonNode item = json.get("data").get(0);

        assertThat(item.get("request_id").asLong()).isEqualTo(81L);
        assertThat(item.get("status").asText()).isEqualTo("PENDING");
        assertThat(item.get("created_at").asText()).startsWith("2026-08-27T10:00");
        assertThat(item.get("user").get("user_id").asLong()).isEqualTo(5L);
        assertThat(json.get("pagination").get("page_size").asInt()).isEqualTo(20);
        assertThat(json.get("pagination").get("total_pages").asInt()).isEqualTo(1);
        assertThat(item.has("requestId")).isFalse();
    }
}
