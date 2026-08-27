package com.weconnect.entity;

import com.weconnect.domain.friend.FriendRequestStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "FRIEND_REQUESTS",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_friend_request",
                columnNames = {"sender_id", "receiver_id"}
        )
)
@Data
@NoArgsConstructor
public class FriendRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FriendRequestStatus status = FriendRequestStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public boolean isPending() {
        return status == FriendRequestStatus.PENDING;
    }

    public void resend(User sender, User receiver, LocalDateTime sentAt) {
        this.sender = sender;
        this.receiver = receiver;
        this.status = FriendRequestStatus.PENDING;
        this.createdAt = sentAt;
        this.respondedAt = null;
    }

    public void accept(LocalDateTime respondedAt) {
        respond(FriendRequestStatus.ACCEPTED, respondedAt);
    }

    public void reject(LocalDateTime respondedAt) {
        respond(FriendRequestStatus.REJECTED, respondedAt);
    }

    public void cancel(LocalDateTime respondedAt) {
        respond(FriendRequestStatus.CANCELLED, respondedAt);
    }

    private void respond(FriendRequestStatus nextStatus, LocalDateTime respondedAt) {
        if (!isPending()) {
            throw new IllegalStateException("Chỉ lời mời đang chờ mới có thể được xử lý");
        }
        this.status = nextStatus;
        this.respondedAt = respondedAt;
    }
}
