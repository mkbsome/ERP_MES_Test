"""
MES Material Management Models
"""
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey,
    Numeric, Text, Boolean, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from ..base import BaseModel, TimestampMixin


class FeederSetup(BaseModel, TimestampMixin):
    """피더 셋업 정보"""
    __tablename__ = 'mes_feeder_setup'

    setup_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    equipment_id = Column(UUID(as_uuid=True), ForeignKey('mes_equipment_master.equipment_id'))
    line_code = Column(String(20), nullable=False)
    feeder_slot = Column(String(20), nullable=False)
    feeder_type = Column(String(50))  # tape_8mm, tape_12mm, tray, stick

    material_code = Column(String(50))
    material_name = Column(String(200))
    reel_id = Column(String(50))
    lot_no = Column(String(50))

    initial_qty = Column(Integer, default=0)
    remaining_qty = Column(Integer, default=0)

    setup_time = Column(DateTime)
    setup_by = Column(String(100))

    status = Column(String(20), default='active')  # active, empty, error

    __table_args__ = (
        CheckConstraint("status IN ('active', 'empty', 'error', 'standby')"),
    )


class MaterialConsumption(BaseModel, TimestampMixin):
    """자재 소비 이력"""
    __tablename__ = 'mes_material_consumption'

    consumption_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    order_id = Column(UUID(as_uuid=True), ForeignKey('mes_production_order.order_id'))
    line_code = Column(String(20), nullable=False)
    equipment_code = Column(String(30))

    material_code = Column(String(50), nullable=False)
    material_name = Column(String(200))
    lot_no = Column(String(50))
    reel_id = Column(String(50))

    consumption_qty = Column(Numeric(15, 3), default=0)
    unit = Column(String(10), default='EA')

    consumption_type = Column(String(20), default='normal')  # normal, loss, scrap
    consumption_time = Column(DateTime, default=datetime.utcnow)

    product_code = Column(String(50))
    result_lot_no = Column(String(50))  # 생산 LOT

    __table_args__ = (
        CheckConstraint("consumption_type IN ('normal', 'loss', 'scrap', 'rework')"),
    )


class MaterialRequest(BaseModel, TimestampMixin):
    """자재 요청"""
    __tablename__ = 'mes_material_request'

    request_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    request_no = Column(String(30), unique=True)
    request_type = Column(String(20), default='replenish')  # replenish, return, transfer

    line_code = Column(String(20), nullable=False)
    equipment_code = Column(String(30))
    feeder_slot = Column(String(20))

    material_code = Column(String(50), nullable=False)
    material_name = Column(String(200))
    requested_qty = Column(Numeric(15, 3), default=0)
    unit = Column(String(10), default='EA')

    urgency = Column(String(10), default='normal')  # normal, urgent, critical
    status = Column(String(20), default='requested')  # requested, approved, in_transit, delivered, cancelled

    requested_by = Column(String(100))
    requested_at = Column(DateTime, default=datetime.utcnow)

    approved_by = Column(String(100))
    approved_at = Column(DateTime)

    delivered_by = Column(String(100))
    delivered_at = Column(DateTime)
    delivered_qty = Column(Numeric(15, 3))

    remarks = Column(Text)

    __table_args__ = (
        CheckConstraint("request_type IN ('replenish', 'return', 'transfer')"),
        CheckConstraint("urgency IN ('normal', 'urgent', 'critical')"),
        CheckConstraint("status IN ('requested', 'approved', 'in_transit', 'delivered', 'cancelled')"),
    )


class MaterialInventory(BaseModel, TimestampMixin):
    """라인 자재 재고 (WIP)"""
    __tablename__ = 'mes_material_inventory'

    inventory_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)

    location_type = Column(String(20), default='line')  # line, buffer, supermarket
    location_code = Column(String(30), nullable=False)

    material_code = Column(String(50), nullable=False)
    material_name = Column(String(200))
    lot_no = Column(String(50))

    qty_on_hand = Column(Numeric(15, 3), default=0)
    qty_allocated = Column(Numeric(15, 3), default=0)
    qty_available = Column(Numeric(15, 3), default=0)
    unit = Column(String(10), default='EA')

    min_qty = Column(Numeric(15, 3), default=0)  # 최소 재고 수량
    max_qty = Column(Numeric(15, 3), default=0)  # 최대 재고 수량

    last_count_date = Column(DateTime)
    last_count_qty = Column(Numeric(15, 3))

    __table_args__ = (
        CheckConstraint("location_type IN ('line', 'buffer', 'supermarket', 'wip')"),
    )
