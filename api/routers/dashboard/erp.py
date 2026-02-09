"""
ERP Dashboard API Router
- KPIs (매출, 수주, 재고, 발주)
- 월별 트렌드
- 알림/경고
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/erp", tags=["ERP Dashboard"])


# ==================== Schemas ====================

class KPICard(BaseModel):
    """KPI 카드"""
    title: str
    value: str
    raw_value: float
    change: float
    change_period: str = "vs 전월"
    trend: str  # 'up', 'down', 'stable'
    unit: Optional[str] = None


class MonthlySalesData(BaseModel):
    """월별 매출 데이터"""
    month: str
    sales: float
    orders: float


class InventoryStatusData(BaseModel):
    """재고 상태 분포"""
    name: str
    value: int
    color: str


class RecentOrder(BaseModel):
    """최근 수주"""
    id: str
    customer: str
    amount: float
    status: str
    date: str


class Alert(BaseModel):
    """알림"""
    type: str  # warning, error, info, success
    message: str
    time: str


class ERPDashboardResponse(BaseModel):
    """ERP 대시보드 응답"""
    kpis: List[KPICard]
    monthly_sales: List[MonthlySalesData]
    inventory_status: List[InventoryStatusData]
    recent_orders: List[RecentOrder]
    alerts: List[Alert]


class SalesSummary(BaseModel):
    """매출 요약"""
    current_month: float
    current_month_target: float
    achievement_rate: float
    quarter_cumulative: float
    year_cumulative: float
    yoy_growth: float


class InventorySummary(BaseModel):
    """재고 요약"""
    total_items: int
    total_value: float
    below_safety_count: int
    excess_count: int
    out_of_stock_count: int
    turnover_rate: float


class PurchaseSummary(BaseModel):
    """구매 요약"""
    pending_orders: int
    pending_receipts: int
    pending_payments: float
    overdue_count: int


# ==================== API Endpoints ====================

@router.get("/summary", response_model=ERPDashboardResponse)
async def get_erp_dashboard():
    """ERP 대시보드 전체 데이터 조회"""
    now = datetime.now()

    # KPI 데이터
    kpis = [
        KPICard(
            title="이번 달 매출",
            value="₩4.2억",
            raw_value=420000000,
            change=12.5,
            trend="up"
        ),
        KPICard(
            title="미결 수주",
            value="127건",
            raw_value=127,
            change=-5.2,
            trend="down"
        ),
        KPICard(
            title="재고 금액",
            value="₩8.7억",
            raw_value=870000000,
            change=3.1,
            trend="up"
        ),
        KPICard(
            title="미입고 발주",
            value="45건",
            raw_value=45,
            change=8.3,
            trend="up"
        ),
    ]

    # 월별 매출/수주 데이터
    monthly_sales = [
        MonthlySalesData(month="7월", sales=380, orders=120),
        MonthlySalesData(month="8월", sales=420, orders=135),
        MonthlySalesData(month="9월", sales=390, orders=125),
        MonthlySalesData(month="10월", sales=450, orders=145),
        MonthlySalesData(month="11월", sales=410, orders=130),
        MonthlySalesData(month="12월", sales=480, orders=155),
    ]

    # 재고 상태
    inventory_status = [
        InventoryStatusData(name="정상", value=2450, color="#22c55e"),
        InventoryStatusData(name="안전재고 미달", value=180, color="#f59e0b"),
        InventoryStatusData(name="과잉재고", value=120, color="#ef4444"),
        InventoryStatusData(name="재고없음", value=50, color="#6b7280"),
    ]

    # 최근 수주
    recent_orders = [
        RecentOrder(id="SO-2024-0892", customer="삼성전자", amount=45000000, status="approved", date="2024-12-15"),
        RecentOrder(id="SO-2024-0891", customer="LG이노텍", amount=32000000, status="pending", date="2024-12-15"),
        RecentOrder(id="SO-2024-0890", customer="현대모비스", amount=28000000, status="approved", date="2024-12-14"),
        RecentOrder(id="SO-2024-0889", customer="SK하이닉스", amount=55000000, status="draft", date="2024-12-14"),
        RecentOrder(id="SO-2024-0888", customer="한화솔루션", amount=18000000, status="approved", date="2024-12-13"),
    ]

    # 알림
    alerts = [
        Alert(type="warning", message="안전재고 미달 품목 15건", time="10분 전"),
        Alert(type="info", message="입고 예정 발주 8건 (오늘)", time="30분 전"),
        Alert(type="error", message="미결 수주 납기 임박 5건", time="1시간 전"),
        Alert(type="success", message="12월 매출 목표 95% 달성", time="2시간 전"),
    ]

    return ERPDashboardResponse(
        kpis=kpis,
        monthly_sales=monthly_sales,
        inventory_status=inventory_status,
        recent_orders=recent_orders,
        alerts=alerts,
    )


@router.get("/kpis", response_model=List[KPICard])
async def get_erp_kpis():
    """ERP KPI 조회"""
    return [
        KPICard(
            title="이번 달 매출",
            value="₩4.2억",
            raw_value=420000000,
            change=12.5,
            trend="up"
        ),
        KPICard(
            title="미결 수주",
            value="127건",
            raw_value=127,
            change=-5.2,
            trend="down"
        ),
        KPICard(
            title="재고 금액",
            value="₩8.7억",
            raw_value=870000000,
            change=3.1,
            trend="up"
        ),
        KPICard(
            title="미입고 발주",
            value="45건",
            raw_value=45,
            change=8.3,
            trend="up"
        ),
    ]


@router.get("/sales/summary", response_model=SalesSummary)
async def get_sales_summary():
    """매출 요약 조회"""
    return SalesSummary(
        current_month=520000000,
        current_month_target=500000000,
        achievement_rate=104.0,
        quarter_cumulative=1410000000,
        year_cumulative=5280000000,
        yoy_growth=12.5,
    )


@router.get("/inventory/summary", response_model=InventorySummary)
async def get_inventory_summary():
    """재고 요약 조회"""
    return InventorySummary(
        total_items=2800,
        total_value=870000000,
        below_safety_count=180,
        excess_count=120,
        out_of_stock_count=50,
        turnover_rate=12.5,
    )


@router.get("/purchase/summary", response_model=PurchaseSummary)
async def get_purchase_summary():
    """구매 요약 조회"""
    return PurchaseSummary(
        pending_orders=45,
        pending_receipts=12,
        pending_payments=210000000,
        overdue_count=3,
    )


@router.get("/alerts", response_model=List[Alert])
async def get_erp_alerts(
    limit: int = Query(10, ge=1, le=50),
):
    """ERP 알림 목록 조회"""
    alerts = [
        Alert(type="warning", message="안전재고 미달 품목 15건", time="10분 전"),
        Alert(type="info", message="입고 예정 발주 8건 (오늘)", time="30분 전"),
        Alert(type="error", message="미결 수주 납기 임박 5건", time="1시간 전"),
        Alert(type="success", message="12월 매출 목표 95% 달성", time="2시간 전"),
        Alert(type="warning", message="결제 예정 거래처 3건", time="3시간 전"),
        Alert(type="info", message="신규 수주 접수 2건", time="4시간 전"),
    ]
    return alerts[:limit]


@router.get("/monthly-trend")
async def get_monthly_trend(
    months: int = Query(6, ge=1, le=12),
):
    """월별 매출/수주 트렌드 조회"""
    data = [
        {"month": "2024-07", "sales": 380000000, "orders": 120, "target": 400000000},
        {"month": "2024-08", "sales": 420000000, "orders": 135, "target": 420000000},
        {"month": "2024-09", "sales": 390000000, "orders": 125, "target": 430000000},
        {"month": "2024-10", "sales": 450000000, "orders": 145, "target": 440000000},
        {"month": "2024-11", "sales": 410000000, "orders": 130, "target": 450000000},
        {"month": "2024-12", "sales": 520000000, "orders": 155, "target": 500000000},
    ]
    return data[-months:]


@router.get("/customer-ranking")
async def get_customer_ranking(
    limit: int = Query(5, ge=1, le=20),
):
    """고객별 매출 순위 조회"""
    return [
        {"rank": 1, "customer_code": "C-001", "customer_name": "삼성전자", "revenue": 550000000, "ratio": 29.7},
        {"rank": 2, "customer_code": "C-004", "customer_name": "Apple Inc.", "revenue": 450000000, "ratio": 24.3},
        {"rank": 3, "customer_code": "C-003", "customer_name": "현대모비스", "revenue": 320000000, "ratio": 17.3},
        {"rank": 4, "customer_code": "C-002", "customer_name": "LG전자", "revenue": 280000000, "ratio": 15.1},
        {"rank": 5, "customer_code": "C-005", "customer_name": "SK하이닉스", "revenue": 250000000, "ratio": 13.5},
    ][:limit]


@router.get("/product-ranking")
async def get_product_ranking(
    limit: int = Query(5, ge=1, le=20),
):
    """제품별 매출 순위 조회"""
    return [
        {"rank": 1, "product_code": "FG-MB-001", "product_name": "스마트폰 메인보드 A타입", "revenue": 750000000, "ratio": 40.5},
        {"rank": 2, "product_code": "FG-ECU-001", "product_name": "자동차 ECU 보드", "revenue": 450000000, "ratio": 24.3},
        {"rank": 3, "product_code": "FG-IOT-001", "product_name": "IoT 통신 모듈", "revenue": 300000000, "ratio": 16.2},
        {"rank": 4, "product_code": "FG-LED-001", "product_name": "LED 드라이버 보드", "revenue": 200000000, "ratio": 10.8},
        {"rank": 5, "product_code": "FG-PB-001", "product_name": "전원보드 Standard", "revenue": 150000000, "ratio": 8.1},
    ][:limit]
