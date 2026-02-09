"""
MES Material Management API Router
"""
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...config import settings
from ...schemas.common import PaginatedResponse
from ...schemas.mes.material import (
    FeederSetupCreate, FeederSetupUpdate, FeederSetupResponse,
    MaterialConsumptionCreate, MaterialConsumptionResponse,
    MaterialRequestCreate, MaterialRequestUpdate, MaterialRequestResponse,
    MaterialInventoryCreate, MaterialInventoryUpdate, MaterialInventoryResponse,
    LineMaterialSummary, MaterialShortageAlert,
    FeederStatus, RequestStatus, RequestUrgency
)

router = APIRouter(prefix="/material", tags=["MES - Material Management"])


# ============== Feeder Setup ==============

@router.get("/feeders", response_model=PaginatedResponse)
async def get_feeder_setups(
    line_code: Optional[str] = None,
    status: Optional[FeederStatus] = None,
    material_code: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """피더 셋업 목록 조회"""
    # 임시 mock 데이터 반환
    items = []

    # 샘플 피더 데이터 생성
    lines = ['SMT-L01', 'SMT-L02', 'SMT-L03']
    for line in lines:
        if line_code and line != line_code:
            continue
        for slot in range(1, 11):
            feeder_status = FeederStatus.ACTIVE if slot <= 8 else FeederStatus.EMPTY
            if status and feeder_status != status:
                continue
            items.append({
                "setup_id": f"00000000-0000-0000-0000-{line[-2:]}{slot:02d}000001",
                "line_code": line,
                "feeder_slot": f"F{slot:02d}",
                "feeder_type": "tape_8mm" if slot % 2 == 0 else "tape_12mm",
                "material_code": f"C{1000 + slot}" if feeder_status == FeederStatus.ACTIVE else None,
                "material_name": f"Capacitor {slot}uF" if feeder_status == FeederStatus.ACTIVE else None,
                "reel_id": f"REEL-{line[-2:]}-{slot:03d}" if feeder_status == FeederStatus.ACTIVE else None,
                "lot_no": f"L2024{slot:04d}" if feeder_status == FeederStatus.ACTIVE else None,
                "initial_qty": 5000 if feeder_status == FeederStatus.ACTIVE else 0,
                "remaining_qty": 5000 - (slot * 100) if feeder_status == FeederStatus.ACTIVE else 0,
                "status": feeder_status.value,
                "setup_time": datetime.now().isoformat(),
                "setup_by": "operator1",
                "created_at": datetime.now().isoformat(),
            })

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return PaginatedResponse(
        items=items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/feeders/{line_code}", response_model=List[FeederSetupResponse])
async def get_line_feeders(
    line_code: str,
    db: AsyncSession = Depends(get_db)
):
    """특정 라인의 피더 셋업 조회"""
    items = []
    for slot in range(1, 21):
        feeder_status = FeederStatus.ACTIVE if slot <= 16 else FeederStatus.EMPTY
        items.append(FeederSetupResponse(
            setup_id=UUID(f"00000000-0000-0000-0000-{line_code[-2:]}{slot:02d}000001"),
            line_code=line_code,
            feeder_slot=f"F{slot:02d}",
            feeder_type="tape_8mm" if slot % 2 == 0 else "tape_12mm",
            material_code=f"C{1000 + slot}" if feeder_status == FeederStatus.ACTIVE else None,
            material_name=f"Capacitor {slot}uF" if feeder_status == FeederStatus.ACTIVE else None,
            reel_id=f"REEL-{line_code[-2:]}-{slot:03d}" if feeder_status == FeederStatus.ACTIVE else None,
            lot_no=f"L2024{slot:04d}" if feeder_status == FeederStatus.ACTIVE else None,
            initial_qty=5000 if feeder_status == FeederStatus.ACTIVE else 0,
            remaining_qty=5000 - (slot * 100) if feeder_status == FeederStatus.ACTIVE else 0,
            status=feeder_status,
            setup_time=datetime.now(),
            setup_by="operator1",
            created_at=datetime.now(),
        ))
    return items


@router.post("/feeders", response_model=FeederSetupResponse)
async def create_feeder_setup(
    data: FeederSetupCreate,
    db: AsyncSession = Depends(get_db)
):
    """피더 셋업 등록"""
    return FeederSetupResponse(
        setup_id=UUID("00000000-0000-0000-0000-000000000001"),
        line_code=data.line_code,
        feeder_slot=data.feeder_slot,
        feeder_type=data.feeder_type,
        material_code=data.material_code,
        material_name=data.material_name,
        reel_id=data.reel_id,
        lot_no=data.lot_no,
        initial_qty=data.initial_qty,
        remaining_qty=data.remaining_qty,
        status=FeederStatus.ACTIVE,
        setup_time=datetime.now(),
        setup_by=data.setup_by,
        created_at=datetime.now(),
    )


@router.patch("/feeders/{setup_id}", response_model=FeederSetupResponse)
async def update_feeder_setup(
    setup_id: UUID,
    data: FeederSetupUpdate,
    db: AsyncSession = Depends(get_db)
):
    """피더 셋업 수정"""
    return FeederSetupResponse(
        setup_id=setup_id,
        line_code="SMT-L01",
        feeder_slot="F01",
        feeder_type="tape_8mm",
        material_code=data.material_code or "C1001",
        material_name=data.material_name or "Capacitor 10uF",
        reel_id=data.reel_id or "REEL-01-001",
        lot_no=data.lot_no or "L20240001",
        initial_qty=5000,
        remaining_qty=data.remaining_qty or 4500,
        status=data.status or FeederStatus.ACTIVE,
        setup_time=datetime.now(),
        setup_by="operator1",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


# ============== Material Consumption ==============

@router.get("/consumption", response_model=PaginatedResponse)
async def get_material_consumption(
    line_code: Optional[str] = None,
    material_code: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """자재 소비 이력 조회"""
    items = []
    for i in range(1, 51):
        items.append({
            "consumption_id": f"00000000-0000-0000-0000-0000000000{i:02d}",
            "line_code": f"SMT-L{(i % 3) + 1:02d}",
            "equipment_code": f"MTR-{(i % 5) + 1:02d}",
            "material_code": f"C{1000 + (i % 20)}",
            "material_name": f"Capacitor {(i % 20) * 10}uF",
            "lot_no": f"L2024{i:04d}",
            "reel_id": f"REEL-{i:04d}",
            "consumption_qty": 100 + (i * 10),
            "unit": "EA",
            "consumption_type": "normal",
            "consumption_time": (datetime.now() - timedelta(hours=i)).isoformat(),
            "product_code": f"MB-{(i % 5) + 1:03d}",
            "result_lot_no": f"PL2024{i:04d}",
            "created_at": datetime.now().isoformat(),
        })

    # 필터링
    if line_code:
        items = [i for i in items if i["line_code"] == line_code]
    if material_code:
        items = [i for i in items if i["material_code"] == material_code]

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return PaginatedResponse(
        items=items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/consumption", response_model=MaterialConsumptionResponse)
async def create_material_consumption(
    data: MaterialConsumptionCreate,
    db: AsyncSession = Depends(get_db)
):
    """자재 소비 등록"""
    return MaterialConsumptionResponse(
        consumption_id=UUID("00000000-0000-0000-0000-000000000001"),
        order_id=data.order_id,
        line_code=data.line_code,
        equipment_code=data.equipment_code,
        material_code=data.material_code,
        material_name=data.material_name,
        lot_no=data.lot_no,
        reel_id=data.reel_id,
        consumption_qty=data.consumption_qty,
        unit=data.unit,
        consumption_type=data.consumption_type,
        product_code=data.product_code,
        result_lot_no=data.result_lot_no,
        consumption_time=datetime.now(),
        created_at=datetime.now(),
    )


# ============== Material Request ==============

@router.get("/requests", response_model=PaginatedResponse)
async def get_material_requests(
    line_code: Optional[str] = None,
    status: Optional[RequestStatus] = None,
    urgency: Optional[RequestUrgency] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """자재 요청 목록 조회"""
    items = []
    statuses = [RequestStatus.REQUESTED, RequestStatus.APPROVED, RequestStatus.IN_TRANSIT, RequestStatus.DELIVERED]
    urgencies = [RequestUrgency.NORMAL, RequestUrgency.URGENT, RequestUrgency.CRITICAL]

    for i in range(1, 31):
        req_status = statuses[i % 4]
        req_urgency = urgencies[i % 3]

        if status and req_status != status:
            continue
        if urgency and req_urgency != urgency:
            continue

        items.append({
            "request_id": f"00000000-0000-0000-0000-0000000000{i:02d}",
            "request_no": f"REQ-2024{i:04d}",
            "request_type": "replenish",
            "line_code": f"SMT-L{(i % 3) + 1:02d}",
            "equipment_code": f"MTR-{(i % 5) + 1:02d}",
            "feeder_slot": f"F{(i % 20) + 1:02d}",
            "material_code": f"C{1000 + (i % 20)}",
            "material_name": f"Capacitor {(i % 20) * 10}uF",
            "requested_qty": 5000,
            "unit": "EA",
            "urgency": req_urgency.value,
            "status": req_status.value,
            "requested_by": "operator1",
            "requested_at": (datetime.now() - timedelta(hours=i)).isoformat(),
            "approved_by": "supervisor1" if req_status != RequestStatus.REQUESTED else None,
            "approved_at": (datetime.now() - timedelta(hours=i-1)).isoformat() if req_status != RequestStatus.REQUESTED else None,
            "delivered_by": "handler1" if req_status == RequestStatus.DELIVERED else None,
            "delivered_at": datetime.now().isoformat() if req_status == RequestStatus.DELIVERED else None,
            "delivered_qty": 5000 if req_status == RequestStatus.DELIVERED else None,
            "created_at": datetime.now().isoformat(),
        })

    if line_code:
        items = [i for i in items if i["line_code"] == line_code]

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return PaginatedResponse(
        items=items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/requests", response_model=MaterialRequestResponse)
async def create_material_request(
    data: MaterialRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """자재 요청 등록"""
    return MaterialRequestResponse(
        request_id=UUID("00000000-0000-0000-0000-000000000001"),
        request_no=f"REQ-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        request_type=data.request_type,
        line_code=data.line_code,
        equipment_code=data.equipment_code,
        feeder_slot=data.feeder_slot,
        material_code=data.material_code,
        material_name=data.material_name,
        requested_qty=data.requested_qty,
        unit=data.unit,
        urgency=data.urgency,
        status=RequestStatus.REQUESTED,
        requested_by=data.requested_by,
        requested_at=datetime.now(),
        remarks=data.remarks,
        created_at=datetime.now(),
    )


@router.patch("/requests/{request_id}", response_model=MaterialRequestResponse)
async def update_material_request(
    request_id: UUID,
    data: MaterialRequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    """자재 요청 상태 수정"""
    now = datetime.now()
    return MaterialRequestResponse(
        request_id=request_id,
        request_no="REQ-20240001",
        request_type="replenish",
        line_code="SMT-L01",
        material_code="C1001",
        material_name="Capacitor 10uF",
        requested_qty=5000,
        unit="EA",
        urgency=RequestUrgency.NORMAL,
        status=data.status or RequestStatus.APPROVED,
        requested_by="operator1",
        requested_at=now - timedelta(hours=1),
        approved_by=data.approved_by,
        approved_at=now if data.status == RequestStatus.APPROVED else None,
        delivered_by=data.delivered_by,
        delivered_at=now if data.status == RequestStatus.DELIVERED else None,
        delivered_qty=data.delivered_qty,
        remarks=data.remarks,
        created_at=now - timedelta(hours=1),
    )


# ============== Material Inventory ==============

@router.get("/inventory", response_model=PaginatedResponse)
async def get_material_inventory(
    location_code: Optional[str] = None,
    material_code: Optional[str] = None,
    low_stock: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """라인 자재 재고 조회"""
    items = []
    locations = ['SMT-L01', 'SMT-L02', 'SMT-L03', 'BUFFER-01', 'SUPERMARKET-01']

    for loc in locations:
        if location_code and loc != location_code:
            continue
        for i in range(1, 11):
            qty_on_hand = 10000 - (i * 500)
            min_qty = 2000

            if low_stock and qty_on_hand >= min_qty:
                continue

            items.append({
                "inventory_id": f"00000000-0000-0000-{loc[-2:]:0>4}-0000000000{i:02d}",
                "location_type": "line" if loc.startswith("SMT") else ("buffer" if loc.startswith("BUFFER") else "supermarket"),
                "location_code": loc,
                "material_code": f"C{1000 + i}",
                "material_name": f"Capacitor {i * 10}uF",
                "lot_no": f"L2024{i:04d}",
                "qty_on_hand": qty_on_hand,
                "qty_allocated": i * 100,
                "qty_available": qty_on_hand - (i * 100),
                "unit": "EA",
                "min_qty": min_qty,
                "max_qty": 15000,
                "last_count_date": datetime.now().isoformat(),
                "last_count_qty": qty_on_hand,
                "created_at": datetime.now().isoformat(),
            })

    if material_code:
        items = [i for i in items if i["material_code"] == material_code]

    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size

    return PaginatedResponse(
        items=items[start:end],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/inventory", response_model=MaterialInventoryResponse)
async def create_material_inventory(
    data: MaterialInventoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """라인 자재 재고 등록"""
    return MaterialInventoryResponse(
        inventory_id=UUID("00000000-0000-0000-0000-000000000001"),
        location_type=data.location_type,
        location_code=data.location_code,
        material_code=data.material_code,
        material_name=data.material_name,
        lot_no=data.lot_no,
        qty_on_hand=data.qty_on_hand,
        qty_allocated=data.qty_allocated,
        qty_available=data.qty_on_hand - data.qty_allocated,
        unit=data.unit,
        min_qty=data.min_qty,
        max_qty=data.max_qty,
        created_at=datetime.now(),
    )


@router.patch("/inventory/{inventory_id}", response_model=MaterialInventoryResponse)
async def update_material_inventory(
    inventory_id: UUID,
    data: MaterialInventoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """라인 자재 재고 수정"""
    qty_on_hand = data.qty_on_hand or 10000
    qty_allocated = data.qty_allocated or 1000
    return MaterialInventoryResponse(
        inventory_id=inventory_id,
        location_type="line",
        location_code="SMT-L01",
        material_code="C1001",
        material_name="Capacitor 10uF",
        lot_no="L20240001",
        qty_on_hand=qty_on_hand,
        qty_allocated=qty_allocated,
        qty_available=qty_on_hand - qty_allocated,
        unit="EA",
        min_qty=data.min_qty or 2000,
        max_qty=data.max_qty or 15000,
        last_count_date=datetime.now(),
        last_count_qty=qty_on_hand,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


# ============== Summary & Alerts ==============

@router.get("/summary/lines", response_model=List[LineMaterialSummary])
async def get_line_material_summary(
    db: AsyncSession = Depends(get_db)
):
    """라인별 자재 현황 요약"""
    lines = [
        ("SMT-L01", "SMT 고속라인 1"),
        ("SMT-L02", "SMT 고속라인 2"),
        ("SMT-L03", "SMT 중속라인 1"),
        ("SMT-L04", "SMT 중속라인 2"),
        ("SMT-L05", "SMT 다품종라인"),
    ]

    return [
        LineMaterialSummary(
            line_code=code,
            line_name=name,
            total_feeders=20,
            active_feeders=20 - i,
            empty_feeders=i,
            error_feeders=0 if i < 3 else 1,
            pending_requests=i,
            urgent_requests=1 if i > 2 else 0,
        )
        for i, (code, name) in enumerate(lines)
    ]


@router.get("/alerts/shortage", response_model=List[MaterialShortageAlert])
async def get_material_shortage_alerts(
    db: AsyncSession = Depends(get_db)
):
    """자재 부족 알림"""
    return [
        MaterialShortageAlert(
            line_code="SMT-L01",
            feeder_slot="F05",
            material_code="C1005",
            material_name="Capacitor 100uF",
            remaining_qty=200,
            estimated_empty_time=datetime.now() + timedelta(minutes=30),
            urgency="critical",
        ),
        MaterialShortageAlert(
            line_code="SMT-L02",
            feeder_slot="F12",
            material_code="R2012",
            material_name="Resistor 10K",
            remaining_qty=500,
            estimated_empty_time=datetime.now() + timedelta(hours=1),
            urgency="urgent",
        ),
        MaterialShortageAlert(
            line_code="SMT-L03",
            feeder_slot="F08",
            material_code="IC3008",
            material_name="MCU STM32F4",
            remaining_qty=150,
            estimated_empty_time=datetime.now() + timedelta(hours=2),
            urgency="normal",
        ),
    ]
