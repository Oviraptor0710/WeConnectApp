package com.weconnect.domain.translation;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum TranslationLanguage {
    VI("Vietnamese"),
    JA("Japanese");

    private final String displayName;

    TranslationLanguage(String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }

    public TranslationLanguage opposite() {
        return this == VI ? JA : VI;
    }

    @JsonCreator
    public static TranslationLanguage from(String value) {
        if (value == null || value.isBlank()) return VI;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Ngôn ngữ đích chỉ hỗ trợ VI hoặc JA");
        }
    }
}
