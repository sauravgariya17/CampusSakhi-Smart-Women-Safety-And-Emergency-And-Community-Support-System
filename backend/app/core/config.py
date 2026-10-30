from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusSakhi Safety Platform"
    API_V1_STR: str = "/api"

    # SQLite is convenient for local development. Production should set a managed DB URL.
    DATABASE_URL: str = Field(
        default="sqlite:///./gehu_safety.db",
        description="Database connection URL"
    )

    # JWT Settings
    JWT_SECRET: str = Field(
        min_length=32,
        description="Unique random HMAC SHA256 secret key (at least 32 characters)"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Map bounds for GEHU Clement Town campus service area
    MAP_CENTER_LAT: float = 30.2675
    MAP_CENTER_LNG: float = 77.9959
    MAP_BOUNDS_RADIUS_KM: float = 2.0
    JOURNEY_CHECKIN_GRACE_MINUTES: int = 15

    # SOS Emergency Settings
    SOS_CONFIRMATION_WINDOW_SECONDS: int = 8

    # Email notification settings
    NOTIFICATION_EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Optional one-time administrator bootstrap. Remove these after first startup.
    BOOTSTRAP_ADMIN_NAME: str | None = None
    BOOTSTRAP_ADMIN_EMAIL: str | None = None
    BOOTSTRAP_ADMIN_PASSWORD: str | None = Field(default=None, min_length=12)

    model_config = {
        "env_file": str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
