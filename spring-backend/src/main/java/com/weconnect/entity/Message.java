package com.weconnect.entity;

import com.weconnect.domain.chat.MessageType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "MESSAGES")
@Data
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 20, nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Column(name = "translated_content", columnDefinition = "TEXT")
    private String translatedContent;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static Message create(
            Conversation conversation,
            User sender,
            String content,
            MessageType type,
            LocalDateTime createdAt
    ) {
        if (!conversation.hasParticipant(sender.getUserId())) {
            throw new IllegalArgumentException("Người gửi không thuộc hội thoại");
        }
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(content);
        message.setMessageType(type);
        message.setCreatedAt(createdAt);
        message.setIsRead(false);
        return message;
    }

    public void markRead() {
        this.isRead = true;
    }
}
