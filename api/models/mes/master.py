"""
MES Master Data Models (기준정보관리)
- 코드그룹/공통코드
- 공장/라인/공정 관리
- 품목/품목별공정 관리
- 작업자/검사항목/불량유형 관리
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum

from api.models.base import Base


# ==================== Enums ====================

class LineType(str, enum.Enum):
    """라인 유형"""
    SMT = "SMT"
    THT = "THT"
    ASSEMBLY = "assembly"
    TEST = "test"


class LineStatus(str, enum.Enum):
    """라인 상태"""
    RUNNING = "running"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    STOPPED = "stopped"


class ProcessType(str, enum.Enum):
    """공정 유형"""
    SMT_PRINT = "smt_print"         # 솔더 프린팅
    SMT_SPI = "smt_spi"             # SPI 검사
    SMT_MOUNT = "smt_mount"         # 칩마운트
    SMT_REFLOW = "smt_reflow"       # 리플로우
    SMT_AOI = "smt_aoi"             # AOI 검사
    THT_INSERT = "tht_insert"       # 삽입
    THT_WAVE = "tht_wave"           # 웨이브 솔더링
    ASSEMBLY = "assembly"           # 조립
    TEST = "test"                   # 테스트
    PACKING = "packing"             # 포장


class SkillLevel(str, enum.Enum):
    """작업자 스킬 레벨"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class DefectCategory(str, enum.Enum):
    """불량 카테고리"""
    SOLDER = "solder"           # 솔더 관련
    COMPONENT = "component"     # 부품 관련
    PCB = "pcb"                 # PCB 관련
    PROCESS = "process"         # 공정 관련
    OTHER = "other"             # 기타


# ==================== Models ====================

class CodeGroup(Base):
    """코드 그룹"""
    __tablename__ = "mes_code_group"

    id = Column(Integer, primary_key=True, index=True)
    group_code = Column(String(50), unique=True, nullable=False, index=True)
    group_name = Column(String(200), nullable=False)
    description = Column(Text)
    is_system = Column(Boolean, default=False)  # 시스템 코드 여부
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    codes = relationship("CommonCode", back_populates="group", cascade="all, delete-orphan")


class CommonCode(Base):
    """공통 코드"""
    __tablename__ = "mes_common_code"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("mes_code_group.id"), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    code_name = Column(String(200), nullable=False)
    code_name_en = Column(String(200))
    sort_order = Column(Integer, default=0)
    extra_value1 = Column(String(200))
    extra_value2 = Column(String(200))
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    group = relationship("CodeGroup", back_populates="codes")


class Factory(Base):
    """공장"""
    __tablename__ = "mes_factory"

    id = Column(Integer, primary_key=True, index=True)
    factory_code = Column(String(50), unique=True, nullable=False, index=True)
    factory_name = Column(String(200), nullable=False)
    address = Column(Text)
    contact_person = Column(String(100))
    contact_phone = Column(String(50))
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Note: ProductionLine relationship is defined in equipment.py


class Process(Base):
    """공정 마스터"""
    __tablename__ = "mes_process"

    id = Column(Integer, primary_key=True, index=True)
    process_code = Column(String(50), unique=True, nullable=False, index=True)
    process_name = Column(String(200), nullable=False)
    process_type = Column(SQLEnum(ProcessType))

    # 표준 시간
    standard_time = Column(Float)  # 분
    setup_time = Column(Float)     # 셋업 시간 (분)

    # 검사 여부
    inspection_required = Column(Boolean, default=False)
    inspection_type = Column(String(50))  # SPI, AOI, 자주검사, 최종검사

    is_active = Column(Boolean, default=True)
    description = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LineProcess(Base):
    """라인별 공정"""
    __tablename__ = "mes_line_process"

    id = Column(Integer, primary_key=True, index=True)
    line_id = Column(Integer, ForeignKey("mes_production_line.id"), nullable=False)
    process_code = Column(String(50), nullable=False)
    process_name = Column(String(200))
    sequence = Column(Integer, nullable=False)  # 공정 순서

    # 설비 연결
    equipment_code = Column(String(50))
    equipment_name = Column(String(200))

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Note: Relationship to ProductionLine handled in equipment.py


class ProductRouting(Base):
    """품목별 공정 (Routing)"""
    __tablename__ = "mes_product_routing"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), nullable=False, index=True)
    product_name = Column(String(200))
    process_code = Column(String(50), nullable=False)
    process_name = Column(String(200))
    sequence = Column(Integer, nullable=False)

    # 시간
    standard_time = Column(Float)  # 표준 가공 시간
    setup_time = Column(Float)     # 셋업 시간

    # 검사
    inspection_required = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Worker(Base):
    """작업자"""
    __tablename__ = "mes_worker"

    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(50), unique=True, nullable=False, index=True)
    worker_name = Column(String(100), nullable=False)
    department = Column(String(100))
    position = Column(String(100))

    # 소속
    factory_code = Column(String(50))
    line_code = Column(String(50))

    # 스킬
    skill_level = Column(SQLEnum(SkillLevel), default=SkillLevel.BEGINNER)
    certified_processes = Column(Text)  # JSON: ["SMT_MOUNT", "SMT_REFLOW"]

    # 연락처
    phone = Column(String(50))
    email = Column(String(100))

    # 상태
    is_active = Column(Boolean, default=True)
    hire_date = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InspectionItem(Base):
    """검사 항목"""
    __tablename__ = "mes_inspection_item"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, nullable=False, index=True)
    item_name = Column(String(200), nullable=False)
    inspection_type = Column(String(50))  # SPI, AOI, 자주검사, 최종검사
    process_code = Column(String(50))

    # 기준값
    target_value = Column(Float)
    upper_limit = Column(Float)
    lower_limit = Column(Float)
    unit = Column(String(20))

    # 측정 방법
    measurement_method = Column(String(200))
    equipment_required = Column(String(200))

    is_mandatory = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Note: DefectType is defined in quality.py


class ProductDefectMapping(Base):
    """품목별 불량유형 매핑"""
    __tablename__ = "mes_product_defect_mapping"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), nullable=False, index=True)
    defect_code = Column(String(50), nullable=False)
    defect_name = Column(String(200))

    # 기준값
    target_rate = Column(Float)  # 목표 불량률 (%)
    alert_rate = Column(Float)   # 경고 불량률 (%)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
