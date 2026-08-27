package com.weconnect.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.dto.user.request.UpdateProfileRequest;
import com.weconnect.dto.user.response.UserSearchItemResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserProfileContractTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void partialProfileRequestDistinguishesMissingFieldFromExplicitNull() throws Exception {
        UpdateProfileRequest request = objectMapper.readValue(
                "{\"bio\":null,\"full_name\":\"  Nguyễn An  \"}",
                UpdateProfileRequest.class
        );

        assertThat(request.isProvided("bio")).isTrue();
        assertThat(request.getBio()).isNull();
        assertThat(request.isProvided("full_name")).isTrue();
        assertThat(request.isProvided("location")).isFalse();
    }

    @Test
    void searchResponseKeepsLegacySnakeCaseContract() throws Exception {
        UserSearchItemResponse response = new UserSearchItemResponse(
                7L,
                "Nguyễn An",
                "/uploads/avatars/a.jpg",
                "N3",
                "Hà Nội",
                List.of("Âm nhạc"),
                FriendshipStatus.NONE
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertThat(json.get("user_id").asLong()).isEqualTo(7L);
        assertThat(json.get("full_name").asText()).isEqualTo("Nguyễn An");
        assertThat(json.get("friendship_status").asText()).isEqualTo("NONE");
        assertThat(json.has("userId")).isFalse();
    }
}
