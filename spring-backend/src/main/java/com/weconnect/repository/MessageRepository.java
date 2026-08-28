package com.weconnect.repository;

import com.weconnect.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Optional<Message> findTopByConversation_ConversationIdOrderByMessageIdDesc(Long conversationId);

    @Query("""
            select m from Message m
            where m.conversation.conversationId = :conversationId
              and (:cursor is null or m.messageId < :cursor)
            order by m.messageId desc
            """)
    List<Message> findBefore(
            @Param("conversationId") Long conversationId,
            @Param("cursor") Long cursor,
            Pageable pageable
    );

    @Query("""
            select m from Message m
            where m.conversation.conversationId = :conversationId
              and (:cursor is null or m.messageId > :cursor)
            order by m.messageId asc
            """)
    List<Message> findAfter(
            @Param("conversationId") Long conversationId,
            @Param("cursor") Long cursor,
            Pageable pageable
    );

    boolean existsByMessageIdAndConversation_ConversationId(Long messageId, Long conversationId);

    long countByConversation_ConversationIdAndSender_UserIdNotAndIsReadFalse(
            Long conversationId,
            Long viewerId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Message m
               set m.isRead = true
             where m.conversation.conversationId = :conversationId
               and m.sender.userId <> :readerId
               and m.isRead = false
               and (:lastReadMessageId is null or m.messageId <= :lastReadMessageId)
            """)
    int markIncomingRead(
            @Param("conversationId") Long conversationId,
            @Param("readerId") Long readerId,
            @Param("lastReadMessageId") Long lastReadMessageId
    );

    @Query("""
            select m from Message m
            where m.messageId in (
                select max(latest.messageId)
                from Message latest
                where latest.conversation.conversationId in :conversationIds
                group by latest.conversation.conversationId
            )
            """)
    List<Message> findLatestForConversations(
            @Param("conversationIds") Collection<Long> conversationIds
    );

    @Query("""
            select m.conversation.conversationId, count(m)
            from Message m
            where m.conversation.conversationId in :conversationIds
              and m.sender.userId <> :viewerId
              and m.isRead = false
            group by m.conversation.conversationId
            """)
    List<Object[]> countUnreadByConversation(
            @Param("conversationIds") Collection<Long> conversationIds,
            @Param("viewerId") Long viewerId
    );
}
