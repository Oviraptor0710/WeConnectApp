package com.weconnect.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Lấy config từ file application.yml
    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // Biến chuỗi String bí mật thành Chìa Khóa Mật Mã (SecretKey)
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // 1. Tạo Access Token (Vé VIP ngắn hạn - 15 phút)
    public String generateAccessToken(String email) {
        return buildToken(email, accessExpirationMs);
    }

    // 2. Tạo Refresh Token (Vé VIP dài hạn để đổi vé mới - 30 ngày)
    public String generateRefreshToken(String email) {
        return buildToken(email, refreshExpirationMs);
    }

    // Hàm lõi: Chế tạo vé
    private String buildToken(String email, long expirationMs) {
        return Jwts.builder()
                .subject(email) // Đưa tên người dùng (email) lên vé
                .issuedAt(new Date(System.currentTimeMillis())) // Thời gian in vé
                .expiration(new Date(System.currentTimeMillis() + expirationMs)) // Thời gian hết hạn
                .signWith(getSigningKey()) // Đóng dấu mộc đỏ
                .compact(); // Nén lại thành chuỗi String ngắn gọn
    }

    // 3. Đọc tên người dùng (email) từ trên vé
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 4. Kiểm tra vé còn hạn không?
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 5. Vệ sĩ soát vé: Vé có phải của người này không, và còn hạn không?
    public boolean isTokenValid(String token, String userEmail) {
        final String email = extractEmail(token);
        return (email.equals(userEmail)) && !isTokenExpired(token);
    }

    // Hàm lõi: Giải mã chiếc vé bằng Chìa Khóa Mật Mã
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parser()
                .verifyWith(getSigningKey()) // Kiểm tra dấu mộc đỏ
                .build()
                .parseSignedClaims(token)
                .getPayload(); // Trích xuất thông tin
        return claimsResolver.apply(claims);
    }
}
