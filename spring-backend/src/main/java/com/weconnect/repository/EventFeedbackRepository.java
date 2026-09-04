package com.weconnect.repository;

import com.weconnect.entity.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {
    List<EventFeedback> findByEventEventIdOrderByCreatedAtDesc(Long eventId);
    List<EventFeedback> findByEventEventId(Long eventId);
    boolean existsByEventEventIdAndUserUserId(Long eventId, Long userId);
}
