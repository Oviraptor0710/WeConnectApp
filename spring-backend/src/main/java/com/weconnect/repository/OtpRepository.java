package com.weconnect.repository;

import com.weconnect.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    
    // Tìm OTP theo email, code và purpose
    Optional<Otp> findByEmailAndCodeAndPurpose(String email, String code, String purpose);
    
    // Tìm các OTP chưa sử dụng của 1 email theo purpose
    List<Otp> findByEmailAndPurposeAndUsedFalse(String email, String purpose);
}
