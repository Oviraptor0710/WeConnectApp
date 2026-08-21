package com.weconnect.security;

import com.weconnect.entity.User;
import com.weconnect.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Tìm vé (Token)
        String jwt = null;

        // Tìm duy nhất trong HttpOnly Cookie (Bảo mật tuyệt đối cho Web, chống XSS)
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }

        // Nếu lục soát mà không thấy vé, cứ cho đi qua cổng
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String userEmail;

        try {
            // Lấy email từ vé
            userEmail = jwtUtil.extractEmail(jwt);

            // Nếu có email và vị khách này chưa được ai "đóng mộc" (chưa được xác thực)
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 3. Tra sổ Database xem có người này không
                User user = userRepository.findByEmail(userEmail).orElse(null);

                // 4. Nếu có người này và vé còn hạn
                if (user != null && jwtUtil.isTokenValid(jwt, user.getEmail())) {
                    
                    // Tạo ra thẻ tên (UsernamePasswordAuthenticationToken)
                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Đóng mộc! (Lưu thẻ tên vào bộ nhớ toàn cục)
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Nếu xé vé bị lỗi (Vé giả, mộc đỏ giả, vé hết hạn...) thì im lặng cho đi qua.
            // Spring Security sẽ tự động chặn họ lại khi họ định bước vào Khu vực VIP.
        }

        // Cuối cùng, mở cửa cho đi tiếp vào bên trong (Controller)
        filterChain.doFilter(request, response);
    }
}
