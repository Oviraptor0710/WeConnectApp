# Trạng thái chuyển toàn bộ Auth sang Spring Boot

Ngày cập nhật: 2026-08-26

## Kết luận

Spring Boot hiện là owner duy nhất của toàn bộ auth vertical slice:

```text
register -> send OTP -> verify OTP -> login
forgot password -> verify OTP -> reset password
refresh session -> me -> logout
```

FastAPI không còn xử lý route `/api/v1/auth/**`. Các module FastAPI và WebSocket chưa migrate vẫn nhận được JWT do Spring phát hành thông qua API Gateway.

## Đã xử lý trong code

- Chuẩn hóa access JWT dùng chung: `sub=user_id`, `type=access`, thuật toán HS256 và cùng `SECRET_KEY`.
- Access token và refresh token được lưu trong HttpOnly cookie; frontend không đọc hoặc lưu JWT trong localStorage.
- Refresh token là opaque token, chỉ lưu SHA-256 hash trong `AUTH_SESSIONS`, được rotate khi refresh và revoke khi logout/reset password.
- Password reset dùng opaque token một lần và có thời hạn riêng.
- Hoàn thiện toàn bộ endpoint auth trên Spring, gồm `/me`, `/refresh`, forgot password và reset password.
- Nginx route toàn bộ `/api/v1/auth/**` sang Spring; với route FastAPI/WebSocket cũ, gateway đổi cookie `accessToken` thành Bearer header.
- Frontend gọi qua gateway, luôn gửi cookie, tự refresh một lần khi gặp 401 và khôi phục user qua `/auth/me` khi reload.
- OTP dùng `SecureRandom`, có cooldown, giới hạn gửi, giới hạn số lần nhập sai, chỉ dùng một lần và vô hiệu hóa mã cũ.
- Challenge OTP bị vô hiệu hóa nếu Brevo gửi mail thất bại.
- Lỗi nghiệp vụ đã có status riêng: 401, 409, 429 và 502.
- CORS chuyển sang biến `CORS_ALLOWED_ORIGINS`, không còn hard-code chỉ cho local.
- Flyway V2 xử lý volume cũ có `OTPS.identifier`, thêm `attempt_count` và tạo `AUTH_SESSIONS`.
- Schema và seed database mới đã thống nhất dùng `OTPS.email`.

## Kiểm tra tự động đã đạt

- Spring: `clean test` thành công, 2/2 test đạt.
- Frontend: `npm run typecheck` thành công.
- Frontend: `npm test` thành công, 5/5 test đạt.
- Frontend: `npm run build:client` thành công.
- `git diff --check` không có lỗi whitespace; chỉ có cảnh báo CRLF/LF của Git trên Windows.

## Việc còn cần xác nhận ở môi trường chạy thật

### 1. Docker daemon trên máy đang không phản hồi

Lệnh kiểm tra Nginx bằng container bị treo, vì vậy chưa có kết quả `nginx -t` và chưa chạy end-to-end qua Docker trong lần rà soát này. Hãy restart Docker Desktop rồi chạy lại stack.

### 2. Migration MySQL chưa được chạy trên volume hiện tại

Không tự động chạy migration trong lúc sửa để tránh thay đổi dữ liệu thật. Trước lần khởi động Spring đầu tiên:

1. Sao lưu database/volume MySQL.
2. Khởi động MySQL và Spring để Flyway chạy V2.
3. Kiểm tra bằng DBeaver:

```sql
SHOW COLUMNS FROM OTPS;
SHOW COLUMNS FROM AUTH_SESSIONS;
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

### 3. Brevo là điều kiện bên ngoài code

- `BREVO_API_KEY` phải còn hiệu lực.
- `BREVO_FROM_EMAIL` phải là sender đã được Brevo xác minh.
- Nếu bật Authorized IPs, outbound IP của máy/server chạy Spring phải được cho phép.
- Không commit API key vào repository.

### 4. Production phải gọi API Gateway

`VITE_API_URL` và `VITE_WS_URL` không được trỏ thẳng vào FastAPI hoặc WebSocket service. Chúng phải trỏ tới public URL của Nginx gateway, hoặc để trống nếu frontend và gateway dùng cùng origin.

Khi frontend và gateway khác origin:

- Đặt `CORS_ALLOWED_ORIGINS` bằng đúng origin của frontend, có thể là danh sách phân cách bằng dấu phẩy.
- Chạy profile `prod` để cookie có `Secure=true` và `SameSite=None`.
- Chỉ đặt `APP_DOMAIN` khi thật sự cần chia sẻ cookie giữa các subdomain; nếu không hãy để trống để dùng host-only cookie.

### 5. Test auth/OTP còn mỏng

Hiện mới có test contract JWT và test khởi động Spring context. Trước khi đưa lên production nên bổ sung integration test cho register/login/refresh/logout, OTP sai/hết hạn/dùng lại, Brevo failure và password reset.

## Checklist smoke test sau khi Docker hoạt động

1. Register một email mới qua frontend.
2. Gửi OTP và xác nhận email đến từ Brevo.
3. Verify OTP; kiểm tra browser có `accessToken` và `refreshToken` dạng HttpOnly.
4. Reload trang; `/api/v1/auth/me` phải khôi phục user.
5. Mở chat hoặc một API FastAPI cũ; request phải thành công mà frontend không cần đọc JWT.
6. Chờ/xóa access cookie rồi gọi API private; frontend phải refresh session đúng một lần.
7. Logout; cả hai cookie bị xóa và refresh token trong DB có `revoked_at`.
8. Chạy forgot password, verify OTP và reset; reset token không được dùng lại.
