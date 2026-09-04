package com.weconnect.repository;

import com.weconnect.entity.MessageTranslation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageTranslationRepository extends JpaRepository<MessageTranslation, Long> {
    @EntityGraph(attributePaths = "message")
    Optional<MessageTranslation> findFirstByMessage_MessageIdOrderByCreatedAtDesc(Long messageId);

    List<MessageTranslation> findAllByMessage_MessageIdInOrderByCreatedAtDesc(
            Collection<Long> messageIds
    );
}
