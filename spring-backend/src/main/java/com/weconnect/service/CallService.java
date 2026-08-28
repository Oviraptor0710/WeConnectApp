package com.weconnect.service;

import com.weconnect.domain.call.CallStatus;
import com.weconnect.domain.call.CallType;
import com.weconnect.dto.call.response.CallConnectionResponse;
import com.weconnect.dto.call.response.CallResponse;
import com.weconnect.dto.call.response.CallUserResponse;
import com.weconnect.dto.call.response.IncomingCallResponse;
import com.weconnect.entity.Call;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.realtime.RealtimeEvent;
import com.weconnect.repository.CallRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CallService {
    private final CallRepository callRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final LiveKitTokenService liveKitTokenService;
    private final ApplicationEventPublisher eventPublisher;
    private final long ringTimeoutSeconds;

    public CallService(
            CallRepository callRepository,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            LiveKitTokenService liveKitTokenService,
            ApplicationEventPublisher eventPublisher,
            @Value("${app.call.ring-timeout-seconds:35}") long ringTimeoutSeconds
    ) {
        this.callRepository = callRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.liveKitTokenService = liveKitTokenService;
        this.eventPublisher = eventPublisher;
        this.ringTimeoutSeconds = ringTimeoutSeconds;
    }

    @Transactional
    public CallResponse createCall(Long callerId, Long calleeId, CallType type) {
        if (callerId.equals(calleeId)) {
            throw BusinessException.badRequest("Không thể tự gọi cho chính mình");
        }

        LocalDateTime now = LocalDateTime.now();
        callRepository.markExpiredRingingCalls(now);
        LockedUsers users = lockUsers(callerId, calleeId);
        if (!Boolean.TRUE.equals(users.second().getIsVerified())) {
            throw BusinessException.notFound("Người nhận không tồn tại");
        }
        requireFriends(callerId, calleeId);
        if (callRepository.existsActiveForUsers(Set.of(callerId, calleeId), now)) {
            throw BusinessException.conflict("CALL_PARTICIPANT_BUSY");
        }

        Call call = Call.ringing(
                users.first(),
                users.second(),
                type,
                "call-" + UUID.randomUUID(),
                now,
                now.plusSeconds(ringTimeoutSeconds)
        );
        call = callRepository.saveAndFlush(call);
        IncomingCallResponse incoming = IncomingCallResponse.from(call);
        publish(calleeId, "video:incoming-call", incoming);
        return CallResponse.from(call);
    }

    @Transactional
    public IncomingCallResponse getActiveIncomingCall(Long receiverId) {
        LocalDateTime now = LocalDateTime.now();
        callRepository.markExpiredRingingCalls(now);
        return callRepository
                .findTopByReceiver_UserIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
                        receiverId, CallStatus.RINGING, now
                )
                .map(IncomingCallResponse::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public CallResponse getCall(Long userId, Long callId) {
        return CallResponse.from(requireCall(callId, userId));
    }

    @Transactional
    public CallResponse acceptCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        if (!call.getReceiver().getUserId().equals(userId)) {
            throw BusinessException.forbidden("Chỉ người nhận mới có thể chấp nhận cuộc gọi");
        }
        LocalDateTime now = LocalDateTime.now();
        requireRingingAndNotExpired(call, now);
        requireFriends(call.getCaller().getUserId(), call.getReceiver().getUserId());
        call.accept(now);
        publish(call.getCaller().getUserId(), "video:call-accepted", Map.of("call_id", callId));
        return CallResponse.from(call);
    }

    @Transactional
    public CallResponse rejectCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        if (!call.getReceiver().getUserId().equals(userId)) {
            throw BusinessException.forbidden("Chỉ người nhận mới có thể từ chối cuộc gọi");
        }
        requireRinging(call);
        call.reject(LocalDateTime.now());
        publish(call.getCaller().getUserId(), "video:call-rejected", Map.of(
                "call_id", callId,
                "reason", "REJECTED"
        ));
        return CallResponse.from(call);
    }

    @Transactional
    public CallResponse cancelCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        if (!call.getCaller().getUserId().equals(userId)) {
            throw BusinessException.forbidden("Chỉ người gọi mới có thể hủy cuộc gọi");
        }
        requireRinging(call);
        call.cancel(LocalDateTime.now());
        publish(call.getReceiver().getUserId(), "video:call-ended", Map.of(
                "call_id", callId,
                "reason", "CANCELLED"
        ));
        return CallResponse.from(call);
    }

    @Transactional
    public CallResponse timeoutCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        requireRinging(call);
        LocalDateTime now = LocalDateTime.now();
        if (call.getExpiresAt().isAfter(now)) {
            throw BusinessException.conflict("Cuộc gọi chưa hết thời gian chờ");
        }
        call.miss(now);
        publishToBoth(call, "video:call-ended", Map.of(
                "call_id", callId,
                "reason", "MISSED"
        ));
        return CallResponse.from(call);
    }

    @Transactional
    public CallResponse endCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        if (call.getStatus() == CallStatus.ENDED) return CallResponse.from(call);
        if (call.getStatus() == CallStatus.RINGING) {
            if (!call.getCaller().getUserId().equals(userId)) {
                throw BusinessException.forbidden("Người nhận phải từ chối thay vì hủy cuộc gọi");
            }
            call.cancel(LocalDateTime.now());
        } else if (call.getStatus() == CallStatus.ACCEPTED) {
            call.end(LocalDateTime.now());
        } else {
            return CallResponse.from(call);
        }
        publishToBoth(call, "video:call-ended", Map.of(
                "call_id", callId,
                "reason", call.getStatus().name()
        ));
        return CallResponse.from(call);
    }

    @Transactional
    public CallConnectionResponse joinCall(Long userId, Long callId) {
        Call call = requireCallForUpdate(callId, userId);
        LocalDateTime now = LocalDateTime.now();
        if (call.isExpired(now)) {
            throw BusinessException.conflict("Cuộc gọi đã hết thời gian chờ");
        }
        boolean callerWaiting = call.getCaller().getUserId().equals(userId)
                && call.getStatus() == CallStatus.RINGING;
        if (!callerWaiting && call.getStatus() != CallStatus.ACCEPTED) {
            throw BusinessException.conflict("Cuộc gọi không còn khả dụng");
        }

        User participant = call.getCaller().getUserId().equals(userId)
                ? call.getCaller()
                : call.getReceiver();
        LiveKitTokenService.ConnectionCredentials credentials =
                liveKitTokenService.createCredentials(participant, call.getRoomName());
        return new CallConnectionResponse(
                CallResponse.from(call),
                CallUserResponse.from(call.otherParticipant(userId)),
                credentials.serverUrl(),
                credentials.participantToken()
        );
    }

    private Call requireCall(Long callId, Long userId) {
        return callRepository.findForParticipant(callId, userId)
                .orElseThrow(() -> BusinessException.notFound("Cuộc gọi không tồn tại"));
    }

    private Call requireCallForUpdate(Long callId, Long userId) {
        Call snapshot = requireCall(callId, userId);
        lockUsers(snapshot.getCaller().getUserId(), snapshot.getReceiver().getUserId());
        return callRepository.findForParticipantForUpdate(callId, userId)
                .orElseThrow(() -> BusinessException.notFound("Cuộc gọi không tồn tại"));
    }

    private void requireRingingAndNotExpired(Call call, LocalDateTime now) {
        requireRinging(call);
        if (call.isExpired(now)) {
            throw BusinessException.conflict("Cuộc gọi đã hết thời gian chờ");
        }
    }

    private void requireRinging(Call call) {
        if (call.getStatus() != CallStatus.RINGING) {
            throw BusinessException.conflict("Cuộc gọi đã được xử lý");
        }
    }

    private void requireFriends(Long firstId, Long secondId) {
        long user1Id = Math.min(firstId, secondId);
        long user2Id = Math.max(firstId, secondId);
        if (!friendshipRepository.existsByUser1_UserIdAndUser2_UserId(user1Id, user2Id)) {
            throw BusinessException.forbidden("NOT_FRIENDS");
        }
    }

    private LockedUsers lockUsers(Long firstUserId, Long secondUserId) {
        List<User> locked = userRepository.findAllByIdForUpdate(Set.of(firstUserId, secondUserId));
        Map<Long, User> byId = locked.stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        User first = byId.get(firstUserId);
        User second = byId.get(secondUserId);
        if (first == null || second == null) {
            throw BusinessException.notFound("Người nhận không tồn tại");
        }
        return new LockedUsers(first, second);
    }

    private void publish(Long userId, String event, Object data) {
        eventPublisher.publishEvent(new RealtimeEvent("private-user-" + userId, event, data));
    }

    private void publishToBoth(Call call, String event, Object data) {
        publish(call.getCaller().getUserId(), event, data);
        publish(call.getReceiver().getUserId(), event, data);
    }

    private record LockedUsers(User first, User second) {
    }
}
