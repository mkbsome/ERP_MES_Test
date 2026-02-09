"""
MES Material Management Schemas
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from uuid import UUID


# Enums
class FeederType(str, Enum):
    TAPE_8MM = "tape_8mm"
    TAPE_12MM = "tape_12mm"
    TAPE_16MM = "tape_16mm"
    TAPE_24MM = "tape_24mm"
    TRAY = "tray"
    STICK = "stick"


class FeederStatus(str, Enum):
    ACTIVE = "active"
    EMPTY = "empty"
    ERROR = "error"
    STANDBY = "standby"


class ConsumptionType(str, Enum):
    NORMAL = "normal"
    LOSS = "loss"
    SCRAP = "scrap"
    REWORK = "rework"


class RequestType(str, Enum):
    REPLENISH = "replenish"
    RETURN = "return"
    TRANSFER = "transfer"


class RequestUrgency(str, Enum):
    NORMAL = "normal"
    URGENT = "urgent"
    CRITICAL = "critical"


class RequestStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class LocationType(str, Enum):
    LINE = "line"
    BUFFER = "buffer"
    SUPERMARKET = "supermarket"
    WIP = "wip"


# Feeder Setup Schemas
class FeederSetupBase(BaseModel):
    line_code: str
    feeder_slot: str
    feeder_type: Optional[FeederType] = None
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    reel_id: Optional[str] = None
    lot_no: Optional[str] = None
    initial_qty: int = 0
    remaining_qty: int = 0


class FeederSetupCreate(FeederSetupBase):
    equipment_id: Optional[UUID] = None
    setup_by: Optional[str] = None


class FeederSetupUpdate(BaseModel):
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    reel_id: Optional[str] = None
    lot_no: Optional[str] = None
    remaining_qty: Optional[int] = None
    status: Optional[FeederStatus] = None


class FeederSetupResponse(FeederSetupBase):
    setup_id: UUID
    equipment_id: Optional[UUID] = None
    setup_time: Optional[datetime] = None
    setup_by: Optional[str] = None
    status: FeederStatus = FeederStatus.ACTIVE
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Material Consumption Schemas
class MaterialConsumptionBase(BaseModel):
    line_code: str
    material_code: str
    material_name: Optional[str] = None
    lot_no: Optional[str] = None
    consumption_qty: Decimal
    unit: str = "EA"
    consumption_type: ConsumptionType = ConsumptionType.NORMAL


class MaterialConsumptionCreate(MaterialConsumptionBase):
    order_id: Optional[UUID] = None
    equipment_code: Optional[str] = None
    reel_id: Optional[str] = None
    product_code: Optional[str] = None
    result_lot_no: Optional[str] = None


class MaterialConsumptionResponse(MaterialConsumptionBase):
    consumption_id: UUID
    order_id: Optional[UUID] = None
    equipment_code: Optional[str] = None
    reel_id: Optional[str] = None
    product_code: Optional[str] = None
    result_lot_no: Optional[str] = None
    consumption_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Material Request Schemas
class MaterialRequestBase(BaseModel):
    request_type: RequestType = RequestType.REPLENISH
    line_code: str
    material_code: str
    material_name: Optional[str] = None
    requested_qty: Decimal
    unit: str = "EA"
    urgency: RequestUrgency = RequestUrgency.NORMAL


class MaterialRequestCreate(MaterialRequestBase):
    equipment_code: Optional[str] = None
    feeder_slot: Optional[str] = None
    requested_by: Optional[str] = None
    remarks: Optional[str] = None


class MaterialRequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    approved_by: Optional[str] = None
    delivered_by: Optional[str] = None
    delivered_qty: Optional[Decimal] = None
    remarks: Optional[str] = None


class MaterialRequestResponse(MaterialRequestBase):
    request_id: UUID
    request_no: Optional[str] = None
    equipment_code: Optional[str] = None
    feeder_slot: Optional[str] = None
    status: RequestStatus = RequestStatus.REQUESTED
    requested_by: Optional[str] = None
    requested_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    delivered_by: Optional[str] = None
    delivered_at: Optional[datetime] = None
    delivered_qty: Optional[Decimal] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Material Inventory Schemas
class MaterialInventoryBase(BaseModel):
    location_type: LocationType = LocationType.LINE
    location_code: str
    material_code: str
    material_name: Optional[str] = None
    lot_no: Optional[str] = None
    qty_on_hand: Decimal = Decimal("0")
    qty_allocated: Decimal = Decimal("0")
    unit: str = "EA"


class MaterialInventoryCreate(MaterialInventoryBase):
    min_qty: Decimal = Decimal("0")
    max_qty: Decimal = Decimal("0")


class MaterialInventoryUpdate(BaseModel):
    qty_on_hand: Optional[Decimal] = None
    qty_allocated: Optional[Decimal] = None
    min_qty: Optional[Decimal] = None
    max_qty: Optional[Decimal] = None


class MaterialInventoryResponse(MaterialInventoryBase):
    inventory_id: UUID
    qty_available: Decimal = Decimal("0")
    min_qty: Decimal = Decimal("0")
    max_qty: Decimal = Decimal("0")
    last_count_date: Optional[datetime] = None
    last_count_qty: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Summary Schemas
class LineMaterialSummary(BaseModel):
    line_code: str
    line_name: Optional[str] = None
    total_feeders: int = 0
    active_feeders: int = 0
    empty_feeders: int = 0
    error_feeders: int = 0
    pending_requests: int = 0
    urgent_requests: int = 0


class MaterialShortageAlert(BaseModel):
    line_code: str
    feeder_slot: str
    material_code: str
    material_name: Optional[str] = None
    remaining_qty: int
    estimated_empty_time: Optional[datetime] = None
    urgency: str
