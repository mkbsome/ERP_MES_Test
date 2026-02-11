"""
Scenario Modifier API
Modifies existing data to inject anomalies for AI detection testing.

Unlike the original approach that INSERT new records,
this module UPDATES existing records to create anomalies within normal data patterns.

Modification Modes:
1. last_n_days: Modify data from last N days
2. date_range: Modify data within specific date range
3. realtime_stream: Inject anomalies into real-time data stream
"""
import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from enum import Enum

from api.database import get_db

router = APIRouter(prefix="/scenario-modifier", tags=["Scenario Modifier"])

TENANT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"


# ============ Enums & Models ============

class ModificationMode(str, Enum):
    LAST_N_DAYS = "last_n_days"
    DATE_RANGE = "date_range"
    REALTIME_STREAM = "realtime_stream"


class AnomalyType(str, Enum):
    # ============ Quality Anomalies (품질) ============
    DEFECT_SPIKE = "defect_spike"                    # 불량률 급증
    YIELD_DEGRADATION = "yield_degradation"          # 수율 점진적 저하
    QUALITY_HOLD = "quality_hold"                    # 품질 홀드 (LOT 출하 제한)
    SPC_VIOLATION = "spc_violation"                  # SPC 관리한계 이탈

    # ============ Equipment Anomalies (설비) ============
    OEE_DROP = "oee_drop"                            # OEE 저하
    EQUIPMENT_BREAKDOWN = "equipment_breakdown"      # 설비 고장/비가동
    CYCLE_TIME_INCREASE = "cycle_time_increase"      # 사이클 타임 증가
    DOWNTIME_SPIKE = "downtime_spike"                # 다운타임 급증
    MAINTENANCE_OVERDUE = "maintenance_overdue"      # 예방보전 지연

    # ============ Production Anomalies (생산) ============
    PRODUCTION_DELAY = "production_delay"            # 생산 지연
    UNDERPRODUCTION = "underproduction"              # 과소 생산
    SCHEDULE_DEVIATION = "schedule_deviation"        # 일정 이탈
    BOTTLENECK = "bottleneck"                        # 공정 병목
    SHIFT_VARIANCE = "shift_variance"                # 교대별 성능 편차

    # ============ Material Anomalies (자재) ============
    MATERIAL_SHORTAGE = "material_shortage"          # 자재 부족
    INCOMING_REJECT = "incoming_reject"              # 수입검사 불합격
    LOT_CONTAMINATION = "lot_contamination"          # LOT 오염

    # ============ Business Anomalies (영업/구매) ============
    DELIVERY_DELAY = "delivery_delay"                # 납품 지연
    ORDER_CANCELLATION = "order_cancellation"        # 주문 취소
    SUPPLIER_DELAY = "supplier_delay"                # 공급업체 납기 지연
    DEMAND_SPIKE = "demand_spike"                    # 수요 급증

    # ============ HR Anomalies (인사) ============
    MASS_ABSENCE = "mass_absence"                    # 대량 결근
    OVERTIME_SPIKE = "overtime_spike"                # 초과근무 급증


class ScenarioModifyRequest(BaseModel):
    """Request to modify existing data with anomaly"""
    anomaly_type: AnomalyType
    modification_mode: ModificationMode
    # For last_n_days mode
    days: Optional[int] = Field(default=1, ge=1, le=30)
    # For date_range mode
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    # Common parameters
    intensity: float = Field(default=0.5, ge=0.1, le=1.0, description="Anomaly intensity (0.1=mild, 1.0=severe)")
    target_line: Optional[str] = None
    target_product: Optional[str] = None
    target_equipment: Optional[str] = None
    # Additional options
    preserve_original: bool = Field(default=True, description="Keep original values in a backup field")


class ScenarioModifyResponse(BaseModel):
    """Response from scenario modification"""
    success: bool
    anomaly_type: str
    modification_mode: str
    records_modified: int
    date_range: Dict[str, str]
    details: Dict[str, Any]
    revert_command: Optional[str] = None


class ModificationHistory(BaseModel):
    """Track modification history for revert capability"""
    id: str
    timestamp: datetime
    anomaly_type: str
    modification_mode: str
    records_modified: int
    original_values: Dict[str, Any]
    can_revert: bool


# ============ In-Memory Storage for Revert ============

_modification_history: Dict[str, ModificationHistory] = {}


# ============ Anomaly Modifiers ============

async def modify_defect_spike(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modify production results to show defect spike.
    Increases defect_qty and decreases good_qty in existing records.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    # Build WHERE clause
    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
        AND good_qty > 0
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    # Get records to modify
    result = await db.execute(text(f"""
        SELECT id, good_qty, defect_qty, output_qty, yield_rate, defect_rate
        FROM mes_production_result
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0
    defect_increase_total = 0
    defect_increase_rate = 0.1 + (intensity * 0.2)  # Initialize before loop

    for record in records:
        record_id, good_qty, defect_qty, output_qty, yield_rate, defect_rate = record

        # Store original values for potential revert
        original_values.append({
            'id': str(record_id),
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty),
            'yield_rate': float(yield_rate) if yield_rate else 0,
            'defect_rate': float(defect_rate) if defect_rate else 0
        })

        # Calculate new defect values based on intensity
        # intensity 0.5 = 15% additional defects, intensity 1.0 = 30% additional defects
        defect_increase = int(float(good_qty) * defect_increase_rate)

        new_defect_qty = float(defect_qty) + defect_increase
        new_good_qty = max(0, float(good_qty) - defect_increase)
        new_yield_rate = (new_good_qty / float(output_qty) * 100) if output_qty > 0 else 0
        new_defect_rate = (new_defect_qty / float(output_qty) * 100) if output_qty > 0 else 0

        # Update record
        await db.execute(text("""
            UPDATE mes_production_result
            SET good_qty = :good_qty,
                defect_qty = :defect_qty,
                yield_rate = :yield_rate,
                defect_rate = :defect_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'good_qty': new_good_qty,
            'defect_qty': new_defect_qty,
            'yield_rate': new_yield_rate,
            'defect_rate': new_defect_rate
        })

        modified_count += 1
        defect_increase_total += defect_increase

    await db.commit()

    # Store for revert
    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="defect_spike",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'total_defects_added': defect_increase_total,
        'average_defect_increase_rate': defect_increase_rate * 100
    }


async def modify_oee_drop(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modify production data to simulate OEE drop.
    - Increases cycle time (reduces throughput)
    - Slightly increases defects
    - May reduce output quantity
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, cycle_time_sec, output_qty, good_qty, defect_qty, yield_rate
        FROM mes_production_result
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, cycle_time, output_qty, good_qty, defect_qty, yield_rate = record

        original_values.append({
            'id': str(record_id),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0,
            'output_qty': float(output_qty),
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty)
        })

        # OEE degradation effects
        cycle_time_increase = 1.0 + (intensity * 0.3)  # Up to 30% slower
        output_reduction = 1.0 - (intensity * 0.15)  # Up to 15% less output

        new_cycle_time = float(cycle_time or 60) * cycle_time_increase
        new_output = max(1, int(float(output_qty) * output_reduction))
        defect_increase = int(float(good_qty) * intensity * 0.05)
        new_good = max(0, float(good_qty) - defect_increase)
        new_defect = float(defect_qty) + defect_increase

        await db.execute(text("""
            UPDATE mes_production_result
            SET cycle_time_sec = :cycle_time,
                output_qty = :output_qty,
                good_qty = :good_qty,
                defect_qty = :defect_qty,
                yield_rate = :yield_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'cycle_time': new_cycle_time,
            'output_qty': new_output,
            'good_qty': new_good,
            'defect_qty': new_defect,
            'yield_rate': (new_good / new_output * 100) if new_output > 0 else 0
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="oee_drop",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'cycle_time_increase': f"{(cycle_time_increase - 1) * 100:.1f}%",
        'output_reduction': f"{(1 - output_reduction) * 100:.1f}%"
    }


async def modify_production_delay(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modify production orders to show delays.
    - Extends planned end dates
    - Reduces completion rates
    - Changes status to show delays
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
        AND status IN ('planned', 'started')
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, planned_end, completion_rate, target_qty, produced_qty
        FROM mes_production_order
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, planned_end, completion_rate, target_qty, produced_qty = record

        original_values.append({
            'id': str(record_id),
            'planned_end': str(planned_end) if planned_end else None,
            'completion_rate': float(completion_rate) if completion_rate else 0,
            'produced_qty': float(produced_qty) if produced_qty else 0
        })

        # Delay effects
        delay_days = int(1 + intensity * 5)  # 1-6 days delay
        new_planned_end = (planned_end + timedelta(days=delay_days)) if planned_end else None

        # Reduce completion rate to show underperformance
        completion_reduction = 0.2 + (intensity * 0.3)  # 20-50% reduction
        new_completion = max(0, float(completion_rate or 0) - (completion_reduction * 100))

        # Reduce produced quantity
        production_reduction = intensity * 0.25  # Up to 25% less produced
        new_produced = max(0, float(produced_qty or 0) * (1 - production_reduction))

        await db.execute(text("""
            UPDATE mes_production_order
            SET planned_end = :planned_end,
                completion_rate = :completion_rate,
                produced_qty = :produced_qty,
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'planned_end': new_planned_end,
            'completion_rate': new_completion,
            'produced_qty': new_produced
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="production_delay",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_delay_days': delay_days,
        'completion_rate_reduction': f"{completion_reduction * 100:.0f}%"
    }


async def modify_delivery_delay(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_product: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modify sales orders to show delivery delays.
    - Extends delivery dates
    - Changes status to show delays
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
        AND status NOT IN ('shipped', 'cancelled', 'closed')
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    result = await db.execute(text(f"""
        SELECT id, order_no, delivery_date, status
        FROM erp_sales_order
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, order_no, delivery_date, status = record

        original_values.append({
            'id': record_id,
            'order_no': order_no,
            'delivery_date': str(delivery_date),
            'status': status
        })

        # Delay delivery date
        delay_days = int(3 + intensity * 14)  # 3-17 days delay
        new_delivery_date = delivery_date + timedelta(days=delay_days) if delivery_date else None

        await db.execute(text("""
            UPDATE erp_sales_order
            SET delivery_date = :delivery_date,
                remark = COALESCE(remark, '') || ' [DELAYED]',
                updated_at = NOW()
            WHERE id = :id
        """), {
            'id': record_id,
            'delivery_date': new_delivery_date
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="delivery_delay",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_delay_days': delay_days
    }


async def modify_yield_degradation(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gradual yield degradation over time.
    Unlike defect_spike which is sudden, this shows gradual decline.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, result_timestamp, good_qty, defect_qty, output_qty, yield_rate
        FROM mes_production_result
        {where_clause}
        ORDER BY result_timestamp
    """), params)
    records = result.fetchall()

    total_days = (end_date - start_date).days + 1
    modified_count = 0

    for i, record in enumerate(records):
        record_id, timestamp, good_qty, defect_qty, output_qty, yield_rate = record

        original_values.append({
            'id': str(record_id),
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty),
            'yield_rate': float(yield_rate) if yield_rate else 0
        })

        # Progressive degradation - gets worse over time
        day_index = (timestamp.date() - start_date).days if isinstance(timestamp, datetime) else i
        progress = day_index / total_days if total_days > 0 else 1

        # Degradation increases over time
        degradation_factor = progress * intensity * 0.15  # Up to 15% degradation at peak intensity

        defect_increase = int(float(good_qty) * degradation_factor)
        new_good = max(0, float(good_qty) - defect_increase)
        new_defect = float(defect_qty) + defect_increase
        new_yield = (new_good / float(output_qty) * 100) if output_qty > 0 else 0

        await db.execute(text("""
            UPDATE mes_production_result
            SET good_qty = :good_qty,
                defect_qty = :defect_qty,
                yield_rate = :yield_rate,
                defect_rate = :defect_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'good_qty': new_good,
            'defect_qty': new_defect,
            'yield_rate': new_yield,
            'defect_rate': (new_defect / float(output_qty) * 100) if output_qty > 0 else 0
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="yield_degradation",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'degradation_pattern': 'progressive',
        'max_degradation': f"{intensity * 15:.1f}%"
    }


async def modify_equipment_breakdown(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None,
    target_equipment: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate equipment breakdown by creating downtime events
    and reducing production output for affected equipment.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    # Get equipment list
    where_clause = "WHERE tenant_id = CAST(:tenant_id AS uuid) AND is_active = true"
    params = {'tenant_id': TENANT_ID}

    if target_equipment:
        where_clause += " AND equipment_code = :equipment_code"
        params['equipment_code'] = target_equipment
    elif target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, equipment_code, line_code, equipment_name
        FROM mes_equipment
        {where_clause}
        LIMIT :limit
    """), {**params, 'limit': int(3 + intensity * 7)})  # 3-10 equipment affected
    equipment_list = result.fetchall()

    modified_count = 0
    downtime_created = 0

    for eq in equipment_list:
        eq_id, eq_code, line_code, eq_name = eq

        original_values.append({
            'equipment_id': str(eq_id),
            'equipment_code': eq_code,
            'was_active': True
        })

        # Create downtime event
        downtime_hours = 2 + (intensity * 10)  # 2-12 hours downtime
        downtime_id = str(uuid.uuid4())

        await db.execute(text("""
            INSERT INTO mes_downtime_event (
                id, tenant_id, equipment_id, equipment_code, line_code,
                start_time, duration_min, downtime_type, downtime_code,
                downtime_reason, reported_by, created_at
            ) VALUES (
                CAST(:id AS uuid), CAST(:tenant_id AS uuid), CAST(:eq_id AS uuid), :eq_code, :line_code,
                :start_time, :duration_min, 'breakdown', :downtime_code,
                :reason, 'SCENARIO_MODIFIER', NOW()
            )
        """), {
            'id': downtime_id,
            'tenant_id': TENANT_ID,
            'eq_id': str(eq_id),
            'eq_code': eq_code,
            'line_code': line_code,
            'start_time': datetime.combine(start_date + timedelta(days=random.randint(0, (end_date - start_date).days)),
                                           datetime.min.time()) + timedelta(hours=random.randint(6, 18)),
            'duration_min': int(downtime_hours * 60),
            'downtime_code': random.choice(['MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'SENSOR']),
            'reason': f'Simulated breakdown - {eq_name}'
        })

        downtime_created += 1
        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="equipment_breakdown",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values, 'downtime_ids': []},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'downtime_events_created': downtime_created,
        'average_downtime_hours': 2 + (intensity * 10)
    }


async def modify_material_shortage(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate material shortage by reducing production output
    and marking some production orders as material-blocked.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
        AND status IN ('planned', 'started')
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    # Affect a percentage of production orders
    result = await db.execute(text(f"""
        SELECT id, target_qty, produced_qty, status
        FROM mes_production_order
        {where_clause}
        ORDER BY RANDOM()
        LIMIT :limit
    """), {**params, 'limit': int(10 + intensity * 40)})  # 10-50 orders affected
    orders = result.fetchall()

    modified_count = 0

    for order in orders:
        order_id, target_qty, produced_qty, status = order

        original_values.append({
            'id': str(order_id),
            'target_qty': float(target_qty) if target_qty else 0,
            'produced_qty': float(produced_qty) if produced_qty else 0,
            'status': status
        })

        # Reduce target quantity due to material shortage
        reduction = 0.3 + (intensity * 0.5)  # 30-80% reduction
        new_target = max(10, int(float(target_qty or 100) * (1 - reduction)))

        await db.execute(text("""
            UPDATE mes_production_order
            SET target_qty = :target_qty,
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(order_id),
            'target_qty': new_target
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="material_shortage",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_reduction': f"{(0.3 + intensity * 0.5) * 100:.0f}%"
    }


async def modify_supplier_delay(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Modify purchase orders to show supplier delivery delays.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    result = await db.execute(text("""
        SELECT id, po_no, expected_date, status
        FROM erp_purchase_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND po_date BETWEEN :start_date AND :end_date
        AND status IN ('confirmed', 'pending')
    """), {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    })
    orders = result.fetchall()

    modified_count = 0

    for order in orders:
        order_id, po_no, expected_date, status = order

        original_values.append({
            'id': order_id,
            'po_no': po_no,
            'expected_date': str(expected_date) if expected_date else None,
            'status': status
        })

        # Delay expected date
        delay_days = int(3 + intensity * 14)  # 3-17 days delay
        new_expected = expected_date + timedelta(days=delay_days) if expected_date else None

        await db.execute(text("""
            UPDATE erp_purchase_order
            SET expected_date = :expected_date,
                remark = COALESCE(remark, '') || ' [SUPPLIER_DELAY]',
                updated_at = NOW()
            WHERE id = :id
        """), {
            'id': order_id,
            'expected_date': new_expected
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="supplier_delay",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_delay_days': int(3 + intensity * 14)
    }


async def modify_order_cancellation(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Cancel a percentage of existing orders.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    result = await db.execute(text("""
        SELECT id, order_no, status
        FROM erp_sales_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
        AND status IN ('draft', 'confirmed', 'in_production')
        ORDER BY RANDOM()
        LIMIT :limit
    """), {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date,
        'limit': int(5 + intensity * 20)  # 5-25 orders cancelled
    })
    orders = result.fetchall()

    modified_count = 0

    for order in orders:
        order_id, order_no, status = order

        original_values.append({
            'id': order_id,
            'order_no': order_no,
            'status': status
        })

        cancel_reason = random.choice(['CUSTOMER_REQUEST', 'SPEC_CHANGE', 'PRICE_ISSUE', 'DELIVERY_ISSUE'])

        await db.execute(text("""
            UPDATE erp_sales_order
            SET status = 'cancelled',
                remark = COALESCE(remark, '') || ' [CANCELLED: ' || :reason || ']',
                updated_at = NOW()
            WHERE id = :id
        """), {
            'id': order_id,
            'reason': cancel_reason
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="order_cancellation",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'orders_cancelled': modified_count
    }


async def modify_shift_variance(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create variance in production performance across different shifts.
    Night shift typically shows worse performance.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, shift, good_qty, defect_qty, output_qty, cycle_time_sec
        FROM mes_production_result
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, shift, good_qty, defect_qty, output_qty, cycle_time = record

        original_values.append({
            'id': str(record_id),
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0
        })

        # Apply variance based on shift
        # Night shift (3) = worst, Day shift (1) = best
        shift_multiplier = 1.0
        if shift == '3' or shift == 'NIGHT':
            shift_multiplier = 1.0 + (intensity * 0.3)  # Up to 30% worse
        elif shift == '2' or shift == 'SWING':
            shift_multiplier = 1.0 + (intensity * 0.15)  # Up to 15% worse

        if shift_multiplier > 1.0:
            defect_increase = int(float(good_qty) * (shift_multiplier - 1) * 0.5)
            new_good = max(0, float(good_qty) - defect_increase)
            new_defect = float(defect_qty) + defect_increase
            new_cycle_time = float(cycle_time or 60) * shift_multiplier

            await db.execute(text("""
                UPDATE mes_production_result
                SET good_qty = :good_qty,
                    defect_qty = :defect_qty,
                    yield_rate = :yield_rate,
                    cycle_time_sec = :cycle_time
                WHERE id = CAST(:id AS uuid)
            """), {
                'id': str(record_id),
                'good_qty': new_good,
                'defect_qty': new_defect,
                'yield_rate': (new_good / float(output_qty) * 100) if output_qty > 0 else 0,
                'cycle_time': new_cycle_time
            })

            modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="shift_variance",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'variance_applied': 'Night shift performance degraded'
    }


async def modify_bottleneck(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate bottleneck at a specific operation/line.
    Increases cycle time significantly for one operation.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    # Pick a random line to be the bottleneck if not specified
    if not target_line:
        line_result = await db.execute(text("""
            SELECT DISTINCT line_code FROM mes_production_result
            WHERE tenant_id = CAST(:tenant_id AS uuid)
            AND result_timestamp::date BETWEEN :start_date AND :end_date
            ORDER BY RANDOM() LIMIT 1
        """), {'tenant_id': TENANT_ID, 'start_date': start_date, 'end_date': end_date})
        line_row = line_result.fetchone()
        target_line = line_row[0] if line_row else 'LINE-001'

    result = await db.execute(text("""
        SELECT id, cycle_time_sec, output_qty
        FROM mes_production_result
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
        AND line_code = :line_code
    """), {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date,
        'line_code': target_line
    })
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, cycle_time, output_qty = record

        original_values.append({
            'id': str(record_id),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0,
            'output_qty': float(output_qty)
        })

        # Severe cycle time increase for bottleneck
        bottleneck_factor = 1.5 + (intensity * 1.5)  # 50-200% slower
        new_cycle_time = float(cycle_time or 60) * bottleneck_factor
        output_reduction = 1.0 - (intensity * 0.4)  # Up to 40% less output
        new_output = max(1, int(float(output_qty) * output_reduction))

        await db.execute(text("""
            UPDATE mes_production_result
            SET cycle_time_sec = :cycle_time,
                output_qty = :output_qty
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'cycle_time': new_cycle_time,
            'output_qty': new_output
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="bottleneck",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'bottleneck_line': target_line,
        'cycle_time_increase': f"{(1.5 + intensity * 1.5 - 1) * 100:.0f}%"
    }


async def modify_spc_violation(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Inject SPC control limit violations by creating extreme yield variations.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, yield_rate, defect_rate, good_qty, defect_qty, output_qty
        FROM mes_production_result
        {where_clause}
        ORDER BY RANDOM()
        LIMIT :limit
    """), {**params, 'limit': int(5 + intensity * 15)})  # 5-20 violations
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, yield_rate, defect_rate, good_qty, defect_qty, output_qty = record

        original_values.append({
            'id': str(record_id),
            'yield_rate': float(yield_rate) if yield_rate else 0,
            'defect_rate': float(defect_rate) if defect_rate else 0,
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty)
        })

        # Create extreme outlier (outside 3-sigma)
        violation_type = random.choice(['high_defect', 'low_yield'])

        if violation_type == 'high_defect':
            # Dramatically increase defects
            defect_spike = int(float(good_qty) * (0.3 + intensity * 0.4))
            new_good = max(0, float(good_qty) - defect_spike)
            new_defect = float(defect_qty) + defect_spike
        else:
            # Dramatically reduce yield
            yield_drop = 0.4 + (intensity * 0.3)
            new_good = max(0, float(good_qty) * (1 - yield_drop))
            new_defect = float(output_qty) - new_good

        await db.execute(text("""
            UPDATE mes_production_result
            SET good_qty = :good_qty,
                defect_qty = :defect_qty,
                yield_rate = :yield_rate,
                defect_rate = :defect_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'good_qty': new_good,
            'defect_qty': new_defect,
            'yield_rate': (new_good / float(output_qty) * 100) if output_qty > 0 else 0,
            'defect_rate': (new_defect / float(output_qty) * 100) if output_qty > 0 else 0
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="spc_violation",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'violations_created': modified_count,
        'violation_type': 'control_limit_breach'
    }


async def modify_cycle_time_increase(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Increase cycle times across production results.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, cycle_time_sec
        FROM mes_production_result
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0
    increase_factor = 1.2 + (intensity * 0.6)  # 20-80% increase

    for record in records:
        record_id, cycle_time = record

        original_values.append({
            'id': str(record_id),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0
        })

        new_cycle_time = float(cycle_time or 60) * increase_factor

        await db.execute(text("""
            UPDATE mes_production_result
            SET cycle_time_sec = :cycle_time
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'cycle_time': new_cycle_time
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="cycle_time_increase",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'cycle_time_increase': f"{(increase_factor - 1) * 100:.0f}%"
    }


async def modify_underproduction(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Reduce produced quantities vs target quantities.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, target_qty, produced_qty, good_qty, completion_rate
        FROM mes_production_order
        {where_clause}
        AND status IN ('started', 'completed')
    """), params)
    records = result.fetchall()

    modified_count = 0
    reduction_factor = 0.6 - (intensity * 0.4)  # 60% to 20% of target

    for record in records:
        record_id, target_qty, produced_qty, good_qty, completion_rate = record

        original_values.append({
            'id': str(record_id),
            'produced_qty': float(produced_qty) if produced_qty else 0,
            'good_qty': float(good_qty) if good_qty else 0,
            'completion_rate': float(completion_rate) if completion_rate else 0
        })

        new_produced = int(float(target_qty or 100) * reduction_factor)
        new_good = int(new_produced * 0.95)  # 95% good rate
        new_completion = (new_produced / float(target_qty) * 100) if target_qty else 0

        await db.execute(text("""
            UPDATE mes_production_order
            SET produced_qty = :produced_qty,
                good_qty = :good_qty,
                completion_rate = :completion_rate,
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'produced_qty': new_produced,
            'good_qty': new_good,
            'completion_rate': new_completion
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="underproduction",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_completion': f"{reduction_factor * 100:.0f}%"
    }


# ============ Additional Anomaly Handlers ============

async def modify_quality_hold(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate quality hold by moving good_qty to scrap_qty (hold = cannot ship).
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
        AND good_qty > 0
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, lot_no, good_qty, scrap_qty, output_qty
        FROM mes_production_result
        {where_clause}
        ORDER BY RANDOM()
        LIMIT :limit
    """), {**params, 'limit': int(10 + intensity * 30)})
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, lot_no, good_qty, scrap_qty, output_qty = record

        original_values.append({
            'id': str(record_id),
            'lot_no': lot_no,
            'good_qty': float(good_qty),
            'scrap_qty': float(scrap_qty) if scrap_qty else 0
        })

        # Move portion of good_qty to scrap_qty (simulating hold)
        hold_rate = 0.5 + (intensity * 0.5)  # 50-100% on hold
        hold_qty = int(float(good_qty) * hold_rate)
        new_good = max(0, float(good_qty) - hold_qty)
        new_scrap = float(scrap_qty or 0) + hold_qty

        await db.execute(text("""
            UPDATE mes_production_result
            SET good_qty = :good_qty,
                scrap_qty = :scrap_qty,
                yield_rate = :yield_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'good_qty': new_good,
            'scrap_qty': new_scrap,
            'yield_rate': (new_good / float(output_qty) * 100) if output_qty and float(output_qty) > 0 else 0
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="quality_hold",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'lots_on_hold': modified_count
    }


async def modify_downtime_spike(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None,
    target_equipment: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create multiple downtime events to simulate spike in equipment downtime.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = "WHERE tenant_id = CAST(:tenant_id AS uuid) AND is_active = true"
    params = {'tenant_id': TENANT_ID}

    if target_equipment:
        where_clause += " AND equipment_code = :equipment_code"
        params['equipment_code'] = target_equipment
    elif target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, equipment_code, line_code
        FROM mes_equipment
        {where_clause}
        LIMIT :limit
    """), {**params, 'limit': int(5 + intensity * 10)})
    equipment_list = result.fetchall()

    modified_count = 0
    downtime_created = 0
    days_in_range = (end_date - start_date).days + 1

    for eq in equipment_list:
        eq_id, eq_code, line_code = eq

        original_values.append({
            'equipment_id': str(eq_id),
            'equipment_code': eq_code
        })

        # Create multiple downtime events
        num_events = int(2 + intensity * 5)  # 2-7 events per equipment

        for _ in range(num_events):
            downtime_id = str(uuid.uuid4())
            downtime_minutes = int(30 + random.random() * intensity * 180)  # 30min to 3.5hrs

            await db.execute(text("""
                INSERT INTO mes_downtime_event (
                    id, tenant_id, equipment_id, equipment_code, line_code,
                    start_time, duration_min, downtime_type, downtime_code,
                    downtime_reason, reported_by, created_at
                ) VALUES (
                    CAST(:id AS uuid), CAST(:tenant_id AS uuid), CAST(:eq_id AS uuid), :eq_code, :line_code,
                    :start_time, :duration_min, :downtime_type, :downtime_code,
                    :reason, 'SCENARIO_MODIFIER', NOW()
                )
            """), {
                'id': downtime_id,
                'tenant_id': TENANT_ID,
                'eq_id': str(eq_id),
                'eq_code': eq_code,
                'line_code': line_code,
                'start_time': datetime.combine(start_date + timedelta(days=random.randint(0, days_in_range - 1)),
                                               datetime.min.time()) + timedelta(hours=random.randint(6, 20)),
                'duration_min': downtime_minutes,
                'downtime_type': random.choice(['breakdown', 'quality', 'other']),
                'downtime_code': random.choice(['MECHANICAL', 'ELECTRICAL', 'SOFTWARE', 'OPERATOR', 'MATERIAL']),
                'reason': f'Simulated downtime spike - {eq_code}'
            })

            downtime_created += 1

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="downtime_spike",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'downtime_events_created': downtime_created,
        'equipment_affected': modified_count
    }


async def modify_maintenance_overdue(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None,
    target_equipment: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate maintenance overdue by creating maintenance-related downtime events.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = "WHERE tenant_id = CAST(:tenant_id AS uuid) AND is_active = true"
    params = {'tenant_id': TENANT_ID}

    if target_equipment:
        where_clause += " AND equipment_code = :equipment_code"
        params['equipment_code'] = target_equipment
    elif target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, equipment_code, line_code
        FROM mes_equipment
        {where_clause}
        LIMIT :limit
    """), {**params, 'limit': int(3 + intensity * 12)})
    equipment_list = result.fetchall()

    modified_count = 0
    downtime_created = 0
    days_in_range = (end_date - start_date).days + 1

    for eq in equipment_list:
        eq_id, eq_code, line_code = eq

        original_values.append({
            'equipment_id': str(eq_id),
            'equipment_code': eq_code
        })

        # Create maintenance-related downtime events
        num_events = int(1 + intensity * 3)  # 1-4 events per equipment

        for _ in range(num_events):
            downtime_id = str(uuid.uuid4())
            downtime_minutes = int(60 + random.random() * intensity * 240)  # 60min to 5hrs

            await db.execute(text("""
                INSERT INTO mes_downtime_event (
                    id, tenant_id, equipment_id, equipment_code, line_code,
                    start_time, duration_min, downtime_type, downtime_code,
                    downtime_reason, reported_by, created_at
                ) VALUES (
                    CAST(:id AS uuid), CAST(:tenant_id AS uuid), CAST(:eq_id AS uuid), :eq_code, :line_code,
                    :start_time, :duration_min, :downtime_type, :downtime_code,
                    :reason, 'SCENARIO_MODIFIER', NOW()
                )
            """), {
                'id': downtime_id,
                'tenant_id': TENANT_ID,
                'eq_id': str(eq_id),
                'eq_code': eq_code,
                'line_code': line_code,
                'start_time': datetime.combine(start_date + timedelta(days=random.randint(0, max(0, days_in_range - 1))),
                                               datetime.min.time()) + timedelta(hours=random.randint(6, 20)),
                'duration_min': downtime_minutes,
                'downtime_type': 'planned',
                'downtime_code': 'PM_OVERDUE',
                'reason': f'Preventive maintenance overdue - {eq_code}'
            })

            downtime_created += 1

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="maintenance_overdue",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'equipment_affected': modified_count,
        'downtime_events_created': downtime_created
    }


async def modify_schedule_deviation(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create significant deviations between planned and actual schedules.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, planned_start, planned_end, actual_start, actual_end, completion_rate
        FROM mes_production_order
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, planned_start, planned_end, actual_start, actual_end, completion_rate = record

        original_values.append({
            'id': str(record_id),
            'planned_start': str(planned_start) if planned_start else None,
            'planned_end': str(planned_end) if planned_end else None,
            'actual_start': str(actual_start) if actual_start else None,
            'actual_end': str(actual_end) if actual_end else None,
            'completion_rate': float(completion_rate) if completion_rate else 0
        })

        # Create schedule deviation
        start_delay_hours = int(4 + intensity * 20)  # 4-24 hours late start
        end_delay_hours = int(8 + intensity * 40)  # 8-48 hours late end

        new_actual_start = (planned_start + timedelta(hours=start_delay_hours)) if planned_start else None
        new_actual_end = (planned_end + timedelta(hours=end_delay_hours)) if planned_end else None

        # Reduce completion rate
        completion_reduction = intensity * 0.3
        new_completion = max(0, float(completion_rate or 80) - (completion_reduction * 100))

        await db.execute(text("""
            UPDATE mes_production_order
            SET actual_start = COALESCE(:actual_start, actual_start),
                actual_end = COALESCE(:actual_end, actual_end),
                completion_rate = :completion_rate,
                updated_at = NOW()
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'actual_start': new_actual_start,
            'actual_end': new_actual_end,
            'completion_rate': new_completion
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="schedule_deviation",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_start_delay_hours': int(4 + intensity * 20),
        'average_end_delay_hours': int(8 + intensity * 40)
    }


async def modify_incoming_reject(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate incoming material quality rejections.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    result = await db.execute(text("""
        SELECT id, po_no, total_amount, status
        FROM erp_purchase_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND po_date BETWEEN :start_date AND :end_date
        AND status IN ('received', 'confirmed')
        ORDER BY RANDOM()
        LIMIT :limit
    """), {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date,
        'limit': int(5 + intensity * 20)
    })
    orders = result.fetchall()

    modified_count = 0

    for order in orders:
        order_id, po_no, total_amount, status = order

        original_values.append({
            'id': order_id,
            'po_no': po_no,
            'total_amount': float(total_amount) if total_amount else 0,
            'status': status
        })

        # Reduce amount due to rejection
        rejection_rate = 0.1 + (intensity * 0.4)  # 10-50% rejected
        new_amount = float(total_amount or 0) * (1 - rejection_rate)

        await db.execute(text("""
            UPDATE erp_purchase_order
            SET total_amount = :total_amount,
                remark = COALESCE(remark, '') || ' [INCOMING_REJECT: ' || :reject_rate || '%]',
                updated_at = NOW()
            WHERE id = :id
        """), {
            'id': order_id,
            'total_amount': new_amount,
            'reject_rate': f"{rejection_rate * 100:.0f}"
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="incoming_reject",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'average_rejection_rate': f"{(0.1 + intensity * 0.4) * 100:.0f}%"
    }


async def modify_lot_contamination(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Mark production lots as contaminated, requiring scrapping or rework.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, lot_no, good_qty, defect_qty, output_qty
        FROM mes_production_result
        {where_clause}
        ORDER BY RANDOM()
        LIMIT :limit
    """), {**params, 'limit': int(5 + intensity * 15)})
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, lot_no, good_qty, defect_qty, output_qty = record

        original_values.append({
            'id': str(record_id),
            'lot_no': lot_no,
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty)
        })

        # All good qty becomes defect due to contamination
        contamination_rate = 0.5 + (intensity * 0.5)  # 50-100% contaminated
        contaminated = int(float(good_qty) * contamination_rate)
        new_good = max(0, float(good_qty) - contaminated)
        new_defect = float(defect_qty) + contaminated

        await db.execute(text("""
            UPDATE mes_production_result
            SET good_qty = :good_qty,
                defect_qty = :defect_qty,
                yield_rate = :yield_rate,
                defect_rate = :defect_rate
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'good_qty': new_good,
            'defect_qty': new_defect,
            'yield_rate': (new_good / float(output_qty) * 100) if output_qty and float(output_qty) > 0 else 0,
            'defect_rate': (new_defect / float(output_qty) * 100) if output_qty and float(output_qty) > 0 else 0
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="lot_contamination",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'lots_contaminated': modified_count,
        'average_contamination_rate': f"{(0.5 + intensity * 0.5) * 100:.0f}%"
    }


async def modify_demand_spike(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_product: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate sudden demand spike by increasing order amounts.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    result = await db.execute(text("""
        SELECT id, order_no, total_amount
        FROM erp_sales_order
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND order_date BETWEEN :start_date AND :end_date
        AND status NOT IN ('cancelled', 'closed')
    """), {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    })
    orders = result.fetchall()

    modified_count = 0
    spike_multiplier = 1.5 + (intensity * 2.5)  # 1.5x to 4x increase

    for order in orders:
        order_id, order_no, total_amount = order

        original_values.append({
            'id': order_id,
            'order_no': order_no,
            'total_amount': float(total_amount) if total_amount else 0
        })

        new_amount = float(total_amount or 0) * spike_multiplier

        await db.execute(text("""
            UPDATE erp_sales_order
            SET total_amount = :total_amount,
                remark = COALESCE(remark, '') || ' [DEMAND_SPIKE]',
                updated_at = NOW()
            WHERE id = :id
        """), {
            'id': order_id,
            'total_amount': new_amount
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="demand_spike",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'demand_multiplier': f"{spike_multiplier:.1f}x"
    }


async def modify_mass_absence(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate mass employee absence affecting production capacity.
    Reduces output and increases cycle times.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, output_qty, cycle_time_sec, worker_id
        FROM mes_production_result
        {where_clause}
    """), params)
    records = result.fetchall()

    modified_count = 0
    absence_rate = 0.2 + (intensity * 0.5)  # 20-70% absence rate

    for record in records:
        record_id, output_qty, cycle_time, worker_id = record

        original_values.append({
            'id': str(record_id),
            'output_qty': float(output_qty),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0
        })

        # Reduced output due to manning shortage
        output_reduction = 1.0 - (absence_rate * 0.6)  # Up to 42% less output
        cycle_time_increase = 1.0 + (absence_rate * 0.4)  # Up to 28% longer cycle time

        new_output = max(1, int(float(output_qty) * output_reduction))
        new_cycle_time = float(cycle_time or 60) * cycle_time_increase

        await db.execute(text("""
            UPDATE mes_production_result
            SET output_qty = :output_qty,
                cycle_time_sec = :cycle_time
            WHERE id = CAST(:id AS uuid)
        """), {
            'id': str(record_id),
            'output_qty': new_output,
            'cycle_time': new_cycle_time
        })

        modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="mass_absence",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'simulated_absence_rate': f"{absence_rate * 100:.0f}%",
        'output_impact': f"-{(1 - (1.0 - absence_rate * 0.6)) * 100:.0f}%"
    }


async def modify_overtime_spike(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    intensity: float,
    target_line: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulate overtime spike - extended working hours with fatigue effects.
    Later shifts show declining quality and productivity.
    """
    modification_id = str(uuid.uuid4())
    original_values = []

    where_clause = """
        WHERE tenant_id = CAST(:tenant_id AS uuid)
        AND result_timestamp::date BETWEEN :start_date AND :end_date
    """
    params = {
        'tenant_id': TENANT_ID,
        'start_date': start_date,
        'end_date': end_date
    }

    if target_line:
        where_clause += " AND line_code = :line_code"
        params['line_code'] = target_line

    result = await db.execute(text(f"""
        SELECT id, result_timestamp, good_qty, defect_qty, output_qty, cycle_time_sec
        FROM mes_production_result
        {where_clause}
        ORDER BY result_timestamp
    """), params)
    records = result.fetchall()

    modified_count = 0

    for record in records:
        record_id, timestamp, good_qty, defect_qty, output_qty, cycle_time = record

        original_values.append({
            'id': str(record_id),
            'good_qty': float(good_qty),
            'defect_qty': float(defect_qty),
            'cycle_time_sec': float(cycle_time) if cycle_time else 0
        })

        # Apply fatigue effect based on time of day
        hour = timestamp.hour if isinstance(timestamp, datetime) else 12
        fatigue_factor = 1.0

        if hour >= 18:  # Evening overtime
            fatigue_factor = 1.0 + (intensity * 0.2 * (hour - 18) / 6)  # Progressively worse
        elif hour >= 22 or hour < 6:  # Night overtime
            fatigue_factor = 1.0 + (intensity * 0.4)  # Worst fatigue

        if fatigue_factor > 1.0:
            defect_increase = int(float(good_qty) * (fatigue_factor - 1) * 0.5)
            new_good = max(0, float(good_qty) - defect_increase)
            new_defect = float(defect_qty) + defect_increase
            new_cycle_time = float(cycle_time or 60) * fatigue_factor

            await db.execute(text("""
                UPDATE mes_production_result
                SET good_qty = :good_qty,
                    defect_qty = :defect_qty,
                    yield_rate = :yield_rate,
                    cycle_time_sec = :cycle_time
                WHERE id = CAST(:id AS uuid)
            """), {
                'id': str(record_id),
                'good_qty': new_good,
                'defect_qty': new_defect,
                'yield_rate': (new_good / float(output_qty) * 100) if output_qty and float(output_qty) > 0 else 0,
                'cycle_time': new_cycle_time
            })

            modified_count += 1

    await db.commit()

    _modification_history[modification_id] = ModificationHistory(
        id=modification_id,
        timestamp=datetime.now(),
        anomaly_type="overtime_spike",
        modification_mode="update",
        records_modified=modified_count,
        original_values={'records': original_values},
        can_revert=True
    )

    return {
        'modification_id': modification_id,
        'records_modified': modified_count,
        'fatigue_effect': 'Applied based on work hours'
    }


# ============ Anomaly Type Router ============

ANOMALY_HANDLERS = {
    # Quality Anomalies
    AnomalyType.DEFECT_SPIKE: modify_defect_spike,
    AnomalyType.YIELD_DEGRADATION: modify_yield_degradation,
    AnomalyType.QUALITY_HOLD: modify_quality_hold,
    AnomalyType.SPC_VIOLATION: modify_spc_violation,

    # Equipment Anomalies
    AnomalyType.OEE_DROP: modify_oee_drop,
    AnomalyType.EQUIPMENT_BREAKDOWN: modify_equipment_breakdown,
    AnomalyType.CYCLE_TIME_INCREASE: modify_cycle_time_increase,
    AnomalyType.DOWNTIME_SPIKE: modify_downtime_spike,
    AnomalyType.MAINTENANCE_OVERDUE: modify_maintenance_overdue,

    # Production Anomalies
    AnomalyType.PRODUCTION_DELAY: modify_production_delay,
    AnomalyType.UNDERPRODUCTION: modify_underproduction,
    AnomalyType.SCHEDULE_DEVIATION: modify_schedule_deviation,
    AnomalyType.BOTTLENECK: modify_bottleneck,
    AnomalyType.SHIFT_VARIANCE: modify_shift_variance,

    # Material Anomalies
    AnomalyType.MATERIAL_SHORTAGE: modify_material_shortage,
    AnomalyType.INCOMING_REJECT: modify_incoming_reject,
    AnomalyType.LOT_CONTAMINATION: modify_lot_contamination,

    # Business Anomalies
    AnomalyType.DELIVERY_DELAY: modify_delivery_delay,
    AnomalyType.ORDER_CANCELLATION: modify_order_cancellation,
    AnomalyType.SUPPLIER_DELAY: modify_supplier_delay,
    AnomalyType.DEMAND_SPIKE: modify_demand_spike,

    # HR Anomalies
    AnomalyType.MASS_ABSENCE: modify_mass_absence,
    AnomalyType.OVERTIME_SPIKE: modify_overtime_spike,
}


# ============ API Endpoints ============

@router.post("/apply", response_model=ScenarioModifyResponse)
async def apply_scenario_modification(
    request: ScenarioModifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Apply anomaly modification to existing data.

    This modifies (UPDATE) existing records rather than creating new ones,
    allowing AI anomaly detection to identify deviations from normal patterns.
    """
    # Determine date range based on mode
    if request.modification_mode == ModificationMode.LAST_N_DAYS:
        end_date = date.today()
        start_date = end_date - timedelta(days=request.days)
    elif request.modification_mode == ModificationMode.DATE_RANGE:
        if not request.start_date or not request.end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date and end_date required for date_range mode"
            )
        start_date = request.start_date
        end_date = request.end_date
    else:  # REALTIME_STREAM
        end_date = date.today()
        start_date = end_date

    # Get handler for anomaly type
    handler = ANOMALY_HANDLERS.get(request.anomaly_type)
    if not handler:
        raise HTTPException(
            status_code=400,
            detail=f"Anomaly type {request.anomaly_type} not yet implemented"
        )

    try:
        # Build kwargs based on handler signature
        import inspect
        sig = inspect.signature(handler)
        kwargs = {
            'db': db,
            'start_date': start_date,
            'end_date': end_date,
            'intensity': request.intensity,
        }

        # Add optional parameters if handler accepts them
        param_names = set(sig.parameters.keys())
        if 'target_line' in param_names and request.target_line:
            kwargs['target_line'] = request.target_line
        if 'target_equipment' in param_names and request.target_equipment:
            kwargs['target_equipment'] = request.target_equipment
        if 'target_product' in param_names and request.target_product:
            kwargs['target_product'] = request.target_product

        # Execute modification
        result = await handler(**kwargs)

        return ScenarioModifyResponse(
            success=True,
            anomaly_type=request.anomaly_type.value,
            modification_mode=request.modification_mode.value,
            records_modified=result.get('records_modified', 0),
            date_range={
                'start': str(start_date),
                'end': str(end_date)
            },
            details=result,
            revert_command=f"/scenario-modifier/revert/{result.get('modification_id')}"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Modification failed: {str(e)}")


@router.get("/anomaly-types")
async def get_available_anomaly_types():
    """Get list of available anomaly types with descriptions"""
    return {
        "quality_anomalies": [
            {"type": "defect_spike", "name": "불량률 급증", "description": "기존 생산 결과의 불량 수량을 급격히 증가시킵니다", "implemented": True},
            {"type": "yield_degradation", "name": "수율 점진적 저하", "description": "시간에 따라 점진적으로 수율이 저하되는 패턴을 생성합니다", "implemented": True},
            {"type": "quality_hold", "name": "품질 홀드", "description": "생산 LOT를 품질 홀드 상태로 변경하여 출하를 제한합니다", "implemented": True},
            {"type": "spc_violation", "name": "SPC 관리한계 이탈", "description": "통계적 공정관리 한계를 벗어나는 극단적 품질 편차를 생성합니다", "implemented": True}
        ],
        "equipment_anomalies": [
            {"type": "oee_drop", "name": "OEE 저하", "description": "설비 효율성(가동률, 성능, 품질) 지표를 저하시킵니다", "implemented": True},
            {"type": "equipment_breakdown", "name": "설비 고장", "description": "설비 고장 이벤트와 비가동 시간을 생성합니다", "implemented": True},
            {"type": "cycle_time_increase", "name": "사이클 타임 증가", "description": "생산 사이클 시간을 증가시켜 처리량을 저하시킵니다", "implemented": True},
            {"type": "downtime_spike", "name": "다운타임 급증", "description": "복수 설비에 대한 가동중단 이벤트를 대량 생성합니다", "implemented": True},
            {"type": "maintenance_overdue", "name": "예방보전 지연", "description": "설비 정기점검/유지보수 일정을 지연 상태로 변경합니다", "implemented": True}
        ],
        "production_anomalies": [
            {"type": "production_delay", "name": "생산 지연", "description": "생산 일정을 지연시키고 완료율을 저하시킵니다", "implemented": True},
            {"type": "underproduction", "name": "과소 생산", "description": "목표 대비 실제 생산량을 감소시킵니다", "implemented": True},
            {"type": "schedule_deviation", "name": "일정 이탈", "description": "계획 대비 실제 시작/종료 시간의 편차를 증가시킵니다", "implemented": True},
            {"type": "bottleneck", "name": "공정 병목", "description": "특정 라인/공정의 사이클 타임을 급격히 증가시켜 병목을 생성합니다", "implemented": True},
            {"type": "shift_variance", "name": "교대별 성능 편차", "description": "교대조(주간/야간)별 생산 성능 차이를 생성합니다", "implemented": True}
        ],
        "material_anomalies": [
            {"type": "material_shortage", "name": "자재 부족", "description": "자재 부족으로 인한 생산 목표량 감소를 시뮬레이션합니다", "implemented": True},
            {"type": "incoming_reject", "name": "수입검사 불합격", "description": "구매자재의 수입검사 불합격으로 인한 물량 감소를 생성합니다", "implemented": True},
            {"type": "lot_contamination", "name": "LOT 오염", "description": "생산 LOT를 오염 상태로 변경하여 양품을 불량으로 전환합니다", "implemented": True}
        ],
        "business_anomalies": [
            {"type": "delivery_delay", "name": "납품 지연", "description": "고객 납품 일정을 지연시킵니다", "implemented": True},
            {"type": "order_cancellation", "name": "주문 취소", "description": "기존 수주를 취소 상태로 변경합니다", "implemented": True},
            {"type": "supplier_delay", "name": "공급업체 납기 지연", "description": "구매발주의 입고 예정일을 지연시킵니다", "implemented": True},
            {"type": "demand_spike", "name": "수요 급증", "description": "주문 수량과 금액을 급격히 증가시킵니다", "implemented": True}
        ],
        "hr_anomalies": [
            {"type": "mass_absence", "name": "대량 결근", "description": "인력 부족으로 인한 생산량 감소와 사이클 타임 증가를 시뮬레이션합니다", "implemented": True},
            {"type": "overtime_spike", "name": "초과근무 급증", "description": "초과근무로 인한 피로 효과(품질 저하, 생산성 감소)를 생성합니다", "implemented": True}
        ]
    }


@router.get("/history")
async def get_modification_history():
    """Get history of modifications for potential revert"""
    return list(_modification_history.values())


@router.post("/revert/{modification_id}")
async def revert_modification(
    modification_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Revert a previous modification to restore original values.
    Only works if original values were preserved.
    """
    if modification_id not in _modification_history:
        raise HTTPException(status_code=404, detail="Modification not found")

    history = _modification_history[modification_id]
    if not history.can_revert:
        raise HTTPException(status_code=400, detail="This modification cannot be reverted")

    try:
        original_records = history.original_values.get('records', [])
        reverted_count = 0

        for record in original_records:
            record_id = record.get('id')
            if not record_id:
                continue

            # Determine table based on anomaly type
            if history.anomaly_type in ['defect_spike', 'oee_drop', 'yield_degradation']:
                # Production results
                await db.execute(text("""
                    UPDATE mes_production_result
                    SET good_qty = :good_qty,
                        defect_qty = :defect_qty,
                        yield_rate = :yield_rate,
                        defect_rate = :defect_rate,
                        cycle_time_sec = COALESCE(:cycle_time, cycle_time_sec),
                        output_qty = COALESCE(:output_qty, output_qty)
                    WHERE id = CAST(:id AS uuid)
                """), {
                    'id': record_id,
                    'good_qty': record.get('good_qty'),
                    'defect_qty': record.get('defect_qty'),
                    'yield_rate': record.get('yield_rate', 0),
                    'defect_rate': record.get('defect_rate', 0),
                    'cycle_time': record.get('cycle_time_sec'),
                    'output_qty': record.get('output_qty')
                })
            elif history.anomaly_type == 'production_delay':
                # Production orders
                await db.execute(text("""
                    UPDATE mes_production_order
                    SET planned_end = :planned_end,
                        completion_rate = :completion_rate,
                        produced_qty = :produced_qty
                    WHERE id = CAST(:id AS uuid)
                """), {
                    'id': record_id,
                    'planned_end': record.get('planned_end'),
                    'completion_rate': record.get('completion_rate'),
                    'produced_qty': record.get('produced_qty')
                })
            elif history.anomaly_type == 'delivery_delay':
                # Sales orders
                await db.execute(text("""
                    UPDATE erp_sales_order
                    SET delivery_date = :delivery_date,
                        status = :status,
                        remark = REPLACE(COALESCE(remark, ''), ' [DELAYED]', '')
                    WHERE id = :id
                """), {
                    'id': record_id,
                    'delivery_date': record.get('delivery_date'),
                    'status': record.get('status')
                })

            reverted_count += 1

        await db.commit()

        # Remove from history after successful revert
        del _modification_history[modification_id]

        return {
            "success": True,
            "message": f"Successfully reverted {reverted_count} records",
            "modification_id": modification_id
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Revert failed: {str(e)}")


@router.delete("/history/{modification_id}")
async def delete_modification_history(modification_id: str):
    """Delete a modification from history (without reverting)"""
    if modification_id not in _modification_history:
        raise HTTPException(status_code=404, detail="Modification not found")

    del _modification_history[modification_id]
    return {"success": True, "message": "Modification history deleted"}
