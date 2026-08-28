package com.weconnect.repository;

import com.weconnect.entity.Call;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CallRepository extends JpaRepository<Call, Long> {
    @EntityGraph(attributePaths = {"caller", "receiver"})
    @Query("""
            select c from Call c
            where c.callId = :callId
              and (c.caller.userId = :userId or c.receiver.userId = :userId)
            """)
    Optional<Call> findForParticipant(
            @Param("callId") Long callId,
            @Param("userId") Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"caller", "receiver"})
    @Query("""
            select c from Call c
            where c.callId = :callId
              and (c.caller.userId = :userId or c.receiver.userId = :userId)
            """)
    Optional<Call> findForParticipantForUpdate(
            @Param("callId") Long callId,
            @Param("userId") Long userId
    );

    @EntityGraph(attributePaths = {"caller", "receiver"})
    Optional<Call> findTopByReceiver_UserIdAndStatusAndExpiresAtAfterOrderByCreatedAtDesc(
            Long receiverId,
            com.weconnect.domain.call.CallStatus status,
            LocalDateTime now
    );

    @Query("""
            select (count(c) > 0) from Call c
            where (c.caller.userId in :userIds or c.receiver.userId in :userIds)
              and (c.status = com.weconnect.domain.call.CallStatus.ACCEPTED
                or (c.status = com.weconnect.domain.call.CallStatus.RINGING and c.expiresAt > :now))
            """)
    boolean existsActiveForUsers(
            @Param("userIds") java.util.Collection<Long> userIds,
            @Param("now") LocalDateTime now
    );

    @Modifying(flushAutomatically = true)
    @Query("""
            update Call c set c.status = com.weconnect.domain.call.CallStatus.MISSED,
                              c.endedAt = :now
            where c.status = com.weconnect.domain.call.CallStatus.RINGING
              and c.expiresAt <= :now
            """)
    int markExpiredRingingCalls(@Param("now") LocalDateTime now);
}
