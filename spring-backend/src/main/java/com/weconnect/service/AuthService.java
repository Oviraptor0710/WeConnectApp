package com.weconnect.service;

import com.weconnect.dto.request.LoginRequest;
import com.weconnect.dto.request.RegisterRequest;
import com.weconnect.entity.Otp;
import com.weconnect.entity.OtpPurpose;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.UserRepository;
import com.weconnect.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpChallengeService otpChallengeService;
    private final AuthSessionService authSessionService;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            OtpChallengeService otpChallengeService,
            AuthSessionService authSessionService,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.otpChallengeService = otpChallengeService;
        this.authSessionService = authSessionService;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public void processRegister(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null) {
            if (Boolean.TRUE.equals(existingUser.getIsVerified())) {
                throw BusinessException.conflict("Email này đã được sử dụng.");
            }
            existingUser.setFullName(request.getFullName().trim());
            existingUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            return;
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(request.getFullName().trim());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setIsVerified(false);
        newUser.setRole("USER");
        userRepository.save(newUser);
    }

    public void sendOtp(String rawEmail, OtpPurpose purpose) {
        String email = normalizeEmail(rawEmail);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            if (purpose == OtpPurpose.FORGOT_PASSWORD) {
                return;
            }
            throw BusinessException.badRequest("Tài khoản không tồn tại trong hệ thống.");
        }
        if (purpose == OtpPurpose.FORGOT_PASSWORD && !Boolean.TRUE.equals(user.getIsVerified())) {
            return;
        }
        if (purpose == OtpPurpose.REGISTER && Boolean.TRUE.equals(user.getIsVerified())) {
            throw BusinessException.conflict("Tài khoản này đã được xác thực rồi.");
        }

        Otp otp = otpChallengeService.createChallenge(email, purpose);
        try {
            emailService.sendOtpEmail(email, otp.getCode(), purpose.name());
        } catch (Exception ex) {
            otpChallengeService.invalidateChallenge(otp.getOtpId());
            throw BusinessException.badGateway("Không thể gửi email OTP. Vui lòng thử lại sau.");
        }
    }

    public AuthenticatedSession verifyRegistrationOtp(String rawEmail, String otpCode) {
        String email = normalizeEmail(rawEmail);
        otpChallengeService.verifyAndConsume(email, otpCode, OtpPurpose.REGISTER);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.badRequest("Tài khoản không tồn tại."));
        user.setIsVerified(true);
        userRepository.save(user);
        return createAuthenticatedSession(user);
    }

    public IssuedToken verifyPasswordResetOtp(String rawEmail, String otpCode) {
        String email = normalizeEmail(rawEmail);
        otpChallengeService.verifyAndConsume(email, otpCode, OtpPurpose.FORGOT_PASSWORD);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.badRequest("Tài khoản không tồn tại."));
        return authSessionService.createPasswordResetToken(user);
    }

    public AuthenticatedSession login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.unauthorized("Sai email hoặc mật khẩu."));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw BusinessException.unauthorized("Tài khoản chưa được xác thực.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("Sai email hoặc mật khẩu.");
        }
        return createAuthenticatedSession(user);
    }

    public AuthenticatedSession refresh(String rawRefreshToken) {
        AuthSessionService.RefreshedSession refreshed = authSessionService.rotateRefreshToken(rawRefreshToken);
        User user = refreshed.user();
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw BusinessException.unauthorized("Tài khoản không còn hoạt động.");
        }
        String accessToken = jwtUtil.generateAccessToken(user);
        return new AuthenticatedSession(
                user,
                accessToken,
                jwtUtil.getAccessExpirationMs() / 1000,
                refreshed.refreshToken().value(),
                refreshed.refreshToken().maxAgeSeconds()
        );
    }

    public void logout(String rawRefreshToken) {
        authSessionService.revokeRefreshToken(rawRefreshToken);
    }

    @Transactional
    public void resetPassword(String rawResetToken, String newPassword) {
        User user = authSessionService.consumePasswordResetToken(rawResetToken);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        authSessionService.revokeAllForUser(user.getUserId());
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.unauthorized("Người dùng không tồn tại."));
    }

    private AuthenticatedSession createAuthenticatedSession(User user) {
        IssuedToken refreshToken = authSessionService.createRefreshToken(user);
        return new AuthenticatedSession(
                user,
                jwtUtil.generateAccessToken(user),
                jwtUtil.getAccessExpirationMs() / 1000,
                refreshToken.value(),
                refreshToken.maxAgeSeconds()
        );
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
