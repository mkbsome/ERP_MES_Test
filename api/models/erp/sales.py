"""
ERP Sales Models
- 수주 (Sales Order)
- 출하 (Shipment)
- 매출 (Sales Revenue)
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Numeric,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum

from api.models.base import Base


# ==================== Enums ====================

class OrderStatus(str, enum.Enum):
    """수주 상태"""
    DRAFT = "draft"             # 임시저장
    CONFIRMED = "confirmed"     # 확정
    IN_PRODUCTION = "in_production"  # 생산중
    READY = "ready"             # 출하대기
    SHIPPED = "shipped"         # 출하완료
    INVOICED = "invoiced"       # 청구완료
    CLOSED = "closed"           # 마감
    CANCELLED = "cancelled"     # 취소


class ShipmentStatus(str, enum.Enum):
    """출하 상태"""
    PENDING = "pending"         # 대기
    PICKING = "picking"         # 피킹중
    PACKED = "packed"           # 포장완료
    SHIPPED = "shipped"         # 출하완료
    DELIVERED = "delivered"     # 배송완료
    CANCELLED = "cancelled"     # 취소


class PaymentTerms(str, enum.Enum):
    """결제조건"""
    CASH = "cash"               # 현금
    NET_30 = "net_30"           # 30일
    NET_45 = "net_45"           # 45일
    NET_60 = "net_60"           # 60일
    NET_90 = "net_90"           # 90일


class DeliveryTerms(str, enum.Enum):
    """배송조건"""
    EXW = "EXW"         # 공장인도
    FOB = "FOB"         # 본선인도
    CIF = "CIF"         # 운임보험료포함인도
    DDP = "DDP"         # 관세지급인도


# ==================== Models ====================

class SalesOrder(Base):
    """수주"""
    __tablename__ = "erp_sales_order"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    order_date = Column(DateTime, default=datetime.utcnow)

    # 고객 정보
    customer_code = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(200))
    customer_po_no = Column(String(100))        # 고객 발주번호

    # 배송 정보
    ship_to_address = Column(Text)
    ship_to_contact = Column(String(100))
    ship_to_phone = Column(String(50))
    requested_date = Column(DateTime)           # 요청 납기일
    promised_date = Column(DateTime)            # 약정 납기일

    # 결제 조건
    payment_terms = Column(SQLEnum(PaymentTerms), default=PaymentTerms.NET_30)
    delivery_terms = Column(SQLEnum(DeliveryTerms), default=DeliveryTerms.EXW)
    currency = Column(String(10), default="KRW")
    exchange_rate = Column(Float, default=1.0)

    # 금액
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)

    # 상태
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.DRAFT)

    # 담당자
    sales_rep = Column(String(100))
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")


class SalesOrderItem(Base):
    """수주 상세"""
    __tablename__ = "erp_sales_order_item"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"), nullable=False)

    # 품목 정보
    item_seq = Column(Integer, nullable=False)
    product_code = Column(String(50), nullable=False)
    product_name = Column(String(200))

    # 수량
    order_qty = Column(Float, nullable=False)
    shipped_qty = Column(Float, default=0)
    remaining_qty = Column(Float, default=0)
    unit = Column(String(20), default="EA")

    # 가격
    unit_price = Column(Numeric(15, 4), default=0)
    discount_rate = Column(Float, default=0)
    amount = Column(Numeric(15, 2), default=0)

    # 납기
    requested_date = Column(DateTime)
    promised_date = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("SalesOrder", back_populates="items")


class Shipment(Base):
    """출하"""
    __tablename__ = "erp_shipment"

    id = Column(Integer, primary_key=True, index=True)
    shipment_no = Column(String(50), unique=True, nullable=False, index=True)
    shipment_date = Column(DateTime, default=datetime.utcnow)

    # 수주 정보
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"))
    order_no = Column(String(50))

    # 고객 정보
    customer_code = Column(String(50), nullable=False)
    customer_name = Column(String(200))

    # 배송 정보
    ship_to_address = Column(Text)
    ship_to_contact = Column(String(100))
    ship_to_phone = Column(String(50))
    carrier = Column(String(100))               # 운송사
    tracking_no = Column(String(100))           # 운송장 번호

    # 상태
    status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.PENDING)

    # 담당자
    picker = Column(String(100))                # 피커
    packer = Column(String(100))                # 포장자
    shipper = Column(String(100))               # 출하자

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("ShipmentItem", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentItem(Base):
    """출하 상세"""
    __tablename__ = "erp_shipment_item"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("erp_shipment.id"), nullable=False)

    # 품목 정보
    item_seq = Column(Integer, nullable=False)
    product_code = Column(String(50), nullable=False)
    product_name = Column(String(200))

    # 수량
    ship_qty = Column(Float, nullable=False)
    unit = Column(String(20), default="EA")

    # LOT 정보
    lot_no = Column(String(100))
    batch_no = Column(String(100))

    # 창고 정보
    warehouse_code = Column(String(50))
    location_code = Column(String(50))

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shipment = relationship("Shipment", back_populates="items")


class SalesRevenue(Base):
    """매출"""
    __tablename__ = "erp_sales_revenue"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)
    invoice_date = Column(DateTime, default=datetime.utcnow)

    # 수주/출하 정보
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"))
    order_no = Column(String(50))
    shipment_id = Column(Integer, ForeignKey("erp_shipment.id"))
    shipment_no = Column(String(50))

    # 고객 정보
    customer_code = Column(String(50), nullable=False)
    customer_name = Column(String(200))

    # 금액
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)
    currency = Column(String(10), default="KRW")

    # 결제
    payment_terms = Column(SQLEnum(PaymentTerms))
    due_date = Column(DateTime)                 # 결제기한
    paid_date = Column(DateTime)                # 결제일
    paid_amount = Column(Numeric(15, 2), default=0)
    is_paid = Column(Boolean, default=False)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
