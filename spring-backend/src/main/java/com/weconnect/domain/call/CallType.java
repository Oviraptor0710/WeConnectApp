package com.weconnect.domain.call;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.weconnect.exception.BusinessException;

import java.util.Locale;

public enum CallType {
    AUDIO,
    VIDEO;

    @JsonCreator
    public static CallType from(String value) {
        if (value == null || value.isBlank()) return VIDEO;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw BusinessException.badRequest("Loại cuộc gọi không hợp lệ");
        }
    }
}
