package com.weconnect.repository;

import com.weconnect.entity.GameWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameWordRepository extends JpaRepository<GameWord, Long> {
}
