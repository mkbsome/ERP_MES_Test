"""
Generator Config API
Endpoints for managing generator configuration
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from api.schemas.generator import (
    GeneratorConfigResponse,
    GeneratorConfigUpdate,
    OutputFormat,
    ApiResponse
)

router = APIRouter()

# Default configuration
DEFAULT_CONFIG: Dict[str, Any] = {
    "id": "default",
    "tenant_id": "T001",
    "start_date": "2024-07-01",
    "end_date": "2024-12-31",
    "output_format": OutputFormat.JSON,
    "output_directory": "./output",
    "random_seed": 42,
    "batch_size": 1000,
    "parallel_workers": 4,
    "include_scenarios": [],
    "exclude_scenarios": [],
    "database_config": {
        "host": "localhost",
        "port": 5432,
        "database": "erp_mes_simulator",
        "username": "postgres",
        "password": ""
    },
    "api_config": {
        "host": "localhost",
        "port": 8000,
        "enable_websocket": True
    }
}

# In-memory config storage
CONFIGS: Dict[str, Dict[str, Any]] = {
    "default": DEFAULT_CONFIG.copy()
}


@router.get("/config", response_model=ApiResponse)
async def get_config(config_id: str = "default"):
    """Get generator configuration"""
    config = CONFIGS.get(config_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"Config {config_id} not found")
    return ApiResponse(success=True, data=config)


@router.put("/config", response_model=ApiResponse)
async def update_config(
    update: GeneratorConfigUpdate,
    config_id: str = "default"
):
    """Update generator configuration"""
    config = CONFIGS.get(config_id)
    if not config:
        # Create new config based on default
        config = DEFAULT_CONFIG.copy()
        CONFIGS[config_id] = config

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            config[key] = value

    return ApiResponse(success=True, data=config)


@router.post("/config/reset", response_model=ApiResponse)
async def reset_config(config_id: str = "default"):
    """Reset configuration to defaults"""
    CONFIGS[config_id] = DEFAULT_CONFIG.copy()
    return ApiResponse(success=True, data=CONFIGS[config_id])


@router.get("/config/database/test", response_model=ApiResponse)
async def test_database_connection():
    """Test database connection"""
    # Simulated test - in production, would actually test connection
    config = CONFIGS.get("default", {})
    db_config = config.get("database_config", {})

    try:
        # Simulate connection test
        # In production:
        # import psycopg2
        # conn = psycopg2.connect(...)
        # conn.close()

        return ApiResponse(
            success=True,
            data={
                "connected": True,
                "host": db_config.get("host"),
                "port": db_config.get("port"),
                "database": db_config.get("database"),
                "message": "데이터베이스 연결 테스트 성공"
            }
        )
    except Exception as e:
        return ApiResponse(
            success=False,
            data={
                "connected": False,
                "error": str(e),
                "message": "데이터베이스 연결 실패"
            }
        )


@router.get("/config/api/test", response_model=ApiResponse)
async def test_api_connection():
    """Test API server status"""
    config = CONFIGS.get("default", {})
    api_config = config.get("api_config", {})

    return ApiResponse(
        success=True,
        data={
            "status": "running",
            "host": api_config.get("host"),
            "port": api_config.get("port"),
            "websocket_enabled": api_config.get("enable_websocket", True),
            "message": "API 서버 정상 동작 중"
        }
    )


@router.get("/config/output-formats", response_model=ApiResponse)
async def get_output_formats():
    """Get available output formats"""
    formats = [
        {
            "value": OutputFormat.JSON,
            "label": "JSON",
            "description": "JSON 파일로 출력 (개발/테스트용)"
        },
        {
            "value": OutputFormat.CSV,
            "label": "CSV",
            "description": "CSV 파일로 출력 (데이터 분석용)"
        },
        {
            "value": OutputFormat.SQL,
            "label": "SQL",
            "description": "SQL INSERT 문으로 출력"
        },
        {
            "value": OutputFormat.DATABASE,
            "label": "Database",
            "description": "PostgreSQL 데이터베이스에 직접 저장"
        }
    ]
    return ApiResponse(success=True, data=formats)
