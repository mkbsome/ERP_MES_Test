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
    """설비 마스터 (mes_equipment_master)"""
    __tablename__ = "mes_equipment_master"
    __table_args__ = (
        CheckConstraint(
            """equipment_type IN (
                'loader', 'unloader', 'printer', 'spi', 'mounter', 'reflow', 'aoi', 'xray',
                'wave', 'selective', 'dispenser', 'insertion', 'inspection', 'test',
                'conveyor', 'robot', 'laser', 'coating', 'other'
            )""",
            name="ck_mes_equipment_type"
        ),
        CheckConstraint(
            "status IN ('active', 'inactive', 'maintenance', 'retired')",
            name="ck_mes_equipment_status"
        ),
        Index("idx_mes_equipment_line", "tenant_id", "line_code", "position_in_line"),
        Index("idx_mes_equipment_type", "equipment_type"),
        {"extend_existing": True},
    )

    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    equipment_name: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(30), nullable=False)
    equipment_category: Mapped[Optional[str]] = mapped_column(String(30))  # SMT, THT, Assembly, Test

    # Line position
    line_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    position_in_line: Mapped[Optional[int]] = mapped_column(Integer)

    # Specs
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100))
    model: Mapped[Optional[str]] = mapped_column(String(100))
    serial_no: Mapped[Optional[str]] = mapped_column(String(50))
    firmware_version: Mapped[Optional[str]] = mapped_column(String(30))

    # Installation
    install_date: Mapped[Optional[date]] = mapped_column(Date)
    warranty_end_date: Mapped[Optional[date]] = mapped_column(Date)

    # Capacity
    standard_cycle_time_sec: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    max_capacity_per_hour: Mapped[Optional[int]] = mapped_column(Integer)

    # Communication
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    port: Mapped[Optional[int]] = mapped_column(Integer)
    communication_protocol: Mapped[Optional[str]] = mapped_column(String(30))
    plc_address: Mapped[Optional[str]] = mapped_column(String(100))

    # Maintenance
    last_pm_date: Mapped[Optional[date]] = mapped_column(Date)
    next_pm_date: Mapped[Optional[date]] = mapped_column(Date)
    pm_interval_days: Mapped[int] = mapped_column(Integer, default=30)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="active")

    # Attributes
    attributes: Mapped[Optional[dict]] = mapped_column(JSONB)


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
    """비가동 이벤트 (mes_downtime_event)"""
    __tablename__ = "mes_downtime_event"
    __table_args__ = (
        CheckConstraint(
            """downtime_category IN (
                'breakdown', 'planned_maintenance', 'unplanned_maintenance',
                'setup', 'changeover', 'material_shortage', 'quality_issue',
                'operator_absence', 'waiting', 'other'
            )""",
            name="ck_mes_downtime_category"
        ),
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'closed')",
            name="ck_mes_downtime_status"
        ),
        Index("idx_mes_downtime_equipment", "tenant_id", "equipment_code", "start_time"),
        Index("idx_mes_downtime_category", "downtime_category", "downtime_code"),
        {"extend_existing": True},
    )

    event_no: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    equipment_code: Mapped[str] = mapped_column(String(30), nullable=False)
    line_code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Classification
    downtime_category: Mapped[str] = mapped_column(String(30), nullable=False)
    downtime_code: Mapped[str] = mapped_column(String(20), nullable=False)
    downtime_reason: Mapped[Optional[str]] = mapped_column(Text)

    # Alarm
    alarm_code: Mapped[Optional[str]] = mapped_column(String(30))
    alarm_message: Mapped[Optional[str]] = mapped_column(Text)

    # Production context
    production_order_no: Mapped[Optional[str]] = mapped_column(String(20))
    product_code: Mapped[Optional[str]] = mapped_column(String(30))
    operator_code: Mapped[Optional[str]] = mapped_column(String(20))

    # Resolution
    root_cause: Mapped[Optional[str]] = mapped_column(Text)
    corrective_action: Mapped[Optional[str]] = mapped_column(Text)
    maintenance_ticket_no: Mapped[Optional[str]] = mapped_column(String(20))

    # Impact
    impact_qty: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3))
    impact_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="open")
    resolved_by: Mapped[Optional[str]] = mapped_column(String(20))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    notes: Mapped[Optional[str]] = mapped_column(Text)
    reported_by: Mapped[Optional[str]] = mapped_column(String(20))

    @property
    def duration_min(self) -> Optional[float]:
        """Calculate duration in minutes"""
        if self.end_time and self.start_time:
            return (self.end_time - self.start_time).total_seconds() / 60.0
        return None
