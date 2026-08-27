package com.weconnect.repository;

import com.weconnect.entity.Hobby;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HobbyRepository extends JpaRepository<Hobby, Integer> {
    List<Hobby> findAllByOrderByCategoryAscNameAsc();
}
