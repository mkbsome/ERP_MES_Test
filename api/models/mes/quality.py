"""
MES Quality models
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Numeric, Text, DateTime, Date, Boolean, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB, ARRAY

from api.models.base import BaseModel, TimestampMixin


class DefectType(BaseModel):
    """불량 유형 마스터 (mes_defect_type) - 실제 DB 스키마 기반"""
    __tablename__ = "mes_defect_type"
    __table_args__ = {"extend_existing": True}

    defect_code: Mapped[Optional[str]] = mapped_column(String(50))
    defect_name: Mapped[Optional[str]] = mapped_column(String(100))
    defect_category: Mapped[Optional[str]] = mapped_column(String(50))
    severity: Mapped[Optional[str]] = mapped_column(String(20))
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class DefectDetail(BaseModel):
    """불량 상세 (mes_defect_detail) - 실제 DB 스키마 기반"""
    __tablename__ = "mes_defect_detail"
    __table_args__ = {"extend_existing": True}

    production_order_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    production_order_no: Mapped[Optional[str]] = mapped_column(String(50))
    product_code: Mapped[Optional[str]] = mapped_column(String(50))
    defect_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    detection_point: Mapped[Optional[str]] = mapped_column(String(50))
    line_code: Mapped[Optional[str]] = mapped_column(String(50))
    equipment_code: Mapped[Optional[str]] = mapped_column(String(50))
    defect_code: Mapped[Optional[str]] = mapped_column(String(50))
    defect_category: Mapped[Optional[str]] = mapped_column(String(50))
    severity: Mapped[Optional[str]] = mapped_column(String(20))
    defect_qty: Mapped[Optional[int]] = mapped_column(Integer, default=1)
    defect_location: Mapped[Optional[str]] = mapped_column(String(100))
    lot_no: Mapped[Optional[str]] = mapped_column(String(50))
    repair_result: Mapped[Optional[str]] = mapped_column(String(50))
    root_cause_category: Mapped[Optional[str]] = mapped_column(String(50))
    root_cause_detail: Mapped[Optional[str]] = mapped_column(Text)
    corrective_action: Mapped[Optional[str]] = mapped_column(Text)
    worker_id: Mapped[Optional[str]] = mapped_column(String(50))
    inspector_id: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class InspectionResult(BaseModel):
    """검사 결과 (mes_inspection_result) - 실제 DB 스키마 기반"""
    __tablename__ = "mes_inspection_result"
    __table_args__ = {"extend_existing": True}

    inspection_no: Mapped[Optional[str]] = mapped_column(String(50))
    inspection_type: Mapped[Optional[str]] = mapped_column(String(50))
    production_order_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    lot_no: Mapped[Optional[str]] = mapped_column(String(50))
    product_code: Mapped[Optional[str]] = mapped_column(String(50))
    inspection_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    inspector_id: Mapped[Optional[str]] = mapped_column(String(50))
    sample_size: Mapped[Optional[int]] = mapped_column(Integer)
    pass_qty: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    fail_qty: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    result: Mapped[Optional[str]] = mapped_column(String(20))
    defect_points: Mapped[Optional[dict]] = mapped_column(JSONB)
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class SPCData(BaseModel):
    """SPC 데이터 (mes_spc_data)"""
    __tablename__ = "mes_spc_data"
    __table_args__ = (
        Index("idx_mes_spc_product", "product_code", "measurement_type", "measurement_datetime"),
        Index("idx_mes_spc_equipment", "equipment_id", "measurement_datetime"),
        {"extend_existing": True},
    )

    spc_no: Mapped[str] = mapped_column(String(30), nullable=False)
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)
    equipment_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)
    lot_no: Mapped[Optional[str]] = mapped_column(String(30))

    # Measurement
    measurement_type: Mapped[str] = mapped_column(String(30), nullable=False)  # SOLDER_VOLUME, SOLDER_HEIGHT, etc.
    measurement_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sample_size: Mapped[int] = mapped_column(Integer, default=1)
    measured_value: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(10))

    # Spec limits
    spec_lower: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 6))  # LSL
    spec_upper: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 6))  # USL
    target_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 6))

    # Control limits
    control_lower: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 6))  # LCL
    control_upper: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 6))  # UCL

    # Calculated
    cpk_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4))
    out_of_spec: Mapped[bool] = mapped_column(Boolean, default=False)
    out_of_control: Mapped[bool] = mapped_column(Boolean, default=False)

    shift: Mapped[Optional[str]] = mapped_column(String(5))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )


class Traceability(BaseModel):
    """추적성 (mes_traceability)"""
    __tablename__ = "mes_traceability"
    __table_args__ = (
        CheckConstraint(
            "trace_type IN ('lot', 'serial', 'panel', 'component')",
            name="ck_mes_trace_type"
        ),
        CheckConstraint(
            "status IS NULL OR status IN ('active', 'completed', 'blocked', 'scrapped', 'shipped')",
            name="ck_mes_trace_status"
        ),
        Index("idx_mes_trace_id", "traced_id", "trace_type"),
        Index("idx_mes_trace_order", "production_order_no", "operation_no"),
        Index("idx_mes_trace_product", "product_code", "trace_timestamp"),
        {"extend_existing": True},
    )

    trace_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    trace_type: Mapped[str] = mapped_column(String(20), nullable=False)
    traced_id: Mapped[str] = mapped_column(String(100), nullable=False)

    # Production
    production_order_no: Mapped[str] = mapped_column(String(20), nullable=False)
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)

    # Operation
    operation_no: Mapped[int] = mapped_column(Integer, nullable=False)
    operation_name: Mapped[Optional[str]] = mapped_column(String(100))

    # Location
    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False)
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)
    shift_code: Mapped[Optional[str]] = mapped_column(String(10))

    # Resources
    operator_code: Mapped[Optional[str]] = mapped_column(String(20))

    # Parent-child
    parent_lot_no: Mapped[Optional[str]] = mapped_column(String(50))
    child_lot_nos: Mapped[Optional[list]] = mapped_column(ARRAY(String))

    # Material traceability
    material_lots: Mapped[Optional[dict]] = mapped_column(JSONB)
    process_parameters: Mapped[Optional[dict]] = mapped_column(JSONB)
    quality_results: Mapped[Optional[dict]] = mapped_column(JSONB)
    test_results: Mapped[Optional[dict]] = mapped_column(JSONB)

    # Linked traces
    previous_trace_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    next_trace_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))

    # Status
    status: Mapped[Optional[str]] = mapped_column(String(20))

    # Shipment
    customer_serial: Mapped[Optional[str]] = mapped_column(String(100))
    ship_date: Mapped[Optional[date]] = mapped_column(Date)
    customer_code: Mapped[Optional[str]] = mapped_column(String(20))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )
