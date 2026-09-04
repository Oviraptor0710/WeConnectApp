package com.weconnect.repository;

import com.weconnect.entity.GameMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameMessageRepository extends JpaRepository<GameMessage, Long> {
    List<GameMessage> findTop50ByRoomRoomIdOrderByMessageIdDesc(Long roomId);
}
