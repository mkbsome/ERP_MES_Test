"""
ERP Master Data Models
- 품목 마스터 (Product Master)
- 고객 마스터 (Customer Master)
- 공급업체 마스터 (Vendor Master)
- BOM (Bill of Materials)
- Routing (공정 경로)
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

class ProductType(str, enum.Enum):
    """품목 유형"""
    FINISHED = "finished"           # 완제품
    SEMI_FINISHED = "semi_finished" # 반제품
    RAW_MATERIAL = "raw_material"   # 원자재
    COMPONENT = "component"         # 부품
    PACKAGING = "packaging"         # 포장재


class ProductStatus(str, enum.Enum):
    """품목 상태"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"
    DEVELOPMENT = "development"


class UnitOfMeasure(str, enum.Enum):
    """단위"""
    EA = "EA"       # 개
    PCS = "PCS"     # 조각
    KG = "KG"       # 킬로그램
    G = "G"         # 그램
    L = "L"         # 리터
    ML = "ML"       # 밀리리터
    M = "M"         # 미터
    MM = "MM"       # 밀리미터
    ROLL = "ROLL"   # 롤
    BOX = "BOX"     # 박스
    SET = "SET"     # 세트


class CustomerType(str, enum.Enum):
    """고객 유형"""
    DOMESTIC = "domestic"   # 국내
    EXPORT = "export"       # 수출
    BOTH = "both"           # 국내/수출 병행


class CustomerGrade(str, enum.Enum):
    """고객 등급"""
    VIP = "VIP"
    A = "A"
    B = "B"
    C = "C"


class VendorType(str, enum.Enum):
    """공급업체 유형"""
    MANUFACTURER = "manufacturer"   # 제조사
    DISTRIBUTOR = "distributor"     # 유통사
    AGENT = "agent"                 # 대리점


class VendorGrade(str, enum.Enum):
    """공급업체 등급"""
    STRATEGIC = "strategic"     # 전략적 파트너
    PREFERRED = "preferred"     # 우선 공급사
    APPROVED = "approved"       # 승인 공급사
    CONDITIONAL = "conditional" # 조건부 승인


# ==================== Models ====================

class ProductMaster(Base):
    """품목 마스터"""
    __tablename__ = "erp_product_master"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(200), nullable=False)
    product_name_en = Column(String(200))

    # 분류
    product_type = Column(SQLEnum(ProductType), default=ProductType.FINISHED)
    product_group = Column(String(50))      # 제품군 (스마트폰, 자동차, IoT 등)
    product_category = Column(String(50))   # 카테고리

    # 규격
    specification = Column(Text)
    model_no = Column(String(100))
    drawing_no = Column(String(100))

    # 단위 및 수량
    unit = Column(SQLEnum(UnitOfMeasure), default=UnitOfMeasure.EA)
    lot_size = Column(Integer, default=1)
    min_order_qty = Column(Integer, default=1)

    # 원가 정보
    standard_cost = Column(Numeric(15, 2), default=0)
    material_cost = Column(Numeric(15, 2), default=0)
    labor_cost = Column(Numeric(15, 2), default=0)
    overhead_cost = Column(Numeric(15, 2), default=0)
    selling_price = Column(Numeric(15, 2), default=0)

    # 리드타임
    lead_time_days = Column(Integer, default=1)
    safety_stock = Column(Integer, default=0)
    reorder_point = Column(Integer, default=0)

    # 상태
    status = Column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE)
    is_active = Column(Boolean, default=True)

    # 추가 정보
    description = Column(Text)
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    bom_headers = relationship("BOMHeader", back_populates="product")
    routing_headers = relationship("RoutingHeader", back_populates="product")


class CustomerMaster(Base):
    """고객 마스터"""
    __tablename__ = "erp_customer_master"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(200), nullable=False)
    customer_name_en = Column(String(200))

    # 분류
    customer_type = Column(SQLEnum(CustomerType), default=CustomerType.DOMESTIC)
    customer_grade = Column(SQLEnum(CustomerGrade), default=CustomerGrade.B)
    industry = Column(String(100))          # 산업 분야

    # 연락처
    ceo_name = Column(String(100))
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    contact_email = Column(String(100))

    # 주소
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(50), default="Korea")
    postal_code = Column(String(20))

    # 사업자 정보
    business_no = Column(String(50))        # 사업자등록번호
    tax_id = Column(String(50))             # 납세자번호

    # 거래 조건
    payment_terms = Column(String(50))      # 결제조건 (30일, 60일 등)
    credit_limit = Column(Numeric(15, 2))   # 여신한도
    currency = Column(String(10), default="KRW")

    # 상태
    is_active = Column(Boolean, default=True)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VendorMaster(Base):
    """공급업체 마스터"""
    __tablename__ = "erp_vendor_master"

    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    vendor_name = Column(String(200), nullable=False)
    vendor_name_en = Column(String(200))

    # 분류
    vendor_type = Column(SQLEnum(VendorType), default=VendorType.MANUFACTURER)
    vendor_grade = Column(SQLEnum(VendorGrade), default=VendorGrade.APPROVED)
    main_category = Column(String(100))     # 주요 공급 품목군

    # 연락처
    ceo_name = Column(String(100))
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    contact_email = Column(String(100))

    # 주소
    address = Column(Text)
    city = Column(String(100))
    country = Column(String(50), default="Korea")
    postal_code = Column(String(20))

    # 사업자 정보
    business_no = Column(String(50))
    tax_id = Column(String(50))

    # 거래 조건
    payment_terms = Column(String(50))
    lead_time_days = Column(Integer, default=7)
    min_order_amount = Column(Numeric(15, 2))
    currency = Column(String(10), default="KRW")

    # 평가
    quality_rating = Column(Float)          # 품질 평점 (0-100)
    delivery_rating = Column(Float)         # 납기 평점 (0-100)
    price_rating = Column(Float)            # 가격 경쟁력 (0-100)
    overall_rating = Column(Float)          # 종합 평점 (0-100)

    # 상태
    is_active = Column(Boolean, default=True)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BOMHeader(Base):
    """BOM 헤더 (Bill of Materials)"""
    __tablename__ = "erp_bom_header"

    id = Column(Integer, primary_key=True, index=True)
    bom_no = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("erp_product_master.id"), nullable=False)

    # BOM 정보
    bom_version = Column(String(20), default="1.0")
    effective_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)

    # 상태
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("ProductMaster", back_populates="bom_headers")
    details = relationship("BOMDetail", back_populates="header", cascade="all, delete-orphan")


class BOMDetail(Base):
    """BOM 상세"""
    __tablename__ = "erp_bom_detail"

    id = Column(Integer, primary_key=True, index=True)
    header_id = Column(Integer, ForeignKey("erp_bom_header.id"), nullable=False)

    # 자재 정보
    item_seq = Column(Integer, nullable=False)  # 순번
    component_code = Column(String(50), nullable=False)
    component_name = Column(String(200))

    # 수량
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(SQLEnum(UnitOfMeasure), default=UnitOfMeasure.EA)

    # 부품 속성
    position = Column(String(100))          # 위치 (예: R1, C2, U3 등)
    alternative_item = Column(String(50))   # 대체품목
    scrap_rate = Column(Float, default=0)   # 스크랩율 (%)

    # 상태
    is_critical = Column(Boolean, default=False)
    is_phantom = Column(Boolean, default=False)  # 가상 품목 여부

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    header = relationship("BOMHeader", back_populates="details")


class RoutingHeader(Base):
    """Routing 헤더 (공정 경로)"""
    __tablename__ = "erp_routing_header"

    id = Column(Integer, primary_key=True, index=True)
    routing_no = Column(String(50), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("erp_product_master.id"), nullable=False)

    # Routing 정보
    routing_version = Column(String(20), default="1.0")
    effective_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)

    # 상태
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    # 추가 정보
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("ProductMaster", back_populates="routing_headers")
    operations = relationship("RoutingOperation", back_populates="header", cascade="all, delete-orphan")


class RoutingOperation(Base):
    """Routing 공정"""
    __tablename__ = "erp_routing_operation"

    id = Column(Integer, primary_key=True, index=True)
    header_id = Column(Integer, ForeignKey("erp_routing_header.id"), nullable=False)

    # 공정 정보
    operation_seq = Column(Integer, nullable=False)     # 공정 순번
    operation_code = Column(String(50), nullable=False)
    operation_name = Column(String(200), nullable=False)

    # 작업장
    work_center_code = Column(String(50))
    work_center_name = Column(String(200))
    line_code = Column(String(50))

    # 시간 정보 (분 단위)
    setup_time = Column(Float, default=0)       # 셋업 시간
    run_time = Column(Float, default=0)         # 가공 시간 (단위당)
    wait_time = Column(Float, default=0)        # 대기 시간
    move_time = Column(Float, default=0)        # 이동 시간

    # 용량
    standard_qty = Column(Integer, default=1)   # 표준 생산 수량
    capacity_per_hour = Column(Float)           # 시간당 생산 능력

    # 원가
    labor_rate = Column(Numeric(10, 2))         # 노무비 단가
    machine_rate = Column(Numeric(10, 2))       # 기계비 단가

    # 품질
    inspection_required = Column(Boolean, default=False)
    inspection_type = Column(String(50))        # 검사 유형

    # 추가 정보
    description = Column(Text)
    remarks = Column(Text)

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    header = relationship("RoutingHeader", back_populates="operations")
