package com.weconnect.service;

import com.weconnect.entity.Otp;
import com.weconnect.entity.OtpPurpose;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OtpChallengeService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final int expireMinutes;
    private final int resendCooldownSeconds;
    private final int maxSendsPerHour;
    private final int maxVerifyAttempts;

    public OtpChallengeService(
            OtpRepository otpRepository,
            @Value("${app.otp.expire-minutes:5}") int expireMinutes,
            @Value("${app.otp.resend-cooldown-seconds:60}") int resendCooldownSeconds,
            @Value("${app.otp.max-sends-per-hour:5}") int maxSendsPerHour,
            @Value("${app.otp.max-verify-attempts:5}") int maxVerifyAttempts
    ) {
        this.otpRepository = otpRepository;
        this.expireMinutes = expireMinutes;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.maxSendsPerHour = maxSendsPerHour;
        this.maxVerifyAttempts = maxVerifyAttempts;
    }

    @Transactional
    public Otp createChallenge(String email, OtpPurpose purpose) {
        LocalDateTime now = LocalDateTime.now();
        Otp latest = otpRepository
                .findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose.name())
                .orElse(null);
        if (latest != null && latest.getCreatedAt() != null
                && latest.getCreatedAt().isAfter(now.minusSeconds(resendCooldownSeconds))) {
            throw BusinessException.tooManyRequests(
                    "Vui lòng đợi " + resendCooldownSeconds + " giây trước khi yêu cầu mã mới."
            );
        }

        long recentSends = otpRepository.countByEmailAndPurposeAndCreatedAtAfter(
                email, purpose.name(), now.minusHours(1));
        if (recentSends >= maxSendsPerHour) {
            throw BusinessException.tooManyRequests("Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau.");
        }

        List<Otp> pending = otpRepository.findByEmailAndPurposeAndUsedFalse(email, purpose.name());
        pending.forEach(otp -> otp.setUsed(true));
        otpRepository.saveAll(pending);

        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setPurpose(purpose.name());
        otp.setCode(String.format("%06d", SECURE_RANDOM.nextInt(1_000_000)));
        otp.setExpireAt(now.plusMinutes(expireMinutes));
        otp.setUsed(false);
        otp.setAttemptCount(0);
        return otpRepository.saveAndFlush(otp);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void invalidateChallenge(Long otpId) {
        otpRepository.findById(otpId).ifPresent(otp -> {
            otp.setUsed(true);
            otpRepository.save(otp);
        });
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public void verifyAndConsume(String email, String code, OtpPurpose purpose) {
        Otp otp = otpRepository
                .findFirstByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose.name())
                .orElseThrow(() -> BusinessException.badRequest("Mã OTP không chính xác hoặc đã hết hạn."));

        LocalDateTime now = LocalDateTime.now();
        if (!otp.getExpireAt().isAfter(now)) {
            otp.setUsed(true);
            throw BusinessException.badRequest("Mã OTP đã hết hạn.");
        }

        if (!constantTimeEquals(otp.getCode(), code)) {
            otpRepository.registerFailedAttempt(otp.getOtpId(), maxVerifyAttempts);
            throw BusinessException.badRequest("Mã OTP không chính xác.");
        }

        if (otpRepository.consumeIfActive(otp.getOtpId(), now) != 1) {
            throw BusinessException.badRequest("Mã OTP đã được sử dụng hoặc đã hết hạn.");
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }
}
