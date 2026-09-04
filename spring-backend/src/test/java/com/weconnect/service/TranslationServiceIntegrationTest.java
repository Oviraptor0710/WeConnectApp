package com.weconnect.service;

import com.weconnect.ai.TranslationProvider;
import com.weconnect.domain.chat.MessageDirection;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.domain.translation.TranslationLanguage;
import com.weconnect.dto.chat.response.ChatMessageResponse;
import com.weconnect.dto.chat.response.ConversationResponse;
import com.weconnect.dto.chat.response.MessageListResponse;
import com.weconnect.dto.translation.response.MessageTranslationResponse;
import com.weconnect.entity.Friendship;
import com.weconnect.entity.Message;
import com.weconnect.entity.MessageTranslation;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.MessageRepository;
import com.weconnect.repository.MessageTranslationRepository;
import com.weconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(TranslationServiceIntegrationTest.FakeProviderConfiguration.class)
class TranslationServiceIntegrationTest {
    @Autowired private TranslationService translationService;
    @Autowired private ChatService chatService;
    @Autowired private UserRepository userRepository;
    @Autowired private FriendshipRepository friendshipRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private MessageTranslationRepository translationRepository;
    @Autowired private FakeTranslationProvider fakeProvider;

    @BeforeEach
    void resetProvider() {
        fakeProvider.reset();
    }

    @Test
    void localVietnameseDetectionTranslatesToJapaneseAndCacheAvoidsAnotherProviderCall() {
        Users users = usersAndFriendship("translation.vi");
        ConversationResponse conversation = conversation(users);
        ChatMessageResponse message = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(),
                "Tôi có một option cho Spring Boot", MessageType.TEXT
        );

        MessageTranslationResponse first = translationService.translateMessage(
                users.first().getUserId(), message.messageId()
        );
        MessageTranslationResponse cached = translationService.translateMessage(
                users.second().getUserId(), message.messageId()
        );

        assertThat(first.sourceLanguage()).isEqualTo(TranslationLanguage.VI);
        assertThat(first.targetLanguage()).isEqualTo(TranslationLanguage.JA);
        assertThat(first.translatedContent()).isEqualTo("JA:Tôi có một option cho Spring Boot");
        assertThat(cached).isEqualTo(first);
        assertThat(fakeProvider.knownSourceCalls()).isEqualTo(1);
        assertThat(fakeProvider.autoDetectionCalls()).isZero();

        MessageListResponse history = chatService.listMessages(
                users.second().getUserId(), conversation.conversationId(), null, 20,
                MessageDirection.BEFORE
        );
        assertThat(history.data()).singleElement()
                .extracting(ChatMessageResponse::translatedContent)
                .isEqualTo(first.translatedContent());
    }

    @Test
    void localJapaneseAndAmbiguousTextUseTheCorrectSingleProviderPath() {
        Users users = usersAndFriendship("translation.direction");
        ConversationResponse conversation = conversation(users);
        ChatMessageResponse japanese = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(),
                "今日はmeetingです", MessageType.TEXT
        );
        ChatMessageResponse ambiguous = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(),
                "xin chao", MessageType.TEXT
        );

        MessageTranslationResponse japaneseResult = translationService.translateMessage(
                users.second().getUserId(), japanese.messageId()
        );
        MessageTranslationResponse ambiguousResult = translationService.translateMessage(
                users.second().getUserId(), ambiguous.messageId()
        );

        assertThat(japaneseResult.sourceLanguage()).isEqualTo(TranslationLanguage.JA);
        assertThat(japaneseResult.targetLanguage()).isEqualTo(TranslationLanguage.VI);
        assertThat(ambiguousResult.sourceLanguage()).isEqualTo(TranslationLanguage.VI);
        assertThat(ambiguousResult.targetLanguage()).isEqualTo(TranslationLanguage.JA);
        assertThat(fakeProvider.knownSourceCalls()).isEqualTo(1);
        assertThat(fakeProvider.autoDetectionCalls()).isEqualTo(1);
    }

    @Test
    void rejectsOutsidersNonTextAndNonTranslatableMessagesBeforeCallingProvider() {
        Users users = usersAndFriendship("translation.rules");
        User outsider = verifiedUser("translation.outsider@test.local", "Người ngoài");
        ConversationResponse conversation = conversation(users);
        ChatMessageResponse text = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "Cần dịch", MessageType.TEXT
        );
        ChatMessageResponse gameInvite = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "ROOM-123", MessageType.GAME_INVITE
        );
        ChatMessageResponse nonTranslatable = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(),
                "https://example.com @friend 123 😊 !!!", MessageType.TEXT
        );

        assertThatThrownBy(() -> translationService.translateMessage(
                outsider.getUserId(), text.messageId()
        )).isInstanceOfSatisfying(BusinessException.class, exception ->
                assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND)
        );
        assertThatThrownBy(() -> translationService.translateMessage(
                users.second().getUserId(), gameInvite.messageId()
        )).isInstanceOfSatisfying(BusinessException.class, exception ->
                assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST)
        );
        assertThatThrownBy(() -> translationService.translateMessage(
                users.second().getUserId(), nonTranslatable.messageId()
        )).isInstanceOfSatisfying(BusinessException.class, exception ->
                assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY)
        );
        assertThat(fakeProvider.totalCalls()).isZero();
    }

    @Test
    void cacheIsReturnedBeforeLanguageDetection() {
        Users users = usersAndFriendship("translation.cache-first");
        ConversationResponse conversation = conversation(users);
        ChatMessageResponse messageResponse = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(),
                "https://example.com 123 😊", MessageType.TEXT
        );
        Message message = messageRepository.findById(messageResponse.messageId()).orElseThrow();
        translationRepository.saveAndFlush(MessageTranslation.create(
                message, TranslationLanguage.VI, TranslationLanguage.JA,
                "キャッシュ済み", "FAKE", "fake-model"
        ));

        MessageTranslationResponse cached = translationService.translateMessage(
                users.second().getUserId(), messageResponse.messageId()
        );

        assertThat(cached.translatedContent()).isEqualTo("キャッシュ済み");
        assertThat(fakeProvider.totalCalls()).isZero();
    }

    private ConversationResponse conversation(Users users) {
        return chatService.createOrGetConversation(users.first().getUserId(), users.second().getUserId());
    }

    private Users usersAndFriendship(String prefix) {
        User first = verifiedUser(prefix + ".first@test.local", "Người thứ nhất");
        User second = verifiedUser(prefix + ".second@test.local", "Người thứ hai");
        friendshipRepository.saveAndFlush(Friendship.between(first, second));
        return new Users(first, second);
    }

    private User verifiedUser(String email, String fullName) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("test-password-hash");
        user.setFullName(fullName);
        user.setRole("USER");
        user.setIsVerified(true);
        return userRepository.saveAndFlush(user);
    }

    private record Users(User first, User second) {
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FakeProviderConfiguration {
        @Bean
        @Primary
        FakeTranslationProvider fakeTranslationProvider() {
            return new FakeTranslationProvider();
        }
    }

    static class FakeTranslationProvider implements TranslationProvider {
        private final AtomicInteger knownSourceInvocations = new AtomicInteger();
        private final AtomicInteger autoDetectionInvocations = new AtomicInteger();

        @Override
        public TranslationResult translate(String content, TranslationLanguage sourceLanguage) {
            knownSourceInvocations.incrementAndGet();
            TranslationLanguage targetLanguage = sourceLanguage.opposite();
            return result(targetLanguage.name() + ":" + content, sourceLanguage, targetLanguage);
        }

        @Override
        public TranslationResult detectAndTranslate(String content) {
            autoDetectionInvocations.incrementAndGet();
            return result("JA:AUTO:" + content, TranslationLanguage.VI, TranslationLanguage.JA);
        }

        private TranslationResult result(String translated, TranslationLanguage source, TranslationLanguage target) {
            return new TranslationResult(translated, source, target, "FAKE", "fake-model");
        }

        int knownSourceCalls() { return knownSourceInvocations.get(); }
        int autoDetectionCalls() { return autoDetectionInvocations.get(); }
        int totalCalls() { return knownSourceCalls() + autoDetectionCalls(); }

        void reset() {
            knownSourceInvocations.set(0);
            autoDetectionInvocations.set(0);
        }
    }
}
