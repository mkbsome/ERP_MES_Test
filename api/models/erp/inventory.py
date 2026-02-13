"""
ERP Inventory Models
- 창고 마스터 (Warehouse)
- 재고 이동 (Inventory Transaction)

실제 DB 스키마 기반 모델 (2024-01 수정)
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, Numeric, Date
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import enum

from api.models.base import Base


# ==================== Enums (API용) ====================

class WarehouseType(str, enum.Enum):
    RAW_MATERIAL = "raw_material"
    WIP = "wip"
    FINISHED_GOODS = "finished_goods"
    DEFECTIVE = "defective"
    QUARANTINE = "quarantine"


class StockStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    BLOCKED = "blocked"
    QUALITY_HOLD = "quality_hold"
    IN_TRANSIT = "in_transit"


class TransactionType(str, enum.Enum):
    RECEIPT = "receipt"
    ISSUE = "issue"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    PRODUCTION_IN = "production_in"
    PRODUCTION_OUT = "production_out"
    RETURN = "return"
    SCRAP = "scrap"


class TransactionReason(str, enum.Enum):
    PURCHASE = "purchase"
    SALES = "sales"
    PRODUCTION = "production"
    QUALITY_ISSUE = "quality_issue"
    PHYSICAL_COUNT = "physical_count"
    CORRECTION = "correction"
    CUSTOMER_RETURN = "customer_return"
    VENDOR_RETURN = "vendor_return"


# ==================== Models (실제 DB 스키마 기반) ====================

class Warehouse(Base):
    """창고 마스터 - 실제 DB: erp_warehouse"""
    __tablename__ = "erp_warehouse"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    warehouse_code = Column(String(50), unique=True, nullable=False, index=True)
    warehouse_name = Column(String(200), nullable=False)
    warehouse_type = Column(String(50))
    location = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))


class InventoryStock(Base):
    """재고 현황 - 실제 DB: erp_inventory_stock (존재하지 않을 수 있음)"""
    __tablename__ = "erp_inventory_stock"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    product_code = Column(String(50), nullable=False, index=True)
    warehouse_code = Column(String(50), nullable=False, index=True)
    quantity = Column(Numeric(15, 2), default=0)
    reserved_qty = Column(Numeric(15, 2), default=0)
    available_qty = Column(Numeric(15, 2), default=0)
    uom = Column(String(20), default="EA")
    lot_no = Column(String(100))
    status = Column(String(20))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))


class InventoryTransaction(Base):
    """재고 이동 이력 - 실제 DB: erp_inventory_transaction"""
    __tablename__ = "erp_inventory_transaction"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    transaction_no = Column(String(50), unique=True, nullable=False, index=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    transaction_reason = Column(String(50))
    item_code = Column(String(50), nullable=False, index=True)
    item_name = Column(String(200))
    from_warehouse = Column(String(50))
    to_warehouse = Column(String(50))
    from_location = Column(String(50))
    to_location = Column(String(50))
    quantity = Column(Numeric(15, 2), nullable=False)
    unit_cost = Column(Numeric(18, 4))
    total_cost = Column(Numeric(18, 2))
    lot_no = Column(String(100))
    reference_type = Column(String(50))
    reference_no = Column(String(100))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(String(50))
