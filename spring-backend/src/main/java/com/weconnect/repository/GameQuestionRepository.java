package com.weconnect.repository;

import com.weconnect.entity.GameQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameQuestionRepository extends JpaRepository<GameQuestion, Long> {
}
