"""
ERP Purchase Models
- 발주 (Purchase Order)
- 입고 (Goods Receipt)
- 매입 (Purchase Invoice)
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

class POStatus(str, enum.Enum):
    """발주 상태"""
    DRAFT = "draft"             # 임시저장
    REQUESTED = "requested"     # 요청
    APPROVED = "approved"       # 승인
    SENT = "sent"               # 발송
    CONFIRMED = "confirmed"     # 공급사 확인
    PARTIAL = "partial"         # 부분입고
    COMPLETED = "completed"     # 입고완료
    CLOSED = "closed"           # 마감
    CANCELLED = "cancelled"     # 취소


class ReceiptStatus(str, enum.Enum):
    """입고 상태"""
    PENDING = "pending"         # 대기
    INSPECTING = "inspecting"   # 검수중
    PASSED = "passed"           # 합격
    REJECTED = "rejected"       # 불합격
    PARTIAL = "partial"         # 부분합격
    STORED = "stored"           # 입고완료


class POType(str, enum.Enum):
    """발주 유형"""
    STANDARD = "standard"       # 일반 발주
    URGENT = "urgent"           # 긴급 발주
    BLANKET = "blanket"         # 기본계약 발주
    CONSIGNMENT = "consignment" # 위탁 발주


# ==================== Models ====================

class PurchaseOrder(Base):
    """발주"""
    __tablename__ = "erp_purchase_order"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(50), unique=True, nullable=False, index=True)
    po_date = Column(DateTime, default=datetime.utcnow)
    po_type = Column(SQLEnum(POType), default=POType.STANDARD)

    # 공급업체 정보
    vendor_code = Column(String(50), nullable=False, index=True)
    vendor_name = Column(String(200))
    vendor_contact = Column(String(100))
    vendor_phone = Column(String(50))

    # 배송 정보
    deliver_to_address = Column(Text)
    deliver_to_contact = Column(String(100))
    requested_date = Column(DateTime)           # 요청 납기일
    confirmed_date = Column(DateTime)           # 확정 납기일

    # 결제 조건
    payment_terms = Column(String(50))
    currency = Column(String(10), default="KRW")
    exchange_rate = Column(Float, default=1.0)

    # 금액
    subtotal = Column(Numeric(15, 2), default=0)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), default=0)

    # 상태
    status = Column(SQLEnum(POStatus), default=POStatus.DRAFT)

    # 담당자
    buyer = Column(String(100))
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # MRP 연계
    mrp_order_id = Column(Integer)
    mrp_order_no = Column(String(100))

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("PurchaseOrderItem", back_populates="po", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    """발주 상세"""
    __tablename__ = "erp_purchase_order_item"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("erp_purchase_order.id"), nullable=False)

    # 품목 정보
    item_seq = Column(Integer, nullable=False)
    item_code = Column(String(50), nullable=False)
    item_name = Column(String(200))

    # 수량
    order_qty = Column(Float, nullable=False)
    received_qty = Column(Float, default=0)
    remaining_qty = Column(Float, default=0)
    unit = Column(String(20), default="EA")

    # 가격
    unit_price = Column(Numeric(15, 4), default=0)
    amount = Column(Numeric(15, 2), default=0)

    # 납기
    requested_date = Column(DateTime)
    confirmed_date = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    po = relationship("PurchaseOrder", back_populates="items")


class GoodsReceipt(Base):
    """입고"""
    __tablename__ = "erp_goods_receipt"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, nullable=False, index=True)
    receipt_date = Column(DateTime, default=datetime.utcnow)

    # 발주 정보
    po_id = Column(Integer, ForeignKey("erp_purchase_order.id"))
    po_no = Column(String(50))

    # 공급업체 정보
    vendor_code = Column(String(50), nullable=False)
    vendor_name = Column(String(200))

    # 배송 정보
    delivery_note_no = Column(String(100))      # 납품서 번호
    invoice_no = Column(String(100))            # 세금계산서 번호

    # 창고 정보
    warehouse_code = Column(String(50))
    location_code = Column(String(50))

    # 상태
    status = Column(SQLEnum(ReceiptStatus), default=ReceiptStatus.PENDING)

    # 담당자
    receiver = Column(String(100))              # 입고담당
    inspector = Column(String(100))             # 검수담당
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship("GoodsReceiptItem", back_populates="receipt", cascade="all, delete-orphan")


class GoodsReceiptItem(Base):
    """입고 상세"""
    __tablename__ = "erp_goods_receipt_item"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("erp_goods_receipt.id"), nullable=False)

    # 품목 정보
    item_seq = Column(Integer, nullable=False)
    item_code = Column(String(50), nullable=False)
    item_name = Column(String(200))

    # 수량
    receipt_qty = Column(Float, nullable=False)     # 입고 수량
    accepted_qty = Column(Float, default=0)         # 합격 수량
    rejected_qty = Column(Float, default=0)         # 불합격 수량
    unit = Column(String(20), default="EA")

    # LOT 정보
    lot_no = Column(String(100))
    batch_no = Column(String(100))
    expiry_date = Column(DateTime)
    manufacturing_date = Column(DateTime)

    # 가격
    unit_price = Column(Numeric(15, 4), default=0)
    amount = Column(Numeric(15, 2), default=0)

    # 검수 결과
    inspection_result = Column(String(50))          # PASS, FAIL, CONDITIONAL
    inspection_remarks = Column(Text)

    # 창고 정보
    warehouse_code = Column(String(50))
    location_code = Column(String(50))

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    receipt = relationship("GoodsReceipt", back_populates="items")
