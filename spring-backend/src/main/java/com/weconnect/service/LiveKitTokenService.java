package com.weconnect.service;

import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LiveKitTokenService {
    private final String serverUrl;
    private final String apiKey;
    private final String apiSecret;
    private final long tokenTtlMillis;

    public LiveKitTokenService(
            @Value("${app.livekit.url:}") String serverUrl,
            @Value("${app.livekit.api-key:}") String apiKey,
            @Value("${app.livekit.api-secret:}") String apiSecret,
            @Value("${app.livekit.token-ttl-ms:600000}") long tokenTtlMillis
    ) {
        this.serverUrl = serverUrl;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.tokenTtlMillis = tokenTtlMillis;
    }

    public ConnectionCredentials createCredentials(User participant, String roomName) {
        requireConfigured();
        try {
            AccessToken token = new AccessToken(apiKey, apiSecret);
            token.setIdentity(participant.getUserId().toString());
            token.setName(participant.getFullName());
            token.setTtl(tokenTtlMillis);
            token.addGrants(new RoomJoin(true), new RoomName(roomName));
            return new ConnectionCredentials(serverUrl, token.toJwt());
        } catch (RuntimeException exception) {
            throw BusinessException.badGateway("Không thể tạo LiveKit token");
        }
    }

    private void requireConfigured() {
        if (serverUrl.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw BusinessException.serviceUnavailable("LiveKit chưa được cấu hình đầy đủ");
        }
    }

    public record ConnectionCredentials(String serverUrl, String participantToken) {
    }
}
