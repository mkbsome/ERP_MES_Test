"""
ERP Sales Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ==================== Enums ====================

class OrderStatus(str, Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    READY = "ready"
    SHIPPED = "shipped"
    INVOICED = "invoiced"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ShipmentStatus(str, Enum):
    PENDING = "pending"
    PICKING = "picking"
    PACKED = "packed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentTerms(str, Enum):
    CASH = "cash"
    NET_30 = "net_30"
    NET_45 = "net_45"
    NET_60 = "net_60"
    NET_90 = "net_90"


class DeliveryTerms(str, Enum):
    EXW = "EXW"
    FOB = "FOB"
    CIF = "CIF"
    DDP = "DDP"


# ==================== Sales Order Item Schemas ====================

class SalesOrderItemBase(BaseModel):
    item_seq: int
    product_code: str = Field(..., max_length=50)
    product_name: Optional[str] = None
    order_qty: float
    shipped_qty: float = 0
    remaining_qty: float = 0
    unit: str = "EA"
    unit_price: float = 0
    discount_rate: float = 0
    amount: float = 0
    requested_date: Optional[datetime] = None
    promised_date: Optional[datetime] = None
    remarks: Optional[str] = None


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemResponse(SalesOrderItemBase):
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Sales Order Schemas ====================

class SalesOrderBase(BaseModel):
    customer_code: str = Field(..., max_length=50)
    customer_name: Optional[str] = None
    customer_po_no: Optional[str] = None
    ship_to_address: Optional[str] = None
    ship_to_contact: Optional[str] = None
    ship_to_phone: Optional[str] = None
    requested_date: Optional[datetime] = None
    promised_date: Optional[datetime] = None
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    delivery_terms: DeliveryTerms = DeliveryTerms.EXW
    currency: str = "KRW"
    exchange_rate: float = 1.0
    subtotal: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    status: OrderStatus = OrderStatus.DRAFT
    sales_rep: Optional[str] = None
    remarks: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = []


class SalesOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_po_no: Optional[str] = None
    ship_to_address: Optional[str] = None
    ship_to_contact: Optional[str] = None
    ship_to_phone: Optional[str] = None
    requested_date: Optional[datetime] = None
    promised_date: Optional[datetime] = None
    payment_terms: Optional[PaymentTerms] = None
    delivery_terms: Optional[DeliveryTerms] = None
    status: Optional[OrderStatus] = None
    sales_rep: Optional[str] = None
    remarks: Optional[str] = None


class SalesOrderResponse(SalesOrderBase):
    id: int
    order_no: str
    order_date: datetime
    created_by: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    items: List[SalesOrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SalesOrderListResponse(BaseModel):
    items: List[SalesOrderResponse]
    total: int
    page: int
    page_size: int


# ==================== Shipment Schemas ====================

class ShipmentItemBase(BaseModel):
    item_seq: int
    product_code: str = Field(..., max_length=50)
    product_name: Optional[str] = None
    ship_qty: float
    unit: str = "EA"
    lot_no: Optional[str] = None
    batch_no: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None
    remarks: Optional[str] = None


class ShipmentItemCreate(ShipmentItemBase):
    pass


class ShipmentItemResponse(ShipmentItemBase):
    id: int
    shipment_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    order_id: Optional[int] = None
    order_no: Optional[str] = None
    customer_code: str = Field(..., max_length=50)
    customer_name: Optional[str] = None
    ship_to_address: Optional[str] = None
    ship_to_contact: Optional[str] = None
    ship_to_phone: Optional[str] = None
    carrier: Optional[str] = None
    tracking_no: Optional[str] = None
    status: ShipmentStatus = ShipmentStatus.PENDING
    remarks: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    items: List[ShipmentItemCreate] = []


class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    tracking_no: Optional[str] = None
    status: Optional[ShipmentStatus] = None
    picker: Optional[str] = None
    packer: Optional[str] = None
    shipper: Optional[str] = None
    remarks: Optional[str] = None


class ShipmentResponse(ShipmentBase):
    id: int
    shipment_no: str
    shipment_date: datetime
    picker: Optional[str]
    packer: Optional[str]
    shipper: Optional[str]
    items: List[ShipmentItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShipmentListResponse(BaseModel):
    items: List[ShipmentResponse]
    total: int
    page: int
    page_size: int


# ==================== Analysis Schemas ====================

class SalesAnalysis(BaseModel):
    """영업 분석"""
    period: str
    total_orders: int
    total_revenue: float
    order_by_status: dict
    revenue_by_customer: List[dict]
    revenue_by_product: List[dict]
    monthly_trend: List[dict]


class SalesPerformance(BaseModel):
    """영업 실적"""
    sales_rep: str
    total_orders: int
    total_revenue: float
    avg_order_value: float
    achievement_rate: float
