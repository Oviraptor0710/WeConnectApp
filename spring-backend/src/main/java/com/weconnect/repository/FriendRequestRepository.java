package com.weconnect.repository;

import com.weconnect.domain.friend.FriendRequestStatus;
import com.weconnect.entity.FriendRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    @Query("""
            select r from FriendRequest r
            where r.status = com.weconnect.domain.friend.FriendRequestStatus.PENDING
              and (r.sender.userId = :userId or r.receiver.userId = :userId)
            """)
    List<FriendRequest> findPendingForUser(@Param("userId") Long userId);

    @Query("""
            select r from FriendRequest r
            where r.status = com.weconnect.domain.friend.FriendRequestStatus.PENDING
              and ((r.sender.userId = :me and r.receiver.userId = :other)
                or (r.sender.userId = :other and r.receiver.userId = :me))
            order by r.createdAt desc
            """)
    List<FriendRequest> findPendingBetween(
            @Param("me") Long me,
            @Param("other") Long other
    );

    @Query("""
            select r from FriendRequest r
            where (r.sender.userId = :me and r.receiver.userId = :other)
               or (r.sender.userId = :other and r.receiver.userId = :me)
            order by r.createdAt desc
            """)
    List<FriendRequest> findAllBetween(
            @Param("me") Long me,
            @Param("other") Long other
    );

    Optional<FriendRequest> findBySender_UserIdAndReceiver_UserId(Long senderId, Long receiverId);

    @EntityGraph(attributePaths = "sender")
    Page<FriendRequest> findByReceiver_UserIdAndStatus(
            Long receiverId,
            FriendRequestStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "receiver")
    Page<FriendRequest> findBySender_UserIdAndStatus(
            Long senderId,
            FriendRequestStatus status,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from FriendRequest r where r.requestId = :requestId")
    Optional<FriendRequest> findByIdForUpdate(@Param("requestId") Long requestId);
}
