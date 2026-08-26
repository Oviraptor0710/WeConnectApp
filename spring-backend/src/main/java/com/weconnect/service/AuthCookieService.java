package com.weconnect.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthCookieService {

    public static final String ACCESS_COOKIE = "accessToken";
    public static final String REFRESH_COOKIE = "refreshToken";

    private final boolean secure;
    private final String sameSite;
    private final String domain;

    public AuthCookieService(
            @Value("${app.cookie.secure:false}") boolean secure,
            @Value("${app.cookie.same-site:Lax}") String sameSite,
            @Value("${app.cookie.domain:}") String domain
    ) {
        this.secure = secure;
        this.sameSite = sameSite;
        this.domain = domain;
    }

    public void writeAuthenticatedSession(HttpServletResponse response, AuthenticatedSession session) {
        addCookie(response, ACCESS_COOKIE, session.accessToken(), "/", session.accessMaxAgeSeconds());
        addCookie(response, REFRESH_COOKIE, session.refreshToken(), "/api/v1/auth", session.refreshMaxAgeSeconds());
    }

    public void clear(HttpServletResponse response) {
        addCookie(response, ACCESS_COOKIE, "", "/", 0);
        addCookie(response, REFRESH_COOKIE, "", "/api/v1/auth", 0);
    }

    private void addCookie(HttpServletResponse response, String name, String value, String path, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(Duration.ofSeconds(maxAgeSeconds));
        if (domain != null && !domain.isBlank()) {
            builder.domain(domain);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}
