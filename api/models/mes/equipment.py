"""
MES Equipment models
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Numeric, Text, DateTime, Date, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

from api.models.base import BaseModel, TimestampMixin


class ProductionLine(BaseModel, TimestampMixin):
    """생산라인 마스터 (mes_production_line)"""
    __tablename__ = "mes_production_line"
    __table_args__ = (
        Index("idx_mes_production_line_tenant", "tenant_id"),
        {"extend_existing": True},
    )

    line_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    line_name: Mapped[str] = mapped_column(String(100), nullable=False)
    line_type: Mapped[str] = mapped_column(String(20), nullable=False)  # smt_high_speed, smt_mid_speed, etc.
    factory_code: Mapped[str] = mapped_column(String(20), default="PLANT1")
    department_code: Mapped[Optional[str]] = mapped_column(String(20))
    capacity_per_shift: Mapped[Optional[int]] = mapped_column(Integer)
    operators_required: Mapped[int] = mapped_column(Integer, default=2)
    status: Mapped[str] = mapped_column(String(20), default="active")


class EquipmentMaster(BaseModel, TimestampMixin):
    """설비 마스터 (mes_equipment) - 실제 DB 스키마 기반"""
    __tablename__ = "mes_equipment"
    __table_args__ = {"extend_existing": True}

    equipment_code: Mapped[str] = mapped_column(String(50), nullable=False)
    equipment_name: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    line_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    line_code: Mapped[Optional[str]] = mapped_column(String(20))
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100))
    model: Mapped[Optional[str]] = mapped_column(String(100))
    serial_no: Mapped[Optional[str]] = mapped_column(String(50))
    install_date: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(default=True)


class EquipmentStatus(BaseModel):
    """설비 상태 (mes_equipment_status)"""
    __tablename__ = "mes_equipment_status"
    __table_args__ = (
        CheckConstraint(
            "status IN ('running', 'idle', 'setup', 'alarm', 'breakdown', 'maintenance', 'offline', 'waiting')",
            name="ck_mes_equip_status"
        ),
        CheckConstraint(
            "alarm_severity IS NULL OR alarm_severity IN ('info', 'warning', 'error', 'critical', 'fatal')",
            name="ck_mes_equip_alarm_severity"
        ),
        Index("idx_mes_equip_status_equip", "tenant_id", "equipment_code", "status_timestamp"),
        Index("idx_mes_equip_status_status", "status", "status_timestamp"),
        {"extend_existing": True},
    )

    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False)
    status_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Status
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    previous_status: Mapped[Optional[str]] = mapped_column(String(20))
    status_reason: Mapped[Optional[str]] = mapped_column(String(100))

    # Alarm
    alarm_code: Mapped[Optional[str]] = mapped_column(String(30))
    alarm_message: Mapped[Optional[str]] = mapped_column(Text)
    alarm_severity: Mapped[Optional[str]] = mapped_column(String(20))

    # Production context
    production_order_no: Mapped[Optional[str]] = mapped_column(String(20))
    product_code: Mapped[Optional[str]] = mapped_column(String(30))
    operator_code: Mapped[Optional[str]] = mapped_column(String(20))

    # Performance
    speed_actual: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    speed_target: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 2))
    temperature_actual: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))
    temperature_target: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2))

    # Counters/Parameters
    counters: Mapped[Optional[dict]] = mapped_column(JSONB)
    parameters: Mapped[Optional[dict]] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )


class EquipmentOEE(BaseModel):
    """설비 OEE (mes_equipment_oee)"""
    __tablename__ = "mes_equipment_oee"
    __table_args__ = (
        Index("idx_mes_oee_date", "tenant_id", "calculation_date"),
        Index("idx_mes_oee_equipment", "equipment_code", "calculation_date"),
        Index("idx_mes_oee_line", "line_code", "calculation_date"),
        {"extend_existing": True},
    )

    calculation_date: Mapped[date] = mapped_column(Date, nullable=False)
    shift_code: Mapped[Optional[str]] = mapped_column(String(10))
    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False)
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Time metrics (minutes)
    planned_time_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    actual_run_time_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    downtime_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    setup_time_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    idle_time_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)

    # Cycle time
    ideal_cycle_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    actual_cycle_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    # Counts
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    good_count: Mapped[int] = mapped_column(Integer, default=0)
    defect_count: Mapped[int] = mapped_column(Integer, default=0)

    # OEE (stored, not generated)
    oee: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 4))

    # Breakdown details
    downtime_breakdown: Mapped[Optional[dict]] = mapped_column(JSONB)
    defect_breakdown: Mapped[Optional[dict]] = mapped_column(JSONB)

    calculated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
    )

    @property
    def availability(self) -> float:
        """Calculate availability"""
        if self.planned_time_min and self.planned_time_min > 0:
            return float(self.actual_run_time_min / self.planned_time_min)
        return 0.0

    @property
    def performance(self) -> float:
        """Calculate performance"""
        if (self.actual_run_time_min and self.actual_run_time_min > 0
            and self.ideal_cycle_time_sec and self.ideal_cycle_time_sec > 0):
            return float(
                (self.total_count * self.ideal_cycle_time_sec / 60.0) / self.actual_run_time_min
            )
        return 0.0

    @property
    def quality(self) -> float:
        """Calculate quality"""
        if self.total_count and self.total_count > 0:
            return float(self.good_count / self.total_count)
        return 0.0

    @property
    def calculated_oee(self) -> float:
        """Calculate OEE from A × P × Q"""
        return self.availability * self.performance * self.quality


class DowntimeEvent(BaseModel, TimestampMixin):
    """비가동 이벤트 (mes_downtime_event) - 실제 DB 스키마 기반"""
    __tablename__ = "mes_downtime_event"
    __table_args__ = {"extend_existing": True}

    equipment_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    equipment_code: Mapped[Optional[str]] = mapped_column(String(50))
    line_code: Mapped[Optional[str]] = mapped_column(String(50))

    # Timing
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    # Classification
    downtime_type: Mapped[Optional[str]] = mapped_column(String(50))
    downtime_code: Mapped[Optional[str]] = mapped_column(String(50))
    downtime_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Resolution
    root_cause: Mapped[Optional[str]] = mapped_column(Text)
    corrective_action: Mapped[Optional[str]] = mapped_column(Text)

    # Context
    production_order_no: Mapped[Optional[str]] = mapped_column(String(50))
    reported_by: Mapped[Optional[str]] = mapped_column(String(50))
    resolved_by: Mapped[Optional[str]] = mapped_column(String(50))
