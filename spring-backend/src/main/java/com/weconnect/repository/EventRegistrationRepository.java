package com.weconnect.repository;

import com.weconnect.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    long countByEventEventId(Long eventId);
    long countByEventEventIdIn(List<Long> eventIds);
    boolean existsByEventEventIdAndUserUserId(Long eventId, Long userId);
    Optional<EventRegistration> findByEventEventIdAndUserUserId(Long eventId, Long userId);
    List<EventRegistration> findByEventEventId(Long eventId);
}
