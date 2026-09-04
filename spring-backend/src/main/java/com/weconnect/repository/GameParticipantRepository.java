package com.weconnect.repository;

import com.weconnect.entity.GameParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameParticipantRepository extends JpaRepository<GameParticipant, Long> {
    Optional<GameParticipant> findByRoomRoomIdAndUserUserIdAndLeftAtIsNull(Long roomId, Long userId);
    List<GameParticipant> findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(Long roomId);
    long countByRoomRoomIdAndLeftAtIsNull(Long roomId);
    List<GameParticipant> findByRoomRoomId(Long roomId);
}
