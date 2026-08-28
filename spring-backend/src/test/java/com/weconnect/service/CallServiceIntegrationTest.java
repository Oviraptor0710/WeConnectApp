package com.weconnect.service;

import com.weconnect.domain.call.CallStatus;
import com.weconnect.domain.call.CallType;
import com.weconnect.dto.call.response.CallConnectionResponse;
import com.weconnect.dto.call.response.CallResponse;
import com.weconnect.entity.Call;
import com.weconnect.entity.Friendship;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.CallRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.UserRepository;
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
class CallServiceIntegrationTest {
    @Autowired
    private CallService callService;

    @Autowired
    private CallRepository callRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Test
    void callerCanJoinRingingCallAndReceiverNeedsToAcceptFirst() {
        Users users = usersAndFriendship("call.join");
        CallResponse created = callService.createCall(
                users.caller().getUserId(), users.receiver().getUserId(), CallType.VIDEO
        );

        assertThat(created.status()).isEqualTo(CallStatus.RINGING);
        assertThat(created.createdAt()).endsWith("Z");
        assertThat(created.expiresAt()).endsWith("Z");
        assertThat(callService.getActiveIncomingCall(users.receiver().getUserId()).callId())
                .isEqualTo(created.callId());

        CallConnectionResponse callerConnection = callService.joinCall(
                users.caller().getUserId(), created.callId()
        );
        assertThat(callerConnection.serverUrl()).isEqualTo("wss://test.livekit.invalid");
        assertThat(callerConnection.participantToken()).isNotBlank();
        assertThat(callerConnection.partner().userId()).isEqualTo(users.receiver().getUserId());

        assertThatThrownBy(() -> callService.joinCall(users.receiver().getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT));

        callService.acceptCall(users.receiver().getUserId(), created.callId());
        CallConnectionResponse receiverConnection = callService.joinCall(
                users.receiver().getUserId(), created.callId()
        );
        assertThat(receiverConnection.participantToken()).isNotBlank();
        assertThat(receiverConnection.call().status()).isEqualTo(CallStatus.ACCEPTED);

        CallResponse ended = callService.endCall(users.caller().getUserId(), created.callId());
        assertThat(ended.status()).isEqualTo(CallStatus.ENDED);
        assertThat(ended.endedAt()).isNotNull();
    }

    @Test
    void ownershipBusyAndOutsiderRulesAreEnforced() {
        Users users = usersAndFriendship("call.rules");
        User outsider = verifiedUser("call.rules.outsider@test.local", "Outsider");
        friendshipRepository.saveAndFlush(Friendship.between(users.receiver(), outsider));
        CallResponse created = callService.createCall(
                users.caller().getUserId(), users.receiver().getUserId(), CallType.VIDEO
        );

        assertThatThrownBy(() -> callService.acceptCall(users.caller().getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> callService.rejectCall(users.caller().getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> callService.getCall(outsider.getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        assertThatThrownBy(() -> callService.createCall(
                users.receiver().getUserId(), outsider.getUserId(), CallType.VIDEO
        )).isInstanceOfSatisfying(BusinessException.class, exception -> {
            assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(exception.getMessage()).isEqualTo("CALL_PARTICIPANT_BUSY");
        });

        CallResponse rejected = callService.rejectCall(users.receiver().getUserId(), created.callId());
        assertThat(rejected.status()).isEqualTo(CallStatus.REJECTED);
        assertThatThrownBy(() -> callService.acceptCall(users.receiver().getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void unfriendBlocksCreateAndAcceptAndTimeoutIsStateful() {
        Users users = usersAndFriendship("call.unfriend");
        CallResponse created = callService.createCall(
                users.caller().getUserId(), users.receiver().getUserId(), CallType.VIDEO
        );
        deleteFriendship(users);

        assertThatThrownBy(() -> callService.acceptCall(users.receiver().getUserId(), created.callId()))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(exception.getMessage()).isEqualTo("NOT_FRIENDS");
                });

        Call call = callRepository.findById(created.callId()).orElseThrow();
        call.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        callRepository.saveAndFlush(call);
        CallResponse missed = callService.timeoutCall(users.caller().getUserId(), created.callId());
        assertThat(missed.status()).isEqualTo(CallStatus.MISSED);

        assertThatThrownBy(() -> callService.createCall(
                users.caller().getUserId(), users.receiver().getUserId(), CallType.VIDEO
        )).isInstanceOfSatisfying(BusinessException.class, exception ->
                assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    private void deleteFriendship(Users users) {
        long low = Math.min(users.caller().getUserId(), users.receiver().getUserId());
        long high = Math.max(users.caller().getUserId(), users.receiver().getUserId());
        Friendship friendship = friendshipRepository
                .findByUser1_UserIdAndUser2_UserId(low, high).orElseThrow();
        friendshipRepository.delete(friendship);
        friendshipRepository.flush();
    }

    private Users usersAndFriendship(String prefix) {
        User caller = verifiedUser(prefix + ".caller@test.local", "Caller");
        User receiver = verifiedUser(prefix + ".receiver@test.local", "Receiver");
        friendshipRepository.saveAndFlush(Friendship.between(caller, receiver));
        return new Users(caller, receiver);
    }

    private User verifiedUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("test-password-hash");
        user.setFullName(name);
        user.setRole("USER");
        user.setIsVerified(true);
        return userRepository.saveAndFlush(user);
    }

    private record Users(User caller, User receiver) {
    }
}
