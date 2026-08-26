package com.weconnect.controller;

import com.weconnect.dto.request.*;
import com.weconnect.dto.response.AuthResponse;
import com.weconnect.dto.response.MessageResponse;
import com.weconnect.dto.response.ResetTokenResponse;
import com.weconnect.entity.OtpPurpose;
import com.weconnect.entity.User;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.AuthCookieService;
import com.weconnect.service.AuthenticatedSession;
import com.weconnect.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    public AuthController(AuthService authService, AuthCookieService cookieService) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    // ==========================================
    // 1. API Đăng ký (Điền Form)
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.processRegister(request);
        return ResponseEntity.ok(new MessageResponse(
                "Thông tin hợp lệ, vui lòng yêu cầu gửi mã OTP để xác thực."
        ));
    }

    // ==========================================
    // 2. API Yêu cầu gửi OTP
    // ==========================================
    @PostMapping({"/send-otp", "/otp/send"})
    public ResponseEntity<MessageResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendOtp(request.getEmail(), request.getPurpose());
        return ResponseEntity.ok(new MessageResponse(
                "Nếu tài khoản hợp lệ, mã OTP đã được gửi đến email của bạn."
        ));
    }

    // ==========================================
    // 3. API Xác thực OTP (Chốt hạ)
    // ==========================================
    @PostMapping({"/verify-otp", "/otp/verify"})
    public ResponseEntity<?> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletResponse response
    ) {
        if (request.getPurpose() == OtpPurpose.FORGOT_PASSWORD) {
            var resetToken = authService.verifyPasswordResetOtp(request.getEmail(), request.getOtpCode());
            return ResponseEntity.ok(new ResetTokenResponse(
                    resetToken.value(), resetToken.maxAgeSeconds()
            ));
        }

        AuthenticatedSession session = authService.verifyRegistrationOtp(
                request.getEmail(), request.getOtpCode());
        cookieService.writeAuthenticatedSession(response, session);
        return ResponseEntity.ok(toAuthResponse(session.user(), "Xác thực và đăng nhập thành công."));
    }

    // ==========================================
    // 4. API Đăng nhập thông thường
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthenticatedSession session = authService.login(request);
        cookieService.writeAuthenticatedSession(response, session);
        return ResponseEntity.ok(toAuthResponse(session.user(), "Đăng nhập thành công."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        AuthenticatedSession session = authService.refresh(refreshToken);
        cookieService.writeAuthenticatedSession(response, session);
        return ResponseEntity.ok(toAuthResponse(session.user(), "Phiên đăng nhập đã được làm mới."));
    }

    // ==========================================
    // 5. API Đăng xuất
    // ==========================================
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @CookieValue(name = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);
        cookieService.clear(response);
        return ResponseEntity.ok(new MessageResponse("Đăng xuất thành công."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        authService.sendOtp(request.getEmail(), OtpPurpose.FORGOT_PASSWORD);
        return ResponseEntity.ok(new MessageResponse(
                "Nếu tài khoản tồn tại, mã xác nhận đã được gửi."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword());
        return ResponseEntity.ok(new MessageResponse("Đặt lại mật khẩu thành công."));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal CustomUserDetails principal) {
        User user = principal.getUser();
        return ResponseEntity.ok(toAuthResponse(user, "Lấy thông tin người dùng thành công."));
    }

    private AuthResponse toAuthResponse(User user, String message) {
        return AuthResponse.builder()
                .message(message)
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
