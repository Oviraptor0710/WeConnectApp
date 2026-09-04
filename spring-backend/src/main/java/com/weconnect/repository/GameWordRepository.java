package com.weconnect.repository;

import com.weconnect.entity.GameWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameWordRepository extends JpaRepository<GameWord, Long> {
    List<GameWord> findByMoraCountBetween(int min, int max);
    Optional<GameWord> findByHiragana(String hiragana);
}
