"""
Equipment-related Pydantic schemas
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EquipmentType(str, Enum):
    """Equipment types"""
    LOADER = "loader"
    UNLOADER = "unloader"
    PRINTER = "printer"
    SPI = "spi"
    MOUNTER = "mounter"
    REFLOW = "reflow"
    AOI = "aoi"
    XRAY = "xray"
    WAVE = "wave"
    SELECTIVE = "selective"
    DISPENSER = "dispenser"
    INSERTION = "insertion"
    INSPECTION = "inspection"
    TEST = "test"
    CONVEYOR = "conveyor"
    ROBOT = "robot"
    LASER = "laser"
    COATING = "coating"
    OTHER = "other"


class EquipmentStatusValue(str, Enum):
    """Equipment status values"""
    RUNNING = "running"
    IDLE = "idle"
    SETUP = "setup"
    ALARM = "alarm"
    BREAKDOWN = "breakdown"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"
    WAITING = "waiting"


class AlarmSeverity(str, Enum):
    """Alarm severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    FATAL = "fatal"


class DowntimeCategory(str, Enum):
    """Downtime categories"""
    BREAKDOWN = "breakdown"
    PLANNED_MAINTENANCE = "planned_maintenance"
    UNPLANNED_MAINTENANCE = "unplanned_maintenance"
    SETUP = "setup"
    CHANGEOVER = "changeover"
    MATERIAL_SHORTAGE = "material_shortage"
    QUALITY_ISSUE = "quality_issue"
    OPERATOR_ABSENCE = "operator_absence"
    WAITING = "waiting"
    OTHER = "other"


# ==================== Production Line ====================

class ProductionLineResponse(BaseModel):
    """Response schema for production line"""
    id: UUID
    tenant_id: UUID
    line_code: str
    line_name: str
    line_type: str
    factory_code: str
    department_code: Optional[str] = None
    capacity_per_shift: Optional[int] = None
    operators_required: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LineStatusResponse(BaseModel):
    """Line status with equipment summary"""
    line_code: str
    line_name: str
    line_type: str
    status: str
    equipment_count: int
    running_count: int
    idle_count: int
    down_count: int
    current_oee: Optional[float] = None
    today_production: Optional[int] = None
    today_defects: Optional[int] = None


# ==================== Equipment Master ====================

class EquipmentMasterResponse(BaseModel):
    """Response schema for equipment master"""
    id: UUID
    tenant_id: UUID
    equipment_code: str
    equipment_name: str
    equipment_type: EquipmentType
    equipment_category: Optional[str] = None
    line_code: str
    position_in_line: Optional[int] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_no: Optional[str] = None
    firmware_version: Optional[str] = None
    install_date: Optional[date] = None
    warranty_end_date: Optional[date] = None
    standard_cycle_time_sec: Optional[Decimal] = None
    max_capacity_per_hour: Optional[int] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    communication_protocol: Optional[str] = None
    last_pm_date: Optional[date] = None
    next_pm_date: Optional[date] = None
    pm_interval_days: int
    status: str
    attributes: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Equipment Status ====================

class EquipmentStatusCreate(BaseModel):
    """Schema for creating equipment status"""
    equipment_code: str = Field(..., max_length=30)
    status: EquipmentStatusValue
    status_reason: Optional[str] = Field(None, max_length=100)
    alarm_code: Optional[str] = Field(None, max_length=30)
    alarm_message: Optional[str] = None
    alarm_severity: Optional[AlarmSeverity] = None
    production_order_no: Optional[str] = Field(None, max_length=20)
    product_code: Optional[str] = Field(None, max_length=30)
    operator_code: Optional[str] = Field(None, max_length=20)


class EquipmentStatusResponse(BaseModel):
    """Response schema for equipment status"""
    id: UUID
    tenant_id: UUID
    equipment_code: str
    status_timestamp: datetime
    status: EquipmentStatusValue
    previous_status: Optional[str] = None
    status_reason: Optional[str] = None
    alarm_code: Optional[str] = None
    alarm_message: Optional[str] = None
    alarm_severity: Optional[AlarmSeverity] = None
    production_order_no: Optional[str] = None
    product_code: Optional[str] = None
    operator_code: Optional[str] = None
    speed_actual: Optional[Decimal] = None
    speed_target: Optional[Decimal] = None
    temperature_actual: Optional[Decimal] = None
    temperature_target: Optional[Decimal] = None
    counters: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EquipmentCurrentStatus(BaseModel):
    """Current status of equipment with master info"""
    equipment_code: str
    equipment_name: str
    equipment_type: EquipmentType
    line_code: str
    position_in_line: Optional[int] = None
    status: EquipmentStatusValue
    status_since: Optional[datetime] = None
    current_order_no: Optional[str] = None
    product_code: Optional[str] = None
    alarm_code: Optional[str] = None
    alarm_message: Optional[str] = None


# ==================== Equipment OEE ====================

class EquipmentOEEResponse(BaseModel):
    """Response schema for equipment OEE"""
    id: UUID
    tenant_id: UUID
    calculation_date: date
    shift_code: Optional[str] = None
    equipment_code: str
    line_code: str
    planned_time_min: Decimal
    actual_run_time_min: Decimal
    downtime_min: Decimal
    setup_time_min: Decimal
    idle_time_min: Decimal
    ideal_cycle_time_sec: Optional[Decimal] = None
    actual_cycle_time_sec: Optional[Decimal] = None
    total_count: int
    good_count: int
    defect_count: int
    oee: Optional[Decimal] = None
    availability: Optional[float] = None
    performance: Optional[float] = None
    quality: Optional[float] = None
    downtime_breakdown: Optional[Dict[str, Any]] = None
    defect_breakdown: Optional[Dict[str, Any]] = None
    calculated_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OEESummary(BaseModel):
    """OEE summary for dashboard"""
    line_code: str
    date: date
    avg_oee: float
    avg_availability: float
    avg_performance: float
    avg_quality: float
    total_downtime_min: float
    equipment_count: int


class OEETrend(BaseModel):
    """OEE trend data point"""
    date: date
    oee: float
    availability: float
    performance: float
    quality: float


# ==================== Downtime Event ====================

class DowntimeEventCreate(BaseModel):
    """Schema for creating downtime event"""
    equipment_code: str = Field(..., max_length=30)
    line_code: str = Field(..., max_length=20)
    start_time: datetime
    downtime_category: DowntimeCategory
    downtime_code: str = Field(..., max_length=20)
    downtime_reason: Optional[str] = None
    alarm_code: Optional[str] = Field(None, max_length=30)
    alarm_message: Optional[str] = None
    production_order_no: Optional[str] = Field(None, max_length=20)
    product_code: Optional[str] = Field(None, max_length=30)
    operator_code: Optional[str] = Field(None, max_length=20)
    reported_by: Optional[str] = Field(None, max_length=20)


class DowntimeEventUpdate(BaseModel):
    """Schema for updating downtime event"""
    end_time: Optional[datetime] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    maintenance_ticket_no: Optional[str] = Field(None, max_length=20)
    impact_qty: Optional[Decimal] = None
    impact_cost: Optional[Decimal] = None
    status: Optional[str] = None
    resolved_by: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class DowntimeEventResponse(BaseModel):
    """Response schema for downtime event"""
    id: UUID
    tenant_id: UUID
    event_no: str
    equipment_code: str
    line_code: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_min: Optional[float] = None
    downtime_category: DowntimeCategory
    downtime_code: str
    downtime_reason: Optional[str] = None
    alarm_code: Optional[str] = None
    alarm_message: Optional[str] = None
    production_order_no: Optional[str] = None
    product_code: Optional[str] = None
    operator_code: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    maintenance_ticket_no: Optional[str] = None
    impact_qty: Optional[Decimal] = None
    impact_cost: Optional[Decimal] = None
    status: str
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None
    reported_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DowntimeAnalysis(BaseModel):
    """Downtime analysis summary"""
    line_code: str
    equipment_code: Optional[str] = None
    category: DowntimeCategory
    downtime_code: str
    occurrence_count: int
    total_duration_min: float
    avg_duration_min: float
    percentage: float
