package com.weconnect.service;

import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.dto.friend.response.AcceptFriendRequestResponse;
import com.weconnect.dto.friend.response.FriendListResponse;
import com.weconnect.dto.friend.response.FriendRequestListResponse;
import com.weconnect.dto.friend.response.FriendRequestResponse;
import com.weconnect.entity.FriendRequest;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.FriendRequestRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FriendServiceIntegrationTest {
    @Autowired
    private FriendService friendService;

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void rejectThenResendReusesAndFullyResetsTheRequest() {
        User sender = verifiedUser("friend.sender1@test.local", "Người gửi");
        User receiver = verifiedUser("friend.receiver1@test.local", "Người nhận");

        FriendRequestResponse sent = friendService.sendFriendRequest(sender.getUserId(), receiver.getUserId());
        assertThat(userProfileService.getUserProfile(sender.getUserId(), receiver.getUserId()).friendshipStatus())
                .isEqualTo(FriendshipStatus.REQUEST_SENT);
        assertThat(userProfileService.getUserProfile(receiver.getUserId(), sender.getUserId()).friendshipStatus())
                .isEqualTo(FriendshipStatus.REQUEST_RECEIVED);

        friendService.rejectFriendRequest(sent.requestId(), receiver.getUserId());
        FriendRequest rejected = friendRequestRepository.findById(sent.requestId()).orElseThrow();
        rejected.setCreatedAt(LocalDateTime.of(2000, 1, 1, 0, 0));
        friendRequestRepository.saveAndFlush(rejected);
        entityManager.clear();

        FriendRequestResponse resent = friendService.sendFriendRequest(sender.getUserId(), receiver.getUserId());
        FriendRequest current = friendRequestRepository.findById(resent.requestId()).orElseThrow();

        assertThat(resent.requestId()).isEqualTo(sent.requestId());
        assertThat(current.getStatus()).isEqualTo(FriendRequestStatus.PENDING);
        assertThat(current.getCreatedAt()).isAfter(LocalDateTime.of(2000, 1, 1, 0, 0));
        assertThat(current.getRespondedAt()).isNull();
        assertThat(current.getSender().getUserId()).isEqualTo(sender.getUserId());
        assertThat(current.getReceiver().getUserId()).isEqualTo(receiver.getUserId());
    }

    @Test
    void acceptCreatesOneFriendshipAndUnfriendAllowsReverseResend() {
        User sender = verifiedUser("friend.sender2@test.local", "An");
        User receiver = verifiedUser("friend.receiver2@test.local", "Bình");
        FriendRequestResponse sent = friendService.sendFriendRequest(sender.getUserId(), receiver.getUserId());

        assertThatThrownBy(() -> friendService.acceptFriendRequest(sent.requestId(), sender.getUserId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        AcceptFriendRequestResponse accepted = friendService.acceptFriendRequest(
                sent.requestId(),
                receiver.getUserId()
        );
        assertThat(accepted.status()).isEqualTo(FriendRequestStatus.ACCEPTED);
        assertThat(friendshipRepository.count()).isEqualTo(1);
        assertThat(userProfileService.getUserProfile(sender.getUserId(), receiver.getUserId()).friendshipStatus())
                .isEqualTo(FriendshipStatus.FRIEND);

        assertThatThrownBy(() -> friendService.acceptFriendRequest(sent.requestId(), receiver.getUserId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(friendshipRepository.count()).isEqualTo(1);

        FriendListResponse friends = friendService.listFriends(sender.getUserId(), "bì", 1, 20);
        assertThat(friends.data()).extracting("userId").containsExactly(receiver.getUserId());

        friendService.unfriend(sender.getUserId(), receiver.getUserId());
        assertThat(friendshipRepository.count()).isZero();
        assertThat(userProfileService.getUserProfile(sender.getUserId(), receiver.getUserId()).friendshipStatus())
                .isEqualTo(FriendshipStatus.NONE);

        FriendRequestResponse reverseRequest = friendService.sendFriendRequest(
                receiver.getUserId(),
                sender.getUserId()
        );
        FriendRequest reused = friendRequestRepository.findById(reverseRequest.requestId()).orElseThrow();
        assertThat(reverseRequest.requestId()).isEqualTo(sent.requestId());
        assertThat(reused.getSender().getUserId()).isEqualTo(receiver.getUserId());
        assertThat(reused.getReceiver().getUserId()).isEqualTo(sender.getUserId());
        assertThat(reused.getStatus()).isEqualTo(FriendRequestStatus.PENDING);
    }

    @Test
    void pendingRequestRejectsCrossSendAndEnforcesCancelOwnership() {
        User sender = verifiedUser("friend.sender3@test.local", "Cường");
        User receiver = verifiedUser("friend.receiver3@test.local", "Dũng");
        FriendRequestResponse sent = friendService.sendFriendRequest(sender.getUserId(), receiver.getUserId());

        FriendRequestListResponse received = friendService.getReceivedRequests(receiver.getUserId(), 1, 20);
        FriendRequestListResponse outgoing = friendService.getSentRequests(sender.getUserId(), 1, 20);
        assertThat(received.data()).extracting("requestId").containsExactly(sent.requestId());
        assertThat(outgoing.data()).extracting("requestId").containsExactly(sent.requestId());

        assertThatThrownBy(() -> friendService.sendFriendRequest(receiver.getUserId(), sender.getUserId()))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("REQUEST_ALREADY_EXISTS");
                });
        assertThatThrownBy(() -> friendService.cancelFriendRequest(sent.requestId(), receiver.getUserId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        friendService.cancelFriendRequest(sent.requestId(), sender.getUserId());
        FriendRequest cancelled = friendRequestRepository.findById(sent.requestId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(FriendRequestStatus.CANCELLED);
        assertThat(cancelled.getRespondedAt()).isNotNull();
        assertThat(friendService.getReceivedRequests(receiver.getUserId(), 1, 20).data()).isEmpty();
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
}
