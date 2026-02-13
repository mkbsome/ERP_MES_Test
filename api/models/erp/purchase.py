"""
ERP Purchase Models
- 발주 (Purchase Order)
- 입고 (Goods Receipt)

실제 DB 스키마 기반 모델 (2024-01 수정)
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Numeric, Date
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum

from api.models.base import Base


# ==================== Enums (API용) ====================

class POStatus(str, enum.Enum):
    DRAFT = "draft"
    REQUESTED = "requested"
    APPROVED = "approved"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIAL = "partial"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ReceiptStatus(str, enum.Enum):
    PENDING = "pending"
    INSPECTING = "inspecting"
    PASSED = "passed"
    REJECTED = "rejected"
    PARTIAL = "partial"
    STORED = "stored"


class POType(str, enum.Enum):
    STANDARD = "standard"
    URGENT = "urgent"
    BLANKET = "blanket"
    CONSIGNMENT = "consignment"


# ==================== Models (실제 DB 스키마 기반) ====================

class PurchaseOrder(Base):
    """발주 - 실제 DB: erp_purchase_order"""
    __tablename__ = "erp_purchase_order"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    po_no = Column(String(50), nullable=False, index=True)
    po_date = Column(Date, nullable=False)
    vendor_id = Column(Integer)
    vendor_code = Column(String(50), nullable=False, index=True)
    vendor_name = Column(String(200))
    expected_date = Column(Date)
    total_amount = Column(Numeric(18, 2), default=0)
    tax_amount = Column(Numeric(18, 2), default=0)
    currency = Column(String(10))
    payment_terms = Column(String(50))
    status = Column(String(30))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    items = relationship("PurchaseOrderItem", back_populates="po", cascade="all, delete-orphan",
                        foreign_keys="PurchaseOrderItem.po_id")


class PurchaseOrderItem(Base):
    """발주 상세 - 실제 DB: erp_purchase_order_item"""
    __tablename__ = "erp_purchase_order_item"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("erp_purchase_order.id"), nullable=False)
    line_no = Column(Integer, nullable=False)
    product_id = Column(Integer)
    item_code = Column(String(50), nullable=False)
    item_name = Column(String(200))
    order_qty = Column(Numeric(15, 2), nullable=False)
    received_qty = Column(Numeric(15, 2), default=0)
    remaining_qty = Column(Numeric(15, 2), default=0)
    unit_price = Column(Numeric(18, 4), default=0)
    amount = Column(Numeric(18, 2), default=0)
    expected_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    po = relationship("PurchaseOrder", back_populates="items", foreign_keys=[po_id])


class GoodsReceipt(Base):
    """입고 - 실제 DB: erp_goods_receipt"""
    __tablename__ = "erp_goods_receipt"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    receipt_no = Column(String(50), nullable=False, index=True)
    receipt_date = Column(Date, nullable=False)
    po_id = Column(Integer)
    po_no = Column(String(50))
    vendor_code = Column(String(50), nullable=False)
    vendor_name = Column(String(200))
    warehouse_code = Column(String(50))
    status = Column(String(30))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    items = relationship("GoodsReceiptItem", back_populates="receipt", cascade="all, delete-orphan",
                        foreign_keys="GoodsReceiptItem.receipt_id")


class GoodsReceiptItem(Base):
    """입고 상세 - 실제 DB: erp_goods_receipt_item"""
    __tablename__ = "erp_goods_receipt_item"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("erp_goods_receipt.id"), nullable=False)
    line_no = Column(Integer, nullable=False)
    po_item_id = Column(Integer)
    item_code = Column(String(50), nullable=False)
    item_name = Column(String(200))
    receipt_qty = Column(Numeric(15, 2), nullable=False)
    accepted_qty = Column(Numeric(15, 2), default=0)
    rejected_qty = Column(Numeric(15, 2), default=0)
    unit_cost = Column(Numeric(18, 4), default=0)
    lot_no = Column(String(100))
    inspection_result = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    receipt = relationship("GoodsReceipt", back_populates="items", foreign_keys=[receipt_id])
