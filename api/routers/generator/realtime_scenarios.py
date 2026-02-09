"""
Realtime Scenario Execution API
Endpoints for executing scenarios that directly modify database in real-time
"""
import sys
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

# Add data-generator to path for importing scenario executor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data-generator'))

from api.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/realtime-scenarios", tags=["Realtime Scenarios"])


# ============ Pydantic Models ============

class ParameterOption(BaseModel):
    """Option for select-type parameters"""
    value: str
    label: str


class ScenarioParameter(BaseModel):
    """Parameter definition for a scenario"""
    name: str
    type: str  # select, number, date, multi_select
    label: str
    description: Optional[str] = None
    required: bool = True
    options: Optional[List[ParameterOption]] = None  # for select/multi_select
    source: Optional[str] = None  # DB table to fetch options from
    min: Optional[float] = None  # for number
    max: Optional[float] = None  # for number
    default: Optional[Any] = None


class ScenarioInfo(BaseModel):
    """Scenario information returned to UI"""
    id: str
    name: str
    description: str
    category: str
    severity: str
    icon: str
    parameters: List[ScenarioParameter]


class ScenarioExecuteRequest(BaseModel):
    """Request to execute a scenario"""
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ScenarioExecuteResponse(BaseModel):
    """Response from scenario execution"""
    success: bool
    scenario_id: str
    scenario_name: str
    message: str
    affected_records: int = 0
    details: Optional[Dict[str, Any]] = None
    executed_at: datetime = Field(default_factory=datetime.now)


class CategoryInfo(BaseModel):
    """Category information"""
    id: str
    name: str
    icon: str
    scenario_count: int


# ============ Scenario Definitions ============

# Full scenario definitions with parameters
REALTIME_SCENARIOS = {
    # Quality Scenarios
    "defect_spike": {
        "id": "QS001",
        "name": "불량률 급증",
        "description": "특정 라인에서 불량률이 급격히 증가하는 시나리오. 실시간으로 불량 레코드를 생성합니다.",
        "category": "quality",
        "severity": "high",
        "icon": "AlertTriangle",
        "parameters": [
            {"name": "line_code", "type": "select", "label": "생산 라인", "source": "mes_production_line", "required": True},
            {"name": "defect_rate", "type": "number", "label": "불량률 (%)", "min": 5, "max": 50, "default": 15, "required": True},
            {"name": "defect_type", "type": "select", "label": "불량 유형", "options": [
                {"value": "SOLDER", "label": "납땜 불량"},
                {"value": "COMPONENT", "label": "부품 불량"},
                {"value": "PLACEMENT", "label": "위치 불량"},
                {"value": "BRIDGE", "label": "브릿지"},
                {"value": "MISSING", "label": "미삽입"}
            ], "default": "SOLDER", "required": True},
            {"name": "duration_hours", "type": "number", "label": "지속 시간", "min": 1, "max": 24, "default": 4, "required": True}
        ]
    },
    "quality_hold": {
        "id": "QS002",
        "name": "품질 홀드",
        "description": "특정 LOT에 대해 품질 홀드를 적용합니다. 출하 및 이동이 제한됩니다.",
        "category": "quality",
        "severity": "high",
        "icon": "Ban",
        "parameters": [
            {"name": "product_code", "type": "select", "label": "제품", "source": "erp_product", "required": True},
            {"name": "hold_reason", "type": "select", "label": "홀드 사유", "options": [
                {"value": "DEFECT_RATE", "label": "불량률 초과"},
                {"value": "CUSTOMER_COMPLAINT", "label": "고객 불만"},
                {"value": "SPEC_DEVIATION", "label": "규격 이탈"},
                {"value": "MATERIAL_ISSUE", "label": "자재 문제"}
            ], "required": True},
            {"name": "affected_lots", "type": "number", "label": "영향 LOT 수", "min": 1, "max": 50, "default": 5, "required": True}
        ]
    },

    # Equipment Scenarios
    "equipment_breakdown": {
        "id": "EQ001",
        "name": "설비 고장",
        "description": "특정 설비에 돌발 고장을 발생시킵니다. 생산이 즉시 중단됩니다.",
        "category": "equipment",
        "severity": "critical",
        "icon": "AlertOctagon",
        "parameters": [
            {"name": "equipment_code", "type": "select", "label": "설비", "source": "mes_equipment", "required": True},
            {"name": "failure_type", "type": "select", "label": "고장 유형", "options": [
                {"value": "MECHANICAL", "label": "기계적 고장"},
                {"value": "ELECTRICAL", "label": "전기적 고장"},
                {"value": "SOFTWARE", "label": "소프트웨어 오류"},
                {"value": "SENSOR", "label": "센서 오류"},
                {"value": "MOTOR", "label": "모터 고장"}
            ], "required": True},
            {"name": "downtime_hours", "type": "number", "label": "예상 복구 시간", "min": 0.5, "max": 48, "default": 4, "required": True}
        ]
    },
    "oee_degradation": {
        "id": "EQ002",
        "name": "OEE 저하",
        "description": "특정 라인의 OEE가 점진적으로 저하되는 시나리오를 시뮬레이션합니다.",
        "category": "equipment",
        "severity": "medium",
        "icon": "TrendingDown",
        "parameters": [
            {"name": "line_code", "type": "select", "label": "생산 라인", "source": "mes_production_line", "required": True},
            {"name": "target_oee", "type": "number", "label": "목표 OEE (%)", "min": 30, "max": 80, "default": 65, "required": True},
            {"name": "degradation_days", "type": "number", "label": "저하 기간 (일)", "min": 1, "max": 30, "default": 7, "required": True},
            {"name": "cause", "type": "select", "label": "저하 원인", "options": [
                {"value": "WEAR", "label": "설비 마모"},
                {"value": "CALIBRATION", "label": "캘리브레이션 필요"},
                {"value": "MATERIAL", "label": "자재 품질 저하"},
                {"value": "OPERATOR", "label": "작업자 숙련도"}
            ], "default": "WEAR", "required": True}
        ]
    },
    "preventive_maintenance": {
        "id": "EQ003",
        "name": "예방보전 일정",
        "description": "설비에 예방보전 일정을 등록합니다. 해당 시간에 생산이 중단됩니다.",
        "category": "equipment",
        "severity": "low",
        "icon": "Wrench",
        "parameters": [
            {"name": "equipment_codes", "type": "multi_select", "label": "설비 선택", "source": "mes_equipment", "required": True},
            {"name": "maintenance_date", "type": "date", "label": "보전 일자", "required": True},
            {"name": "maintenance_type", "type": "select", "label": "보전 유형", "options": [
                {"value": "DAILY", "label": "일상점검"},
                {"value": "WEEKLY", "label": "주간점검"},
                {"value": "MONTHLY", "label": "월간점검"},
                {"value": "OVERHAUL", "label": "오버홀"}
            ], "required": True},
            {"name": "duration_hours", "type": "number", "label": "예상 소요시간", "min": 0.5, "max": 24, "default": 2, "required": True}
        ]
    },

    # Production Scenarios
    "urgent_order": {
        "id": "PR001",
        "name": "긴급 수주",
        "description": "긴급 주문을 생성합니다. 영업주문, 작업지시, MES 지시가 즉시 생성됩니다.",
        "category": "production",
        "severity": "high",
        "icon": "Zap",
        "parameters": [
            {"name": "customer_code", "type": "select", "label": "고객", "source": "erp_customer", "required": True},
            {"name": "product_code", "type": "select", "label": "제품", "source": "erp_product", "required": True},
            {"name": "quantity", "type": "number", "label": "수량", "min": 100, "max": 10000, "default": 1000, "required": True},
            {"name": "due_days", "type": "number", "label": "납기 (일)", "min": 1, "max": 14, "default": 3, "required": True},
            {"name": "priority", "type": "select", "label": "우선순위", "options": [
                {"value": "URGENT", "label": "긴급"},
                {"value": "HIGH", "label": "높음"},
                {"value": "NORMAL", "label": "보통"}
            ], "default": "URGENT", "required": True}
        ]
    },
    "production_delay": {
        "id": "PR002",
        "name": "생산 지연",
        "description": "진행 중인 작업지시에 지연을 발생시킵니다.",
        "category": "production",
        "severity": "medium",
        "icon": "Clock",
        "parameters": [
            {"name": "work_order_id", "type": "select", "label": "작업지시", "source": "erp_work_order", "required": True},
            {"name": "delay_days", "type": "number", "label": "지연 일수", "min": 1, "max": 14, "default": 3, "required": True},
            {"name": "delay_reason", "type": "select", "label": "지연 사유", "options": [
                {"value": "MATERIAL", "label": "자재 미입고"},
                {"value": "EQUIPMENT", "label": "설비 고장"},
                {"value": "QUALITY", "label": "품질 문제"},
                {"value": "MANPOWER", "label": "인력 부족"},
                {"value": "SCHEDULE", "label": "일정 변경"}
            ], "required": True}
        ]
    },
    "shift_change": {
        "id": "PR003",
        "name": "근무 교대 변경",
        "description": "특정 라인의 근무 교대 패턴을 변경합니다.",
        "category": "production",
        "severity": "low",
        "icon": "RefreshCw",
        "parameters": [
            {"name": "line_code", "type": "select", "label": "생산 라인", "source": "mes_production_line", "required": True},
            {"name": "new_shift", "type": "select", "label": "새 교대 패턴", "options": [
                {"value": "2SHIFT", "label": "2교대"},
                {"value": "3SHIFT", "label": "3교대"},
                {"value": "DAY_ONLY", "label": "주간 전용"},
                {"value": "24H", "label": "24시간 연속"}
            ], "required": True},
            {"name": "effective_date", "type": "date", "label": "적용일", "required": True}
        ]
    },

    # Material Scenarios
    "material_shortage": {
        "id": "MT001",
        "name": "자재 부족",
        "description": "특정 자재의 재고를 감소시켜 부족 상황을 시뮬레이션합니다.",
        "category": "material",
        "severity": "high",
        "icon": "PackageMinus",
        "parameters": [
            {"name": "material_code", "type": "select", "label": "자재", "source": "erp_material", "required": True},
            {"name": "shortage_rate", "type": "number", "label": "부족률 (%)", "min": 10, "max": 90, "default": 50, "required": True},
            {"name": "warehouse_code", "type": "select", "label": "창고", "source": "erp_warehouse", "required": True}
        ]
    },
    "incoming_inspection_fail": {
        "id": "MT002",
        "name": "수입검사 불합격",
        "description": "입고된 자재에 대해 수입검사 불합격 처리합니다.",
        "category": "material",
        "severity": "medium",
        "icon": "XCircle",
        "parameters": [
            {"name": "vendor_code", "type": "select", "label": "공급업체", "source": "erp_vendor", "required": True},
            {"name": "material_code", "type": "select", "label": "자재", "source": "erp_material", "required": True},
            {"name": "rejection_rate", "type": "number", "label": "불합격률 (%)", "min": 10, "max": 100, "default": 30, "required": True},
            {"name": "rejection_reason", "type": "select", "label": "불합격 사유", "options": [
                {"value": "DIMENSION", "label": "치수 불량"},
                {"value": "APPEARANCE", "label": "외관 불량"},
                {"value": "FUNCTION", "label": "기능 불량"},
                {"value": "CONTAMINATION", "label": "오염"},
                {"value": "DOCUMENTATION", "label": "서류 미비"}
            ], "required": True}
        ]
    },

    # Business Scenarios
    "order_cancellation": {
        "id": "BS001",
        "name": "주문 취소",
        "description": "기존 주문을 취소 처리합니다. 관련 작업지시도 함께 취소됩니다.",
        "category": "business",
        "severity": "high",
        "icon": "FileX",
        "parameters": [
            {"name": "sales_order_id", "type": "select", "label": "영업주문", "source": "erp_sales_order", "required": True},
            {"name": "cancel_reason", "type": "select", "label": "취소 사유", "options": [
                {"value": "CUSTOMER_REQUEST", "label": "고객 요청"},
                {"value": "SPEC_CHANGE", "label": "사양 변경"},
                {"value": "PRICE_ISSUE", "label": "가격 문제"},
                {"value": "DELIVERY_ISSUE", "label": "납기 문제"},
                {"value": "OTHER", "label": "기타"}
            ], "required": True}
        ]
    },
    "supplier_delay": {
        "id": "BS002",
        "name": "공급업체 납기 지연",
        "description": "특정 공급업체의 발주건에 납기 지연을 적용합니다.",
        "category": "business",
        "severity": "medium",
        "icon": "Truck",
        "parameters": [
            {"name": "vendor_code", "type": "select", "label": "공급업체", "source": "erp_vendor", "required": True},
            {"name": "delay_days", "type": "number", "label": "지연 일수", "min": 1, "max": 30, "default": 7, "required": True},
            {"name": "affect_open_orders", "type": "select", "label": "적용 범위", "options": [
                {"value": "ALL", "label": "모든 미결 발주"},
                {"value": "PENDING", "label": "미확정 발주만"},
                {"value": "CONFIRMED", "label": "확정 발주만"}
            ], "default": "ALL", "required": True}
        ]
    },

    # HR Scenarios
    "mass_absence": {
        "id": "HR001",
        "name": "대량 결근",
        "description": "특정 부서/라인에서 대량 결근 상황을 발생시킵니다.",
        "category": "hr",
        "severity": "high",
        "icon": "UserMinus",
        "parameters": [
            {"name": "department_code", "type": "select", "label": "부서", "source": "erp_department", "required": True},
            {"name": "absence_rate", "type": "number", "label": "결근률 (%)", "min": 10, "max": 50, "default": 20, "required": True},
            {"name": "absence_date", "type": "date", "label": "결근일", "required": True},
            {"name": "absence_reason", "type": "select", "label": "결근 사유", "options": [
                {"value": "SICK", "label": "병가"},
                {"value": "PERSONAL", "label": "개인사유"},
                {"value": "WEATHER", "label": "기상악화"},
                {"value": "STRIKE", "label": "파업"}
            ], "default": "SICK", "required": True}
        ]
    },
    "overtime_request": {
        "id": "HR002",
        "name": "초과근무 요청",
        "description": "특정 부서에 초과근무를 일괄 등록합니다.",
        "category": "hr",
        "severity": "low",
        "icon": "Clock4",
        "parameters": [
            {"name": "department_code", "type": "select", "label": "부서", "source": "erp_department", "required": True},
            {"name": "overtime_hours", "type": "number", "label": "초과근무 시간", "min": 1, "max": 8, "default": 2, "required": True},
            {"name": "overtime_date", "type": "date", "label": "근무일", "required": True},
            {"name": "overtime_type", "type": "select", "label": "근무 유형", "options": [
                {"value": "WEEKDAY", "label": "평일 연장"},
                {"value": "WEEKEND", "label": "휴일 근무"},
                {"value": "NIGHT", "label": "야간 근무"}
            ], "default": "WEEKDAY", "required": True}
        ]
    }
}

CATEGORY_INFO = {
    "quality": {"name": "품질 시나리오", "icon": "CheckCircle"},
    "equipment": {"name": "설비 시나리오", "icon": "Settings"},
    "production": {"name": "생산 시나리오", "icon": "Factory"},
    "material": {"name": "자재 시나리오", "icon": "Package"},
    "business": {"name": "영업/구매 시나리오", "icon": "Briefcase"},
    "hr": {"name": "인사 시나리오", "icon": "Users"}
}


# ============ Helper Functions ============

async def get_parameter_options_from_db(source: str, db: AsyncSession) -> List[ParameterOption]:
    """Fetch parameter options from database based on source table"""
    from sqlalchemy import text

    query_map = {
        # MES tables
        "mes_production_line": "SELECT line_code as value, line_code as label FROM mes_production_line ORDER BY line_code",
        "mes_equipment": "SELECT equipment_code as value, equipment_name as label FROM mes_equipment WHERE is_active = true ORDER BY equipment_code",
        # ERP tables (correct table names with _master suffix)
        "erp_product": "SELECT product_code as value, product_name as label FROM erp_product_master WHERE is_active = true ORDER BY product_code",
        "erp_customer": "SELECT customer_code as value, customer_name as label FROM erp_customer_master WHERE is_active = true ORDER BY customer_code",
        "erp_vendor": "SELECT vendor_code as value, vendor_name as label FROM erp_vendor_master WHERE is_active = true ORDER BY vendor_code",
        "erp_material": "SELECT product_code as value, product_name as label FROM erp_product_master WHERE is_active = true ORDER BY product_code",  # Using product_master as material
        "erp_warehouse": "SELECT warehouse_code as value, warehouse_code as label FROM erp_warehouse ORDER BY warehouse_code",
        "erp_work_order": "SELECT order_no as value, CONCAT(order_no, ' - ', product_code) as label FROM erp_work_order WHERE status IN ('PLANNED', 'RELEASED', 'IN_PROGRESS') ORDER BY order_no DESC LIMIT 50",
        "erp_sales_order": "SELECT order_no as value, CONCAT(order_no, ' - ', customer_code) as label FROM erp_sales_order WHERE status IN ('draft', 'confirmed') ORDER BY order_no DESC LIMIT 50",
        "erp_department": "SELECT department_code as value, department_name as label FROM erp_department ORDER BY department_code"
    }

    if source not in query_map:
        return []

    try:
        result = await db.execute(text(query_map[source]))
        rows = result.fetchall()
        return [ParameterOption(value=str(row[0]), label=str(row[1])) for row in rows]
    except Exception as e:
        print(f"Error fetching options for {source}: {e}")
        return []


# ============ API Endpoints ============

@router.get("/categories", response_model=List[CategoryInfo])
async def get_categories():
    """Get all scenario categories with counts"""
    category_counts = {}
    for scenario in REALTIME_SCENARIOS.values():
        cat = scenario["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return [
        CategoryInfo(
            id=cat_id,
            name=info["name"],
            icon=info["icon"],
            scenario_count=category_counts.get(cat_id, 0)
        )
        for cat_id, info in CATEGORY_INFO.items()
    ]


@router.get("/list", response_model=List[ScenarioInfo])
async def get_realtime_scenarios(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all realtime scenarios with parameter definitions"""
    scenarios = []

    for scenario_key, scenario in REALTIME_SCENARIOS.items():
        if category and scenario["category"] != category:
            continue

        # Build parameters with options
        params = []
        for p in scenario["parameters"]:
            param = ScenarioParameter(
                name=p["name"],
                type=p["type"],
                label=p["label"],
                description=p.get("description"),
                required=p.get("required", True),
                min=p.get("min"),
                max=p.get("max"),
                default=p.get("default"),
                source=p.get("source")
            )

            # Add static options
            if "options" in p:
                param.options = [ParameterOption(**opt) for opt in p["options"]]

            # Fetch options from DB if source is specified
            if p.get("source"):
                db_options = await get_parameter_options_from_db(p["source"], db)
                if db_options:
                    param.options = db_options

            params.append(param)

        scenarios.append(ScenarioInfo(
            id=scenario_key,
            name=scenario["name"],
            description=scenario["description"],
            category=scenario["category"],
            severity=scenario["severity"],
            icon=scenario["icon"],
            parameters=params
        ))

    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioInfo)
async def get_scenario_detail(
    scenario_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific scenario"""
    if scenario_id not in REALTIME_SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    scenario = REALTIME_SCENARIOS[scenario_id]

    # Build parameters with options
    params = []
    for p in scenario["parameters"]:
        param = ScenarioParameter(
            name=p["name"],
            type=p["type"],
            label=p["label"],
            description=p.get("description"),
            required=p.get("required", True),
            min=p.get("min"),
            max=p.get("max"),
            default=p.get("default"),
            source=p.get("source")
        )

        if "options" in p:
            param.options = [ParameterOption(**opt) for opt in p["options"]]

        if p.get("source"):
            db_options = await get_parameter_options_from_db(p["source"], db)
            if db_options:
                param.options = db_options

        params.append(param)

    return ScenarioInfo(
        id=scenario_id,
        name=scenario["name"],
        description=scenario["description"],
        category=scenario["category"],
        severity=scenario["severity"],
        icon=scenario["icon"],
        parameters=params
    )


@router.post("/{scenario_id}/execute", response_model=ScenarioExecuteResponse)
async def execute_scenario(
    scenario_id: str,
    request: ScenarioExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Execute a scenario with given parameters - directly modifies the database"""
    if scenario_id not in REALTIME_SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    scenario = REALTIME_SCENARIOS[scenario_id]

    # Validate required parameters
    for p in scenario["parameters"]:
        if p.get("required", True) and p["name"] not in request.parameters:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required parameter: {p['name']}"
            )

    try:
        # Import and use the scenario executor
        from scenario_executor import ScenarioExecutor

        executor = ScenarioExecutor()
        result = await executor.execute_scenario(scenario_id, request.parameters)

        return ScenarioExecuteResponse(
            success=result.get("success", False),
            scenario_id=scenario_id,
            scenario_name=scenario["name"],
            message=result.get("message", "Scenario executed"),
            affected_records=result.get("affected_records", 0),
            details=result.get("details")
        )

    except ImportError as e:
        # Fallback: Execute directly using SQL
        return await execute_scenario_direct(scenario_id, scenario, request.parameters, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario execution failed: {str(e)}")


async def execute_scenario_direct(
    scenario_id: str,
    scenario: dict,
    params: dict,
    db: AsyncSession
) -> ScenarioExecuteResponse:
    """Direct execution of scenarios using SQL when executor is not available"""
    from sqlalchemy import text
    import uuid
    from datetime import datetime, timedelta

    affected = 0
    details = {}

    try:
        if scenario_id == "defect_spike":
            # Create defect records in mes_defect_detail table
            line_code = params["line_code"]
            defect_rate = params["defect_rate"]
            defect_type = params["defect_type"]

            # Get recent production results for this line (using correct column names)
            # Use recent data if today's data doesn't exist
            result = await db.execute(text("""
                SELECT id, lot_no, good_qty, production_order_id, production_order_no, product_code
                FROM mes_production_result
                WHERE line_code = :line_code
                AND good_qty > 0
                ORDER BY result_timestamp DESC
                LIMIT 10
            """), {"line_code": line_code})

            results = result.fetchall()

            for row in results:
                defect_qty = int(row[2] * defect_rate / 100)
                if defect_qty > 0:
                    await db.execute(text("""
                        INSERT INTO mes_defect_detail (
                            id, tenant_id, production_order_id, production_order_no,
                            product_code, defect_timestamp, detection_point, line_code,
                            defect_code, defect_category, severity, defect_qty,
                            lot_no, inspector_id, created_at
                        ) VALUES (
                            :id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, :production_order_id, :production_order_no,
                            :product_code, NOW(), 'INLINE', :line_code,
                            :defect_code, :defect_category, 'MAJOR', :defect_qty,
                            :lot_no, 'SYSTEM', NOW()
                        )
                    """), {
                        "id": str(uuid.uuid4()),
                        "production_order_id": row[3],
                        "production_order_no": row[4],
                        "product_code": row[5],
                        "line_code": line_code,
                        "lot_no": row[1],
                        "defect_code": f"DEF_{defect_type}",
                        "defect_category": defect_type,
                        "defect_qty": defect_qty
                    })
                    affected += 1

            await db.commit()
            details = {"defect_type": defect_type, "records_created": affected}

        elif scenario_id == "equipment_breakdown":
            equipment_code = params["equipment_code"]
            failure_type = params["failure_type"]
            downtime_hours = params["downtime_hours"]

            # Get equipment id first
            eq_result = await db.execute(text("""
                SELECT id, line_code FROM mes_equipment WHERE equipment_code = :equipment_code
            """), {"equipment_code": equipment_code})
            eq_row = eq_result.fetchone()
            equipment_id = eq_row[0] if eq_row else None
            line_code = eq_row[1] if eq_row else None

            # Update equipment - set is_active to false as status column doesn't exist
            await db.execute(text("""
                UPDATE mes_equipment
                SET is_active = false,
                    updated_at = NOW()
                WHERE equipment_code = :equipment_code
            """), {"equipment_code": equipment_code})

            # Create downtime record in mes_downtime_event (correct table name)
            # downtime_type must be lowercase: breakdown, setup, material, quality, planned, other
            await db.execute(text("""
                INSERT INTO mes_downtime_event (
                    id, tenant_id, equipment_id, equipment_code, line_code,
                    start_time, duration_min, downtime_type, downtime_code, downtime_reason,
                    reported_by, created_at
                ) VALUES (
                    :id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, :equipment_id, :equipment_code, :line_code,
                    NOW(), :duration_min, :downtime_type, :downtime_code, :reason,
                    'SYSTEM', NOW()
                )
            """), {
                "id": str(uuid.uuid4()),
                "equipment_id": equipment_id,
                "equipment_code": equipment_code,
                "line_code": line_code,
                "duration_min": downtime_hours * 60,
                "downtime_type": "breakdown",  # must be lowercase
                "downtime_code": failure_type,
                "reason": f"Breakdown: {failure_type}"
            })

            await db.commit()
            affected = 1
            details = {"equipment": equipment_code, "expected_recovery": str(datetime.now() + timedelta(hours=downtime_hours))}

        elif scenario_id == "urgent_order":
            customer_code = params["customer_code"]
            product_code = params["product_code"]
            quantity = params["quantity"]
            due_days = params["due_days"]
            priority = params["priority"]

            order_no = f"SO-URG-{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # Get customer info
            cust_result = await db.execute(text("""
                SELECT id, customer_name FROM erp_customer_master WHERE customer_code = :customer_code
            """), {"customer_code": customer_code})
            cust_row = cust_result.fetchone()
            customer_id = cust_row[0] if cust_row else None
            customer_name = cust_row[1] if cust_row else customer_code

            # Create sales order (using correct erp_sales_order schema)
            # status must be lowercase: draft, confirmed, in_production, ready, shipped, invoiced, closed, cancelled
            await db.execute(text("""
                INSERT INTO erp_sales_order (
                    tenant_id, order_no, order_date, customer_id, customer_code, customer_name,
                    delivery_date, status, total_amount, tax_amount, currency,
                    remark, created_at
                ) VALUES (
                    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, :order_no, CURRENT_DATE, :customer_id, :customer_code, :customer_name,
                    CURRENT_DATE + :due_days * INTERVAL '1 day', 'confirmed', :total, :tax, 'KRW',
                    :remark, NOW()
                )
            """), {
                "order_no": order_no,
                "customer_id": customer_id,
                "customer_code": customer_code,
                "customer_name": customer_name,
                "due_days": due_days,
                "total": quantity * 100,  # Dummy unit price
                "tax": quantity * 10,
                "remark": f"긴급 주문 - 우선순위: {priority}"
            })

            await db.commit()
            affected = 1
            details = {"order_no": order_no, "product": product_code, "quantity": quantity}

        elif scenario_id == "material_shortage":
            material_code = params["material_code"]
            shortage_rate = params["shortage_rate"]
            warehouse_code = params["warehouse_code"]

            # Create inventory adjustment record (since erp_inventory table doesn't exist directly)
            # We'll create an inventory_adjustment record to simulate shortage
            await db.execute(text("""
                INSERT INTO erp_inventory_adjustment (
                    tenant_id, adjustment_no, adjustment_date, warehouse_code,
                    adjustment_type, status, reason, remark, created_at
                ) VALUES (
                    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
                    :adjustment_no, CURRENT_DATE, :warehouse_code,
                    'DECREASE', 'COMPLETED', 'SHORTAGE', :remark, NOW()
                )
                RETURNING id
            """), {
                "adjustment_no": f"ADJ-SHORT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "warehouse_code": warehouse_code,
                "remark": f"자재 부족 시뮬레이션: {material_code}, 부족률 {shortage_rate}%"
            })

            await db.commit()
            affected = 1
            details = {"material_code": material_code, "shortage_rate": shortage_rate, "warehouse": warehouse_code}

        else:
            return ScenarioExecuteResponse(
                success=False,
                scenario_id=scenario_id,
                scenario_name=scenario["name"],
                message=f"Scenario {scenario_id} is not yet implemented for direct execution",
                affected_records=0
            )

        return ScenarioExecuteResponse(
            success=True,
            scenario_id=scenario_id,
            scenario_name=scenario["name"],
            message=f"Scenario executed successfully. {affected} record(s) affected.",
            affected_records=affected,
            details=details
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database operation failed: {str(e)}")


@router.get("/{scenario_id}/parameters/{param_name}/options", response_model=List[ParameterOption])
async def get_parameter_options(
    scenario_id: str,
    param_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get options for a specific parameter (for dependent dropdowns)"""
    if scenario_id not in REALTIME_SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    scenario = REALTIME_SCENARIOS[scenario_id]

    for p in scenario["parameters"]:
        if p["name"] == param_name:
            if "options" in p:
                return [ParameterOption(**opt) for opt in p["options"]]
            if p.get("source"):
                return await get_parameter_options_from_db(p["source"], db)
            return []

    raise HTTPException(status_code=404, detail=f"Parameter {param_name} not found")
