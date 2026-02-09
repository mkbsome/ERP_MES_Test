"""
Generator API Schemas
Pydantic models for data generator endpoints
"""
from datetime import date, datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class ScenarioCategory(str, Enum):
    MES_PRODUCTION = "mes_production"
    MES_EQUIPMENT = "mes_equipment"
    MES_QUALITY = "mes_quality"
    MES_MATERIAL = "mes_material"
    MES_SYSTEM = "mes_system"
    ERP_SALES = "erp_sales"
    ERP_PURCHASE = "erp_purchase"
    ERP_INVENTORY = "erp_inventory"
    ERP_ACCOUNTING = "erp_accounting"
    ERP_HR = "erp_hr"
    ERP_MASTER = "erp_master"


class TriggerType(str, Enum):
    SCHEDULED = "scheduled"
    CONDITION = "condition"
    RANDOM = "random"
    ALWAYS = "always"


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OutputFormat(str, Enum):
    JSON = "json"
    DATABASE = "database"


# Scenario schemas
class ScenarioBase(BaseModel):
    id: str
    name: str
    description: str
    category: ScenarioCategory
    enabled: bool = True
    ai_use_cases: List[str] = []
    trigger_type: TriggerType
    start_date: Optional[str] = None
    duration_days: Optional[int] = None


class ScenarioResponse(ScenarioBase):
    pass


class ScenarioUpdate(BaseModel):
    enabled: bool


# Generator config schemas
class GeneratorConfigBase(BaseModel):
    start_date: str = Field(default="2024-07-01", description="시뮬레이션 시작일")
    end_date: str = Field(default="2024-12-31", description="시뮬레이션 종료일")
    tenant_id: str = Field(default="T001", description="테넌트 ID")
    random_seed: int = Field(default=42, description="Random seed")
    enabled_scenarios: List[str] = Field(default_factory=list, description="활성화된 시나리오 ID 목록")
    output_format: OutputFormat = Field(default=OutputFormat.JSON, description="출력 형식")


class GeneratorConfigResponse(GeneratorConfigBase):
    pass


class GeneratorConfigUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tenant_id: Optional[str] = None
    random_seed: Optional[int] = None
    enabled_scenarios: Optional[List[str]] = None
    output_format: Optional[OutputFormat] = None


# Record counts
class MESRecordCounts(BaseModel):
    production_orders: int = 0
    production_results: int = 0
    equipment_status: int = 0
    quality_inspections: int = 0
    defect_records: int = 0
    material_consumption: int = 0


class ERPRecordCounts(BaseModel):
    sales_orders: int = 0
    purchase_orders: int = 0
    inventory_transactions: int = 0
    journal_entries: int = 0
    attendance_records: int = 0


class RecordCounts(BaseModel):
    mes: MESRecordCounts = Field(default_factory=MESRecordCounts)
    erp: ERPRecordCounts = Field(default_factory=ERPRecordCounts)


# Progress schemas
class GeneratorProgress(BaseModel):
    current_day: int = 0
    total_days: int = 0
    current_date: str = ""
    percentage: float = 0.0
    current_module: Optional[str] = None
    records_generated: RecordCounts = Field(default_factory=RecordCounts)


# Job schemas
class GeneratorJobCreate(GeneratorConfigBase):
    pass


class GeneratorJobResponse(BaseModel):
    id: str
    status: JobStatus
    config: GeneratorConfigBase
    progress: GeneratorProgress
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# Summary schemas
class ModuleSummary(BaseModel):
    total_records: int = 0
    tables: Dict[str, int] = Field(default_factory=dict)


class GeneratorSummary(BaseModel):
    mes: Dict[str, ModuleSummary] = Field(default_factory=dict)
    erp: Dict[str, ModuleSummary] = Field(default_factory=dict)
    total_records: int = 0
    duration_seconds: float = 0.0


# WebSocket message
class WSMessageType(str, Enum):
    PROGRESS = "progress"
    COMPLETED = "completed"
    ERROR = "error"
    LOG = "log"


class WSMessage(BaseModel):
    type: WSMessageType
    job_id: str
    data: Any
    timestamp: datetime = Field(default_factory=datetime.now)


# API Response wrapper
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[str] = None
