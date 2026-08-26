package com.weconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "OTPS")
@Data
@NoArgsConstructor
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "otp_id")
    private Long otpId;

    @Column(nullable = false, length = 255)
    private String email; // Đổi từ identifier sang email vì chỉ gửi qua email

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 50)
    private String purpose; // REGISTER | FORGOT_PASSWORD

    @Column(name = "expire_at", nullable = false)
    private LocalDateTime expireAt;

    private Boolean used = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
