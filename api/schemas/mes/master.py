"""
MES Master Data Schemas (기준정보관리)
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ==================== Enums ====================

class LineType(str, Enum):
    SMT = "SMT"
    THT = "THT"
    ASSEMBLY = "assembly"
    TEST = "test"


class LineStatus(str, Enum):
    RUNNING = "running"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    STOPPED = "stopped"


class ProcessType(str, Enum):
    SMT_PRINT = "smt_print"
    SMT_SPI = "smt_spi"
    SMT_MOUNT = "smt_mount"
    SMT_REFLOW = "smt_reflow"
    SMT_AOI = "smt_aoi"
    THT_INSERT = "tht_insert"
    THT_WAVE = "tht_wave"
    ASSEMBLY = "assembly"
    TEST = "test"
    PACKING = "packing"


class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class DefectCategory(str, Enum):
    SOLDER = "solder"
    COMPONENT = "component"
    PCB = "pcb"
    PROCESS = "process"
    OTHER = "other"


# ==================== Code Group Schemas ====================

class CodeGroupBase(BaseModel):
    group_code: str = Field(..., max_length=50)
    group_name: str = Field(..., max_length=200)
    description: Optional[str] = None
    is_system: bool = False
    is_active: bool = True


class CodeGroupCreate(CodeGroupBase):
    pass


class CodeGroupResponse(CodeGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Common Code Schemas ====================

class CommonCodeBase(BaseModel):
    code: str = Field(..., max_length=50)
    code_name: str = Field(..., max_length=200)
    code_name_en: Optional[str] = None
    sort_order: int = 0
    extra_value1: Optional[str] = None
    extra_value2: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class CommonCodeCreate(CommonCodeBase):
    group_id: int


class CommonCodeResponse(CommonCodeBase):
    id: int
    group_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CodeGroupWithCodes(CodeGroupResponse):
    codes: List[CommonCodeResponse] = []


# ==================== Factory Schemas ====================

class FactoryBase(BaseModel):
    factory_code: str = Field(..., max_length=50)
    factory_name: str = Field(..., max_length=200)
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool = True


class FactoryCreate(FactoryBase):
    pass


class FactoryResponse(FactoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Production Line Schemas ====================

class ProductionLineBase(BaseModel):
    line_code: str = Field(..., max_length=50)
    line_name: str = Field(..., max_length=200)
    factory_id: Optional[int] = None
    line_type: LineType = LineType.SMT
    status: LineStatus = LineStatus.IDLE
    capacity_per_hour: Optional[int] = None
    tact_time: Optional[float] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None


class ProductionLineCreate(ProductionLineBase):
    pass


class ProductionLineResponse(ProductionLineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Process Schemas ====================

class ProcessBase(BaseModel):
    process_code: str = Field(..., max_length=50)
    process_name: str = Field(..., max_length=200)
    process_type: Optional[ProcessType] = None
    standard_time: Optional[float] = None
    setup_time: Optional[float] = None
    inspection_required: bool = False
    inspection_type: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None


class ProcessCreate(ProcessBase):
    pass


class ProcessResponse(ProcessBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Line Process Schemas ====================

class LineProcessBase(BaseModel):
    line_id: int
    process_code: str = Field(..., max_length=50)
    process_name: Optional[str] = None
    sequence: int
    equipment_code: Optional[str] = None
    equipment_name: Optional[str] = None
    is_active: bool = True


class LineProcessCreate(LineProcessBase):
    pass


class LineProcessResponse(LineProcessBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Product Routing Schemas ====================

class ProductRoutingBase(BaseModel):
    product_code: str = Field(..., max_length=50)
    product_name: Optional[str] = None
    process_code: str = Field(..., max_length=50)
    process_name: Optional[str] = None
    sequence: int
    standard_time: Optional[float] = None
    setup_time: Optional[float] = None
    inspection_required: bool = False
    is_active: bool = True


class ProductRoutingCreate(ProductRoutingBase):
    pass


class ProductRoutingResponse(ProductRoutingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Worker Schemas ====================

class WorkerBase(BaseModel):
    worker_code: str = Field(..., max_length=50)
    worker_name: str = Field(..., max_length=100)
    department: Optional[str] = None
    position: Optional[str] = None
    factory_code: Optional[str] = None
    line_code: Optional[str] = None
    skill_level: SkillLevel = SkillLevel.BEGINNER
    certified_processes: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    hire_date: Optional[datetime] = None


class WorkerCreate(WorkerBase):
    pass


class WorkerResponse(WorkerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Inspection Item Schemas ====================

class InspectionItemBase(BaseModel):
    item_code: str = Field(..., max_length=50)
    item_name: str = Field(..., max_length=200)
    inspection_type: Optional[str] = None
    process_code: Optional[str] = None
    target_value: Optional[float] = None
    upper_limit: Optional[float] = None
    lower_limit: Optional[float] = None
    unit: Optional[str] = None
    measurement_method: Optional[str] = None
    equipment_required: Optional[str] = None
    is_mandatory: bool = True
    is_active: bool = True
    description: Optional[str] = None


class InspectionItemCreate(InspectionItemBase):
    pass


class InspectionItemResponse(InspectionItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Defect Type Schemas ====================

class DefectTypeBase(BaseModel):
    defect_code: str = Field(..., max_length=50)
    defect_name: str = Field(..., max_length=200)
    defect_name_en: Optional[str] = None
    category: DefectCategory = DefectCategory.OTHER
    cause_equipment: Optional[str] = None
    cause_process: Optional[str] = None
    typical_cause: Optional[str] = None
    severity: int = 1
    is_active: bool = True
    description: Optional[str] = None


class DefectTypeCreate(DefectTypeBase):
    pass


class DefectTypeResponse(DefectTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Product Defect Mapping Schemas ====================

class ProductDefectMappingBase(BaseModel):
    product_code: str = Field(..., max_length=50)
    defect_code: str = Field(..., max_length=50)
    defect_name: Optional[str] = None
    target_rate: Optional[float] = None
    alert_rate: Optional[float] = None
    is_active: bool = True


class ProductDefectMappingCreate(ProductDefectMappingBase):
    pass


class ProductDefectMappingResponse(ProductDefectMappingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== List Response Schemas ====================

class CodeGroupListResponse(BaseModel):
    items: List[CodeGroupWithCodes]
    total: int


class FactoryListResponse(BaseModel):
    items: List[FactoryResponse]
    total: int


class ProductionLineListResponse(BaseModel):
    items: List[ProductionLineResponse]
    total: int


class ProcessListResponse(BaseModel):
    items: List[ProcessResponse]
    total: int


class WorkerListResponse(BaseModel):
    items: List[WorkerResponse]
    total: int


class InspectionItemListResponse(BaseModel):
    items: List[InspectionItemResponse]
    total: int


class DefectTypeListResponse(BaseModel):
    items: List[DefectTypeResponse]
    total: int
