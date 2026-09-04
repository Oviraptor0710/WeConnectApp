package com.weconnect.service;

import com.weconnect.ai.TranslationProvider;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.domain.translation.SourceLanguageDetection;
import com.weconnect.dto.translation.response.MessageTranslationResponse;
import com.weconnect.entity.Message;
import com.weconnect.entity.MessageTranslation;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.MessageRepository;
import com.weconnect.repository.MessageTranslationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TranslationService {
    private final MessageRepository messageRepository;
    private final MessageTranslationRepository translationRepository;
    private final TranslationProvider translationProvider;
    private final TranslationStoreService translationStoreService;
    private final LocalLanguageDetector languageDetector;
    private final TranslationRateLimiter rateLimiter;
    private final int maxInputCharacters;

    public TranslationService(
            MessageRepository messageRepository,
            MessageTranslationRepository translationRepository,
            TranslationProvider translationProvider,
            TranslationStoreService translationStoreService,
            LocalLanguageDetector languageDetector,
            TranslationRateLimiter rateLimiter,
            @Value("${app.gemini.max-input-characters:5000}") int maxInputCharacters
    ) {
        this.messageRepository = messageRepository;
        this.translationRepository = translationRepository;
        this.translationProvider = translationProvider;
        this.translationStoreService = translationStoreService;
        this.languageDetector = languageDetector;
        this.rateLimiter = rateLimiter;
        this.maxInputCharacters = maxInputCharacters;
    }

    public MessageTranslationResponse translateMessage(
            Long currentUserId,
            Long messageId
    ) {
        Message message = messageRepository.findForParticipant(messageId, currentUserId)
                .orElseThrow(() -> BusinessException.notFound("Tin nhắn không tồn tại"));

        MessageTranslation cached = translationRepository
                .findFirstByMessage_MessageIdOrderByCreatedAtDesc(messageId)
                .orElse(null);
        if (cached != null) return MessageTranslationResponse.from(message, cached);

        requireTranslatable(message);
        SourceLanguageDetection detection = languageDetector.detect(message.getContent());
        if (detection == SourceLanguageDetection.NOT_TRANSLATABLE) {
            throw BusinessException.unprocessableEntity(
                    "Tin nhắn chỉ chứa URL, email, mention, số, emoji hoặc dấu câu nên không thể dịch"
            );
        }

        rateLimiter.acquire(currentUserId);
        TranslationProvider.TranslationResult generated = detection == SourceLanguageDetection.AMBIGUOUS
                ? translationProvider.detectAndTranslate(message.getContent())
                : translationProvider.translate(message.getContent(), detection.asSupportedLanguage());
        return translationStoreService.storeIfAbsent(
                currentUserId,
                messageId,
                generated
        );
    }

    private void requireTranslatable(Message message) {
        if (message.getMessageType() != MessageType.TEXT) {
            throw BusinessException.badRequest("Chỉ có thể dịch tin nhắn văn bản");
        }
        if (message.getContent() == null || message.getContent().isBlank()) {
            throw BusinessException.badRequest("Tin nhắn không có nội dung để dịch");
        }
        if (message.getContent().length() > maxInputCharacters) {
            throw BusinessException.payloadTooLarge(
                    "Tin nhắn vượt quá " + maxInputCharacters + " ký tự cho mỗi lần dịch"
            );
        }
    }
}
