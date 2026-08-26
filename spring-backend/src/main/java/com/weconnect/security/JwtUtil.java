package com.weconnect.security;

import com.weconnect.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    public static final String ACCESS_TOKEN_TYPE = "access";

    private final SecretKey signingKey;
    private final String issuer;
    private final long accessExpirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secretKey,
            @Value("${app.jwt.issuer:weconnect-auth}") String issuer,
            @Value("${app.jwt.access-expiration-ms}") long accessExpirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.accessExpirationMs = accessExpirationMs;
    }

    /**
     * Contract dùng chung trong giai đoạn Strangler:
     * sub=user_id, type=access. FastAPI và WebSocket cũ đều hiểu contract này.
     */
    public String generateAccessToken(User user) {
        return buildToken(
                user.getUserId().toString(),
                Map.of(
                        "type", ACCESS_TOKEN_TYPE,
                        "email", user.getEmail(),
                        "role", user.getRole()
                ),
                accessExpirationMs
        );
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }

    public String extractTokenType(String token) {
        return parseClaims(token).get("type", String.class);
    }

    public boolean isAccessTokenValid(String token, Long expectedUserId) {
        Claims claims = parseClaims(token);
        return ACCESS_TOKEN_TYPE.equals(claims.get("type", String.class))
                && expectedUserId.toString().equals(claims.getSubject())
                && claims.getExpiration().after(new Date());
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    private String buildToken(String subject, Map<String, Object> claims, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuer(issuer)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
