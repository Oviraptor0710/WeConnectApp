package com.weconnect.repository;

import com.weconnect.entity.GameMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameMessageRepository extends JpaRepository<GameMessage, Long> {
}
