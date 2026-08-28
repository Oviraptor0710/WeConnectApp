package com.weconnect.domain.chat;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum MessageType {
    TEXT,
    IMAGE,
    FILE,
    GAME_INVITE;

    @JsonCreator
    public static MessageType from(String value) {
        if (value == null) return TEXT;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Loại tin nhắn không hợp lệ");
        }
    }
}
