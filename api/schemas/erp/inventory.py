"""
ERP Inventory Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ==================== Enums ====================

class WarehouseType(str, Enum):
    RAW_MATERIAL = "raw_material"
    WIP = "wip"
    FINISHED_GOODS = "finished_goods"
    DEFECTIVE = "defective"
    QUARANTINE = "quarantine"


class StockStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    BLOCKED = "blocked"
    QUALITY_HOLD = "quality_hold"
    IN_TRANSIT = "in_transit"


class TransactionType(str, Enum):
    RECEIPT = "receipt"
    ISSUE = "issue"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    PRODUCTION_IN = "production_in"
    PRODUCTION_OUT = "production_out"
    RETURN = "return"
    SCRAP = "scrap"


class TransactionReason(str, Enum):
    PURCHASE = "purchase"
    SALES = "sales"
    PRODUCTION = "production"
    QUALITY_ISSUE = "quality_issue"
    PHYSICAL_COUNT = "physical_count"
    CORRECTION = "correction"
    CUSTOMER_RETURN = "customer_return"
    VENDOR_RETURN = "vendor_return"


# ==================== Warehouse Schemas ====================

class WarehouseBase(BaseModel):
    warehouse_code: str = Field(..., max_length=50)
    warehouse_name: str = Field(..., max_length=200)
    warehouse_type: WarehouseType = WarehouseType.RAW_MATERIAL
    location: Optional[str] = None
    address: Optional[str] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    max_capacity: Optional[float] = None
    current_capacity: Optional[float] = None
    capacity_unit: Optional[str] = None
    is_active: bool = True
    remarks: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    warehouse_name: Optional[str] = None
    warehouse_type: Optional[WarehouseType] = None
    location: Optional[str] = None
    address: Optional[str] = None
    manager_name: Optional[str] = None
    manager_phone: Optional[str] = None
    max_capacity: Optional[float] = None
    is_active: Optional[bool] = None
    remarks: Optional[str] = None


class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WarehouseListResponse(BaseModel):
    items: List[WarehouseResponse]
    total: int
    page: int
    page_size: int


# ==================== Stock Schemas ====================

class StockBase(BaseModel):
    item_code: str = Field(..., max_length=50)
    item_name: Optional[str] = None
    warehouse_code: str = Field(..., max_length=50)
    location_code: Optional[str] = None
    quantity: float = 0
    reserved_qty: float = 0
    available_qty: float = 0
    unit: str = "EA"
    lot_no: Optional[str] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    manufacturing_date: Optional[datetime] = None
    unit_cost: float = 0
    total_value: float = 0
    status: StockStatus = StockStatus.AVAILABLE
    last_receipt_date: Optional[datetime] = None
    last_issue_date: Optional[datetime] = None


class StockResponse(StockBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StockListResponse(BaseModel):
    items: List[StockResponse]
    total: int
    page: int
    page_size: int


class StockSummary(BaseModel):
    item_code: str
    item_name: Optional[str]
    total_qty: float
    available_qty: float
    reserved_qty: float
    total_value: float
    warehouse_distribution: dict


# ==================== Transaction Schemas ====================

class TransactionBase(BaseModel):
    item_code: str = Field(..., max_length=50)
    item_name: Optional[str] = None
    transaction_type: TransactionType
    transaction_reason: Optional[TransactionReason] = None
    from_warehouse: Optional[str] = None
    from_location: Optional[str] = None
    to_warehouse: Optional[str] = None
    to_location: Optional[str] = None
    quantity: float
    unit: str = "EA"
    lot_no: Optional[str] = None
    batch_no: Optional[str] = None
    unit_cost: float = 0
    total_value: float = 0
    reference_type: Optional[str] = None
    reference_no: Optional[str] = None
    remarks: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    transaction_no: str
    transaction_date: datetime
    created_by: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int


# ==================== Analysis Schemas ====================

class InventoryAnalysis(BaseModel):
    """재고 분석"""
    total_items: int
    total_value: float
    stock_by_warehouse: dict
    stock_by_status: dict
    low_stock_items: List[dict]
    excess_stock_items: List[dict]
    aging_analysis: dict


class InventoryMovementSummary(BaseModel):
    """재고 이동 요약"""
    period: str
    total_receipts: int
    total_issues: int
    total_transfers: int
    receipt_value: float
    issue_value: float
    movement_by_type: dict
    top_moving_items: List[dict]
