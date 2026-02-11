"""
MES Production models
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Numeric, Text, DateTime, Date, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from api.models.base import BaseModel


class ProductionOrder(BaseModel):
    """MES 생산지시 (mes_production_order)"""
    __tablename__ = "mes_production_order"
    __table_args__ = (
        Index("idx_mes_prod_order_tenant", "tenant_id", "planned_start"),
        Index("idx_mes_prod_order_line", "line_code", "status"),
        {"extend_existing": True},
    )

    production_order_no: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    erp_work_order_no: Mapped[Optional[str]] = mapped_column(String(20))
    order_date: Mapped[datetime] = mapped_column(Date, nullable=False)

    # Product
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)
    product_name: Mapped[Optional[str]] = mapped_column(String(200))

    # Line
    line_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)

    # Quantities
    target_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    produced_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)
    good_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)
    defect_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)
    scrap_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)

    # References
    bom_id: Mapped[Optional[int]] = mapped_column(Integer)
    routing_id: Mapped[Optional[int]] = mapped_column(Integer)

    # Timing
    planned_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    planned_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Status
    status: Mapped[Optional[str]] = mapped_column(String(20), default="planned")
    priority: Mapped[Optional[int]] = mapped_column(Integer, default=5)
    completion_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))

    # Timestamps
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class ProductionResult(BaseModel):
    """MES 생산실적 (mes_production_result)"""
    __tablename__ = "mes_production_result"
    __table_args__ = (
        Index("idx_mes_prod_result_order", "production_order_no", "operation_seq"),
        Index("idx_mes_prod_result_line", "tenant_id", "line_code", "result_timestamp"),
        {"extend_existing": True},
    )

    production_order_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    production_order_no: Mapped[Optional[str]] = mapped_column(String(20))
    result_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Operation
    operation_seq: Mapped[Optional[int]] = mapped_column(Integer)

    # Location
    line_code: Mapped[Optional[str]] = mapped_column(String(20))
    equipment_code: Mapped[Optional[str]] = mapped_column(String(30))

    # Product
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)
    lot_no: Mapped[Optional[str]] = mapped_column(String(50))

    # Quantities
    input_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    output_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    good_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    defect_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)
    scrap_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), default=0)

    # Performance
    cycle_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    yield_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    defect_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))

    # Resources
    worker_id: Mapped[Optional[str]] = mapped_column(String(20))
    shift: Mapped[Optional[str]] = mapped_column(String(10))

    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class RealtimeProduction(BaseModel):
    """MES 실시간 생산현황 (mes_realtime_production)"""
    __tablename__ = "mes_realtime_production"
    __table_args__ = (
        Index("idx_mes_rt_prod_line", "tenant_id", "line_code", "timestamp"),
        Index("idx_mes_rt_prod_equipment", "equipment_code", "timestamp"),
        {"extend_existing": True},
    )

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)
    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False)

    # Production
    production_order_no: Mapped[Optional[str]] = mapped_column(String(20))
    product_code: Mapped[Optional[str]] = mapped_column(String(30))
    current_operation: Mapped[Optional[str]] = mapped_column(String(50))

    # Counts
    takt_count: Mapped[int] = mapped_column(Integer, default=0)
    good_count: Mapped[int] = mapped_column(Integer, default=0)
    defect_count: Mapped[int] = mapped_column(Integer, default=0)

    # Performance
    cycle_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    target_cycle_time_ms: Mapped[Optional[int]] = mapped_column(Integer)

    # Equipment
    equipment_status: Mapped[Optional[str]] = mapped_column(String(20))
    speed_rpm: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    temperature_celsius: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    pressure_bar: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))

    operator_code: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
