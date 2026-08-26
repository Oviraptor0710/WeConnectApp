package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "GAME_QUESTIONS")
@Data
@NoArgsConstructor
public class GameQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "game_type", nullable = false, length = 50)
    private String gameType; // QUIZ | KANJI

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(length = 255)
    private String description;

    @Column(columnDefinition = "JSON", nullable = false)
    private String options; // Chuỗi JSON chứa mảng các lựa chọn (A, B, C, D)

    @Column(name = "correct_index", nullable = false, columnDefinition = "TINYINT")
    private Integer correctIndex; // TINYINT trong DB có thể map với Integer hoặc Byte

    @Column(length = 255)
    private String hint;

    @Column(columnDefinition = "TINYINT")
    private Integer difficulty = 1;
}
