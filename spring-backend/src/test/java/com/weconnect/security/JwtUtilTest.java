package com.weconnect.security;

import com.weconnect.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-that-is-long-enough-for-hs256";

    @Test
    void accessTokenUsesLegacyCompatibleContract() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, "weconnect-auth", 900_000);
        User user = new User();
        user.setUserId(42L);
        user.setEmail("user@example.com");
        user.setRole("USER");

        String token = jwtUtil.generateAccessToken(user);
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertEquals("42", claims.getSubject());
        assertEquals("access", claims.get("type", String.class));
        assertEquals("user@example.com", claims.get("email", String.class));
        assertEquals("USER", claims.get("role", String.class));
        assertEquals("weconnect-auth", claims.getIssuer());
        assertTrue(jwtUtil.isAccessTokenValid(token, 42L));
    }
}
