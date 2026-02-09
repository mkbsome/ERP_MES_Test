"""
Quality-related Pydantic schemas
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DetectionPoint(str, Enum):
    """Defect detection points"""
    SPI = "spi"
    AOI = "aoi"
    XRAY = "xray"
    ICT = "ict"
    FCT = "fct"
    VISUAL = "visual"
    CUSTOMER = "customer"


class DefectCategory(str, Enum):
    """Defect categories"""
    SOLDER = "solder"
    COMPONENT = "component"
    PLACEMENT = "placement"
    SHORT = "short"
    OPEN = "open"
    BRIDGE = "bridge"
    INSUFFICIENT = "insufficient"
    VOID = "void"
    CRACK = "crack"
    CONTAMINATION = "contamination"
    MECHANICAL = "mechanical"
    OTHER = "other"


class DefectSeverity(str, Enum):
    """Defect severity levels"""
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


class RepairResult(str, Enum):
    """Repair result values"""
    REPAIRED = "repaired"
    SCRAPPED = "scrapped"
    PENDING = "pending"
    NO_ACTION = "no_action"


class InspectionType(str, Enum):
    """Inspection types"""
    SPI = "SPI"
    AOI = "AOI"
    AXI = "AXI"
    MANUAL = "MANUAL"
    ICT = "ICT"
    FCT = "FCT"


class InspectionResult(str, Enum):
    """Inspection results"""
    PASS = "PASS"
    FAIL = "FAIL"
    REWORK = "REWORK"


# ==================== Defect Type ====================

class DefectTypeResponse(BaseModel):
    """Response schema for defect type"""
    id: UUID
    tenant_id: UUID
    defect_code: str
    defect_name: str
    defect_name_en: Optional[str] = None
    defect_category: str
    severity: DefectSeverity
    detection_methods: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== Defect Detail ====================

class DefectDetailCreate(BaseModel):
    """Schema for creating defect detail"""
    detection_point: DetectionPoint
    equipment_code: str = Field(..., max_length=30)
    line_code: str = Field(..., max_length=20)
    production_order_no: Optional[str] = Field(None, max_length=20)
    product_code: str = Field(..., max_length=30)
    lot_no: Optional[str] = Field(None, max_length=50)
    panel_id: Optional[str] = Field(None, max_length=50)
    pcb_serial: Optional[str] = Field(None, max_length=50)
    defect_category: DefectCategory
    defect_code: str = Field(..., max_length=20)
    defect_description: Optional[str] = None
    defect_location: Optional[str] = Field(None, max_length=100)
    component_ref: Optional[str] = Field(None, max_length=50)
    component_code: Optional[str] = Field(None, max_length=30)
    x_position: Optional[Decimal] = None
    y_position: Optional[Decimal] = None
    defect_qty: int = Field(default=1, ge=1)
    severity: Optional[DefectSeverity] = None
    image_url: Optional[str] = None
    detected_by: Optional[str] = Field(None, max_length=20)
    detection_method: Optional[str] = Field(None, max_length=30)


class DefectDetailUpdate(BaseModel):
    """Schema for updating defect detail"""
    repair_action: Optional[str] = Field(None, max_length=100)
    repair_result: Optional[RepairResult] = None
    repaired_by: Optional[str] = Field(None, max_length=20)
    root_cause_category: Optional[str] = Field(None, max_length=30)
    root_cause_detail: Optional[str] = None


class DefectDetailResponse(BaseModel):
    """Response schema for defect detail"""
    id: UUID
    tenant_id: UUID
    defect_timestamp: datetime
    detection_point: DetectionPoint
    equipment_code: str
    line_code: str
    production_order_no: Optional[str] = None
    product_code: str
    lot_no: Optional[str] = None
    panel_id: Optional[str] = None
    pcb_serial: Optional[str] = None
    defect_category: DefectCategory
    defect_code: str
    defect_description: Optional[str] = None
    defect_location: Optional[str] = None
    component_ref: Optional[str] = None
    component_code: Optional[str] = None
    x_position: Optional[Decimal] = None
    y_position: Optional[Decimal] = None
    defect_qty: int
    severity: Optional[DefectSeverity] = None
    image_url: Optional[str] = None
    detected_by: Optional[str] = None
    detection_method: Optional[str] = None
    repair_action: Optional[str] = None
    repair_result: Optional[RepairResult] = None
    repaired_by: Optional[str] = None
    repaired_at: Optional[datetime] = None
    root_cause_category: Optional[str] = None
    root_cause_detail: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DefectAnalysisResponse(BaseModel):
    """Defect analysis/pareto response"""
    defect_code: str
    defect_name: Optional[str] = None
    defect_category: DefectCategory
    count: int
    percentage: float
    cumulative_percentage: float


class DefectTrend(BaseModel):
    """Defect trend data point"""
    date: date
    line_code: str
    defect_count: int
    defect_rate: float


# ==================== Inspection Result ====================

class InspectionResultCreate(BaseModel):
    """Schema for creating inspection result"""
    inspection_type: InspectionType
    lot_no: str = Field(..., max_length=30)
    board_id: Optional[str] = Field(None, max_length=50)
    product_code: str = Field(..., max_length=30)
    line_code: Optional[str] = Field(None, max_length=20)
    operation_no: Optional[int] = None
    shift: Optional[str] = Field(None, max_length=5)
    inspector_code: Optional[str] = Field(None, max_length=20)
    result: InspectionResult
    total_inspected: int = Field(default=1, ge=1)
    pass_qty: int = Field(default=0, ge=0)
    fail_qty: int = Field(default=0, ge=0)
    defect_points: Optional[List[Dict[str, Any]]] = None
    inspection_time_sec: Optional[Decimal] = None


class InspectionResultResponse(BaseModel):
    """Response schema for inspection result"""
    id: UUID
    tenant_id: UUID
    inspection_no: str
    inspection_type: InspectionType
    production_order_id: Optional[UUID] = None
    lot_no: str
    board_id: Optional[str] = None
    product_code: str
    line_code: Optional[str] = None
    equipment_id: Optional[UUID] = None
    operation_no: Optional[int] = None
    inspection_datetime: datetime
    shift: Optional[str] = None
    inspector_code: Optional[str] = None
    result: InspectionResult
    total_inspected: int
    pass_qty: int
    fail_qty: int
    defect_points: Optional[List[Dict[str, Any]]] = None
    inspection_time_sec: Optional[Decimal] = None
    rework_flag: bool
    created_at: datetime

    # Calculated
    pass_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ==================== SPC Data ====================

class SPCDataCreate(BaseModel):
    """Schema for creating SPC data"""
    line_code: str = Field(..., max_length=20)
    product_code: str = Field(..., max_length=30)
    lot_no: Optional[str] = Field(None, max_length=30)
    measurement_type: str = Field(..., max_length=30)
    sample_size: int = Field(default=1, ge=1)
    measured_value: Decimal
    unit: Optional[str] = Field(None, max_length=10)
    spec_lower: Optional[Decimal] = None
    spec_upper: Optional[Decimal] = None
    target_value: Optional[Decimal] = None
    control_lower: Optional[Decimal] = None
    control_upper: Optional[Decimal] = None
    shift: Optional[str] = Field(None, max_length=5)


class SPCDataResponse(BaseModel):
    """Response schema for SPC data"""
    id: UUID
    tenant_id: UUID
    spc_no: str
    line_code: str
    equipment_id: Optional[UUID] = None
    product_code: str
    lot_no: Optional[str] = None
    measurement_type: str
    measurement_datetime: datetime
    sample_size: int
    measured_value: Decimal
    unit: Optional[str] = None
    spec_lower: Optional[Decimal] = None
    spec_upper: Optional[Decimal] = None
    target_value: Optional[Decimal] = None
    control_lower: Optional[Decimal] = None
    control_upper: Optional[Decimal] = None
    cpk_value: Optional[Decimal] = None
    out_of_spec: bool
    out_of_control: bool
    shift: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SPCChartData(BaseModel):
    """SPC chart data"""
    measurement_type: str
    measurements: List[SPCDataResponse]
    mean: float
    std_dev: float
    ucl: float
    lcl: float
    usl: Optional[float] = None
    lsl: Optional[float] = None
    cpk: Optional[float] = None


# ==================== Quality Summary ====================

class QualitySummary(BaseModel):
    """Daily quality summary"""
    date: date
    line_code: str
    total_inspected: int
    total_pass: int
    total_fail: int
    pass_rate: float
    defect_rate: float
    top_defects: List[DefectAnalysisResponse]
