package com.weconnect.dto.translation.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.domain.translation.TranslationLanguage;
import com.weconnect.entity.Message;
import com.weconnect.entity.MessageTranslation;

public record MessageTranslationResponse(
        @JsonProperty("message_id") Long messageId,
        @JsonProperty("original_content") String originalContent,
        @JsonProperty("translated_content") String translatedContent,
        @JsonProperty("source_language") TranslationLanguage sourceLanguage,
        @JsonProperty("target_language") TranslationLanguage targetLanguage
) {
    public static MessageTranslationResponse from(Message message, MessageTranslation translation) {
        return new MessageTranslationResponse(
                message.getMessageId(),
                message.getContent(),
                translation.getTranslatedContent(),
                translation.getSourceLanguage(),
                translation.getTargetLanguage()
        );
    }
}
