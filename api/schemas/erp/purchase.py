"""
ERP Purchase Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ==================== Enums ====================

class POStatus(str, Enum):
    DRAFT = "draft"
    REQUESTED = "requested"
    APPROVED = "approved"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIAL = "partial"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ReceiptStatus(str, Enum):
    PENDING = "pending"
    INSPECTING = "inspecting"
    PASSED = "passed"
    REJECTED = "rejected"
    PARTIAL = "partial"
    STORED = "stored"


class POType(str, Enum):
    STANDARD = "standard"
    URGENT = "urgent"
    BLANKET = "blanket"
    CONSIGNMENT = "consignment"


# ==================== PO Item Schemas ====================

class POItemBase(BaseModel):
    item_seq: int
    item_code: str = Field(..., max_length=50)
    item_name: Optional[str] = None
    order_qty: float
    received_qty: float = 0
    remaining_qty: float = 0
    unit: str = "EA"
    unit_price: float = 0
    amount: float = 0
    requested_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None
    remarks: Optional[str] = None


class POItemCreate(POItemBase):
    pass


class POItemResponse(POItemBase):
    id: int
    po_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Purchase Order Schemas ====================

class POBase(BaseModel):
    po_type: POType = POType.STANDARD
    vendor_code: str = Field(..., max_length=50)
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_phone: Optional[str] = None
    deliver_to_address: Optional[str] = None
    deliver_to_contact: Optional[str] = None
    requested_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    currency: str = "KRW"
    exchange_rate: float = 1.0
    subtotal: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    status: POStatus = POStatus.DRAFT
    buyer: Optional[str] = None
    mrp_order_id: Optional[int] = None
    mrp_order_no: Optional[str] = None
    remarks: Optional[str] = None


class POCreate(POBase):
    items: List[POItemCreate] = []


class POUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    vendor_phone: Optional[str] = None
    deliver_to_address: Optional[str] = None
    deliver_to_contact: Optional[str] = None
    requested_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    status: Optional[POStatus] = None
    buyer: Optional[str] = None
    remarks: Optional[str] = None


class POResponse(POBase):
    id: int
    po_no: str
    po_date: datetime
    created_by: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    items: List[POItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class POListResponse(BaseModel):
    items: List[POResponse]
    total: int
    page: int
    page_size: int


# ==================== Receipt Item Schemas ====================

class ReceiptItemBase(BaseModel):
    item_seq: int
    item_code: str = Field(..., max_length=50)
    item_name: Optional[str] = None
    receipt_qty: float
    accepted_qty: float = 0
    rejected_qty: float = 0
    unit: str = "EA"
    lot_no: Optional[str] = None
    batch_no: Optional[str] = None
    expiry_date: Optional[datetime] = None
    manufacturing_date: Optional[datetime] = None
    unit_price: float = 0
    amount: float = 0
    inspection_result: Optional[str] = None
    inspection_remarks: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None
    remarks: Optional[str] = None


class ReceiptItemCreate(ReceiptItemBase):
    pass


class ReceiptItemResponse(ReceiptItemBase):
    id: int
    receipt_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Goods Receipt Schemas ====================

class ReceiptBase(BaseModel):
    po_id: Optional[int] = None
    po_no: Optional[str] = None
    vendor_code: str = Field(..., max_length=50)
    vendor_name: Optional[str] = None
    delivery_note_no: Optional[str] = None
    invoice_no: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None
    status: ReceiptStatus = ReceiptStatus.PENDING
    remarks: Optional[str] = None


class ReceiptCreate(ReceiptBase):
    items: List[ReceiptItemCreate] = []


class ReceiptUpdate(BaseModel):
    delivery_note_no: Optional[str] = None
    invoice_no: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None
    status: Optional[ReceiptStatus] = None
    receiver: Optional[str] = None
    inspector: Optional[str] = None
    remarks: Optional[str] = None


class ReceiptResponse(ReceiptBase):
    id: int
    receipt_no: str
    receipt_date: datetime
    receiver: Optional[str]
    inspector: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    items: List[ReceiptItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReceiptListResponse(BaseModel):
    items: List[ReceiptResponse]
    total: int
    page: int
    page_size: int


# ==================== Analysis Schemas ====================

class PurchaseAnalysis(BaseModel):
    """구매 분석"""
    period: str
    total_orders: int
    total_amount: float
    order_by_status: dict
    amount_by_vendor: List[dict]
    amount_by_category: List[dict]
    monthly_trend: List[dict]


class VendorPerformance(BaseModel):
    """공급업체 실적"""
    vendor_code: str
    vendor_name: str
    total_orders: int
    total_amount: float
    on_time_rate: float
    quality_rate: float
    overall_score: float
