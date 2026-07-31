from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, OTPSendRequest, OTPVerifyRequest,
    ForgotPasswordRequest, ResetPasswordRequest, RefreshRequest,
    TokenResponse, UserBrief,
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_reset_token,
    decode_token,
)
from app.utils.otp import save_otp, verify_otp
from app.config import settings

router = APIRouter()


def _has_email_sender_config() -> bool:
    """True nếu có Brevo API config để gửi email OTP."""
    return bool(settings.BREVO_API_KEY)


def _build_token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.user_id),
        refresh_token=create_refresh_token(user.user_id),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserBrief.model_validate(user),
    )


def _find_user_by_identifier(db: Session, identifier: str) -> User | None:
    """Tìm user theo email hoặc số điện thoại."""
    return (
        db.query(User)
        .filter((User.email == identifier) | (User.phone_number == identifier))
        .first()
    )


# ── POST /register ───────────────────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    SRS ID 3: Đăng ký tài khoản bằng email.
    Sau khi đăng ký, hệ thống gửi OTP — người dùng cần xác thực qua /otp/verify.
    """
    # Từ chối đăng ký bằng số điện thoại (chưa hỗ trợ SMS)
    if body.identifier_type.value == "PHONE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đăng ký bằng số điện thoại chưa được hỗ trợ. Vui lòng sử dụng email.",
        )

    # Kiểm tra dịch vụ email OTP đã được cấu hình trước khi tạo user
    if not _has_email_sender_config():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ gửi email OTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
        )

    identifier = body.identifier.strip().lower()

    existing = _find_user_by_identifier(db, identifier)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email hoặc số điện thoại đã được đăng ký")

    user = User(
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
        email=identifier,
        is_verified=False,
        role="USER",
    )

    if body.date_of_birth:
        from datetime import date
        user.date_of_birth = date.fromisoformat(body.date_of_birth)
    if body.gender:
        user.gender = body.gender

    db.add(user)
    db.commit()
    db.refresh(user)

    save_otp(db, identifier, "REGISTER")

    return {
        "data": {
            "user_id": user.user_id,
            "message": "Đăng ký thành công. Vui lòng kiểm tra OTP và xác thực.",
            "otp_required": True,
        }
    }


# ── POST /otp/send ───────────────────────────────────────────────────────────
@router.post("/otp/send")
def otp_send(body: OTPSendRequest, db: Session = Depends(get_db)):
    """SRS ID 8: Gửi lại OTP qua email."""
    identifier = body.identifier.strip()

    if body.purpose.value == "FORGOT_PASSWORD":
        user = _find_user_by_identifier(db, identifier)
        if not user:
            # Không tiết lộ thông tin tài khoản — trả success giả
            return {"data": {"message": "Nếu tài khoản tồn tại, OTP đã được gửi."}}

    save_otp(db, identifier, body.purpose.value)
    return {"data": {"message": "OTP đã được gửi.", "expires_in": settings.OTP_EXPIRE_MINUTES * 60}}


# ── POST /otp/verify ─────────────────────────────────────────────────────────
@router.post("/otp/verify")
def otp_verify(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    SRS ID 3, 5: Xác thực OTP.
    - REGISTER: kích hoạt tài khoản, trả về access/refresh token.
    - FORGOT_PASSWORD: trả về reset_token ngắn hạn.
    """
    identifier = body.identifier.strip()
    ok = verify_otp(db, identifier, body.code, body.purpose.value)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP không hợp lệ hoặc đã hết hạn")

    if body.purpose.value == "REGISTER":
        user = _find_user_by_identifier(db, identifier)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tài khoản không tồn tại")
        user.is_verified = True
        db.commit()
        db.refresh(user)
        return {"data": _build_token_response(user)}

    # FORGOT_PASSWORD
    user = _find_user_by_identifier(db, identifier)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tài khoản không tồn tại")
    reset_token = create_reset_token(user.user_id)
    return {"data": {"reset_token": reset_token, "expires_in": settings.RESET_TOKEN_EXPIRE_MINUTES * 60}}


# ── POST /login ──────────────────────────────────────────────────────────────
@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """SRS ID 4: Đăng nhập bằng email hoặc SĐT + mật khẩu."""
    identifier = body.identifier.strip()
    user = _find_user_by_identifier(db, identifier)

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thông tin đăng nhập không chính xác")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa xác thực OTP. Vui lòng kiểm tra email/SĐT.",
        )

    return {"data": _build_token_response(user)}


# ── POST /forgot-password ────────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """SRS ID 5: Gửi OTP để đặt lại mật khẩu."""
    identifier = body.identifier.strip()
    user = _find_user_by_identifier(db, identifier)
    if user:
        save_otp(db, identifier, "FORGOT_PASSWORD")
    # Luôn trả về success để tránh user enumeration
    return {"data": {"message": "Nếu tài khoản tồn tại, OTP đã được gửi."}}


# ── POST /reset-password ─────────────────────────────────────────────────────
@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """SRS ID 5: Đặt lại mật khẩu sau khi xác thực OTP."""
    payload = decode_token(body.reset_token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token đặt lại mật khẩu không hợp lệ")

    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tài khoản không tồn tại")

    user.password_hash = hash_password(body.new_password)
    db.commit()


# ── POST /refresh ────────────────────────────────────────────────────────────
@router.post("/refresh")
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """Cấp access_token mới từ refresh_token còn hạn."""
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token không hợp lệ")

    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại")

    return {
        "data": {
            "access_token": create_access_token(user.user_id),
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    }


# ── POST /logout ─────────────────────────────────────────────────────────────
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: User = Depends(get_current_user)):
    """Đăng xuất (stateless JWT — client xoá token ở phía mình)."""
    pass
