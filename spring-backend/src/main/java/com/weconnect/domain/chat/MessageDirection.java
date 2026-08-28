package com.weconnect.domain.chat;

import com.weconnect.exception.BusinessException;

import java.util.Locale;

public enum MessageDirection {
    BEFORE,
    AFTER;

    public static MessageDirection from(String value) {
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            throw BusinessException.badRequest("direction phải là 'before' hoặc 'after'");
        }
    }
}
