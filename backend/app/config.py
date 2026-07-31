from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str = "db"
    DB_PORT: int = 3306
    DB_USER: str = "weconnect"
    DB_PASSWORD: str = "weconnect_pass"
    DB_NAME: str = "weconnect"

    SECRET_KEY: str = "change-this-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    RESET_TOKEN_EXPIRE_MINUTES: int = 10

    OTP_EXPIRE_MINUTES: int = 5
    OTP_FROM_NAME: str = "WeConnect"

    # Brevo API config (dùng cho OTP qua email, HTTP/HTTPS port 443)
    BREVO_API_KEY: str | None = None
    BREVO_FROM_EMAIL: str = "otp@example.com"

    GEMINI_API_KEY: str | None = None

    PUSHER_APP_ID: str | None = None
    PUSHER_KEY: str | None = None
    PUSHER_SECRET: str | None = None
    PUSHER_CLUSTER: str | None = None
    PUSHER_SSL: bool = True

    LIVEKIT_URL: str | None = None
    LIVEKIT_API_KEY: str | None = None
    LIVEKIT_API_SECRET: str | None = None

    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = {"env_file": ".env"}


settings = Settings()
