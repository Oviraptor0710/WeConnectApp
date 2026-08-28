package com.weconnect.repository;

import com.weconnect.entity.Conversation;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @EntityGraph(attributePaths = {"user1", "user2"})
    Optional<Conversation> findByUser1_UserIdAndUser2_UserId(Long user1Id, Long user2Id);

    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("""
            select c from Conversation c
            where c.user1.userId = :userId or c.user2.userId = :userId
            order by coalesce(c.lastMessageAt, c.createdAt) desc
            """)
    Page<Conversation> findAllForUser(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("""
            select c from Conversation c
            where c.conversationId = :conversationId
              and (c.user1.userId = :userId or c.user2.userId = :userId)
            """)
    Optional<Conversation> findForUser(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"user1", "user2"})
    @Query("""
            select c from Conversation c
            where c.conversationId = :conversationId
              and (c.user1.userId = :userId or c.user2.userId = :userId)
            """)
    Optional<Conversation> findForUserForUpdate(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );
}
