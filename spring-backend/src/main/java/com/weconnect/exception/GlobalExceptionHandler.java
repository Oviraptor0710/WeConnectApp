package com.weconnect.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.LocalDateTime;

// Khai báo đây là "Cái lưới" hứng lỗi của toàn hệ thống
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Hứng các lỗi Nghiệp vụ có HTTP status phù hợp (OTP-014)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .status(ex.getHttpStatus().value())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, ex.getHttpStatus());
    }

    // 2. Hứng lỗi Validate dữ liệu (VD: Frontend gửi lên Email không đúng định dạng)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        // Rút trích câu thông báo lỗi đầu tiên (VD: "Mật khẩu phải dài hơn 6 ký tự")
        String errorMessage = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value()) // Mã 400
                .message(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .findFirst()
                .map(violation -> violation.getMessage())
                .orElse("Tham số không hợp lệ");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableRequest(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingFile(MissingServletRequestPartException ex) {
        return error(HttpStatus.BAD_REQUEST, "Vui lòng chọn file ảnh");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "File không được vượt quá 10MB");
    }

    // 3. Hứng toàn bộ các lỗi Hệ thống nghiêm trọng (Sập Database, Chia cho 0, Lỗi code chìm...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        // In lỗi chi tiết ra màn hình console (chỉ để Dev Backend đọc và fix bug)
        ex.printStackTrace();

        // Gửi về cho Frontend một câu thông báo chung chung, tuyệt đối không lộ code lỗi!
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value()) // Mã 500 (Internal Server Error)
                .message("Hệ thống đang bận hoặc xảy ra sự cố! Vui lòng thử lại sau.")
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message) {
        ErrorResponse error = ErrorResponse.builder()
                .status(status.value())
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(error, status);
    }
}
