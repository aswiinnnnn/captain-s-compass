"""Application configuration via pydantic-settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATA_MODE: str = "mock"  # "mock" or "live"
    SQLALCHEMY_DATABASE_URI: str
    SECRET_KEY: str
    CORS_ORIGINS: str
    BACKEND_DB_POOL_SIZE: int
    BACKEND_DB_MAX_OVERFLOW: int
    TAVILY_API_KEY: str = ""  # https://tavily.com — free tier: 1 000 req/month

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()
