package com.weconnect.service;

import com.weconnect.ai.TranslationProvider;
import com.weconnect.dto.translation.response.MessageTranslationResponse;
import com.weconnect.entity.Message;
import com.weconnect.entity.MessageTranslation;
import com.weconnect.exception.BusinessException;
import com.weconnect.realtime.RealtimeEvent;
import com.weconnect.repository.MessageRepository;
import com.weconnect.repository.MessageTranslationRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TranslationStoreService {
    private final MessageRepository messageRepository;
    private final MessageTranslationRepository translationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TranslationStoreService(
            MessageRepository messageRepository,
            MessageTranslationRepository translationRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.messageRepository = messageRepository;
        this.translationRepository = translationRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public MessageTranslationResponse storeIfAbsent(
            Long currentUserId,
            Long messageId,
            TranslationProvider.TranslationResult generated
    ) {
        Message message = messageRepository.findForParticipantForUpdate(messageId, currentUserId)
                .orElseThrow(() -> BusinessException.notFound("Tin nhắn không tồn tại"));
        MessageTranslation translation = translationRepository
                .findFirstByMessage_MessageIdOrderByCreatedAtDesc(messageId)
                .orElseGet(() -> translationRepository.saveAndFlush(MessageTranslation.create(
                        message,
                        generated.sourceLanguage(),
                        generated.targetLanguage(),
                        generated.translatedContent(),
                        generated.provider(),
                        generated.modelName()
                )));

        MessageTranslationResponse response = MessageTranslationResponse.from(message, translation);
        publishToParticipants(message, response);
        return response;
    }

    private void publishToParticipants(Message message, MessageTranslationResponse response) {
        eventPublisher.publishEvent(new RealtimeEvent(
                "private-user-" + message.getConversation().getUser1().getUserId(),
                "chat:translated",
                response
        ));
        eventPublisher.publishEvent(new RealtimeEvent(
                "private-user-" + message.getConversation().getUser2().getUserId(),
                "chat:translated",
                response
        ));
    }
}
