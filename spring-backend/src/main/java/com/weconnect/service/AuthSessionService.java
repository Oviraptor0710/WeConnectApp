package com.weconnect.service;

import com.weconnect.entity.AuthSession;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.AuthSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class AuthSessionService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthSessionRepository sessionRepository;
    private final long refreshExpirationMs;
    private final long passwordResetExpirationMs;

    public AuthSessionService(
            AuthSessionRepository sessionRepository,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs,
            @Value("${app.password-reset.expiration-ms:600000}") long passwordResetExpirationMs
    ) {
        this.sessionRepository = sessionRepository;
        this.refreshExpirationMs = refreshExpirationMs;
        this.passwordResetExpirationMs = passwordResetExpirationMs;
    }

    @Transactional
    public IssuedToken createRefreshToken(User user) {
        return createToken(user, AuthSession.REFRESH_TOKEN, refreshExpirationMs);
    }

    @Transactional
    public RefreshedSession rotateRefreshToken(String rawToken) {
        AuthSession session = findActiveToken(rawToken, AuthSession.REFRESH_TOKEN,
                "Refresh token không hợp lệ hoặc đã hết hạn.");

        session.setRevokedAt(LocalDateTime.now());
        IssuedToken replacement = createToken(session.getUser(), AuthSession.REFRESH_TOKEN, refreshExpirationMs);
        return new RefreshedSession(session.getUser(), replacement);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        sessionRepository
                .findByTokenHashAndTokenTypeAndRevokedAtIsNull(hash(rawToken), AuthSession.REFRESH_TOKEN)
                .ifPresent(session -> session.setRevokedAt(LocalDateTime.now()));
    }

    @Transactional
    public IssuedToken createPasswordResetToken(User user) {
        return createToken(user, AuthSession.PASSWORD_RESET_TOKEN, passwordResetExpirationMs);
    }

    @Transactional
    public User consumePasswordResetToken(String rawToken) {
        AuthSession session = findActiveToken(rawToken, AuthSession.PASSWORD_RESET_TOKEN,
                "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        session.setRevokedAt(LocalDateTime.now());
        return session.getUser();
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        sessionRepository.revokeAllActiveByUserId(userId, LocalDateTime.now());
    }

    private IssuedToken createToken(User user, String tokenType, long expirationMs) {
        String rawToken = newRawToken();
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setTokenHash(hash(rawToken));
        session.setTokenType(tokenType);
        session.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(expirationMs)));
        sessionRepository.save(session);
        return new IssuedToken(rawToken, expirationMs / 1000);
    }

    private AuthSession findActiveToken(String rawToken, String tokenType, String errorMessage) {
        if (rawToken == null || rawToken.isBlank()) {
            throw BusinessException.unauthorized(errorMessage);
        }
        AuthSession session = sessionRepository
                .findByTokenHashAndTokenTypeAndRevokedAtIsNull(hash(rawToken), tokenType)
                .orElseThrow(() -> BusinessException.unauthorized(errorMessage));
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setRevokedAt(LocalDateTime.now());
            throw BusinessException.unauthorized(errorMessage);
        }
        return session;
    }

    private static String newRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    public record RefreshedSession(User user, IssuedToken refreshToken) {
    }
}
