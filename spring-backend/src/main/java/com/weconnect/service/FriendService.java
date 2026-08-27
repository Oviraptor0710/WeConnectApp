package com.weconnect.service;

import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.dto.common.response.PaginationResponse;
import com.weconnect.dto.friend.response.AcceptFriendRequestResponse;
import com.weconnect.dto.friend.response.FriendListResponse;
import com.weconnect.dto.friend.response.FriendRequestListItemResponse;
import com.weconnect.dto.friend.response.FriendRequestListResponse;
import com.weconnect.dto.friend.response.FriendRequestResponse;
import com.weconnect.dto.friend.response.FriendRequestStatusResponse;
import com.weconnect.dto.user.response.UserSearchItemResponse;
import com.weconnect.entity.FriendRequest;
import com.weconnect.entity.Friendship;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.FriendRequestRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class FriendService {
    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;

    public FriendService(
            UserRepository userRepository,
            FriendRequestRepository friendRequestRepository,
            FriendshipRepository friendshipRepository
    ) {
        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    public FriendRequestResponse sendFriendRequest(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw BusinessException.badRequest("Không thể gửi lời mời cho chính mình");
        }

        LockedUsers users = lockUsers(senderId, receiverId);
        long user1Id = Math.min(senderId, receiverId);
        long user2Id = Math.max(senderId, receiverId);

        if (friendshipRepository.existsByUser1_UserIdAndUser2_UserId(user1Id, user2Id)) {
            throw BusinessException.conflict("ALREADY_FRIENDS");
        }
        if (!friendRequestRepository.findPendingBetween(senderId, receiverId).isEmpty()) {
            throw BusinessException.conflict("REQUEST_ALREADY_EXISTS");
        }

        FriendRequest request = reusableRequest(senderId, receiverId);
        if (request == null) {
            request = new FriendRequest();
        }
        request.resend(users.first(), users.second(), LocalDateTime.now());

        try {
            return FriendRequestResponse.from(friendRequestRepository.saveAndFlush(request));
        } catch (DataIntegrityViolationException exception) {
            throw BusinessException.conflict("REQUEST_ALREADY_EXISTS");
        }
    }

    @Transactional(readOnly = true)
    public FriendRequestListResponse getReceivedRequests(Long userId, int page, int pageSize) {
        Page<FriendRequest> result = friendRequestRepository.findByReceiver_UserIdAndStatus(
                userId,
                FriendRequestStatus.PENDING,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        List<FriendRequestListItemResponse> data = result.getContent().stream()
                .map(request -> FriendRequestListItemResponse.from(request, request.getSender()))
                .toList();
        return new FriendRequestListResponse(data, pagination(page, pageSize, result));
    }

    @Transactional(readOnly = true)
    public FriendRequestListResponse getSentRequests(Long userId, int page, int pageSize) {
        Page<FriendRequest> result = friendRequestRepository.findBySender_UserIdAndStatus(
                userId,
                FriendRequestStatus.PENDING,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        List<FriendRequestListItemResponse> data = result.getContent().stream()
                .map(request -> FriendRequestListItemResponse.from(request, request.getReceiver()))
                .toList();
        return new FriendRequestListResponse(data, pagination(page, pageSize, result));
    }

    @Transactional
    public void cancelFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest request = lockRequestPair(requestId);
        if (!request.isPending() || !request.getSender().getUserId().equals(currentUserId)) {
            throw BusinessException.notFound("Lời mời không tồn tại hoặc không có quyền huỷ");
        }
        request.cancel(LocalDateTime.now());
    }

    @Transactional
    public AcceptFriendRequestResponse acceptFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest request = lockRequestPair(requestId);
        if (!request.isPending() || !request.getReceiver().getUserId().equals(currentUserId)) {
            throw BusinessException.notFound("Lời mời không tồn tại");
        }

        long user1Id = Math.min(request.getSender().getUserId(), request.getReceiver().getUserId());
        long user2Id = Math.max(request.getSender().getUserId(), request.getReceiver().getUserId());
        if (friendshipRepository.existsByUser1_UserIdAndUser2_UserId(user1Id, user2Id)) {
            throw BusinessException.conflict("ALREADY_FRIENDS");
        }

        request.accept(LocalDateTime.now());
        Friendship friendship = Friendship.between(request.getSender(), request.getReceiver());
        try {
            friendship = friendshipRepository.saveAndFlush(friendship);
        } catch (DataIntegrityViolationException exception) {
            throw BusinessException.conflict("ALREADY_FRIENDS");
        }
        return new AcceptFriendRequestResponse(request.getStatus(), friendship.getFriendshipId());
    }

    @Transactional
    public FriendRequestStatusResponse rejectFriendRequest(Long requestId, Long currentUserId) {
        FriendRequest request = lockRequestPair(requestId);
        if (!request.isPending() || !request.getReceiver().getUserId().equals(currentUserId)) {
            throw BusinessException.notFound("Lời mời không tồn tại");
        }
        request.reject(LocalDateTime.now());
        return new FriendRequestStatusResponse(request.getStatus());
    }

    @Transactional(readOnly = true)
    public FriendListResponse listFriends(Long userId, String keyword, int page, int pageSize) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        Page<User> result = userRepository.findFriends(
                userId,
                normalizedKeyword,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.ASC, "fullName"))
        );
        List<UserSearchItemResponse> data = result.getContent().stream()
                .map(user -> UserSearchItemResponse.from(user, FriendshipStatus.FRIEND))
                .toList();
        return new FriendListResponse(data, pagination(page, pageSize, result));
    }

    @Transactional
    public void unfriend(Long currentUserId, Long otherUserId) {
        if (currentUserId.equals(otherUserId)) {
            throw BusinessException.notFound("Hai người không phải là bạn bè");
        }
        lockUsers(currentUserId, otherUserId);
        long user1Id = Math.min(currentUserId, otherUserId);
        long user2Id = Math.max(currentUserId, otherUserId);
        Friendship friendship = friendshipRepository.findBetweenForUpdate(user1Id, user2Id)
                .orElseThrow(() -> BusinessException.notFound("Hai người không phải là bạn bè"));
        friendshipRepository.delete(friendship);
    }

    private FriendRequest reusableRequest(Long senderId, Long receiverId) {
        return friendRequestRepository.findBySender_UserIdAndReceiver_UserId(senderId, receiverId)
                .orElseGet(() -> friendRequestRepository.findAllBetween(senderId, receiverId)
                        .stream()
                        .findFirst()
                        .orElse(null));
    }

    private FriendRequest lockRequestPair(Long requestId) {
        FriendRequest snapshot = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> BusinessException.notFound("Lời mời không tồn tại"));
        lockUsers(snapshot.getSender().getUserId(), snapshot.getReceiver().getUserId());
        return friendRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> BusinessException.notFound("Lời mời không tồn tại"));
    }

    private LockedUsers lockUsers(Long firstUserId, Long secondUserId) {
        List<User> lockedUsers = userRepository.findAllByIdForUpdate(Set.of(firstUserId, secondUserId));
        Map<Long, User> usersById = new HashMap<>();
        lockedUsers.forEach(user -> usersById.put(user.getUserId(), user));

        User first = usersById.get(firstUserId);
        User second = usersById.get(secondUserId);
        if (first == null || second == null) {
            throw BusinessException.notFound("Người dùng không tồn tại");
        }
        return new LockedUsers(first, second);
    }

    private PaginationResponse pagination(int page, int pageSize, Page<?> result) {
        return new PaginationResponse(page, pageSize, result.getTotalElements(), result.getTotalPages());
    }

    private record LockedUsers(User first, User second) {
    }
}
