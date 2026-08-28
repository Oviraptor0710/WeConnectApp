package com.weconnect.service;

import com.weconnect.domain.chat.MessageDirection;
import com.weconnect.domain.chat.MessageType;
import com.weconnect.dto.chat.response.ChatMessageResponse;
import com.weconnect.dto.chat.response.ConversationListResponse;
import com.weconnect.dto.chat.response.ConversationResponse;
import com.weconnect.dto.chat.response.MessageListResponse;
import com.weconnect.entity.Friendship;
import com.weconnect.entity.Message;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.MessageRepository;
import com.weconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatServiceIntegrationTest {
    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Test
    void conversationMessageCursorUnreadAndReadFlowStayConsistent() {
        Users users = usersAndFriendship("chat.flow");
        ConversationResponse conversation = chatService.createOrGetConversation(
                users.first().getUserId(), users.second().getUserId()
        );
        ConversationResponse sameConversation = chatService.createOrGetConversation(
                users.second().getUserId(), users.first().getUserId()
        );
        assertThat(sameConversation.conversationId()).isEqualTo(conversation.conversationId());

        ChatMessageResponse first = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "Một", MessageType.TEXT
        );
        ChatMessageResponse second = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "Hai", MessageType.TEXT
        );

        ConversationListResponse receiverList = chatService.listConversations(
                users.second().getUserId(), 1, 20
        );
        assertThat(receiverList.data()).hasSize(1);
        assertThat(receiverList.data().get(0).unreadCount()).isEqualTo(2);
        assertThat(receiverList.data().get(0).lastMessage().messageId()).isEqualTo(second.messageId());

        MessageListResponse latestPage = chatService.listMessages(
                users.second().getUserId(), conversation.conversationId(), null, 1,
                MessageDirection.BEFORE
        );
        assertThat(latestPage.data()).extracting(ChatMessageResponse::messageId)
                .containsExactly(second.messageId());
        MessageListResponse olderPage = chatService.listMessages(
                users.second().getUserId(), conversation.conversationId(), latestPage.nextCursor(), 10,
                MessageDirection.BEFORE
        );
        assertThat(olderPage.data()).extracting(ChatMessageResponse::messageId)
                .containsExactly(first.messageId());

        chatService.markConversationRead(
                users.second().getUserId(), conversation.conversationId(), first.messageId()
        );
        assertThat(chatService.listConversations(users.second().getUserId(), 1, 20)
                .data().get(0).unreadCount()).isEqualTo(1);
        Message firstEntity = messageRepository.findById(first.messageId()).orElseThrow();
        Message secondEntity = messageRepository.findById(second.messageId()).orElseThrow();
        assertThat(firstEntity.getIsRead()).isTrue();
        assertThat(secondEntity.getIsRead()).isFalse();
    }

    @Test
    void unfriendKeepsHistoryAndReadButBlocksNewActivityUntilRefriended() {
        Users users = usersAndFriendship("chat.unfriend");
        ConversationResponse conversation = chatService.createOrGetConversation(
                users.first().getUserId(), users.second().getUserId()
        );
        ChatMessageResponse oldMessage = chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "Tin nhắn cũ", MessageType.TEXT
        );

        long lowId = Math.min(users.first().getUserId(), users.second().getUserId());
        long highId = Math.max(users.first().getUserId(), users.second().getUserId());
        Friendship friendship = friendshipRepository
                .findByUser1_UserIdAndUser2_UserId(lowId, highId).orElseThrow();
        friendshipRepository.delete(friendship);
        friendshipRepository.flush();

        assertThat(chatService.listMessages(
                users.second().getUserId(), conversation.conversationId(), null, 20,
                MessageDirection.BEFORE
        ).data()).extracting(ChatMessageResponse::messageId).contains(oldMessage.messageId());
        chatService.markConversationRead(
                users.second().getUserId(), conversation.conversationId(), oldMessage.messageId()
        );

        assertThatThrownBy(() -> chatService.sendMessage(
                users.first().getUserId(), conversation.conversationId(), "Không được gửi", MessageType.TEXT
        )).isInstanceOfSatisfying(BusinessException.class, exception -> {
            assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(exception.getMessage()).isEqualTo("NOT_FRIENDS");
        });
        assertThatThrownBy(() -> chatService.sendTypingStatus(
                users.first().getUserId(), conversation.conversationId(), true
        )).isInstanceOf(BusinessException.class);

        friendshipRepository.saveAndFlush(Friendship.between(users.first(), users.second()));
        ChatMessageResponse resumed = chatService.sendMessage(
                users.second().getUserId(), conversation.conversationId(), "Nhắn lại", MessageType.TEXT
        );
        assertThat(resumed.conversationId()).isEqualTo(conversation.conversationId());
    }

    @Test
    void attachmentIsAtomicAndNonParticipantCannotReadConversation() {
        Users users = usersAndFriendship("chat.file");
        User outsider = verifiedUser("chat.outsider@test.local", "Người ngoài");
        ConversationResponse conversation = chatService.createOrGetConversation(
                users.first().getUserId(), users.second().getUserId()
        );
        MockMultipartFile file = new MockMultipartFile(
                "file", "ghi-chu.txt", "text/plain",
                "nội dung".getBytes(StandardCharsets.UTF_8)
        );

        ChatMessageResponse attachment = chatService.sendAttachment(
                users.first().getUserId(), conversation.conversationId(), file
        );
        assertThat(attachment.type()).isEqualTo(MessageType.FILE);
        assertThat(attachment.content()).startsWith("/uploads/chat/").endsWith("-ghi-chu.txt");

        assertThatThrownBy(() -> chatService.listMessages(
                outsider.getUserId(), conversation.conversationId(), null, 20,
                MessageDirection.BEFORE
        )).isInstanceOfSatisfying(BusinessException.class, exception ->
                assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND)
        );
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
}
