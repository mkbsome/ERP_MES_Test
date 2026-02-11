"""
Production-related Pydantic schemas
"""
from datetime import datetime, date
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


# ==================== Production Order ====================

class ProductionOrderBase(BaseModel):
    """Base schema for production order"""
    product_code: str = Field(..., max_length=30)
    product_name: Optional[str] = Field(None, max_length=200)
    line_code: Optional[str] = Field(None, max_length=20)
    target_qty: Decimal = Field(..., gt=0)
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    priority: Optional[int] = Field(default=5, ge=1, le=10)


class ProductionOrderCreate(ProductionOrderBase):
    """Schema for creating production order"""
    erp_work_order_no: Optional[str] = Field(None, max_length=20)
    order_date: Optional[date] = None


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


class ProductionOrderResponse(BaseModel):
    """Response schema for production order"""
    id: UUID
    tenant_id: UUID
    production_order_no: str
    erp_work_order_no: Optional[str] = None
    order_date: date
    product_code: str
    product_name: Optional[str] = None
    line_code: Optional[str] = None
    target_qty: Decimal
    produced_qty: Optional[Decimal] = Decimal(0)
    good_qty: Optional[Decimal] = Decimal(0)
    defect_qty: Optional[Decimal] = Decimal(0)
    scrap_qty: Optional[Decimal] = Decimal(0)
    bom_id: Optional[int] = None
    routing_id: Optional[int] = None
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    completion_rate: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Calculated fields (not from DB)
    calc_completion_rate: Optional[float] = None
    calc_defect_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


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
    production_order_no: Optional[str] = Field(None, max_length=20)
    line_code: Optional[str] = Field(None, max_length=20)
    equipment_code: Optional[str] = Field(None, max_length=30)
    operation_seq: Optional[int] = None
    product_code: str = Field(..., max_length=30)
    lot_no: Optional[str] = Field(None, max_length=50)
    input_qty: Decimal
    output_qty: Decimal
    good_qty: Decimal
    defect_qty: Optional[Decimal] = Decimal(0)
    scrap_qty: Optional[Decimal] = Decimal(0)


class ProductionResultCreate(ProductionResultBase):
    """Schema for creating production result"""
    result_timestamp: Optional[datetime] = None
    cycle_time_sec: Optional[Decimal] = None
    worker_id: Optional[str] = Field(None, max_length=20)
    shift: Optional[str] = Field(None, max_length=10)


class ProductionResultResponse(BaseModel):
    """Response schema for production result"""
    id: UUID
    tenant_id: UUID
    production_order_id: Optional[UUID] = None
    production_order_no: Optional[str] = None
    result_timestamp: datetime
    operation_seq: Optional[int] = None
    line_code: Optional[str] = None
    equipment_code: Optional[str] = None
    product_code: str
    lot_no: Optional[str] = None
    input_qty: Decimal
    output_qty: Decimal
    good_qty: Decimal
    defect_qty: Optional[Decimal] = Decimal(0)
    scrap_qty: Optional[Decimal] = Decimal(0)
    cycle_time_sec: Optional[Decimal] = None
    yield_rate: Optional[Decimal] = None
    defect_rate: Optional[Decimal] = None
    worker_id: Optional[str] = None
    shift: Optional[str] = None
    created_at: Optional[datetime] = None

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
    equipment_status: Optional[str] = None
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
    line_code: Optional[str] = None
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
