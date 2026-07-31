from unittest.mock import patch, MagicMock
import pytest
import urllib.request
import urllib.error

from app.utils.otp import generate_otp, send_otp_email, _is_email, _has_brevo_config
from fastapi import HTTPException


# ── generate_otp ──────────────────────────────────────────────────────────────
def test_generate_otp_default_length():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()


def test_generate_otp_custom_length():
    otp = generate_otp(4)
    assert len(otp) == 4
    assert otp.isdigit()


def test_generate_otp_randomness():
    otps = {generate_otp() for _ in range(100)}
    assert len(otps) > 1


# ── _is_email ─────────────────────────────────────────────────────────────────
def test_is_email_valid():
    assert _is_email("test@example.com") is True
    assert _is_email("user+tag@domain.co.jp") is True


def test_is_email_invalid():
    assert _is_email("not-an-email") is False
    assert _is_email("@missing-user.com") is False
    assert _is_email("missing-domain@") is False
    assert _is_email("+84912345678") is False


# ── _has_brevo_config ────────────────────────────────────────────────────────
def test_has_brevo_config_with_key():
    with patch("app.utils.otp.settings") as mock_settings:
        mock_settings.BREVO_API_KEY = "xkeysib-test"
        assert _has_brevo_config() is True


def test_has_brevo_config_without_key():
    with patch("app.utils.otp.settings") as mock_settings:
        mock_settings.BREVO_API_KEY = None
        assert _has_brevo_config() is False


# ── send_otp_email ────────────────────────────────────────────────────────────
def test_send_otp_email_missing_brevo_config_raises_503():
    with patch("app.utils.otp.settings") as mock_settings:
        mock_settings.BREVO_API_KEY = None
        mock_settings.BREVO_FROM_EMAIL = "otp@example.com"
        mock_settings.OTP_FROM_NAME = "WeConnect"
        with pytest.raises(HTTPException) as exc:
            send_otp_email("test@example.com", "123456", "REGISTER")
        assert exc.value.status_code == 503
        assert "chưa được cấu hình" in exc.value.detail


def test_send_otp_email_non_email_identifier_raises_400():
    with patch("app.utils.otp.settings") as mock_settings:
        mock_settings.BREVO_API_KEY = "xkeysib-test"
        with pytest.raises(HTTPException) as exc:
            send_otp_email("+84912345678", "123456", "REGISTER")
        assert exc.value.status_code == 400
        assert "số điện thoại" in exc.value.detail.lower()


def test_send_otp_email_brevo_success():
    with patch("app.utils.otp.settings") as mock_settings, \
         patch("app.utils.otp.urllib.request.urlopen") as mock_urlopen:
        mock_settings.BREVO_API_KEY = "xkeysib-test"
        mock_settings.BREVO_FROM_EMAIL = "otp@example.com"
        mock_settings.OTP_FROM_NAME = "WeConnect"
        mock_settings.OTP_EXPIRE_MINUTES = 5

        mock_response = MagicMock()
        mock_response.status = 201
        mock_urlopen.return_value.__enter__ = MagicMock(return_value=mock_response)
        mock_urlopen.return_value.__exit__ = MagicMock(return_value=False)

        send_otp_email("test@example.com", "111111", "FORGOT_PASSWORD")

        mock_urlopen.assert_called_once()
        call_args = mock_urlopen.call_args[0]
        assert call_args[0].get_full_url() == "https://api.brevo.com/v3/smtp/email"
        assert call_args[0].headers["api-key"] == "xkeysib-test"
        assert call_args[0].method == "POST"


def test_send_otp_email_brevo_http_error_raises_503():
    with patch("app.utils.otp.settings") as mock_settings, \
         patch("app.utils.otp.urllib.request.urlopen") as mock_urlopen:
        mock_settings.BREVO_API_KEY = "xkeysib-test"
        mock_settings.BREVO_FROM_EMAIL = "otp@example.com"
        mock_settings.OTP_FROM_NAME = "WeConnect"
        mock_settings.OTP_EXPIRE_MINUTES = 5

        mock_error = urllib.error.HTTPError(
            "https://api.brevo.com/v3/smtp/email",
            400,
            "Bad Request",
            {},
            None,
        )
        mock_error.read = MagicMock(return_value=b'{"message":"Invalid email"}')
        mock_urlopen.side_effect = mock_error

        with pytest.raises(HTTPException) as exc:
            send_otp_email("test@example.com", "123456", "REGISTER")
        assert exc.value.status_code == 503
        assert "Không thể gửi" in exc.value.detail


def test_send_otp_email_brevo_network_error_raises_503():
    with patch("app.utils.otp.settings") as mock_settings, \
         patch("app.utils.otp.urllib.request.urlopen") as mock_urlopen:
        mock_settings.BREVO_API_KEY = "xkeysib-test"
        mock_settings.BREVO_FROM_EMAIL = "otp@example.com"
        mock_settings.OTP_FROM_NAME = "WeConnect"
        mock_settings.OTP_EXPIRE_MINUTES = 5

        mock_urlopen.side_effect = Exception("Network error")

        with pytest.raises(HTTPException) as exc:
            send_otp_email("test@example.com", "123456", "REGISTER")
        assert exc.value.status_code == 503
        assert "Không thể gửi" in exc.value.detail
