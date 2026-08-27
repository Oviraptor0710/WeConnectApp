package com.weconnect.entity;

import com.weconnect.domain.friend.FriendRequestStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FriendRequestTest {
    @Test
    void resendResetsTheWholeCurrentRequestLifecycle() {
        User oldSender = user(1L);
        User oldReceiver = user(2L);
        User newSender = user(2L);
        User newReceiver = user(1L);
        LocalDateTime firstSentAt = LocalDateTime.of(2026, 1, 1, 8, 0);
        LocalDateTime respondedAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        LocalDateTime resentAt = LocalDateTime.of(2026, 1, 2, 10, 0);

        FriendRequest request = new FriendRequest();
        request.resend(oldSender, oldReceiver, firstSentAt);
        request.reject(respondedAt);
        request.resend(newSender, newReceiver, resentAt);

        assertThat(request.getSender()).isSameAs(newSender);
        assertThat(request.getReceiver()).isSameAs(newReceiver);
        assertThat(request.getStatus()).isEqualTo(FriendRequestStatus.PENDING);
        assertThat(request.getCreatedAt()).isEqualTo(resentAt);
        assertThat(request.getRespondedAt()).isNull();
    }

    @Test
    void aCompletedRequestCannotBeCompletedAgainWithoutResend() {
        FriendRequest request = new FriendRequest();
        request.resend(user(1L), user(2L), LocalDateTime.now());
        request.accept(LocalDateTime.now());

        assertThatThrownBy(() -> request.cancel(LocalDateTime.now()))
                .isInstanceOf(IllegalStateException.class);
    }

    private User user(Long id) {
        User user = new User();
        user.setUserId(id);
        return user;
    }
}
