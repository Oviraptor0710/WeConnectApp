package com.weconnect.repository;

import com.weconnect.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    
    List<Otp> findByEmailAndPurposeAndUsedFalse(String email, String purpose);

    Optional<Otp> findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, String purpose);

    long countByEmailAndPurposeAndCreatedAtAfter(String email, String purpose, LocalDateTime createdAt);

    @Modifying
    @Query("""
            update Otp otp
               set otp.used = true
             where otp.otpId = :otpId
               and otp.used = false
               and otp.expireAt > :now
            """)
    int consumeIfActive(@Param("otpId") Long otpId, @Param("now") LocalDateTime now);

    @Modifying
    @Query(value = """
            UPDATE OTPS
               SET attempt_count = attempt_count + 1,
                   used = IF(attempt_count + 1 >= :maxAttempts, TRUE, used)
             WHERE otp_id = :otpId
               AND used = FALSE
            """, nativeQuery = true)
    int registerFailedAttempt(@Param("otpId") Long otpId, @Param("maxAttempts") int maxAttempts);
}
