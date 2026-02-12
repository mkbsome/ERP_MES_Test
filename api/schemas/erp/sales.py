"""
ERP Sales Schemas
- Aligned with actual database schema
"""

from datetime import datetime, date
from typing import Optional, List, Any
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
    product_code: str = Field(..., max_length=50)
    product_name: Optional[str] = None
    order_qty: float
    unit_price: float = 0
    amount: float = 0
    promised_date: Optional[date] = None
    remark: Optional[str] = None


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemResponse(BaseModel):
    """Sales order item response - aligned with DB schema"""
    id: int
    order_id: Optional[int] = None
    line_no: int
    product_id: Optional[int] = None
    product_code: str
    product_name: Optional[str] = None
    order_qty: float
    shipped_qty: float = 0
    remaining_qty: float = 0
    unit_price: float = 0
    amount: float = 0
    promised_date: Optional[str] = None
    remark: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== Sales Order Schemas ====================

class SalesOrderBase(BaseModel):
    customer_code: str = Field(..., max_length=50)
    customer_name: Optional[str] = None
    delivery_date: Optional[date] = None
    shipping_address: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: str = "KRW"
    tax_amount: float = 0
    total_amount: float = 0


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = []
    created_by: Optional[str] = None


class SalesOrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    delivery_date: Optional[date] = None
    shipping_address: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class SalesOrderResponse(BaseModel):
    """Sales order response - aligned with DB schema"""
    id: int
    order_no: str
    order_date: Optional[str] = None
    customer_id: Optional[int] = None
    customer_code: str
    customer_name: Optional[str] = None
    delivery_date: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: Optional[str] = "KRW"
    tax_amount: float = 0
    total_amount: float = 0
    status: Optional[str] = None
    remark: Optional[str] = None
    created_by: Optional[str] = None
    items: List[SalesOrderItemResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class SalesOrderListResponse(BaseModel):
    items: List[SalesOrderResponse]
    total: int
    page: int
    page_size: int


# ==================== Shipment Schemas ====================

class ShipmentItemBase(BaseModel):
    product_code: str = Field(..., max_length=50)
    product_name: Optional[str] = None
    ship_qty: float
    lot_no: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None


class ShipmentItemCreate(ShipmentItemBase):
    pass


class ShipmentItemResponse(BaseModel):
    """Shipment item response - aligned with DB schema"""
    id: int
    shipment_id: Optional[int] = None
    line_no: int
    product_code: str
    product_name: Optional[str] = None
    order_item_id: Optional[int] = None
    ship_qty: float
    lot_no: Optional[str] = None
    warehouse_code: Optional[str] = None
    location_code: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ShipmentBase(BaseModel):
    order_id: Optional[int] = None
    order_no: Optional[str] = None
    customer_code: str = Field(..., max_length=50)
    customer_name: Optional[str] = None
    shipping_address: Optional[str] = None
    carrier: Optional[str] = None
    tracking_no: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    items: List[ShipmentItemCreate] = []


class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    tracking_no: Optional[str] = None
    status: Optional[str] = None


class ShipmentResponse(BaseModel):
    """Shipment response - aligned with DB schema"""
    id: int
    shipment_no: str
    shipment_date: Optional[str] = None
    order_id: Optional[int] = None
    order_no: Optional[str] = None
    customer_code: Optional[str] = None
    customer_name: Optional[str] = None
    shipping_address: Optional[str] = None
    carrier: Optional[str] = None
    tracking_no: Optional[str] = None
    status: Optional[str] = None
    items: List[ShipmentItemResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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
