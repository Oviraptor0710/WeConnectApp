package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "GAME_WORDS")
@Data
@NoArgsConstructor
public class GameWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "word_id")
    private Long wordId;

    @Column(nullable = false, unique = true, length = 50)
    private String hiragana;

    @Column(nullable = false, length = 50)
    private String katakana;

    @Column(name = "meaning_vi", nullable = false, length = 255)
    private String meaningVi;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "jlpt_level", columnDefinition = "TINYINT")
    private Integer jlptLevel; // TINYINT (có thể null)

    @Column(name = "mora_count", nullable = false, columnDefinition = "TINYINT")
    private Integer moraCount; // TINYINT

    @Column(name = "first_kana", nullable = false, length = 3)
    private String firstKana;

    @Column(name = "last_kana", nullable = false, length = 3)
    private String lastKana;

    @Column(columnDefinition = "TINYINT")
    private Integer difficulty = 1;
}
