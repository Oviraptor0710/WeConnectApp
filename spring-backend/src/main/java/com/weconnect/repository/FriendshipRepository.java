package com.weconnect.repository;

import com.weconnect.entity.Friendship;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    @Query("""
            select f from Friendship f
            where f.user1.userId = :userId or f.user2.userId = :userId
            """)
    List<Friendship> findAllForUser(@Param("userId") Long userId);

    boolean existsByUser1_UserIdAndUser2_UserId(Long user1Id, Long user2Id);

    Optional<Friendship> findByUser1_UserIdAndUser2_UserId(Long user1Id, Long user2Id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select f from Friendship f
            where f.user1.userId = :user1Id and f.user2.userId = :user2Id
            """)
    Optional<Friendship> findBetweenForUpdate(
            @Param("user1Id") Long user1Id,
            @Param("user2Id") Long user2Id
    );
}
