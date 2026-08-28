package com.weconnect.entity;

import com.weconnect.domain.call.CallStatus;
import com.weconnect.domain.call.CallType;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "CALLS",
        uniqueConstraints = @UniqueConstraint(name = "uq_call_room", columnNames = "room_name")
)
@Data
@NoArgsConstructor
public class Call {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_id")
    private Long callId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", length = 10, nullable = false)
    private CallType callType = CallType.VIDEO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private CallStatus status = CallStatus.RINGING;

    @Column(name = "room_name", nullable = false, unique = true, length = 255)
    private String roomName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public static Call ringing(
            User caller,
            User receiver,
            CallType type,
            String roomName,
            LocalDateTime createdAt,
            LocalDateTime expiresAt
    ) {
        Call call = new Call();
        call.setCaller(caller);
        call.setReceiver(receiver);
        call.setCallType(type);
        call.setRoomName(roomName);
        call.setStatus(CallStatus.RINGING);
        call.setCreatedAt(createdAt);
        call.setExpiresAt(expiresAt);
        return call;
    }

    public boolean hasParticipant(Long userId) {
        return caller.getUserId().equals(userId) || receiver.getUserId().equals(userId);
    }

    public User otherParticipant(Long userId) {
        if (caller.getUserId().equals(userId)) return receiver;
        if (receiver.getUserId().equals(userId)) return caller;
        throw new IllegalArgumentException("Người dùng không thuộc cuộc gọi");
    }

    public boolean isExpired(LocalDateTime now) {
        return status == CallStatus.RINGING && !expiresAt.isAfter(now);
    }

    public void accept(LocalDateTime now) {
        requireRinging();
        status = CallStatus.ACCEPTED;
        acceptedAt = now;
    }

    public void reject(LocalDateTime now) {
        finishRinging(CallStatus.REJECTED, now);
    }

    public void cancel(LocalDateTime now) {
        finishRinging(CallStatus.CANCELLED, now);
    }

    public void miss(LocalDateTime now) {
        finishRinging(CallStatus.MISSED, now);
    }

    public void end(LocalDateTime now) {
        if (status == CallStatus.ENDED) return;
        if (status != CallStatus.ACCEPTED) {
            throw new IllegalStateException("Chỉ cuộc gọi đã chấp nhận mới có thể kết thúc");
        }
        status = CallStatus.ENDED;
        endedAt = now;
    }

    private void finishRinging(CallStatus nextStatus, LocalDateTime now) {
        requireRinging();
        status = nextStatus;
        endedAt = now;
    }

    private void requireRinging() {
        if (status != CallStatus.RINGING) {
            throw new IllegalStateException("Cuộc gọi không còn ở trạng thái chờ");
        }
    }
}
