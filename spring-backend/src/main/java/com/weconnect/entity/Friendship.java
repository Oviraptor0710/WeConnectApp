package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "FRIENDSHIPS",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_friendship",
                columnNames = {"user1_id", "user2_id"}
        )
)
@Data
@NoArgsConstructor
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "friendship_id")
    private Long friendshipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static Friendship between(User firstUser, User secondUser) {
        if (firstUser.getUserId() == null || secondUser.getUserId() == null) {
            throw new IllegalArgumentException("Người dùng phải được lưu trước khi kết bạn");
        }
        if (firstUser.getUserId().equals(secondUser.getUserId())) {
            throw new IllegalArgumentException("Không thể tạo quan hệ bạn bè với chính mình");
        }

        Friendship friendship = new Friendship();
        if (firstUser.getUserId() < secondUser.getUserId()) {
            friendship.setUser1(firstUser);
            friendship.setUser2(secondUser);
        } else {
            friendship.setUser1(secondUser);
            friendship.setUser2(firstUser);
        }
        return friendship;
    }
}
