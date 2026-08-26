package com.weconnect.dto.response;

public record ResetTokenResponse(String resetToken, long expiresIn) {
}
