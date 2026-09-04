package com.weconnect.repository;

import com.weconnect.entity.GameAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameAnswerRepository extends JpaRepository<GameAnswer, Long> {
    boolean existsByRoomRoomIdAndUserUserIdAndQuestionIndex(Long roomId, Long userId, int questionIndex);
    List<GameAnswer> findByRoomRoomIdAndUserUserId(Long roomId, Long userId);
}
