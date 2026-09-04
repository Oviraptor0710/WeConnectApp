package com.weconnect.service;

import com.weconnect.domain.chat.MessageDirection;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.dto.chat.response.ChatMessageResponse;
import com.weconnect.dto.chat.response.ConversationListResponse;
import com.weconnect.dto.chat.response.ConversationResponse;
import com.weconnect.dto.chat.response.MessageListResponse;
import com.weconnect.dto.common.response.PaginationResponse;
import com.weconnect.entity.Conversation;
import com.weconnect.entity.Message;
import com.weconnect.entity.MessageTranslation;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.realtime.RealtimeEvent;
import com.weconnect.realtime.WsBroadcastClient;
import com.weconnect.repository.ConversationRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.MessageRepository;
import com.weconnect.repository.MessageTranslationRepository;
import com.weconnect.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageTranslationRepository messageTranslationRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final MediaStorageService mediaStorageService;
    private final ApplicationEventPublisher eventPublisher;
    private final WsBroadcastClient wsBroadcastClient;

    public ChatService(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            MessageTranslationRepository messageTranslationRepository,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            MediaStorageService mediaStorageService,
            ApplicationEventPublisher eventPublisher,
            WsBroadcastClient wsBroadcastClient
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.messageTranslationRepository = messageTranslationRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.mediaStorageService = mediaStorageService;
        this.eventPublisher = eventPublisher;
        this.wsBroadcastClient = wsBroadcastClient;
    }

    @Transactional(readOnly = true)
    public ConversationListResponse listConversations(Long userId, int page, int pageSize) {
        Page<Conversation> result = conversationRepository.findAllForUser(
                userId,
                PageRequest.of(page - 1, pageSize)
        );
        List<Long> conversationIds = result.getContent().stream()
                .map(Conversation::getConversationId)
                .toList();

        Map<Long, Message> latestMessages = conversationIds.isEmpty()
                ? Map.of()
                : messageRepository.findLatestForConversations(conversationIds).stream()
                .collect(Collectors.toMap(
                        message -> message.getConversation().getConversationId(),
                        Function.identity()
                ));
        Map<Long, Long> unreadCounts = unreadCounts(conversationIds, userId);

        List<ConversationResponse> data = result.getContent().stream()
                .map(conversation -> ConversationResponse.from(
                        conversation,
                        userId,
                        latestMessages.get(conversation.getConversationId()),
                        unreadCounts.getOrDefault(conversation.getConversationId(), 0L)
                ))
                .toList();
        return new ConversationListResponse(
                data,
                new PaginationResponse(page, pageSize, result.getTotalElements(), result.getTotalPages())
        );
    }

    @Transactional
    public ConversationResponse createOrGetConversation(Long currentUserId, Long receiverId) {
        if (currentUserId.equals(receiverId)) {
            throw BusinessException.badRequest("Không thể tự nhắn tin cho chính mình");
        }

        LockedUsers users = lockUsers(currentUserId, receiverId);
        if (!Boolean.TRUE.equals(users.second().getIsVerified())) {
            throw BusinessException.notFound("Người nhận không tồn tại");
        }
        requireFriends(currentUserId, receiverId);

        long user1Id = Math.min(currentUserId, receiverId);
        long user2Id = Math.max(currentUserId, receiverId);
        Conversation conversation = conversationRepository
                .findByUser1_UserIdAndUser2_UserId(user1Id, user2Id)
                .orElseGet(() -> createConversation(users.first(), users.second()));
        return conversationResponse(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public MessageListResponse listMessages(
            Long currentUserId,
            Long conversationId,
            Long cursor,
            int limit,
            MessageDirection direction
    ) {
        requireConversation(conversationId, currentUserId);
        List<Message> messages;
        Long nextCursor;

        if (direction == MessageDirection.AFTER) {
            messages = messageRepository.findAfter(conversationId, cursor, PageRequest.of(0, limit));
            nextCursor = messages.size() == limit
                    ? messages.get(messages.size() - 1).getMessageId()
                    : null;
        } else {
            messages = new ArrayList<>(
                    messageRepository.findBefore(conversationId, cursor, PageRequest.of(0, limit))
            );
            Collections.reverse(messages);
            nextCursor = messages.size() == limit ? messages.get(0).getMessageId() : null;
        }

        Map<Long, String> translations = messages.isEmpty()
                ? Map.of()
                : messageTranslationRepository
                .findAllByMessage_MessageIdInOrderByCreatedAtDesc(
                        messages.stream().map(Message::getMessageId).toList()
                )
                .stream()
                .collect(Collectors.toMap(
                        translation -> translation.getMessage().getMessageId(),
                        MessageTranslation::getTranslatedContent,
                        (newest, ignoredOlder) -> newest
                ));

        return new MessageListResponse(
                messages.stream()
                        .map(message -> ChatMessageResponse.from(
                                message,
                                translations.get(message.getMessageId())
                        ))
                        .toList(),
                nextCursor
        );
    }

    @Transactional
    public ChatMessageResponse sendMessage(
            Long currentUserId,
            Long conversationId,
            String content,
            MessageType type
    ) {
        if (type != MessageType.TEXT && type != MessageType.GAME_INVITE) {
            throw BusinessException.badRequest("Tin nhắn file phải được gửi qua API attachment");
        }
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isEmpty()) {
            throw BusinessException.badRequest("Nội dung tin nhắn không được để trống");
        }

        Conversation conversation = requireConversationForUpdate(conversationId, currentUserId);
        requireFriends(currentUserId, conversation.otherParticipant(currentUserId).getUserId());
        return persistAndPublishMessage(
                conversation,
                participant(conversation, currentUserId),
                normalizedContent,
                type
        );
    }

    @Transactional
    public ChatMessageResponse sendAttachment(
            Long currentUserId,
            Long conversationId,
            MultipartFile file
    ) {
        Conversation conversation = requireConversationForUpdate(conversationId, currentUserId);
        requireFriends(currentUserId, conversation.otherParticipant(currentUserId).getUserId());

        MediaStorageService.StoredChatFile storedFile = mediaStorageService.saveChatFile(file);
        registerRollbackCleanup(storedFile.url());
        return persistAndPublishMessage(
                conversation,
                participant(conversation, currentUserId),
                storedFile.url(),
                storedFile.type()
        );
    }

    @Transactional
    public void markConversationRead(Long currentUserId, Long conversationId, Long lastReadMessageId) {
        Conversation conversation = requireConversation(conversationId, currentUserId);
        if (lastReadMessageId != null
                && !messageRepository.existsByMessageIdAndConversation_ConversationId(
                        lastReadMessageId,
                        conversationId
                )) {
            throw BusinessException.notFound("Tin nhắn đã đọc không tồn tại");
        }

        messageRepository.markIncomingRead(conversationId, currentUserId, lastReadMessageId);

        Map<String, Object> readPayload = new HashMap<>();
        readPayload.put("conversation_id", conversationId);
        readPayload.put("user_id", currentUserId);
        readPayload.put("last_read_message_id", lastReadMessageId);
        publishToBoth(conversation, "chat:read", readPayload);
        publishConversationUpdate(conversation, currentUserId);
    }

    @Transactional(readOnly = true)
    public void sendTypingStatus(Long currentUserId, Long conversationId, boolean isTyping) {
        Conversation conversation = requireConversation(conversationId, currentUserId);
        User otherUser = conversation.otherParticipant(currentUserId);
        requireFriends(currentUserId, otherUser.getUserId());

        wsBroadcastClient.broadcast(
                userRoom(otherUser.getUserId()),
                "chat:typing",
                Map.of(
                        "conversation_id", conversationId,
                        "user_id", currentUserId,
                        "is_typing", isTyping
                )
        );
    }

    private ChatMessageResponse persistAndPublishMessage(
            Conversation conversation,
            User sender,
            String content,
            MessageType type
    ) {
        LocalDateTime now = LocalDateTime.now();
        Message message = Message.create(conversation, sender, content, type, now);
        message = messageRepository.saveAndFlush(message);
        conversation.touch(message.getCreatedAt());

        ChatMessageResponse response = ChatMessageResponse.from(message);
        publishToBoth(conversation, "chat:new", response);
        publishConversationUpdate(conversation, conversation.getUser1().getUserId());
        publishConversationUpdate(conversation, conversation.getUser2().getUserId());
        return response;
    }

    private Conversation createConversation(User first, User second) {
        return conversationRepository.saveAndFlush(Conversation.between(first, second));
    }

    private ConversationResponse conversationResponse(Conversation conversation, Long viewerId) {
        Message lastMessage = messageRepository
                .findTopByConversation_ConversationIdOrderByMessageIdDesc(conversation.getConversationId())
                .orElse(null);
        long unreadCount = messageRepository
                .countByConversation_ConversationIdAndSender_UserIdNotAndIsReadFalse(
                        conversation.getConversationId(),
                        viewerId
                );
        return ConversationResponse.from(conversation, viewerId, lastMessage, unreadCount);
    }

    private Map<Long, Long> unreadCounts(List<Long> conversationIds, Long viewerId) {
        if (conversationIds.isEmpty()) return Map.of();
        Map<Long, Long> counts = new HashMap<>();
        messageRepository.countUnreadByConversation(conversationIds, viewerId).forEach(row ->
                counts.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue())
        );
        return counts;
    }

    private Conversation requireConversation(Long conversationId, Long userId) {
        return conversationRepository.findForUser(conversationId, userId)
                .orElseThrow(() -> BusinessException.notFound("Cuộc trò chuyện không tồn tại"));
    }

    private Conversation requireConversationForUpdate(Long conversationId, Long userId) {
        Conversation snapshot = requireConversation(conversationId, userId);
        lockUsers(snapshot.getUser1().getUserId(), snapshot.getUser2().getUserId());
        return conversationRepository.findForUserForUpdate(conversationId, userId)
                .orElseThrow(() -> BusinessException.notFound("Cuộc trò chuyện không tồn tại"));
    }

    private void requireFriends(Long firstUserId, Long secondUserId) {
        long user1Id = Math.min(firstUserId, secondUserId);
        long user2Id = Math.max(firstUserId, secondUserId);
        if (!friendshipRepository.existsByUser1_UserIdAndUser2_UserId(user1Id, user2Id)) {
            throw BusinessException.forbidden("NOT_FRIENDS");
        }
    }

    private User participant(Conversation conversation, Long userId) {
        if (conversation.getUser1().getUserId().equals(userId)) return conversation.getUser1();
        if (conversation.getUser2().getUserId().equals(userId)) return conversation.getUser2();
        throw BusinessException.notFound("Cuộc trò chuyện không tồn tại");
    }

    private LockedUsers lockUsers(Long firstUserId, Long secondUserId) {
        List<User> lockedUsers = userRepository.findAllByIdForUpdate(Set.of(firstUserId, secondUserId));
        Map<Long, User> usersById = lockedUsers.stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        User first = usersById.get(firstUserId);
        User second = usersById.get(secondUserId);
        if (first == null || second == null) {
            throw BusinessException.notFound("Người nhận không tồn tại");
        }
        return new LockedUsers(first, second);
    }

    private void publishConversationUpdate(Conversation conversation, Long viewerId) {
        eventPublisher.publishEvent(new RealtimeEvent(
                userRoom(viewerId),
                "conversation:updated",
                conversationResponse(conversation, viewerId)
        ));
    }

    private void publishToBoth(Conversation conversation, String event, Object data) {
        eventPublisher.publishEvent(new RealtimeEvent(
                userRoom(conversation.getUser1().getUserId()), event, data
        ));
        eventPublisher.publishEvent(new RealtimeEvent(
                userRoom(conversation.getUser2().getUserId()), event, data
        ));
    }

    private void registerRollbackCleanup(String url) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != TransactionSynchronization.STATUS_COMMITTED) {
                    mediaStorageService.deleteByUrl(url);
                }
            }
        });
    }

    private String userRoom(Long userId) {
        return "private-user-" + userId;
    }

    private record LockedUsers(User first, User second) {
    }
}
