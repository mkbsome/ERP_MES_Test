"""
Application configuration management
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = "GreenBoard MES API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:solutiontree8789@localhost:5432/erp_mes_db"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Default tenant (for single-tenant demo)
    default_tenant_id: str = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]

    # WebSocket
    ws_heartbeat_interval: int = 30

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    class Config:
        env_file = ".env"
        env_prefix = "MES_"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
