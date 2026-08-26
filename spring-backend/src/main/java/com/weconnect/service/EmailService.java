package com.weconnect.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestTemplate restTemplate;

    // Hút dữ liệu từ application.yml (vốn được hút từ .env)
    @Value("${app.brevo.api-key}")
    private String brevoApiKey;

    @Value("${app.brevo.from-email}")
    private String brevoFromEmail;

    public EmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", brevoApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Ai là người gửi?
        Map<String, Object> sender = new HashMap<>();
        sender.put("name", "WeConnect System");
        sender.put("email", brevoFromEmail);

        // Gửi cho ai?
        Map<String, Object> to = new HashMap<>();
        to.put("email", toEmail);

        // Xây dựng thân thư (JSON Body)
        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(to));
        String action = "FORGOT_PASSWORD".equals(purpose) ? "đặt lại mật khẩu" : "xác nhận tài khoản";
        body.put("subject", "WeConnect - Mã OTP " + action);
        
        String htmlTemplate = "<html><body>"
                + "<h2>Chào bạn,</h2>"
                + "<p>Mã OTP xác nhận tài khoản WeConnect của bạn là: "
                + "<strong style='font-size:24px; color:#4F46E5'>" + otpCode + "</strong></p>"
                + "<p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ cho bất kỳ ai!</p>"
                + "</body></html>";
        body.put("htmlContent", htmlTemplate);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            // Bắn Request lên Brevo
            restTemplate.postForEntity(url, request, String.class);
        } catch (RestClientResponseException ex) {
            log.error("Brevo rejected OTP email: status={}, response={}",
                    ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalStateException("Brevo rejected the email request", ex);
        } catch (Exception ex) {
            log.error("Could not send OTP email to Brevo", ex);
            throw new IllegalStateException("Could not send OTP email", ex);
        }
    }
}
