"""
ERP Master Data Models
- 품목 마스터 (Product Master)
- 고객 마스터 (Customer Master)
- 공급업체 마스터 (Vendor Master)
- BOM (Bill of Materials)
- Routing (공정 경로)

실제 DB 스키마 기반 모델 (2024-01 수정)
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Numeric, Date
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum

from api.models.base import Base


# ==================== Enums (API용 - DB에는 String으로 저장됨) ====================

class ProductType(str, enum.Enum):
    """품목 유형"""
    FINISHED = "finished"
    SEMI_FINISHED = "semi_finished"
    RAW_MATERIAL = "raw_material"
    COMPONENT = "component"
    PACKAGING = "packaging"


class ProductStatus(str, enum.Enum):
    """품목 상태"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"
    DEVELOPMENT = "development"


class UnitOfMeasure(str, enum.Enum):
    """단위"""
    EA = "EA"
    PCS = "PCS"
    KG = "KG"
    G = "G"
    L = "L"
    ML = "ML"
    M = "M"
    MM = "MM"
    ROLL = "ROLL"
    BOX = "BOX"
    SET = "SET"


class CustomerType(str, enum.Enum):
    """고객 유형"""
    DOMESTIC = "domestic"
    EXPORT = "export"
    BOTH = "both"


class CustomerGrade(str, enum.Enum):
    """고객 등급"""
    VIP = "VIP"
    A = "A"
    B = "B"
    C = "C"


class VendorType(str, enum.Enum):
    """공급업체 유형"""
    MANUFACTURER = "manufacturer"
    DISTRIBUTOR = "distributor"
    AGENT = "agent"


class VendorGrade(str, enum.Enum):
    """공급업체 등급"""
    STRATEGIC = "strategic"
    PREFERRED = "preferred"
    APPROVED = "approved"
    CONDITIONAL = "conditional"


# ==================== Models (실제 DB 스키마 기반) ====================

class ProductMaster(Base):
    """품목 마스터 - 실제 DB: erp_product_master"""
    __tablename__ = "erp_product_master"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    product_code = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    product_type = Column(String(50), nullable=False)  # DB는 varchar
    product_group = Column(String(50))
    uom = Column(String(20), nullable=False)  # unit of measure
    standard_cost = Column(Numeric(15, 2))
    selling_price = Column(Numeric(15, 2))
    safety_stock = Column(Numeric(15, 2))
    lead_time_days = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))
    created_by = Column(String(100))
    updated_by = Column(String(100))


class CustomerMaster(Base):
    """고객 마스터 - 실제 DB: erp_customer_master"""
    __tablename__ = "erp_customer_master"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(200), nullable=False)
    customer_type = Column(String(50))  # DB는 varchar
    customer_grade = Column(String(20))  # DB는 varchar
    business_no = Column(String(50))
    ceo_name = Column(String(100))
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(100))
    credit_limit = Column(Numeric(15, 2))
    payment_terms = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))


class VendorMaster(Base):
    """공급업체 마스터 - 실제 DB: erp_vendor_master"""
    __tablename__ = "erp_vendor_master"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    vendor_name = Column(String(200), nullable=False)
    vendor_type = Column(String(50))  # DB는 varchar
    vendor_grade = Column(String(20))  # DB는 varchar
    business_no = Column(String(50))
    ceo_name = Column(String(100))
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(100))
    payment_terms = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))


class BOMHeader(Base):
    """BOM 헤더 - 실제 DB: erp_bom_header"""
    __tablename__ = "erp_bom_header"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    bom_no = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer)
    product_code = Column(String(50))
    bom_version = Column(String(20), default="1.0")
    effective_date = Column(Date)
    expiry_date = Column(Date)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(100))
    approved_at = Column(DateTime(timezone=True))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    details = relationship("BOMDetail", back_populates="header", cascade="all, delete-orphan",
                          foreign_keys="BOMDetail.header_id")


class BOMDetail(Base):
    """BOM 상세 - 실제 DB: erp_bom_detail"""
    __tablename__ = "erp_bom_detail"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    header_id = Column(Integer, ForeignKey("erp_bom_header.id"), nullable=False)
    item_seq = Column(Integer, nullable=False)
    component_code = Column(String(50), nullable=False)
    component_name = Column(String(200))
    quantity = Column(Numeric(15, 4), nullable=False, default=1.0)
    uom = Column(String(20), default="EA")
    position = Column(String(100))
    alternative_item = Column(String(50))
    scrap_rate = Column(Numeric(5, 2), default=0)
    is_critical = Column(Boolean, default=False)
    is_phantom = Column(Boolean, default=False)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    header = relationship("BOMHeader", back_populates="details", foreign_keys=[header_id])


class RoutingHeader(Base):
    """Routing 헤더 - 실제 DB: erp_routing_header"""
    __tablename__ = "erp_routing_header"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    routing_no = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer)
    product_code = Column(String(50))
    routing_version = Column(String(20), default="1.0")
    effective_date = Column(Date)
    expiry_date = Column(Date)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(100))
    approved_at = Column(DateTime(timezone=True))
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    operations = relationship("RoutingOperation", back_populates="header", cascade="all, delete-orphan",
                             foreign_keys="RoutingOperation.header_id")


class RoutingOperation(Base):
    """Routing 공정 - 실제 DB: erp_routing_operation"""
    __tablename__ = "erp_routing_operation"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(PGUUID(as_uuid=True), nullable=False)
    header_id = Column(Integer, ForeignKey("erp_routing_header.id"), nullable=False)
    operation_seq = Column(Integer, nullable=False)
    operation_code = Column(String(50), nullable=False)
    operation_name = Column(String(200), nullable=False)
    work_center_code = Column(String(50))
    work_center_name = Column(String(200))
    line_code = Column(String(50))
    setup_time = Column(Numeric(10, 2), default=0)
    run_time = Column(Numeric(10, 2), default=0)
    wait_time = Column(Numeric(10, 2), default=0)
    move_time = Column(Numeric(10, 2), default=0)
    standard_qty = Column(Integer, default=1)
    capacity_per_hour = Column(Numeric(10, 2))
    labor_rate = Column(Numeric(10, 2))
    machine_rate = Column(Numeric(10, 2))
    inspection_required = Column(Boolean, default=False)
    inspection_type = Column(String(50))
    description = Column(Text)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True))

    # Relationships
    header = relationship("RoutingHeader", back_populates="operations", foreign_keys=[header_id])
