package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "GAME_ROOMS")
@Data
@NoArgsConstructor
public class GameRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    // Khóa ngoại trỏ về User (Chủ phòng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(name = "room_type", length = 50)
    private String roomType = "QUIZ"; // QUIZ | TRIVIA | CUSTOM

    @Column(name = "max_players")
    private Integer maxPlayers = 10;

    @Column(length = 20)
    private String status = "WAITING"; // WAITING | PLAYING | ENDED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "paused_at")
    private LocalDateTime pausedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // Các cột JSON lưu trữ trạng thái Game theo thời gian thực
    @Column(name = "question_ids", columnDefinition = "JSON")
    private String questionIds;

    @Column(name = "room_settings", columnDefinition = "JSON")
    private String roomSettings;

    @Column(name = "game_state", columnDefinition = "JSON")
    private String gameState;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
