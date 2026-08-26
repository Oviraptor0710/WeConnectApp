package com.weconnect.repository;

import com.weconnect.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

import jakarta.persistence.LockModeType;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthSession> findByTokenHashAndTokenTypeAndRevokedAtIsNull(String tokenHash, String tokenType);

    @Modifying
    @Query("""
            update AuthSession session
               set session.revokedAt = :now
             where session.user.userId = :userId
               and session.revokedAt is null
            """)
    int revokeAllActiveByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
