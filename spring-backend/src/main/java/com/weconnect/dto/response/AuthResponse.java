package com.weconnect.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String message;
    private Long userId;
    private String email;
    private String fullName;
    private String role;
}
