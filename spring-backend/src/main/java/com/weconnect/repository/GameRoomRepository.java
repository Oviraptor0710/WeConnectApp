package com.weconnect.repository;

import com.weconnect.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {
    Optional<GameRoom> findByCodeIgnoreCaseAndStatusNot(String code, String status);
    List<GameRoom> findByStatusNotOrderByCreatedAtDesc(String status);
    List<GameRoom> findByRoomTypeAndStatusOrderByCreatedAtAsc(String roomType, String status);
}
