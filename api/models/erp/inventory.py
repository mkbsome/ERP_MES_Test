"""
ERP Inventory Models
- 재고 마스터 (Inventory Stock)
- 재고 이동 (Inventory Transaction)
- 창고 마스터 (Warehouse)
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

class WarehouseType(str, enum.Enum):
    """창고 유형"""
    RAW_MATERIAL = "raw_material"       # 원자재 창고
    WIP = "wip"                         # 재공품 창고
    FINISHED_GOODS = "finished_goods"   # 완제품 창고
    DEFECTIVE = "defective"             # 불량품 창고
    QUARANTINE = "quarantine"           # 격리 창고


class StockStatus(str, enum.Enum):
    """재고 상태"""
    AVAILABLE = "available"         # 사용 가능
    RESERVED = "reserved"           # 예약됨
    BLOCKED = "blocked"             # 차단됨
    QUALITY_HOLD = "quality_hold"   # 품질 보류
    IN_TRANSIT = "in_transit"       # 이동 중


class TransactionType(str, enum.Enum):
    """재고 이동 유형"""
    RECEIPT = "receipt"             # 입고
    ISSUE = "issue"                 # 출고
    TRANSFER = "transfer"           # 이동
    ADJUSTMENT = "adjustment"       # 조정
    PRODUCTION_IN = "production_in"   # 생산 입고
    PRODUCTION_OUT = "production_out" # 생산 출고
    RETURN = "return"               # 반품
    SCRAP = "scrap"                 # 폐기


class TransactionReason(str, enum.Enum):
    """이동 사유"""
    PURCHASE = "purchase"           # 구매
    SALES = "sales"                 # 판매
    PRODUCTION = "production"       # 생산
    QUALITY_ISSUE = "quality_issue" # 품질 이상
    PHYSICAL_COUNT = "physical_count"   # 실사
    CORRECTION = "correction"       # 오류 수정
    CUSTOMER_RETURN = "customer_return" # 고객 반품
    VENDOR_RETURN = "vendor_return"     # 공급사 반품


# ==================== Models ====================

class Warehouse(Base):
    """창고 마스터"""
    __tablename__ = "erp_warehouse"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(50), unique=True, nullable=False, index=True)
    warehouse_name = Column(String(200), nullable=False)
    warehouse_type = Column(SQLEnum(WarehouseType), default=WarehouseType.RAW_MATERIAL)

    # 위치 정보
    location = Column(String(200))
    address = Column(Text)

    # 책임자
    manager_name = Column(String(100))
    manager_phone = Column(String(50))

    # 용량
    max_capacity = Column(Float)            # 최대 용량
    current_capacity = Column(Float)        # 현재 사용량
    capacity_unit = Column(String(20))      # 용량 단위

    # 상태
    is_active = Column(Boolean, default=True)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryStock(Base):
    """재고 현황"""
    __tablename__ = "erp_inventory_stock"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), nullable=False, index=True)
    item_name = Column(String(200))
    warehouse_code = Column(String(50), nullable=False, index=True)
    location_code = Column(String(50))      # 로케이션 (창고 내 위치)

    # 수량
    quantity = Column(Float, default=0)
    reserved_qty = Column(Float, default=0) # 예약 수량
    available_qty = Column(Float, default=0) # 가용 수량
    unit = Column(String(20), default="EA")

    # LOT 정보
    lot_no = Column(String(100))
    batch_no = Column(String(100))
    expiry_date = Column(DateTime)
    manufacturing_date = Column(DateTime)

    # 원가
    unit_cost = Column(Numeric(15, 4), default=0)
    total_value = Column(Numeric(15, 2), default=0)

    # 상태
    status = Column(SQLEnum(StockStatus), default=StockStatus.AVAILABLE)

    # 마지막 이동 정보
    last_receipt_date = Column(DateTime)
    last_issue_date = Column(DateTime)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InventoryTransaction(Base):
    """재고 이동 이력"""
    __tablename__ = "erp_inventory_transaction"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(50), unique=True, nullable=False, index=True)
    transaction_date = Column(DateTime, default=datetime.utcnow)

    # 품목 정보
    item_code = Column(String(50), nullable=False, index=True)
    item_name = Column(String(200))

    # 이동 유형
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    transaction_reason = Column(SQLEnum(TransactionReason))

    # 창고 정보
    from_warehouse = Column(String(50))
    from_location = Column(String(50))
    to_warehouse = Column(String(50))
    to_location = Column(String(50))

    # 수량
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="EA")

    # LOT 정보
    lot_no = Column(String(100))
    batch_no = Column(String(100))

    # 원가
    unit_cost = Column(Numeric(15, 4), default=0)
    total_value = Column(Numeric(15, 2), default=0)

    # 참조 정보
    reference_type = Column(String(50))     # 참조 문서 유형 (PO, SO, WO 등)
    reference_no = Column(String(100))      # 참조 문서 번호

    # 처리자
    created_by = Column(String(100))
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
