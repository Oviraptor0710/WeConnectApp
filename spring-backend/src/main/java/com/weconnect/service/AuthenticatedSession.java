package com.weconnect.service;

import com.weconnect.entity.User;

public record AuthenticatedSession(
        User user,
        String accessToken,
        long accessMaxAgeSeconds,
        String refreshToken,
        long refreshMaxAgeSeconds
) {
}
