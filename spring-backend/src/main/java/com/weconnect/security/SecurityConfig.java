package com.weconnect.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final List<String> allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            @Value("${app.cors.allowed-origins}") String allowedOrigins
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Cấu hình CORS (Cho phép Frontend Web gọi API)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 2. Tắt CSRF (Vì chúng ta dùng JWT và cơ chế SameSite Cookie để chống CSRF thay thế)
            .csrf(csrf -> csrf.disable())
            
            // 3. Quy định khu vực Public & Private
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/api/v1/auth/register",
                        "/api/v1/auth/send-otp",
                        "/api/v1/auth/verify-otp",
                        "/api/v1/auth/otp/send",
                        "/api/v1/auth/otp/verify",
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/logout",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/reset-password"
                ).permitAll()
                .requestMatchers("/static/**", "/uploads/**", "/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/hobbies").permitAll()
                .requestMatchers("/api/v1/auth/me").authenticated()
                .anyRequest().authenticated()
            )
            
            // 4. Báo cho Spring biết quán Bar này KHÔNG LƯU SỔ KHÁCH (Stateless)
            // Khách ra khỏi cửa là quên luôn. Lần sau vào phải xòe vé JWT ra kiểm tra lại từ đầu.
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, exception) ->
                    response.sendError(401, "Unauthorized"))
            )
            
            // 5. Xếp hàng cho Vệ sĩ: 
            // Yêu cầu anh Vệ sĩ JwtAuthFilter của chúng ta đứng chặn NGAY TRƯỚC mặt ông bảo vệ mặc định của Spring
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Cấu hình danh sách "Khách quen" (CORS) được phép nói chuyện với Backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Chỉ cho phép các tên miền Frontend này gọi API (KHÔNG được dùng "*" khi có Cookie)
        configuration.setAllowedOrigins(allowedOrigins);
        
        // Cho phép các hành động
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        
        // QUAN TRỌNG: Cho phép Frontend gửi kèm Cookie qua Backend!
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng luật CORS này cho toàn bộ đường dẫn API
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
