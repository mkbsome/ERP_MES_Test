"""
MES Dashboard API Router
- 생산 KPIs
- 라인 현황
- 설비 OEE
- 품질 현황
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/mes", tags=["MES Dashboard"])


# ==================== Schemas ====================

class ProductionKPI(BaseModel):
    """생산 KPI"""
    title: str
    value: str
    raw_value: float
    target: Optional[float] = None
    achievement_rate: Optional[float] = None
    unit: Optional[str] = None


class LineStatus(BaseModel):
    """라인 현황"""
    line_code: str
    line_name: str
    status: str  # running, idle, down, maintenance
    current_product: Optional[str] = None
    target_qty: int
    produced_qty: int
    progress: float
    oee: float
    defect_rate: float


class EquipmentSummary(BaseModel):
    """설비 요약"""
    total: int
    running: int
    idle: int
    down: int
    maintenance: int
    avg_oee: float


class OEEData(BaseModel):
    """OEE 데이터"""
    line_code: str
    availability: float
    performance: float
    quality: float
    oee: float


class QualitySummary(BaseModel):
    """품질 요약"""
    total_inspected: int
    total_passed: int
    total_failed: int
    pass_rate: float
    defect_rate: float
    top_defects: List[dict]


class HourlyProductionData(BaseModel):
    """시간별 생산 데이터"""
    hour: str
    target: int
    actual: int
    defect: int


class MESAlert(BaseModel):
    """MES 알림"""
    type: str  # warning, error, info
    severity: str  # high, medium, low
    message: str
    source: str
    time: str


class MESDashboardResponse(BaseModel):
    """MES 대시보드 응답"""
    kpis: List[ProductionKPI]
    line_status: List[LineStatus]
    equipment_summary: EquipmentSummary
    oee_data: List[OEEData]
    quality_summary: QualitySummary
    hourly_production: List[HourlyProductionData]
    alerts: List[MESAlert]


# ==================== API Endpoints ====================

@router.get("/summary", response_model=MESDashboardResponse)
async def get_mes_dashboard():
    """MES 대시보드 전체 데이터 조회"""

    # KPI 데이터
    kpis = [
        ProductionKPI(title="금일 생산실적", value="12,450", raw_value=12450, target=15000, achievement_rate=83.0, unit="EA"),
        ProductionKPI(title="가동률", value="87.5%", raw_value=87.5, target=90.0, achievement_rate=97.2, unit="%"),
        ProductionKPI(title="종합 OEE", value="78.2%", raw_value=78.2, target=85.0, achievement_rate=92.0, unit="%"),
        ProductionKPI(title="불량률", value="0.35%", raw_value=0.35, target=0.5, achievement_rate=142.9, unit="%"),
    ]

    # 라인 현황
    line_status = [
        LineStatus(line_code="SMT-L01", line_name="SMT 1라인", status="running",
                   current_product="스마트폰 메인보드 A", target_qty=3000, produced_qty=2450,
                   progress=81.7, oee=82.5, defect_rate=0.28),
        LineStatus(line_code="SMT-L02", line_name="SMT 2라인", status="running",
                   current_product="자동차 ECU 보드", target_qty=2500, produced_qty=1980,
                   progress=79.2, oee=79.8, defect_rate=0.42),
        LineStatus(line_code="SMT-L03", line_name="SMT 3라인", status="down",
                   current_product="LED 드라이버", target_qty=4000, produced_qty=2100,
                   progress=52.5, oee=65.2, defect_rate=0.55),
        LineStatus(line_code="SMT-L04", line_name="SMT 4라인", status="idle",
                   current_product=None, target_qty=0, produced_qty=0,
                   progress=0, oee=0, defect_rate=0),
    ]

    # 설비 요약
    equipment_summary = EquipmentSummary(
        total=48,
        running=38,
        idle=5,
        down=3,
        maintenance=2,
        avg_oee=78.2,
    )

    # OEE 데이터
    oee_data = [
        OEEData(line_code="SMT-L01", availability=92.5, performance=90.2, quality=98.8, oee=82.5),
        OEEData(line_code="SMT-L02", availability=88.5, performance=91.5, quality=98.5, oee=79.8),
        OEEData(line_code="SMT-L03", availability=75.2, performance=88.0, quality=98.5, oee=65.2),
    ]

    # 품질 요약
    quality_summary = QualitySummary(
        total_inspected=12450,
        total_passed=12406,
        total_failed=44,
        pass_rate=99.65,
        defect_rate=0.35,
        top_defects=[
            {"defect_code": "D001", "defect_name": "솔더 브릿지", "count": 15, "ratio": 34.1},
            {"defect_code": "D002", "defect_name": "미삽", "count": 12, "ratio": 27.3},
            {"defect_code": "D003", "defect_name": "콜드 솔더", "count": 8, "ratio": 18.2},
            {"defect_code": "D004", "defect_name": "틀어짐", "count": 5, "ratio": 11.4},
            {"defect_code": "D005", "defect_name": "기타", "count": 4, "ratio": 9.1},
        ],
    )

    # 시간별 생산 데이터
    hourly_production = [
        HourlyProductionData(hour="08:00", target=500, actual=485, defect=2),
        HourlyProductionData(hour="09:00", target=500, actual=510, defect=1),
        HourlyProductionData(hour="10:00", target=500, actual=495, defect=3),
        HourlyProductionData(hour="11:00", target=500, actual=520, defect=1),
        HourlyProductionData(hour="12:00", target=250, actual=240, defect=1),
        HourlyProductionData(hour="13:00", target=500, actual=490, defect=2),
        HourlyProductionData(hour="14:00", target=500, actual=505, defect=2),
        HourlyProductionData(hour="15:00", target=500, actual=480, defect=4),
    ]

    # 알림
    alerts = [
        MESAlert(type="error", severity="high", message="SMT-L03 리플로우 장비 온도 이상", source="SMT-RF-03", time="5분 전"),
        MESAlert(type="warning", severity="medium", message="SMT-L01 프린터 스퀴지 교체 시점", source="SMT-PR-01", time="15분 전"),
        MESAlert(type="info", severity="low", message="SMT-L02 작업지시 WO-2024-0456 완료", source="SMT-L02", time="30분 전"),
    ]

    return MESDashboardResponse(
        kpis=kpis,
        line_status=line_status,
        equipment_summary=equipment_summary,
        oee_data=oee_data,
        quality_summary=quality_summary,
        hourly_production=hourly_production,
        alerts=alerts,
    )


@router.get("/kpis", response_model=List[ProductionKPI])
async def get_mes_kpis():
    """MES KPI 조회"""
    return [
        ProductionKPI(title="금일 생산실적", value="12,450", raw_value=12450, target=15000, achievement_rate=83.0, unit="EA"),
        ProductionKPI(title="가동률", value="87.5%", raw_value=87.5, target=90.0, achievement_rate=97.2, unit="%"),
        ProductionKPI(title="종합 OEE", value="78.2%", raw_value=78.2, target=85.0, achievement_rate=92.0, unit="%"),
        ProductionKPI(title="불량률", value="0.35%", raw_value=0.35, target=0.5, achievement_rate=142.9, unit="%"),
    ]


@router.get("/lines", response_model=List[LineStatus])
async def get_line_status():
    """라인별 현황 조회"""
    return [
        LineStatus(line_code="SMT-L01", line_name="SMT 1라인", status="running",
                   current_product="스마트폰 메인보드 A", target_qty=3000, produced_qty=2450,
                   progress=81.7, oee=82.5, defect_rate=0.28),
        LineStatus(line_code="SMT-L02", line_name="SMT 2라인", status="running",
                   current_product="자동차 ECU 보드", target_qty=2500, produced_qty=1980,
                   progress=79.2, oee=79.8, defect_rate=0.42),
        LineStatus(line_code="SMT-L03", line_name="SMT 3라인", status="down",
                   current_product="LED 드라이버", target_qty=4000, produced_qty=2100,
                   progress=52.5, oee=65.2, defect_rate=0.55),
        LineStatus(line_code="SMT-L04", line_name="SMT 4라인", status="idle",
                   current_product=None, target_qty=0, produced_qty=0,
                   progress=0, oee=0, defect_rate=0),
    ]


@router.get("/equipment/summary", response_model=EquipmentSummary)
async def get_equipment_summary():
    """설비 요약 조회"""
    return EquipmentSummary(
        total=48,
        running=38,
        idle=5,
        down=3,
        maintenance=2,
        avg_oee=78.2,
    )


@router.get("/oee", response_model=List[OEEData])
async def get_oee_data(
    line_code: Optional[str] = None,
):
    """OEE 데이터 조회"""
    data = [
        OEEData(line_code="SMT-L01", availability=92.5, performance=90.2, quality=98.8, oee=82.5),
        OEEData(line_code="SMT-L02", availability=88.5, performance=91.5, quality=98.5, oee=79.8),
        OEEData(line_code="SMT-L03", availability=75.2, performance=88.0, quality=98.5, oee=65.2),
        OEEData(line_code="SMT-L04", availability=0, performance=0, quality=0, oee=0),
    ]
    if line_code:
        return [d for d in data if d.line_code == line_code]
    return data


@router.get("/quality/summary", response_model=QualitySummary)
async def get_quality_summary():
    """품질 요약 조회"""
    return QualitySummary(
        total_inspected=12450,
        total_passed=12406,
        total_failed=44,
        pass_rate=99.65,
        defect_rate=0.35,
        top_defects=[
            {"defect_code": "D001", "defect_name": "솔더 브릿지", "count": 15, "ratio": 34.1},
            {"defect_code": "D002", "defect_name": "미삽", "count": 12, "ratio": 27.3},
            {"defect_code": "D003", "defect_name": "콜드 솔더", "count": 8, "ratio": 18.2},
            {"defect_code": "D004", "defect_name": "틀어짐", "count": 5, "ratio": 11.4},
            {"defect_code": "D005", "defect_name": "기타", "count": 4, "ratio": 9.1},
        ],
    )


@router.get("/hourly-production", response_model=List[HourlyProductionData])
async def get_hourly_production(
    line_code: Optional[str] = None,
):
    """시간별 생산 현황 조회"""
    return [
        HourlyProductionData(hour="08:00", target=500, actual=485, defect=2),
        HourlyProductionData(hour="09:00", target=500, actual=510, defect=1),
        HourlyProductionData(hour="10:00", target=500, actual=495, defect=3),
        HourlyProductionData(hour="11:00", target=500, actual=520, defect=1),
        HourlyProductionData(hour="12:00", target=250, actual=240, defect=1),
        HourlyProductionData(hour="13:00", target=500, actual=490, defect=2),
        HourlyProductionData(hour="14:00", target=500, actual=505, defect=2),
        HourlyProductionData(hour="15:00", target=500, actual=480, defect=4),
    ]


@router.get("/alerts", response_model=List[MESAlert])
async def get_mes_alerts(
    limit: int = Query(10, ge=1, le=50),
    severity: Optional[str] = None,
):
    """MES 알림 목록 조회"""
    alerts = [
        MESAlert(type="error", severity="high", message="SMT-L03 리플로우 장비 온도 이상", source="SMT-RF-03", time="5분 전"),
        MESAlert(type="warning", severity="medium", message="SMT-L01 프린터 스퀴지 교체 시점", source="SMT-PR-01", time="15분 전"),
        MESAlert(type="info", severity="low", message="SMT-L02 작업지시 WO-2024-0456 완료", source="SMT-L02", time="30분 전"),
        MESAlert(type="warning", severity="medium", message="SMT-L01 피더 알람 - Slot 15", source="SMT-CM-01", time="45분 전"),
        MESAlert(type="info", severity="low", message="SMT-L03 자재 보충 완료", source="SMT-L03", time="1시간 전"),
    ]

    if severity:
        alerts = [a for a in alerts if a.severity == severity]

    return alerts[:limit]


@router.get("/defect-trend")
async def get_defect_trend(
    days: int = Query(7, ge=1, le=30),
):
    """불량 추이 조회"""
    return [
        {"date": "2024-12-09", "total": 45, "defect": 0.38},
        {"date": "2024-12-10", "total": 42, "defect": 0.35},
        {"date": "2024-12-11", "total": 48, "defect": 0.40},
        {"date": "2024-12-12", "total": 38, "defect": 0.32},
        {"date": "2024-12-13", "total": 41, "defect": 0.34},
        {"date": "2024-12-14", "total": 44, "defect": 0.37},
        {"date": "2024-12-15", "total": 44, "defect": 0.35},
    ][-days:]


@router.get("/oee-trend")
async def get_oee_trend(
    line_code: Optional[str] = None,
    days: int = Query(7, ge=1, le=30),
):
    """OEE 추이 조회"""
    return [
        {"date": "2024-12-09", "oee": 76.5, "availability": 90.2, "performance": 88.5, "quality": 95.8},
        {"date": "2024-12-10", "oee": 78.2, "availability": 91.5, "performance": 89.2, "quality": 95.9},
        {"date": "2024-12-11", "oee": 75.8, "availability": 88.5, "performance": 89.5, "quality": 95.7},
        {"date": "2024-12-12", "oee": 79.5, "availability": 92.0, "performance": 90.0, "quality": 96.0},
        {"date": "2024-12-13", "oee": 77.8, "availability": 90.8, "performance": 89.5, "quality": 95.8},
        {"date": "2024-12-14", "oee": 78.5, "availability": 91.2, "performance": 89.8, "quality": 95.9},
        {"date": "2024-12-15", "oee": 78.2, "availability": 91.0, "performance": 89.5, "quality": 96.0},
    ][-days:]
