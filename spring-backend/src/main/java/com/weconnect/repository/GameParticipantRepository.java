package com.weconnect.repository;

import com.weconnect.entity.GameParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameParticipantRepository extends JpaRepository<GameParticipant, Long> {
}
