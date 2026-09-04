package com.weconnect.repository;

import com.weconnect.entity.GameQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameQuestionRepository extends JpaRepository<GameQuestion, Long> {
    List<GameQuestion> findByGameType(String gameType);
}
