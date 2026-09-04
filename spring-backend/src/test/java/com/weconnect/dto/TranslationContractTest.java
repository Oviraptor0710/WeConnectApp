package com.weconnect.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weconnect.controller.MessageTranslationController;
import com.weconnect.domain.translation.TranslationLanguage;
import com.weconnect.dto.translation.response.MessageTranslationResponse;
import com.weconnect.security.CustomUserDetails;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TranslationContractTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void endpointOnlyNeedsMessageIdAndAuthenticatedUser() throws Exception {
        Method method = MessageTranslationController.class.getDeclaredMethod(
                "translate", Long.class, CustomUserDetails.class
        );

        assertThat(method.getParameterCount()).isEqualTo(2);
        assertThatThrownBy(() -> TranslationLanguage.from("EN"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void responseReportsTheBackendDetectedDirectionInSnakeCase() throws Exception {
        MessageTranslationResponse response = new MessageTranslationResponse(
                11L, "Xin chào", "こんにちは",
                TranslationLanguage.VI, TranslationLanguage.JA
        );

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));
        assertThat(json.get("message_id").asLong()).isEqualTo(11L);
        assertThat(json.get("original_content").asText()).isEqualTo("Xin chào");
        assertThat(json.get("translated_content").asText()).isEqualTo("こんにちは");
        assertThat(json.get("source_language").asText()).isEqualTo("VI");
        assertThat(json.get("target_language").asText()).isEqualTo("JA");
        assertThat(json.has("messageId")).isFalse();
    }
}
