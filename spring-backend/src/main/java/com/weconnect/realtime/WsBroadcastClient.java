package com.weconnect.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Component
public class WsBroadcastClient {
    private static final Logger log = LoggerFactory.getLogger(WsBroadcastClient.class);
    private final RestClient restClient;
    private final String internalSecret;

    public WsBroadcastClient(
            @Value("${app.ws.internal-url}") String internalUrl,
            @Value("${app.ws.internal-secret}") String internalSecret,
            @Value("${app.ws.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${app.ws.read-timeout-ms:5000}") int readTimeoutMs
    ) {
        // Node/Express ws-server chỉ cần HTTP/1.1. Ép dùng request factory
        // dựa trên HttpURLConnection để tránh lỗi EOF của HTTP client mặc định
        // ("header parser received no bytes") khi tái sử dụng connection trong Docker.
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeoutMs);
        requestFactory.setReadTimeout(readTimeoutMs);

        this.restClient = RestClient.builder()
                .baseUrl(internalUrl)
                .requestFactory(requestFactory)
                .defaultHeader("Connection", "close")
                .build();
        this.internalSecret = internalSecret;
    }

    public boolean broadcast(String room, String event, Object data) {
        try {
            restClient.post()
                    .uri("/internal/broadcast")
                    .header("X-Internal-Secret", internalSecret)
                    .body(Map.of("room", room, "event", event, "data", data))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException exception) {
            log.warn("Không thể broadcast event {} tới room {}: {}", event, room, exception.getMessage());
            return false;
        }
    }
}
