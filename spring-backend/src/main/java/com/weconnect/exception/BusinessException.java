package com.weconnect.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception cơ sở cho tất cả lỗi nghiệp vụ.
 * Mỗi exception nghiệp vụ kế thừa từ đây và mang theo HTTP status phù hợp.
 */
public class BusinessException extends RuntimeException {
    private final HttpStatus httpStatus;

    public BusinessException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    // --- 400 Bad Request: Dữ liệu đầu vào không hợp lệ ---
    public static BusinessException badRequest(String message) {
        return new BusinessException(message, HttpStatus.BAD_REQUEST);
    }

    // --- 401 Unauthorized: Sai thông tin đăng nhập ---
    public static BusinessException unauthorized(String message) {
        return new BusinessException(message, HttpStatus.UNAUTHORIZED);
    }

    // --- 409 Conflict: Email đã tồn tại ---
    public static BusinessException conflict(String message) {
        return new BusinessException(message, HttpStatus.CONFLICT);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(message, HttpStatus.NOT_FOUND);
    }

    public static BusinessException unprocessableEntity(String message) {
        return new BusinessException(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public static BusinessException payloadTooLarge(String message) {
        return new BusinessException(message, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    // --- 429 Too Many Requests: Spam OTP ---
    public static BusinessException tooManyRequests(String message) {
        return new BusinessException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    // --- 502 Bad Gateway: Dịch vụ ngoài (Brevo) lỗi ---
    public static BusinessException badGateway(String message) {
        return new BusinessException(message, HttpStatus.BAD_GATEWAY);
    }
}
