package com.weconnect.repository;

import com.weconnect.entity.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {
}
