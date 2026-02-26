"""
Application configuration management

AWS 배포를 위한 환경변수 기반 설정
모든 설정은 MES_ 접두사 환경변수로 오버라이드 가능
"""
import os
from functools import lru_cache
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = "GreenBoard MES API"
    app_version: str = "1.0.0"
    debug: bool = False  # 프로덕션 기본값: False

    # Database - 환경변수 필수
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/erp_mes_db"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Default tenant (for single-tenant demo)
    default_tenant_id: str = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

    # CORS - 쉼표 구분 문자열 또는 리스트 지원
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # WebSocket
    ws_heartbeat_interval: int = 30

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # AWS 관련 (옵션)
    aws_region: str = "ap-northeast-2"

    @property
    def cors_origins_list(self) -> List[str]:
        """CORS origins를 리스트로 반환"""
        if isinstance(self.cors_origins, str):
            # 쉼표로 구분된 문자열 처리
            origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
            return origins
        return self.cors_origins

    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부"""
        return not self.debug

    class Config:
        env_file = ".env"
        env_prefix = "MES_"
        # 환경변수 우선 적용
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


def clear_settings_cache():
    """설정 캐시 클리어 (테스트용)"""
    get_settings.cache_clear()


settings = get_settings()
