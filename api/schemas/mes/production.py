"""
Production-related Pydantic schemas
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductionOrderStatus(str, Enum):
    """Production order status"""
    PLANNED = "planned"
    RELEASED = "released"
    STARTED = "started"
    PAUSED = "paused"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ResultType(str, Enum):
    """Production result type"""
    NORMAL = "normal"
    REWORK = "rework"
    TEST = "test"
    TRIAL = "trial"
    SAMPLE = "sample"


# ==================== Production Order ====================

class ProductionOrderBase(BaseModel):
    """Base schema for production order"""
    product_code: str = Field(..., max_length=30)
    product_name: Optional[str] = Field(None, max_length=200)
    line_code: str = Field(..., max_length=20)
    target_qty: Decimal = Field(..., gt=0)
    unit: str = Field(default="PNL", max_length=10)
    planned_start: datetime
    planned_end: datetime
    priority: int = Field(default=5, ge=1, le=10)
    lot_no: Optional[str] = Field(None, max_length=50)
    customer_code: Optional[str] = Field(None, max_length=20)
    sales_order_no: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    """Schema for creating production order"""
    erp_work_order_no: Optional[str] = Field(None, max_length=20)


class ProductionOrderUpdate(BaseModel):
    """Schema for updating production order"""
    status: Optional[ProductionOrderStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    produced_qty: Optional[Decimal] = None
    good_qty: Optional[Decimal] = None
    defect_qty: Optional[Decimal] = None
    scrap_qty: Optional[Decimal] = None
    current_operation: Optional[int] = None
    notes: Optional[str] = None


class ProductionOrderResponse(ProductionOrderBase):
    """Response schema for production order"""
    id: UUID
    tenant_id: UUID
    production_order_no: str
    erp_work_order_no: Optional[str] = None
    product_rev: Optional[str] = None
    started_qty: Decimal
    produced_qty: Decimal
    good_qty: Decimal
    defect_qty: Decimal
    scrap_qty: Decimal
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: ProductionOrderStatus
    current_operation: Optional[int] = None
    bom_id: Optional[UUID] = None
    routing_id: Optional[UUID] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Calculated fields
    completion_rate: Optional[float] = None
    defect_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

    @property
    def calc_completion_rate(self) -> float:
        if self.target_qty and self.target_qty > 0:
            return float(self.produced_qty / self.target_qty) * 100
        return 0.0

    @property
    def calc_defect_rate(self) -> float:
        if self.produced_qty and self.produced_qty > 0:
            return float(self.defect_qty / self.produced_qty) * 100
        return 0.0


class ProductionOrderListResponse(BaseModel):
    """Response for list of production orders"""
    items: List[ProductionOrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


# ==================== Production Result ====================

class ProductionResultBase(BaseModel):
    """Base schema for production result"""
    production_order_no: str = Field(..., max_length=20)
    shift_code: str = Field(..., max_length=10)
    line_code: str = Field(..., max_length=20)
    equipment_code: Optional[str] = Field(None, max_length=30)
    operation_no: int
    operation_name: Optional[str] = Field(None, max_length=100)
    product_code: str = Field(..., max_length=30)
    lot_no: Optional[str] = Field(None, max_length=50)
    input_qty: Decimal
    output_qty: Decimal
    good_qty: Decimal
    defect_qty: Decimal = Decimal(0)
    rework_qty: Decimal = Decimal(0)
    scrap_qty: Decimal = Decimal(0)
    unit: str = Field(default="PNL", max_length=10)


class ProductionResultCreate(ProductionResultBase):
    """Schema for creating production result"""
    result_timestamp: Optional[datetime] = None  # Defaults to now
    cycle_time_sec: Optional[Decimal] = None
    takt_time_sec: Optional[Decimal] = None
    setup_time_min: Optional[Decimal] = None
    run_time_min: Optional[Decimal] = None
    idle_time_min: Optional[Decimal] = None
    operator_code: Optional[str] = Field(None, max_length=20)
    operator_name: Optional[str] = Field(None, max_length=100)
    result_type: ResultType = ResultType.NORMAL
    notes: Optional[str] = None
    reported_by: Optional[str] = Field(None, max_length=20)


class ProductionResultResponse(ProductionResultBase):
    """Response schema for production result"""
    id: UUID
    tenant_id: UUID
    result_timestamp: datetime
    cycle_time_sec: Optional[Decimal] = None
    takt_time_sec: Optional[Decimal] = None
    setup_time_min: Optional[Decimal] = None
    run_time_min: Optional[Decimal] = None
    idle_time_min: Optional[Decimal] = None
    operator_code: Optional[str] = None
    operator_name: Optional[str] = None
    result_type: ResultType
    notes: Optional[str] = None
    reported_by: Optional[str] = None
    created_at: datetime

    # Calculated fields
    yield_rate: Optional[float] = None
    defect_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Realtime Production ====================

class EquipmentStatusValue(str, Enum):
    """Equipment status values"""
    RUNNING = "running"
    IDLE = "idle"
    SETUP = "setup"
    ALARM = "alarm"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"
    WAITING = "waiting"


class RealtimeProductionResponse(BaseModel):
    """Response schema for realtime production"""
    id: UUID
    tenant_id: UUID
    timestamp: datetime
    line_code: str
    equipment_code: str
    production_order_no: Optional[str] = None
    product_code: Optional[str] = None
    current_operation: Optional[str] = None
    takt_count: int
    good_count: int
    defect_count: int
    cycle_time_ms: Optional[int] = None
    target_cycle_time_ms: Optional[int] = None
    equipment_status: Optional[EquipmentStatusValue] = None
    speed_rpm: Optional[Decimal] = None
    temperature_celsius: Optional[Decimal] = None
    pressure_bar: Optional[Decimal] = None
    operator_code: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== Production Analysis ====================

class DailyProductionSummary(BaseModel):
    """Daily production summary"""
    date: datetime
    line_code: str
    total_input: Decimal
    total_output: Decimal
    total_good: Decimal
    total_defect: Decimal
    yield_rate: float
    defect_rate: float


class LineProductionStatus(BaseModel):
    """Line production status"""
    line_code: str
    line_name: Optional[str] = None
    current_order_no: Optional[str] = None
    product_code: Optional[str] = None
    target_qty: Optional[Decimal] = None
    produced_qty: Optional[Decimal] = None
    completion_rate: float
    status: str
    equipment_count: int
    running_count: int
    down_count: int
