"""
MES Dashboard API Router
- 생산 KPIs
- 라인 현황
- 설비 OEE
- 품질 현황
"""
from datetime import datetime, timedelta, date
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel

from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.models.mes.production import ProductionOrder, ProductionResult, RealtimeProduction
from api.models.mes.equipment import ProductionLine, EquipmentMaster, EquipmentStatus, EquipmentOEE
from api.models.mes.quality import DefectDetail, InspectionResult
from api.models.mes.system import Notification

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


# ==================== Mock Data Service ====================

class MockDataService:
    """DB에 데이터가 없을 때 사용할 Mock 데이터 서비스"""

    @staticmethod
    def get_kpis() -> list:
        return [
            ProductionKPI(title="금일 생산실적", value="12,450", raw_value=12450, target=15000, achievement_rate=83.0, unit="EA"),
            ProductionKPI(title="가동률", value="87.5%", raw_value=87.5, target=90.0, achievement_rate=97.2, unit="%"),
            ProductionKPI(title="종합 OEE", value="78.2%", raw_value=78.2, target=85.0, achievement_rate=92.0, unit="%"),
            ProductionKPI(title="불량률", value="0.35%", raw_value=0.35, target=0.5, achievement_rate=142.9, unit="%"),
        ]

    @staticmethod
    def get_line_status() -> list:
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

    @staticmethod
    def get_equipment_summary() -> EquipmentSummary:
        return EquipmentSummary(
            total=48,
            running=38,
            idle=5,
            down=3,
            maintenance=2,
            avg_oee=78.2,
        )

    @staticmethod
    def get_oee_data() -> list:
        return [
            OEEData(line_code="SMT-L01", availability=92.5, performance=90.2, quality=98.8, oee=82.5),
            OEEData(line_code="SMT-L02", availability=88.5, performance=91.5, quality=98.5, oee=79.8),
            OEEData(line_code="SMT-L03", availability=75.2, performance=88.0, quality=98.5, oee=65.2),
            OEEData(line_code="SMT-L04", availability=0, performance=0, quality=0, oee=0),
        ]

    @staticmethod
    def get_quality_summary() -> QualitySummary:
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

    @staticmethod
    def get_hourly_production() -> list:
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

    @staticmethod
    def get_alerts() -> list:
        return [
            MESAlert(type="error", severity="high", message="SMT-L03 리플로우 장비 온도 이상", source="SMT-RF-03", time="5분 전"),
            MESAlert(type="warning", severity="medium", message="SMT-L01 프린터 스퀴지 교체 시점", source="SMT-PR-01", time="15분 전"),
            MESAlert(type="info", severity="low", message="SMT-L02 작업지시 WO-2024-0456 완료", source="SMT-L02", time="30분 전"),
            MESAlert(type="warning", severity="medium", message="SMT-L01 피더 알람 - Slot 15", source="SMT-CM-01", time="45분 전"),
            MESAlert(type="info", severity="low", message="SMT-L03 자재 보충 완료", source="SMT-L03", time="1시간 전"),
        ]

    @staticmethod
    def get_defect_trend(days: int = 7) -> list:
        return [
            {"date": "2024-12-09", "total": 45, "defect": 0.38},
            {"date": "2024-12-10", "total": 42, "defect": 0.35},
            {"date": "2024-12-11", "total": 48, "defect": 0.40},
            {"date": "2024-12-12", "total": 38, "defect": 0.32},
            {"date": "2024-12-13", "total": 41, "defect": 0.34},
            {"date": "2024-12-14", "total": 44, "defect": 0.37},
            {"date": "2024-12-15", "total": 44, "defect": 0.35},
        ][-days:]

    @staticmethod
    def get_oee_trend(days: int = 7) -> list:
        return [
            {"date": "2024-12-09", "oee": 76.5, "availability": 90.2, "performance": 88.5, "quality": 95.8},
            {"date": "2024-12-10", "oee": 78.2, "availability": 91.5, "performance": 89.2, "quality": 95.9},
            {"date": "2024-12-11", "oee": 75.8, "availability": 88.5, "performance": 89.5, "quality": 95.7},
            {"date": "2024-12-12", "oee": 79.5, "availability": 92.0, "performance": 90.0, "quality": 96.0},
            {"date": "2024-12-13", "oee": 77.8, "availability": 90.8, "performance": 89.5, "quality": 95.8},
            {"date": "2024-12-14", "oee": 78.5, "availability": 91.2, "performance": 89.8, "quality": 95.9},
            {"date": "2024-12-15", "oee": 78.2, "availability": 91.0, "performance": 89.5, "quality": 96.0},
        ][-days:]


# ==================== Helper Functions ====================

def format_time_ago(dt: datetime) -> str:
    """datetime을 '~분 전', '~시간 전' 형식으로 변환"""
    if not dt:
        return "알 수 없음"

    now = datetime.now()
    if dt.tzinfo:
        now = datetime.now(dt.tzinfo)

    diff = now - dt
    minutes = int(diff.total_seconds() / 60)

    if minutes < 1:
        return "방금 전"
    elif minutes < 60:
        return f"{minutes}분 전"
    elif minutes < 1440:
        hours = minutes // 60
        return f"{hours}시간 전"
    else:
        days = minutes // 1440
        return f"{days}일 전"


def decimal_to_float(value) -> float:
    """Decimal을 float으로 변환"""
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


# ==================== API Endpoints ====================

@router.get("/summary", response_model=MESDashboardResponse)
async def get_mes_dashboard(db: AsyncSession = Depends(get_db)):
    """MES 대시보드 전체 데이터 조회"""
    try:
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # KPI 데이터 조회
        kpis = await _get_production_kpis(db, today_start, today_end)

        # 라인 현황 조회
        line_status = await _get_line_status_data(db, today_start, today_end)

        # 설비 요약 조회
        equipment_summary = await _get_equipment_summary_data(db)

        # OEE 데이터 조회
        oee_data = await _get_oee_data(db, today)

        # 품질 요약 조회
        quality_summary = await _get_quality_summary_data(db, today_start, today_end)

        # 시간별 생산 데이터 조회
        hourly_production = await _get_hourly_production_data(db, today)

        # 알림 조회
        alerts = await _get_alerts_data(db)

        return MESDashboardResponse(
            kpis=kpis,
            line_status=line_status,
            equipment_summary=equipment_summary,
            oee_data=oee_data,
            quality_summary=quality_summary,
            hourly_production=hourly_production,
            alerts=alerts,
        )

    except Exception as e:
        # 에러 시 Mock 데이터 반환
        return MESDashboardResponse(
            kpis=MockDataService.get_kpis(),
            line_status=MockDataService.get_line_status(),
            equipment_summary=MockDataService.get_equipment_summary(),
            oee_data=MockDataService.get_oee_data(),
            quality_summary=MockDataService.get_quality_summary(),
            hourly_production=MockDataService.get_hourly_production(),
            alerts=MockDataService.get_alerts(),
        )


async def _get_production_kpis(db: AsyncSession, today_start: datetime, today_end: datetime) -> List[ProductionKPI]:
    """생산 KPI 데이터 조회"""
    try:
        # 금일 생산 실적 조회
        prod_query = select(
            func.coalesce(func.sum(ProductionResult.good_qty), 0).label('total_good'),
            func.coalesce(func.sum(ProductionResult.defect_qty), 0).label('total_defect'),
            func.coalesce(func.sum(ProductionResult.output_qty), 0).label('total_output')
        ).where(
            and_(
                ProductionResult.result_timestamp >= today_start,
                ProductionResult.result_timestamp <= today_end
            )
        )
        result = await db.execute(prod_query)
        prod_data = result.one_or_none()

        if not prod_data or prod_data.total_output == 0:
            return MockDataService.get_kpis()

        total_good = decimal_to_float(prod_data.total_good)
        total_defect = decimal_to_float(prod_data.total_defect)
        total_output = decimal_to_float(prod_data.total_output)

        # 목표 생산량 조회
        target_query = select(
            func.coalesce(func.sum(ProductionOrder.target_qty), 0)
        ).where(
            ProductionOrder.order_date == today_start.date()
        )
        target_result = await db.execute(target_query)
        target_qty = decimal_to_float(target_result.scalar() or 15000)

        # 달성률 계산
        achievement_rate = (total_good / target_qty * 100) if target_qty > 0 else 0

        # 불량률 계산
        defect_rate = (total_defect / total_output * 100) if total_output > 0 else 0

        # OEE 조회 (평균)
        oee_query = select(func.avg(EquipmentOEE.oee)).where(
            EquipmentOEE.calculated_date == today_start.date()
        )
        oee_result = await db.execute(oee_query)
        avg_oee = decimal_to_float(oee_result.scalar() or 78.2)

        # 가동률 조회
        availability_query = select(func.avg(EquipmentOEE.availability)).where(
            EquipmentOEE.calculated_date == today_start.date()
        )
        avail_result = await db.execute(availability_query)
        avg_availability = decimal_to_float(avail_result.scalar() or 87.5)

        return [
            ProductionKPI(
                title="금일 생산실적",
                value=f"{int(total_good):,}",
                raw_value=total_good,
                target=target_qty,
                achievement_rate=round(achievement_rate, 1),
                unit="EA"
            ),
            ProductionKPI(
                title="가동률",
                value=f"{avg_availability:.1f}%",
                raw_value=avg_availability,
                target=90.0,
                achievement_rate=round(avg_availability / 90.0 * 100, 1),
                unit="%"
            ),
            ProductionKPI(
                title="종합 OEE",
                value=f"{avg_oee:.1f}%",
                raw_value=avg_oee,
                target=85.0,
                achievement_rate=round(avg_oee / 85.0 * 100, 1),
                unit="%"
            ),
            ProductionKPI(
                title="불량률",
                value=f"{defect_rate:.2f}%",
                raw_value=defect_rate,
                target=0.5,
                achievement_rate=round((0.5 / defect_rate * 100) if defect_rate > 0 else 100, 1),
                unit="%"
            ),
        ]

    except Exception as e:
        return MockDataService.get_kpis()


async def _get_line_status_data(db: AsyncSession, today_start: datetime, today_end: datetime) -> List[LineStatus]:
    """라인 현황 데이터 조회"""
    try:
        query = select(ProductionLine).where(ProductionLine.is_active == True)
        result = await db.execute(query)
        lines = result.scalars().all()

        if not lines:
            return MockDataService.get_line_status()

        line_status_list = []
        for line in lines:
            # 해당 라인의 금일 생산 실적 조회
            prod_query = select(
                func.coalesce(func.sum(ProductionResult.good_qty), 0).label('produced'),
                func.coalesce(func.sum(ProductionResult.defect_qty), 0).label('defect')
            ).where(
                and_(
                    ProductionResult.line_code == line.line_code,
                    ProductionResult.result_timestamp >= today_start,
                    ProductionResult.result_timestamp <= today_end
                )
            )
            prod_result = await db.execute(prod_query)
            prod_data = prod_result.one_or_none()

            produced_qty = decimal_to_float(prod_data.produced) if prod_data else 0
            defect_qty = decimal_to_float(prod_data.defect) if prod_data else 0

            # 목표 수량 조회
            target_query = select(
                func.coalesce(func.sum(ProductionOrder.target_qty), 0)
            ).where(
                and_(
                    ProductionOrder.line_code == line.line_code,
                    ProductionOrder.order_date == today_start.date()
                )
            )
            target_result = await db.execute(target_query)
            target_qty = decimal_to_float(target_result.scalar() or 0)

            # 현재 작업 중인 제품 조회
            current_order_query = select(ProductionOrder).where(
                and_(
                    ProductionOrder.line_code == line.line_code,
                    ProductionOrder.status == 'running'
                )
            ).order_by(ProductionOrder.planned_start.desc()).limit(1)
            current_order_result = await db.execute(current_order_query)
            current_order = current_order_result.scalar_one_or_none()

            current_product = current_order.product_name if current_order else None

            # OEE 조회
            oee_query = select(EquipmentOEE).where(
                and_(
                    EquipmentOEE.line_code == line.line_code,
                    EquipmentOEE.calculated_date == today_start.date()
                )
            ).order_by(EquipmentOEE.created_at.desc()).limit(1)
            oee_result = await db.execute(oee_query)
            oee_data = oee_result.scalar_one_or_none()

            oee = decimal_to_float(oee_data.oee) if oee_data else 0

            # 진행률 계산
            progress = (produced_qty / target_qty * 100) if target_qty > 0 else 0

            # 불량률 계산
            total_output = produced_qty + defect_qty
            defect_rate = (defect_qty / total_output * 100) if total_output > 0 else 0

            # 상태 결정
            status = line.status.value if line.status else "idle"
            if status not in ["running", "idle", "down", "maintenance"]:
                status = "idle"

            line_status_list.append(LineStatus(
                line_code=line.line_code,
                line_name=line.line_name or line.line_code,
                status=status,
                current_product=current_product,
                target_qty=int(target_qty),
                produced_qty=int(produced_qty),
                progress=round(progress, 1),
                oee=round(oee, 1),
                defect_rate=round(defect_rate, 2)
            ))

        return line_status_list if line_status_list else MockDataService.get_line_status()

    except Exception as e:
        return MockDataService.get_line_status()


async def _get_equipment_summary_data(db: AsyncSession) -> EquipmentSummary:
    """설비 요약 데이터 조회"""
    try:
        # 전체 설비 수
        total_query = select(func.count()).select_from(EquipmentMaster).where(EquipmentMaster.is_active == True)
        total_result = await db.execute(total_query)
        total = total_result.scalar() or 0

        if total == 0:
            return MockDataService.get_equipment_summary()

        # 설비 상태별 집계
        status_query = select(
            EquipmentStatus.status,
            func.count().label('count')
        ).group_by(EquipmentStatus.status)
        status_result = await db.execute(status_query)
        status_counts = {row.status: row.count for row in status_result.all()}

        running = status_counts.get('running', 0)
        idle = status_counts.get('idle', 0)
        down = status_counts.get('down', 0) + status_counts.get('error', 0)
        maintenance = status_counts.get('maintenance', 0)

        # 평균 OEE 조회
        today = date.today()
        oee_query = select(func.avg(EquipmentOEE.oee)).where(
            EquipmentOEE.calculated_date == today
        )
        oee_result = await db.execute(oee_query)
        avg_oee = decimal_to_float(oee_result.scalar() or 78.2)

        return EquipmentSummary(
            total=total,
            running=running,
            idle=idle,
            down=down,
            maintenance=maintenance,
            avg_oee=round(avg_oee, 1)
        )

    except Exception as e:
        return MockDataService.get_equipment_summary()


async def _get_oee_data(db: AsyncSession, today: date) -> List[OEEData]:
    """OEE 데이터 조회"""
    try:
        # 라인별 OEE 조회
        query = select(EquipmentOEE).where(
            EquipmentOEE.calculated_date == today
        ).order_by(EquipmentOEE.line_code)

        result = await db.execute(query)
        oee_records = result.scalars().all()

        if not oee_records:
            return MockDataService.get_oee_data()

        # 라인별로 가장 최신 OEE 데이터 사용
        line_oee_map = {}
        for record in oee_records:
            if record.line_code not in line_oee_map:
                line_oee_map[record.line_code] = record

        oee_list = []
        for line_code, record in line_oee_map.items():
            oee_list.append(OEEData(
                line_code=line_code,
                availability=round(decimal_to_float(record.availability), 1),
                performance=round(decimal_to_float(record.performance), 1),
                quality=round(decimal_to_float(record.quality), 1),
                oee=round(decimal_to_float(record.oee), 1)
            ))

        return oee_list if oee_list else MockDataService.get_oee_data()

    except Exception as e:
        return MockDataService.get_oee_data()


async def _get_quality_summary_data(db: AsyncSession, today_start: datetime, today_end: datetime) -> QualitySummary:
    """품질 요약 데이터 조회"""
    try:
        # 검사 결과 집계
        insp_query = select(
            func.count().label('total'),
            func.sum(case((InspectionResult.result == 'pass', 1), else_=0)).label('passed'),
            func.sum(case((InspectionResult.result == 'fail', 1), else_=0)).label('failed')
        ).where(
            and_(
                InspectionResult.inspection_time >= today_start,
                InspectionResult.inspection_time <= today_end
            )
        )
        insp_result = await db.execute(insp_query)
        insp_data = insp_result.one_or_none()

        total_inspected = insp_data.total or 0 if insp_data else 0
        total_passed = insp_data.passed or 0 if insp_data else 0
        total_failed = insp_data.failed or 0 if insp_data else 0

        if total_inspected == 0:
            return MockDataService.get_quality_summary()

        pass_rate = (total_passed / total_inspected * 100) if total_inspected > 0 else 0
        defect_rate = (total_failed / total_inspected * 100) if total_inspected > 0 else 0

        # 상위 불량 유형 조회
        defect_query = select(
            DefectDetail.defect_code,
            DefectDetail.defect_name,
            func.count().label('count')
        ).where(
            and_(
                DefectDetail.detected_at >= today_start,
                DefectDetail.detected_at <= today_end
            )
        ).group_by(
            DefectDetail.defect_code,
            DefectDetail.defect_name
        ).order_by(func.count().desc()).limit(5)

        defect_result = await db.execute(defect_query)
        defect_rows = defect_result.all()

        total_defects = sum(row.count for row in defect_rows) if defect_rows else 0

        top_defects = []
        for row in defect_rows:
            ratio = (row.count / total_defects * 100) if total_defects > 0 else 0
            top_defects.append({
                "defect_code": row.defect_code or "D000",
                "defect_name": row.defect_name or "기타",
                "count": row.count,
                "ratio": round(ratio, 1)
            })

        if not top_defects:
            return MockDataService.get_quality_summary()

        return QualitySummary(
            total_inspected=total_inspected,
            total_passed=total_passed,
            total_failed=total_failed,
            pass_rate=round(pass_rate, 2),
            defect_rate=round(defect_rate, 2),
            top_defects=top_defects
        )

    except Exception as e:
        return MockDataService.get_quality_summary()


async def _get_hourly_production_data(db: AsyncSession, today: date) -> List[HourlyProductionData]:
    """시간별 생산 데이터 조회"""
    try:
        today_start = datetime.combine(today, datetime.min.time())

        # 시간별 생산 실적 집계
        hourly_data = []
        for hour in range(8, 18):  # 8시부터 17시까지
            hour_start = today_start.replace(hour=hour, minute=0, second=0)
            hour_end = today_start.replace(hour=hour, minute=59, second=59)

            query = select(
                func.coalesce(func.sum(ProductionResult.good_qty), 0).label('actual'),
                func.coalesce(func.sum(ProductionResult.defect_qty), 0).label('defect')
            ).where(
                and_(
                    ProductionResult.result_timestamp >= hour_start,
                    ProductionResult.result_timestamp <= hour_end
                )
            )
            result = await db.execute(query)
            data = result.one_or_none()

            actual = int(decimal_to_float(data.actual)) if data else 0
            defect = int(decimal_to_float(data.defect)) if data else 0

            # 점심시간(12시)은 목표 절반
            target = 250 if hour == 12 else 500

            hourly_data.append(HourlyProductionData(
                hour=f"{hour:02d}:00",
                target=target,
                actual=actual,
                defect=defect
            ))

        # 데이터가 모두 0이면 Mock 데이터 반환
        if all(h.actual == 0 for h in hourly_data):
            return MockDataService.get_hourly_production()

        return hourly_data

    except Exception as e:
        return MockDataService.get_hourly_production()


async def _get_alerts_data(db: AsyncSession) -> List[MESAlert]:
    """알림 데이터 조회"""
    try:
        # 최근 알림 조회
        query = select(Notification).where(
            Notification.is_read == False
        ).order_by(Notification.created_at.desc()).limit(10)

        result = await db.execute(query)
        notifications = result.scalars().all()

        if not notifications:
            return MockDataService.get_alerts()

        alerts = []
        for notif in notifications:
            # 알림 타입 매핑
            notif_type = "info"
            severity = "low"

            if notif.notification_type:
                type_lower = notif.notification_type.lower()
                if "error" in type_lower or "critical" in type_lower:
                    notif_type = "error"
                    severity = "high"
                elif "warning" in type_lower or "alert" in type_lower:
                    notif_type = "warning"
                    severity = "medium"
                elif "success" in type_lower:
                    notif_type = "info"
                    severity = "low"

            alerts.append(MESAlert(
                type=notif_type,
                severity=severity,
                message=notif.message or notif.title,
                source=notif.link_url or "SYSTEM",
                time=format_time_ago(notif.created_at)
            ))

        return alerts if alerts else MockDataService.get_alerts()

    except Exception as e:
        return MockDataService.get_alerts()


@router.get("/kpis", response_model=List[ProductionKPI])
async def get_mes_kpis(db: AsyncSession = Depends(get_db)):
    """MES KPI 조회"""
    try:
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        return await _get_production_kpis(db, today_start, today_end)

    except Exception as e:
        return MockDataService.get_kpis()


@router.get("/lines", response_model=List[LineStatus])
async def get_line_status(db: AsyncSession = Depends(get_db)):
    """라인별 현황 조회"""
    try:
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        return await _get_line_status_data(db, today_start, today_end)

    except Exception as e:
        return MockDataService.get_line_status()


@router.get("/equipment/summary", response_model=EquipmentSummary)
async def get_equipment_summary(db: AsyncSession = Depends(get_db)):
    """설비 요약 조회"""
    try:
        return await _get_equipment_summary_data(db)

    except Exception as e:
        return MockDataService.get_equipment_summary()


@router.get("/oee", response_model=List[OEEData])
async def get_oee_data(
    line_code: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """OEE 데이터 조회"""
    try:
        today = date.today()
        oee_list = await _get_oee_data(db, today)

        if line_code:
            return [d for d in oee_list if d.line_code == line_code]

        return oee_list

    except Exception as e:
        data = MockDataService.get_oee_data()
        if line_code:
            return [d for d in data if d.line_code == line_code]
        return data


@router.get("/quality/summary", response_model=QualitySummary)
async def get_quality_summary(db: AsyncSession = Depends(get_db)):
    """품질 요약 조회"""
    try:
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        return await _get_quality_summary_data(db, today_start, today_end)

    except Exception as e:
        return MockDataService.get_quality_summary()


@router.get("/hourly-production", response_model=List[HourlyProductionData])
async def get_hourly_production(
    line_code: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """시간별 생산 현황 조회"""
    try:
        today = date.today()
        return await _get_hourly_production_data(db, today)

    except Exception as e:
        return MockDataService.get_hourly_production()


@router.get("/alerts", response_model=List[MESAlert])
async def get_mes_alerts(
    limit: int = Query(10, ge=1, le=50),
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """MES 알림 목록 조회"""
    try:
        alerts = await _get_alerts_data(db)

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        return alerts[:limit]

    except Exception as e:
        alerts = MockDataService.get_alerts()

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        return alerts[:limit]


@router.get("/defect-trend")
async def get_defect_trend(
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """불량 추이 조회"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # 일별 불량 집계
        query = select(
            func.date(ProductionResult.result_timestamp).label('date'),
            func.coalesce(func.sum(ProductionResult.defect_qty), 0).label('total_defect'),
            func.coalesce(func.sum(ProductionResult.output_qty), 0).label('total_output')
        ).where(
            and_(
                func.date(ProductionResult.result_timestamp) >= start_date,
                func.date(ProductionResult.result_timestamp) <= end_date
            )
        ).group_by(
            func.date(ProductionResult.result_timestamp)
        ).order_by(func.date(ProductionResult.result_timestamp))

        result = await db.execute(query)
        rows = result.all()

        if not rows:
            return MockDataService.get_defect_trend(days)

        trend_data = []
        for row in rows:
            total_defect = decimal_to_float(row.total_defect)
            total_output = decimal_to_float(row.total_output)
            defect_rate = (total_defect / total_output * 100) if total_output > 0 else 0

            trend_data.append({
                "date": row.date.strftime("%Y-%m-%d") if hasattr(row.date, 'strftime') else str(row.date),
                "total": int(total_defect),
                "defect": round(defect_rate, 2)
            })

        return trend_data if trend_data else MockDataService.get_defect_trend(days)

    except Exception as e:
        return MockDataService.get_defect_trend(days)


@router.get("/oee-trend")
async def get_oee_trend(
    line_code: Optional[str] = None,
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    """OEE 추이 조회"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # 일별 OEE 조회
        query = select(
            EquipmentOEE.calculated_date,
            func.avg(EquipmentOEE.oee).label('oee'),
            func.avg(EquipmentOEE.availability).label('availability'),
            func.avg(EquipmentOEE.performance).label('performance'),
            func.avg(EquipmentOEE.quality).label('quality')
        ).where(
            and_(
                EquipmentOEE.calculated_date >= start_date,
                EquipmentOEE.calculated_date <= end_date
            )
        )

        if line_code:
            query = query.where(EquipmentOEE.line_code == line_code)

        query = query.group_by(EquipmentOEE.calculated_date).order_by(EquipmentOEE.calculated_date)

        result = await db.execute(query)
        rows = result.all()

        if not rows:
            return MockDataService.get_oee_trend(days)

        trend_data = []
        for row in rows:
            trend_data.append({
                "date": row.calculated_date.strftime("%Y-%m-%d") if hasattr(row.calculated_date, 'strftime') else str(row.calculated_date),
                "oee": round(decimal_to_float(row.oee), 1),
                "availability": round(decimal_to_float(row.availability), 1),
                "performance": round(decimal_to_float(row.performance), 1),
                "quality": round(decimal_to_float(row.quality), 1)
            })

        return trend_data if trend_data else MockDataService.get_oee_trend(days)

    except Exception as e:
        return MockDataService.get_oee_trend(days)
