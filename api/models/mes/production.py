"""
MES Production models
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Numeric, Text, DateTime, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

from api.models.base import BaseModel, TimestampMixin


class ProductionOrder(BaseModel, TimestampMixin):
    """MES 생산지시 (mes_production_order)"""
    __tablename__ = "mes_production_order"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'released', 'started', 'paused', 'completed', 'closed', 'cancelled')",
            name="ck_mes_prod_order_status"
        ),
        CheckConstraint("priority BETWEEN 1 AND 10", name="ck_mes_prod_order_priority"),
        Index("idx_mes_prod_order_tenant", "tenant_id", "planned_start"),
        Index("idx_mes_prod_order_line", "line_code", "status"),
        {"extend_existing": True},
    )

    production_order_no: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    erp_work_order_no: Mapped[Optional[str]] = mapped_column(String(20))

    # Product
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)
    product_name: Mapped[Optional[str]] = mapped_column(String(200))
    product_rev: Mapped[Optional[str]] = mapped_column(String(10))

    # Line
    line_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # Quantities
    target_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    unit: Mapped[str] = mapped_column(String(10), default="PNL")
    started_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    produced_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    good_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    defect_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    scrap_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)

    # Timing
    planned_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    planned_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="planned")
    current_operation: Mapped[Optional[int]] = mapped_column(Integer)
    priority: Mapped[int] = mapped_column(Integer, default=5)

    # References
    bom_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    routing_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    lot_no: Mapped[Optional[str]] = mapped_column(String(50))
    customer_code: Mapped[Optional[str]] = mapped_column(String(20))
    sales_order_no: Mapped[Optional[str]] = mapped_column(String(20))

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(20))


class ProductionResult(BaseModel):
    """MES 생산실적 (mes_production_result)"""
    __tablename__ = "mes_production_result"
    __table_args__ = (
        CheckConstraint(
            "result_type IN ('normal', 'rework', 'test', 'trial', 'sample')",
            name="ck_mes_prod_result_type"
        ),
        Index("idx_mes_prod_result_order", "production_order_no", "operation_no"),
        Index("idx_mes_prod_result_line", "tenant_id", "line_code", "result_timestamp"),
        {"extend_existing": True},
    )

    production_order_no: Mapped[str] = mapped_column(String(20), nullable=False)
    result_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    shift_code: Mapped[str] = mapped_column(String(10), nullable=False)

    # Location
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)
    equipment_code: Mapped[Optional[str]] = mapped_column(String(30))

    # Operation
    operation_no: Mapped[int] = mapped_column(Integer, nullable=False)
    operation_name: Mapped[Optional[str]] = mapped_column(String(100))

    # Product
    product_code: Mapped[str] = mapped_column(String(30), nullable=False)
    lot_no: Mapped[Optional[str]] = mapped_column(String(50))

    # Quantities
    input_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    output_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    good_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    defect_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    rework_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    scrap_qty: Mapped[Decimal] = mapped_column(Numeric(12, 3), default=0)
    unit: Mapped[str] = mapped_column(String(10), default="PNL")

    # Times
    cycle_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    takt_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    setup_time_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    run_time_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    idle_time_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    # Resources
    operator_code: Mapped[Optional[str]] = mapped_column(String(20))
    operator_name: Mapped[Optional[str]] = mapped_column(String(100))
    result_type: Mapped[str] = mapped_column(String(20), default="normal")

    notes: Mapped[Optional[str]] = mapped_column(Text)
    reported_by: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )

    @property
    def yield_rate(self) -> float:
        """Calculate yield rate"""
        if self.input_qty and self.input_qty > 0:
            return float(self.good_qty / self.input_qty)
        return 0.0

    @property
    def defect_rate(self) -> float:
        """Calculate defect rate"""
        if self.output_qty and self.output_qty > 0:
            return float(self.defect_qty / self.output_qty)
        return 0.0


class RealtimeProduction(BaseModel):
    """MES 실시간 생산현황 (mes_realtime_production)"""
    __tablename__ = "mes_realtime_production"
    __table_args__ = (
        CheckConstraint(
            "equipment_status IN ('running', 'idle', 'setup', 'alarm', 'maintenance', 'offline', 'waiting')",
            name="ck_mes_rt_prod_status"
        ),
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )
