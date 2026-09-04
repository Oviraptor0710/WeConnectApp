package com.weconnect.repository;

import com.weconnect.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByTitleContainingIgnoreCase(String title);
    List<Event> findByStatus(String status);
    List<Event> findByTitleContainingIgnoreCaseAndStatus(String title, String status);
    List<Event> findByOrganizerUserIdOrderByCreatedAtDesc(Long userId);
    long countByOrganizerUserId(Long userId);
    long countByOrganizerUserIdAndStatus(Long userId, String status);
}
