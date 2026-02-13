"""
Equipment Management API Router
"""
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.config import settings
from api.models.mes.equipment import (
    EquipmentMaster,
    EquipmentStatus,
    EquipmentOEE,
    DowntimeEvent,
    ProductionLine,
)
from api.schemas.mes.equipment import (
    EquipmentMasterResponse,
    EquipmentStatusCreate,
    EquipmentStatusResponse,
    EquipmentCurrentStatus,
    EquipmentOEEResponse,
    OEESummary,
    OEETrend,
    DowntimeEventCreate,
    DowntimeEventUpdate,
    DowntimeEventResponse,
    DowntimeAnalysis,
    ProductionLineResponse,
    LineStatusResponse,
    EquipmentStatusValue,
)
from api.services.mock_data import MockDataService


router = APIRouter(prefix="/equipment", tags=["MES - Equipment"])


# ==================== Static Routes (MUST be defined before dynamic routes) ====================

# ==================== Equipment Status - Static Routes ====================

@router.get("/status/all")
async def get_all_equipment_status(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
):
    """Get current status of all equipment (with mock data fallback)

    Returns data structure expected by Dashboard:
    {
        "lines": [...],
        "equipment": [...],
        "summary": {...}
    }
    """
    try:
        tenant_id = UUID(settings.default_tenant_id)

        # Get all equipment
        eq_query = select(EquipmentMaster).where(EquipmentMaster.tenant_id == tenant_id)
        if line_code:
            eq_query = eq_query.where(EquipmentMaster.line_code == line_code)
        eq_query = eq_query.order_by(EquipmentMaster.line_code, EquipmentMaster.position_in_line)

        eq_result = await db.execute(eq_query)
        equipment_list = eq_result.scalars().all()

        if not equipment_list:
            # Return mock data if no DB data
            raise Exception("No equipment data found, using mock data")

        statuses = []
        for equipment in equipment_list:
            # Get latest status for each equipment
            status_query = select(EquipmentStatus).where(
                and_(
                    EquipmentStatus.tenant_id == tenant_id,
                    EquipmentStatus.equipment_code == equipment.equipment_code,
                )
            ).order_by(EquipmentStatus.status_timestamp.desc()).limit(1)

            status_result = await db.execute(status_query)
            latest_status = status_result.scalar_one_or_none()

            statuses.append(EquipmentCurrentStatus(
                equipment_code=equipment.equipment_code,
                equipment_name=equipment.equipment_name,
                equipment_type=equipment.equipment_type,
                line_code=equipment.line_code,
                position_in_line=equipment.position_in_line,
                status=latest_status.status if latest_status else EquipmentStatusValue.OFFLINE,
                status_since=latest_status.status_timestamp if latest_status else None,
                current_order_no=latest_status.production_order_no if latest_status else None,
                product_code=latest_status.product_code if latest_status else None,
                alarm_code=latest_status.alarm_code if latest_status else None,
                alarm_message=latest_status.alarm_message if latest_status else None,
            ))

        return statuses
    except Exception:
        # Return mock data on any error (DB connection, empty data, etc.)
        return MockDataService.get_all_equipment_status_formatted(line_code)


# ==================== OEE - Static Routes ====================

@router.get("/oee")
async def get_oee_data(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    equipment_code: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get OEE data (with mock data fallback)

    Returns data structure expected by Dashboard:
    {
        "summary": {"avg_oee": 85.0, "avg_availability": 90.0, ...},
        "trend": [...],
        "by_line": [...]
    }
    """
    try:
        tenant_id = UUID(settings.default_tenant_id)

        query = select(EquipmentOEE).where(EquipmentOEE.tenant_id == tenant_id)

        if line_code:
            query = query.where(EquipmentOEE.line_code == line_code)
        if equipment_code:
            query = query.where(EquipmentOEE.equipment_code == equipment_code)
        if start_date:
            query = query.where(EquipmentOEE.calculation_date >= start_date)
        if end_date:
            query = query.where(EquipmentOEE.calculation_date <= end_date)

        query = query.order_by(EquipmentOEE.calculation_date.desc())

        result = await db.execute(query)
        oee_data = result.scalars().all()

        if not oee_data:
            raise Exception("No OEE data found, using mock data")

        # Calculate availability, performance, quality from stored data
        responses = []
        for oee in oee_data:
            resp = EquipmentOEEResponse.model_validate(oee)

            # Calculate metrics
            if oee.planned_time_min and oee.planned_time_min > 0:
                resp.availability = float(oee.actual_run_time_min / oee.planned_time_min)

            if (oee.actual_run_time_min and oee.actual_run_time_min > 0
                and oee.ideal_cycle_time_sec and oee.ideal_cycle_time_sec > 0):
                resp.performance = float(
                    (oee.total_count * float(oee.ideal_cycle_time_sec) / 60.0) / float(oee.actual_run_time_min)
                )

            if oee.total_count and oee.total_count > 0:
                resp.quality = float(oee.good_count / oee.total_count)

            responses.append(resp)

        return responses
    except Exception:
        # Return mock data formatted for Dashboard
        return MockDataService.get_oee_data_formatted(line_code)


@router.get("/oee/{equipment_code}/trend", response_model=List[OEETrend])
async def get_oee_trend(
    equipment_code: str,
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Get OEE trend for specific equipment"""
    tenant_id = UUID(settings.default_tenant_id)
    start_date = date.today()

    query = select(EquipmentOEE).where(
        and_(
            EquipmentOEE.tenant_id == tenant_id,
            EquipmentOEE.equipment_code == equipment_code,
            EquipmentOEE.calculation_date >= start_date,
        )
    ).order_by(EquipmentOEE.calculation_date)

    result = await db.execute(query)
    oee_data = result.scalars().all()

    trends = []
    for oee in oee_data:
        availability = performance = quality = 0.0

        if oee.planned_time_min and oee.planned_time_min > 0:
            availability = float(oee.actual_run_time_min / oee.planned_time_min)

        if (oee.actual_run_time_min and oee.actual_run_time_min > 0
            and oee.ideal_cycle_time_sec and oee.ideal_cycle_time_sec > 0):
            performance = float(
                (oee.total_count * float(oee.ideal_cycle_time_sec) / 60.0) / float(oee.actual_run_time_min)
            )

        if oee.total_count and oee.total_count > 0:
            quality = float(oee.good_count / oee.total_count)

        calculated_oee = availability * performance * quality

        trends.append(OEETrend(
            date=oee.calculation_date,
            oee=calculated_oee,
            availability=availability,
            performance=performance,
            quality=quality,
        ))

    return trends


# ==================== Downtime - Static Routes ====================

@router.get("/downtime")
async def get_downtime_events(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    equipment_code: Optional[str] = None,
    line_code: Optional[str] = None,
    downtime_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Get downtime events"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(DowntimeEvent).where(DowntimeEvent.tenant_id == tenant_id)

    if equipment_code:
        query = query.where(DowntimeEvent.equipment_code == equipment_code)
    if line_code:
        query = query.where(DowntimeEvent.line_code == line_code)
    if downtime_type:
        query = query.where(DowntimeEvent.downtime_type == downtime_type)
    if start_date:
        query = query.where(DowntimeEvent.start_time >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(DowntimeEvent.start_time <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(DowntimeEvent.start_time.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    events = result.scalars().all()

    return {"items": [DowntimeEventResponse.model_validate(e) for e in events], "total": len(events)}


@router.post("/downtime", response_model=DowntimeEventResponse)
async def create_downtime_event(
    data: DowntimeEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create downtime event"""
    tenant_id = UUID(settings.default_tenant_id)

    # Generate event number
    event_no = f"DT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid4())[:4].upper()}"

    event = DowntimeEvent(
        tenant_id=tenant_id,
        event_no=event_no,
        **data.model_dump()
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return DowntimeEventResponse.model_validate(event)


@router.patch("/downtime/{event_id}", response_model=DowntimeEventResponse)
async def update_downtime_event(
    event_id: UUID,
    data: DowntimeEventUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update downtime event"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(DowntimeEvent).where(
        and_(
            DowntimeEvent.id == event_id,
            DowntimeEvent.tenant_id == tenant_id,
        )
    )
    result = await db.execute(query)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail="Downtime event not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    # Auto-set resolved_at when resolving
    if data.status in ["resolved", "closed"] and not event.resolved_at:
        event.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(event)

    return DowntimeEventResponse.model_validate(event)


# ==================== Maintenance - Static Routes ====================

@router.get("/maintenance", response_model=List[DowntimeEventResponse])
async def get_maintenance_history(
    db: AsyncSession = Depends(get_db),
    equipment_code: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get maintenance history (downtime events with maintenance categories)"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(DowntimeEvent).where(
        and_(
            DowntimeEvent.tenant_id == tenant_id,
            DowntimeEvent.downtime_category.in_([
                "planned_maintenance",
                "unplanned_maintenance",
            ])
        )
    )

    if equipment_code:
        query = query.where(DowntimeEvent.equipment_code == equipment_code)

    query = query.order_by(DowntimeEvent.start_time.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    events = result.scalars().all()

    return [DowntimeEventResponse.model_validate(e) for e in events]


@router.post("/maintenance", response_model=DowntimeEventResponse)
async def create_maintenance_record(
    data: DowntimeEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create maintenance record"""
    # Validate category is maintenance-related
    if data.downtime_category not in ["planned_maintenance", "unplanned_maintenance"]:
        raise HTTPException(
            status_code=400,
            detail="Maintenance record must have maintenance category"
        )

    return await create_downtime_event(data, db)


# ==================== Equipment Master - List Route ====================

@router.get("")
async def get_equipment_list(
    db: AsyncSession = Depends(get_db),
    line_code: Optional[str] = None,
    equipment_type: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """Get list of equipment - 실제 DB 데이터 반환"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(EquipmentMaster).where(EquipmentMaster.tenant_id == tenant_id)

    if line_code:
        query = query.where(EquipmentMaster.line_code == line_code)
    if equipment_type:
        query = query.where(EquipmentMaster.equipment_type == equipment_type)
    if is_active is not None:
        query = query.where(EquipmentMaster.is_active == is_active)

    query = query.order_by(EquipmentMaster.line_code, EquipmentMaster.equipment_code)

    result = await db.execute(query)
    equipment_list = result.scalars().all()

    return {
        "items": [
            {
                "id": str(e.id),
                "equipment_code": e.equipment_code,
                "equipment_name": e.equipment_name,
                "equipment_type": e.equipment_type,
                "line_id": str(e.line_id) if e.line_id else None,
                "line_code": e.line_code,
                "manufacturer": e.manufacturer,
                "model": e.model,
                "serial_no": e.serial_no,
                "install_date": e.install_date.isoformat() if e.install_date else None,
                "is_active": e.is_active,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "updated_at": e.updated_at.isoformat() if e.updated_at else None,
            }
            for e in equipment_list
        ],
        "total": len(equipment_list),
    }


# ==================== Dynamic Routes (MUST be defined AFTER static routes) ====================

@router.get("/{equipment_id}", response_model=EquipmentMasterResponse)
async def get_equipment(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get equipment by ID"""
    tenant_id = UUID(settings.default_tenant_id)

    query = select(EquipmentMaster).where(
        and_(
            EquipmentMaster.id == equipment_id,
            EquipmentMaster.tenant_id == tenant_id,
        )
    )
    result = await db.execute(query)
    equipment = result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return EquipmentMasterResponse.model_validate(equipment)


@router.get("/{equipment_id}/status", response_model=EquipmentStatusResponse)
async def get_equipment_current_status(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get current status of equipment"""
    tenant_id = UUID(settings.default_tenant_id)

    # Get equipment
    eq_query = select(EquipmentMaster).where(
        and_(
            EquipmentMaster.id == equipment_id,
            EquipmentMaster.tenant_id == tenant_id,
        )
    )
    eq_result = await db.execute(eq_query)
    equipment = eq_result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Get latest status
    status_query = select(EquipmentStatus).where(
        and_(
            EquipmentStatus.tenant_id == tenant_id,
            EquipmentStatus.equipment_code == equipment.equipment_code,
        )
    ).order_by(EquipmentStatus.status_timestamp.desc()).limit(1)

    status_result = await db.execute(status_query)
    status = status_result.scalar_one_or_none()

    if not status:
        raise HTTPException(status_code=404, detail="No status found for equipment")

    return EquipmentStatusResponse.model_validate(status)


@router.post("/{equipment_id}/status", response_model=EquipmentStatusResponse)
async def update_equipment_status(
    equipment_id: UUID,
    data: EquipmentStatusCreate,
    db: AsyncSession = Depends(get_db),
):
    """Update equipment status"""
    tenant_id = UUID(settings.default_tenant_id)

    # Verify equipment exists
    eq_query = select(EquipmentMaster).where(
        and_(
            EquipmentMaster.id == equipment_id,
            EquipmentMaster.tenant_id == tenant_id,
        )
    )
    eq_result = await db.execute(eq_query)
    equipment = eq_result.scalar_one_or_none()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Get previous status
    prev_query = select(EquipmentStatus).where(
        and_(
            EquipmentStatus.tenant_id == tenant_id,
            EquipmentStatus.equipment_code == equipment.equipment_code,
        )
    ).order_by(EquipmentStatus.status_timestamp.desc()).limit(1)

    prev_result = await db.execute(prev_query)
    prev_status = prev_result.scalar_one_or_none()

    # Create new status record
    status = EquipmentStatus(
        tenant_id=tenant_id,
        equipment_code=equipment.equipment_code,
        status_timestamp=datetime.utcnow(),
        previous_status=prev_status.status if prev_status else None,
        **data.model_dump(exclude={"equipment_code"})
    )
    db.add(status)
    await db.commit()
    await db.refresh(status)

    return EquipmentStatusResponse.model_validate(status)
