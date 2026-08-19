package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "GAMES")
@Data
@NoArgsConstructor
public class Game {

    @Id
    @Column(name = "game_id", length = 50)
    private String gameId; // Không dùng GeneratedValue vì khóa chính là chuỗi (VARCHAR)

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "game_type", nullable = false, unique = true, length = 50)
    private String gameType;

    @Column(name = "icon_bg", length = 50)
    private String iconBg;

    @Column(name = "badge_bg", length = 50)
    private String badgeBg;

    @Column(name = "badge_text", length = 50)
    private String badgeText;
}
