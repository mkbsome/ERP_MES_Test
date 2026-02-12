"""
ERP Sales Models
- 수주 (Sales Order)
- 출하 (Shipment)
- 매출 (Sales Revenue)

NOTE: Models are aligned with actual database schema
"""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, Text, ForeignKey, Numeric
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from api.models.base import Base


# ==================== Models ====================

class SalesOrder(Base):
    """수주 (erp_sales_order)"""
    __tablename__ = "erp_sales_order"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    order_date = Column(Date, nullable=False)

    # 고객 정보
    customer_id = Column(Integer)
    customer_code = Column(String(50), nullable=False, index=True)
    customer_name = Column(String(200))

    # 배송 정보
    delivery_date = Column(Date)
    shipping_address = Column(Text)

    # 결제 조건
    payment_terms = Column(String(50))
    currency = Column(String(10), default="KRW")

    # 금액
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)

    # 상태
    status = Column(String(30))

    # 기타
    remark = Column(Text)
    created_by = Column(String(100))

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")


class SalesOrderItem(Base):
    """수주 상세 (erp_sales_order_item)"""
    __tablename__ = "erp_sales_order_item"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"))

    # 품목 정보
    line_no = Column(Integer, nullable=False)
    product_id = Column(Integer)
    product_code = Column(String(50), nullable=False)
    product_name = Column(String(200))

    # 수량
    order_qty = Column(Numeric(12, 3), nullable=False)
    shipped_qty = Column(Numeric(12, 3), default=0)
    remaining_qty = Column(Numeric(12, 3), default=0)

    # 가격
    unit_price = Column(Numeric(15, 4), nullable=False)
    amount = Column(Numeric(15, 2), default=0)

    # 납기
    promised_date = Column(Date)

    # 추가 정보
    remark = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    order = relationship("SalesOrder", back_populates="items")


class Shipment(Base):
    """출하 (erp_shipment)"""
    __tablename__ = "erp_shipment"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    shipment_no = Column(String(50), unique=True, nullable=False, index=True)
    shipment_date = Column(Date, nullable=False)

    # 수주 정보
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"))
    order_no = Column(String(50))

    # 고객 정보
    customer_code = Column(String(50))
    customer_name = Column(String(200))

    # 배송 정보
    shipping_address = Column(Text)
    carrier = Column(String(100))
    tracking_no = Column(String(100))

    # 상태
    status = Column(String(30))

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("ShipmentItem", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentItem(Base):
    """출하 상세 (erp_shipment_item)"""
    __tablename__ = "erp_shipment_item"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("erp_shipment.id"))

    # 품목 정보
    line_no = Column(Integer, nullable=False)
    product_code = Column(String(50), nullable=False)
    product_name = Column(String(200))
    order_item_id = Column(Integer)

    # 수량
    ship_qty = Column(Numeric(12, 3), nullable=False)

    # LOT 정보
    lot_no = Column(String(100))

    # 창고 정보
    warehouse_code = Column(String(50))
    location_code = Column(String(50))

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    shipment = relationship("Shipment", back_populates="items")


class SalesRevenue(Base):
    """매출 (erp_sales_revenue)"""
    __tablename__ = "erp_sales_revenue"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)
    invoice_date = Column(Date, nullable=False)

    # 수주/출하 정보
    order_id = Column(Integer, ForeignKey("erp_sales_order.id"))
    shipment_id = Column(Integer, ForeignKey("erp_shipment.id"))

    # 고객 정보
    customer_code = Column(String(50))
    customer_name = Column(String(200))

    # 금액
    subtotal = Column(Numeric(15, 2), nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), nullable=False)

    # 결제
    payment_terms = Column(String(50))
    due_date = Column(Date)
    status = Column(String(30))
    paid_amount = Column(Numeric(15, 2), default=0)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
