"""
ERP Production Management API Router
- BOM (Bill of Materials)
- Routing (공정 경로)
- Work Orders (작업지시)
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import random

router = APIRouter(prefix="/production", tags=["ERP Production"])


# ==================== Schemas ====================

class BOMItem(BaseModel):
    """BOM 구성품목"""
    item_seq: int
    item_code: str
    item_name: str
    qty_per: float
    unit: str
    scrap_rate: float = 0
    remarks: Optional[str] = None


class BOMResponse(BaseModel):
    """BOM 응답"""
    id: int
    product_code: str
    product_name: str
    version: str
    components: int
    total_cost: float
    status: str  # active, inactive, draft
    effective_date: str
    expiry_date: Optional[str] = None
    items: List[BOMItem]
    created_at: str
    updated_at: str


class BOMListResponse(BaseModel):
    """BOM 목록 응답"""
    items: List[BOMResponse]
    total: int
    page: int
    page_size: int


class RoutingStep(BaseModel):
    """공정 단계"""
    step_seq: int
    operation_code: str
    operation_name: str
    work_center_code: str
    work_center_name: str
    setup_time: float
    run_time: float
    queue_time: float
    move_time: float
    unit: str = "min"


class RoutingResponse(BaseModel):
    """Routing 응답"""
    id: int
    product_code: str
    product_name: str
    version: str
    operations: int
    total_time: float
    status: str
    effective_date: str
    expiry_date: Optional[str] = None
    steps: List[RoutingStep]
    created_at: str
    updated_at: str


class RoutingListResponse(BaseModel):
    """Routing 목록 응답"""
    items: List[RoutingResponse]
    total: int
    page: int
    page_size: int


class WorkOrderCreate(BaseModel):
    """작업지시 생성"""
    product_code: str
    qty: int
    start_date: str
    end_date: str
    line_code: str
    priority: int = 5
    sales_order_no: Optional[str] = None
    remarks: Optional[str] = None


class WorkOrderResponse(BaseModel):
    """작업지시 응답"""
    id: int
    order_no: str
    product_code: str
    product_name: str
    qty: int
    produced_qty: int
    start_date: str
    end_date: str
    line_code: str
    line_name: str
    status: str
    progress: float
    priority: int
    sales_order_no: Optional[str] = None
    remarks: Optional[str] = None
    created_at: str
    updated_at: str


class WorkOrderListResponse(BaseModel):
    """작업지시 목록 응답"""
    items: List[WorkOrderResponse]
    total: int
    page: int
    page_size: int


class WeeklyProductionPlan(BaseModel):
    """주간 생산 계획"""
    day: str
    planned: int
    actual: int


# ==================== BOM API ====================

@router.get("/bom", response_model=BOMListResponse)
async def get_bom_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_code: Optional[str] = None,
    status: Optional[str] = None,
):
    """BOM 목록 조회"""
    bom_list = [
        BOMResponse(
            id=1,
            product_code="SMT-MB-001",
            product_name="스마트폰 메인보드 A타입",
            version="3.0",
            components=156,
            total_cost=42500,
            status="active",
            effective_date="2024-01-01",
            items=[
                BOMItem(item_seq=1, item_code="IC-STM32F4", item_name="STM32F407VGT6 MCU", qty_per=1, unit="EA"),
                BOMItem(item_seq=2, item_code="CAP-0603-10UF", item_name="적층세라믹콘덴서 10μF", qty_per=48, unit="EA"),
                BOMItem(item_seq=3, item_code="RES-0402-10K", item_name="칩저항 10KΩ", qty_per=32, unit="EA"),
                BOMItem(item_seq=4, item_code="CON-USB-C", item_name="USB Type-C 커넥터", qty_per=1, unit="EA"),
            ],
            created_at="2024-01-01T00:00:00",
            updated_at="2024-12-01T00:00:00",
        ),
        BOMResponse(
            id=2,
            product_code="PWR-BD-002",
            product_name="전원보드 B형",
            version="2.1",
            components=89,
            total_cost=18500,
            status="active",
            effective_date="2024-03-01",
            items=[
                BOMItem(item_seq=1, item_code="IC-TPS5430", item_name="DC-DC 컨버터 IC", qty_per=2, unit="EA"),
                BOMItem(item_seq=2, item_code="CAP-1206-100UF", item_name="전해콘덴서 100μF", qty_per=12, unit="EA"),
                BOMItem(item_seq=3, item_code="IND-10UH", item_name="인덕터 10μH", qty_per=4, unit="EA"),
            ],
            created_at="2024-03-01T00:00:00",
            updated_at="2024-11-15T00:00:00",
        ),
        BOMResponse(
            id=3,
            product_code="LED-DRV-003",
            product_name="LED 드라이버",
            version="1.5",
            components=45,
            total_cost=8200,
            status="active",
            effective_date="2024-06-01",
            items=[
                BOMItem(item_seq=1, item_code="IC-LED-DRV", item_name="LED 드라이버 IC", qty_per=1, unit="EA"),
                BOMItem(item_seq=2, item_code="RES-0402-1K", item_name="칩저항 1KΩ", qty_per=8, unit="EA"),
            ],
            created_at="2024-06-01T00:00:00",
            updated_at="2024-10-20T00:00:00",
        ),
    ]

    if product_code:
        bom_list = [b for b in bom_list if product_code.lower() in b.product_code.lower()]
    if status:
        bom_list = [b for b in bom_list if b.status == status]

    return BOMListResponse(
        items=bom_list,
        total=len(bom_list),
        page=page,
        page_size=page_size,
    )


@router.get("/bom/{bom_id}", response_model=BOMResponse)
async def get_bom(bom_id: int):
    """BOM 상세 조회"""
    return BOMResponse(
        id=bom_id,
        product_code="SMT-MB-001",
        product_name="스마트폰 메인보드 A타입",
        version="3.0",
        components=156,
        total_cost=42500,
        status="active",
        effective_date="2024-01-01",
        items=[
            BOMItem(item_seq=1, item_code="IC-STM32F4", item_name="STM32F407VGT6 MCU", qty_per=1, unit="EA", scrap_rate=0.5),
            BOMItem(item_seq=2, item_code="CAP-0603-10UF", item_name="적층세라믹콘덴서 10μF", qty_per=48, unit="EA", scrap_rate=1.0),
            BOMItem(item_seq=3, item_code="RES-0402-10K", item_name="칩저항 10KΩ", qty_per=32, unit="EA", scrap_rate=1.0),
            BOMItem(item_seq=4, item_code="CON-USB-C", item_name="USB Type-C 커넥터", qty_per=1, unit="EA", scrap_rate=0.2),
            BOMItem(item_seq=5, item_code="CON-FPC-30P", item_name="FPC 커넥터 30핀", qty_per=2, unit="EA", scrap_rate=0.5),
            BOMItem(item_seq=6, item_code="LED-0805-WHT", item_name="LED 0805 백색", qty_per=4, unit="EA", scrap_rate=0.5),
        ],
        created_at="2024-01-01T00:00:00",
        updated_at="2024-12-01T00:00:00",
    )


@router.get("/bom/{product_code}/explosion")
async def get_bom_explosion(product_code: str, level: int = Query(99, ge=1)):
    """BOM 전개 (다단계)"""
    return {
        "product_code": product_code,
        "product_name": "스마트폰 메인보드 A타입",
        "explosion_level": level,
        "items": [
            {
                "level": 1, "item_code": "PCB-MAIN-V3", "item_name": "메인보드 PCB V3.0",
                "qty_per": 1, "unit": "EA", "total_qty": 1,
                "children": [
                    {"level": 2, "item_code": "FR4-1.6MM", "item_name": "FR4 기판 1.6mm", "qty_per": 1, "unit": "EA", "total_qty": 1},
                    {"level": 2, "item_code": "CU-35UM", "item_name": "구리박 35μm", "qty_per": 0.5, "unit": "M2", "total_qty": 0.5},
                ]
            },
            {
                "level": 1, "item_code": "IC-STM32F4", "item_name": "STM32F407VGT6 MCU",
                "qty_per": 1, "unit": "EA", "total_qty": 1,
                "children": []
            },
            {
                "level": 1, "item_code": "CAP-0603-10UF", "item_name": "적층세라믹콘덴서 10μF",
                "qty_per": 48, "unit": "EA", "total_qty": 48,
                "children": []
            },
        ],
        "total_components": 156,
        "total_cost": 42500,
    }


# ==================== Routing API ====================

@router.get("/routing", response_model=RoutingListResponse)
async def get_routing_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_code: Optional[str] = None,
    status: Optional[str] = None,
):
    """Routing 목록 조회"""
    routing_list = [
        RoutingResponse(
            id=1,
            product_code="SMT-MB-001",
            product_name="스마트폰 메인보드 A타입",
            version="2.0",
            operations=8,
            total_time=45,
            status="active",
            effective_date="2024-01-01",
            steps=[
                RoutingStep(step_seq=10, operation_code="PRT", operation_name="인쇄(Printing)", work_center_code="SMT-PR-01", work_center_name="프린터 1호기", setup_time=10, run_time=5, queue_time=2, move_time=1),
                RoutingStep(step_seq=20, operation_code="SPI", operation_name="SPI 검사", work_center_code="SMT-SPI-01", work_center_name="SPI 검사기", setup_time=5, run_time=3, queue_time=1, move_time=1),
                RoutingStep(step_seq=30, operation_code="MNT", operation_name="칩마운트", work_center_code="SMT-CM-01", work_center_name="칩마운터 1호기", setup_time=20, run_time=15, queue_time=5, move_time=2),
                RoutingStep(step_seq=40, operation_code="REF", operation_name="리플로우", work_center_code="SMT-RF-01", work_center_name="리플로우 1호기", setup_time=15, run_time=8, queue_time=3, move_time=2),
                RoutingStep(step_seq=50, operation_code="AOI", operation_name="AOI 검사", work_center_code="SMT-AOI-01", work_center_name="AOI 검사기", setup_time=5, run_time=5, queue_time=2, move_time=1),
            ],
            created_at="2024-01-01T00:00:00",
            updated_at="2024-12-01T00:00:00",
        ),
        RoutingResponse(
            id=2,
            product_code="PWR-BD-002",
            product_name="전원보드 B형",
            version="1.5",
            operations=6,
            total_time=35,
            status="active",
            effective_date="2024-03-01",
            steps=[
                RoutingStep(step_seq=10, operation_code="PRT", operation_name="인쇄(Printing)", work_center_code="SMT-PR-02", work_center_name="프린터 2호기", setup_time=8, run_time=4, queue_time=2, move_time=1),
                RoutingStep(step_seq=20, operation_code="MNT", operation_name="칩마운트", work_center_code="SMT-CM-02", work_center_name="칩마운터 2호기", setup_time=15, run_time=12, queue_time=3, move_time=2),
                RoutingStep(step_seq=30, operation_code="REF", operation_name="리플로우", work_center_code="SMT-RF-02", work_center_name="리플로우 2호기", setup_time=10, run_time=8, queue_time=2, move_time=1),
            ],
            created_at="2024-03-01T00:00:00",
            updated_at="2024-11-15T00:00:00",
        ),
    ]

    if product_code:
        routing_list = [r for r in routing_list if product_code.lower() in r.product_code.lower()]
    if status:
        routing_list = [r for r in routing_list if r.status == status]

    return RoutingListResponse(
        items=routing_list,
        total=len(routing_list),
        page=page,
        page_size=page_size,
    )


@router.get("/routing/{routing_id}", response_model=RoutingResponse)
async def get_routing(routing_id: int):
    """Routing 상세 조회"""
    return RoutingResponse(
        id=routing_id,
        product_code="SMT-MB-001",
        product_name="스마트폰 메인보드 A타입",
        version="2.0",
        operations=8,
        total_time=45,
        status="active",
        effective_date="2024-01-01",
        steps=[
            RoutingStep(step_seq=10, operation_code="PRT", operation_name="인쇄(Printing)", work_center_code="SMT-PR-01", work_center_name="프린터 1호기", setup_time=10, run_time=5, queue_time=2, move_time=1),
            RoutingStep(step_seq=20, operation_code="SPI", operation_name="SPI 검사", work_center_code="SMT-SPI-01", work_center_name="SPI 검사기", setup_time=5, run_time=3, queue_time=1, move_time=1),
            RoutingStep(step_seq=30, operation_code="MNT", operation_name="칩마운트", work_center_code="SMT-CM-01", work_center_name="칩마운터 1호기", setup_time=20, run_time=15, queue_time=5, move_time=2),
            RoutingStep(step_seq=40, operation_code="REF", operation_name="리플로우", work_center_code="SMT-RF-01", work_center_name="리플로우 1호기", setup_time=15, run_time=8, queue_time=3, move_time=2),
            RoutingStep(step_seq=50, operation_code="AOI", operation_name="AOI 검사", work_center_code="SMT-AOI-01", work_center_name="AOI 검사기", setup_time=5, run_time=5, queue_time=2, move_time=1),
            RoutingStep(step_seq=60, operation_code="THT", operation_name="후삽(Through-hole)", work_center_code="THT-01", work_center_name="후삽 1호기", setup_time=10, run_time=10, queue_time=3, move_time=2),
            RoutingStep(step_seq=70, operation_code="WAV", operation_name="웨이브 솔더링", work_center_code="WAV-01", work_center_name="웨이브 1호기", setup_time=12, run_time=6, queue_time=2, move_time=1),
            RoutingStep(step_seq=80, operation_code="FCT", operation_name="기능 검사", work_center_code="FCT-01", work_center_name="기능검사기", setup_time=5, run_time=8, queue_time=2, move_time=1),
        ],
        created_at="2024-01-01T00:00:00",
        updated_at="2024-12-01T00:00:00",
    )


# ==================== Work Orders API ====================

@router.get("/work-orders", response_model=WorkOrderListResponse)
async def get_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    line_code: Optional[str] = None,
):
    """작업지시 목록 조회"""
    work_orders = [
        WorkOrderResponse(
            id=1, order_no="WO-2024-0456", product_code="SMT-MB-001", product_name="스마트폰 메인보드 A타입",
            qty=1000, produced_qty=650, start_date="2024-12-15", end_date="2024-12-18",
            line_code="SMT-L01", line_name="SMT 1라인", status="in_progress", progress=65.0, priority=1,
            sales_order_no="SO-2024-0892", created_at="2024-12-14T00:00:00", updated_at="2024-12-15T10:00:00"
        ),
        WorkOrderResponse(
            id=2, order_no="WO-2024-0455", product_code="PWR-BD-002", product_name="전원보드 B형",
            qty=2000, produced_qty=0, start_date="2024-12-16", end_date="2024-12-19",
            line_code="SMT-L02", line_name="SMT 2라인", status="waiting", progress=0, priority=2,
            sales_order_no="SO-2024-0891", created_at="2024-12-14T00:00:00", updated_at="2024-12-14T00:00:00"
        ),
        WorkOrderResponse(
            id=3, order_no="WO-2024-0454", product_code="LED-DRV-003", product_name="LED 드라이버",
            qty=3000, produced_qty=3000, start_date="2024-12-14", end_date="2024-12-16",
            line_code="SMT-L03", line_name="SMT 3라인", status="completed", progress=100.0, priority=3,
            created_at="2024-12-13T00:00:00", updated_at="2024-12-16T16:00:00"
        ),
        WorkOrderResponse(
            id=4, order_no="WO-2024-0453", product_code="ECU-AUT-001", product_name="자동차 ECU 모듈",
            qty=500, produced_qty=0, start_date="2024-12-17", end_date="2024-12-20",
            line_code="SMT-L04", line_name="SMT 4라인", status="planned", progress=0, priority=1,
            sales_order_no="SO-2024-0890", created_at="2024-12-15T00:00:00", updated_at="2024-12-15T00:00:00"
        ),
    ]

    if status:
        work_orders = [w for w in work_orders if w.status == status]
    if line_code:
        work_orders = [w for w in work_orders if w.line_code == line_code]

    return WorkOrderListResponse(
        items=work_orders,
        total=len(work_orders),
        page=page,
        page_size=page_size,
    )


@router.post("/work-orders", response_model=WorkOrderResponse)
async def create_work_order(data: WorkOrderCreate):
    """작업지시 생성"""
    now = datetime.utcnow()
    return WorkOrderResponse(
        id=100,
        order_no=f"WO-{now.strftime('%Y')}-{random.randint(1000, 9999)}",
        product_code=data.product_code,
        product_name="신규 제품",
        qty=data.qty,
        produced_qty=0,
        start_date=data.start_date,
        end_date=data.end_date,
        line_code=data.line_code,
        line_name=f"라인 {data.line_code}",
        status="planned",
        progress=0,
        priority=data.priority,
        sales_order_no=data.sales_order_no,
        remarks=data.remarks,
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
    )


@router.get("/work-orders/{order_id}", response_model=WorkOrderResponse)
async def get_work_order(order_id: int):
    """작업지시 상세 조회"""
    return WorkOrderResponse(
        id=order_id,
        order_no=f"WO-2024-{order_id:04d}",
        product_code="SMT-MB-001",
        product_name="스마트폰 메인보드 A타입",
        qty=1000,
        produced_qty=650,
        start_date="2024-12-15",
        end_date="2024-12-18",
        line_code="SMT-L01",
        line_name="SMT 1라인",
        status="in_progress",
        progress=65.0,
        priority=1,
        sales_order_no="SO-2024-0892",
        created_at="2024-12-14T00:00:00",
        updated_at="2024-12-15T10:00:00",
    )


@router.post("/work-orders/{order_id}/release")
async def release_work_order(order_id: int):
    """작업지시 지시"""
    return {"message": f"Work order {order_id} has been released", "status": "released"}


@router.post("/work-orders/{order_id}/start")
async def start_work_order(order_id: int):
    """작업지시 시작"""
    return {"message": f"Work order {order_id} has been started", "status": "in_progress"}


@router.post("/work-orders/{order_id}/complete")
async def complete_work_order(order_id: int):
    """작업지시 완료"""
    return {"message": f"Work order {order_id} has been completed", "status": "completed"}


@router.get("/weekly-plan", response_model=List[WeeklyProductionPlan])
async def get_weekly_production_plan():
    """주간 생산 계획 조회"""
    return [
        WeeklyProductionPlan(day="월", planned=5000, actual=4800),
        WeeklyProductionPlan(day="화", planned=5000, actual=5100),
        WeeklyProductionPlan(day="수", planned=5000, actual=4950),
        WeeklyProductionPlan(day="목", planned=5000, actual=5200),
        WeeklyProductionPlan(day="금", planned=5000, actual=0),
    ]
