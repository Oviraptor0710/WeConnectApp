package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "CONVERSATIONS",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_conversation",
                columnNames = {"user1_id", "user2_id"}
        )
)
@Data
@NoArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static Conversation between(User firstUser, User secondUser) {
        if (firstUser.getUserId() == null || secondUser.getUserId() == null) {
            throw new IllegalArgumentException("Người dùng phải được lưu trước khi tạo hội thoại");
        }
        if (firstUser.getUserId().equals(secondUser.getUserId())) {
            throw new IllegalArgumentException("Không thể tự tạo hội thoại với chính mình");
        }

        Conversation conversation = new Conversation();
        if (firstUser.getUserId() < secondUser.getUserId()) {
            conversation.setUser1(firstUser);
            conversation.setUser2(secondUser);
        } else {
            conversation.setUser1(secondUser);
            conversation.setUser2(firstUser);
        }
        return conversation;
    }

    public boolean hasParticipant(Long userId) {
        return user1.getUserId().equals(userId) || user2.getUserId().equals(userId);
    }

    public User otherParticipant(Long userId) {
        if (user1.getUserId().equals(userId)) return user2;
        if (user2.getUserId().equals(userId)) return user1;
        throw new IllegalArgumentException("Người dùng không thuộc hội thoại");
    }

    public void touch(LocalDateTime messageTime) {
        this.lastMessageAt = messageTime;
    }
}
