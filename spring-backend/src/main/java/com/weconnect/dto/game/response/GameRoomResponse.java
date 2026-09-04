package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.GameParticipant;
import com.weconnect.entity.GameRoom;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record GameRoomResponse(
        @JsonProperty("room_id") Long roomId,
        String code,
        @JsonProperty("host_id") Long hostId,
        @JsonProperty("room_type") String roomType,
        @JsonProperty("max_players") Integer maxPlayers,
        String status,
        @JsonProperty("created_at") LocalDateTime createdAt,
        @JsonProperty("started_at") LocalDateTime startedAt,
        @JsonProperty("room_settings") Map<String, Object> roomSettings,
        @JsonProperty("participants_count") int participantsCount,
        List<ParticipantResponse> participants
) {
    public record ParticipantResponse(
            @JsonProperty("user_id") Long userId,
            @JsonProperty("full_name") String fullName,
            @JsonProperty("avatar_url") String avatarUrl,
            int score
    ) {
        public static ParticipantResponse from(GameParticipant participant) {
            return new ParticipantResponse(participant.getUser().getUserId(), participant.getUser().getFullName(),
                    participant.getUser().getAvatarUrl(), participant.getScore() == null ? 0 : participant.getScore());
        }
    }
}
