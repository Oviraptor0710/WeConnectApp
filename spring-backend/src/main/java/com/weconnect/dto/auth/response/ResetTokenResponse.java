package com.weconnect.dto.auth.response;

public record ResetTokenResponse(String resetToken, long expiresIn) {
}
