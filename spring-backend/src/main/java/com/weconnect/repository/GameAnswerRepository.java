package com.weconnect.repository;

import com.weconnect.entity.GameAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameAnswerRepository extends JpaRepository<GameAnswer, Long> {
}
