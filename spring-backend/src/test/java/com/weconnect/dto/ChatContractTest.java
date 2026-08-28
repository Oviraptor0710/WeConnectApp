package com.weconnect.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.dto.chat.request.MarkConversationReadRequest;
import com.weconnect.dto.chat.request.SendMessageRequest;
import com.weconnect.dto.chat.response.ChatMessageResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChatContractTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void requestsKeepLegacySnakeCaseAndCaseInsensitiveMessageType() throws Exception {
        MarkConversationReadRequest readRequest = objectMapper.readValue(
                "{\"last_read_message_id\":42}",
                MarkConversationReadRequest.class
        );
        SendMessageRequest messageRequest = objectMapper.readValue(
                "{\"content\":\"Xin chào\",\"type\":\"game_invite\"}",
                SendMessageRequest.class
        );

        assertThat(readRequest.lastReadMessageId()).isEqualTo(42L);
        assertThat(messageRequest.type()).isEqualTo(MessageType.GAME_INVITE);
    }

    @Test
    void messageResponseKeepsFrontendContract() throws Exception {
        ChatMessageResponse response = new ChatMessageResponse(
                9L, 3L, 7L, "hello", MessageType.TEXT, null,
                "2026-08-27T10:00:00", false
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));
        assertThat(json.get("message_id").asLong()).isEqualTo(9L);
        assertThat(json.get("conversation_id").asLong()).isEqualTo(3L);
        assertThat(json.get("sender_id").asLong()).isEqualTo(7L);
        assertThat(json.get("type").asText()).isEqualTo("TEXT");
        assertThat(json.get("is_read").asBoolean()).isFalse();
        assertThat(json.has("messageId")).isFalse();
    }
}
