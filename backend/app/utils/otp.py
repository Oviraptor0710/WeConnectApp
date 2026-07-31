import random
import string
import re
import urllib.request
import urllib.error
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.config import settings
from fastapi import HTTPException, status

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _is_email(identifier: str) -> bool:
    return bool(_EMAIL_RE.match(identifier))


def _has_brevo_config() -> bool:
    return bool(settings.BREVO_API_KEY)


def send_otp_email(identifier: str, code: str, purpose: str) -> None:
    """Gửi OTP qua email bằng Brevo API (HTTP/HTTPS, port 443)."""
    if not _is_email(identifier):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP qua số điện thoại chưa được hỗ trợ. Vui lòng sử dụng email.",
        )

    if not _has_brevo_config():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ gửi email OTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
        )

    label = "Đăng ký" if purpose == "REGISTER" else "Quên mật khẩu"
    subject = f"{settings.OTP_FROM_NAME} - Mã OTP {label}"
    html_body = (
        f"<p>Mã OTP của bạn là: <strong>{code}</strong></p>"
        f"<p>Mã này sẽ hết hạn sau {settings.OTP_EXPIRE_MINUTES} phút.</p>"
    )

    payload = {
        "sender": {"email": settings.BREVO_FROM_EMAIL, "name": settings.OTP_FROM_NAME},
        "to": [{"email": identifier}],
        "subject": subject,
        "htmlContent": html_body,
    }

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "api-key": settings.BREVO_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print(f"[Brevo] Gửi email OTP thành công: {response.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"[Brevo] HTTP {e.code} - {body}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Không thể gửi email OTP. Vui lòng thử lại sau.",
        )
    except Exception as e:
        print(f"[Brevo] Lỗi khi gửi email OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể gửi email OTP. Vui lòng thử lại sau.",
        )


def save_otp(db: Session, identifier: str, purpose: str) -> str:
    from app.models.user import OTP

    last_otp = (
        db.query(OTP)
        .filter(OTP.identifier == identifier, OTP.purpose == purpose)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if last_otp:
        now = datetime.now(timezone.utc)
        elapsed = now - last_otp.created_at.replace(tzinfo=timezone.utc)
        if elapsed < timedelta(minutes=4):
            remaining = 240 - int(elapsed.total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Vui lòng đợi {remaining} giây nữa trước khi yêu cầu mã mới.",
            )

    db.query(OTP).filter(
        OTP.identifier == identifier,
        OTP.purpose == purpose,
        OTP.used == False,
    ).update({"used": True})

    code = generate_otp()
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTP(identifier=identifier, code=code, purpose=purpose, expire_at=expire_at)
    db.add(otp)
    db.commit()

    send_otp_email(identifier, code, purpose)
    return code


def verify_otp(db: Session, identifier: str, code: str, purpose: str) -> bool:
    from app.models.user import OTP

    now = datetime.now(timezone.utc)
    otp = (
        db.query(OTP)
        .filter(
            OTP.identifier == identifier,
            OTP.code == code,
            OTP.purpose == purpose,
            OTP.used == False,
            OTP.expire_at > now,
        )
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp:
        return False

    otp.used = True
    db.commit()
    return True
