package com.weconnect.entity;

import com.weconnect.domain.translation.TranslationLanguage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "MESSAGE_TRANSLATIONS",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_message_translation",
                columnNames = {"message_id", "target_language"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class MessageTranslation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "translation_id")
    private Long translationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_language", nullable = false, length = 10)
    private TranslationLanguage sourceLanguage;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_language", nullable = false, length = 10)
    private TranslationLanguage targetLanguage;

    @Column(name = "translated_content", nullable = false, columnDefinition = "TEXT")
    private String translatedContent;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public static MessageTranslation create(
            Message message,
            TranslationLanguage sourceLanguage,
            TranslationLanguage targetLanguage,
            String translatedContent,
            String provider,
            String modelName
    ) {
        MessageTranslation translation = new MessageTranslation();
        translation.setMessage(message);
        translation.setSourceLanguage(sourceLanguage);
        translation.setTargetLanguage(targetLanguage);
        translation.setTranslatedContent(translatedContent);
        translation.setProvider(provider);
        translation.setModelName(modelName);
        return translation;
    }
}
