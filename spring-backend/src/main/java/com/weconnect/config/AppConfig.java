package com.weconnect.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AppConfig {

    // Legacy JSON columns (GAME_ROOMS) use Jackson 2 directly. Spring Boot 4
    // uses Jackson 3 for HTTP conversion, so expose an explicit mapper for
    // services that serialize/deserialize those database JSON strings.
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    // Công cụ băm mật khẩu (BCrypt) - Chuẩn công nghiệp bảo mật
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Công cụ chuyên dùng để gọi HTTP Requests sang các API bên ngoài (như Brevo)
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        return new RestTemplate(requestFactory);
    }
}
