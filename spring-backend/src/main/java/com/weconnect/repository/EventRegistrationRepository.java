package com.weconnect.repository;

import com.weconnect.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
}
