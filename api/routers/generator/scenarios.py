"""
Generator Scenarios API
Endpoints for managing AI test scenarios
"""
from typing import List
from fastapi import APIRouter, HTTPException
from api.schemas.generator import (
    ScenarioResponse,
    ScenarioUpdate,
    ScenarioCategory,
    TriggerType,
    ApiResponse
)

router = APIRouter()

# In-memory scenario storage (would be loaded from YAML in production)
SCENARIOS = [
    # MES - 생산관리
    {"id": "production_target_miss", "name": "생산 목표 미달", "description": "일일 생산 목표 대비 실적이 부족한 상황", "category": ScenarioCategory.MES_PRODUCTION, "enabled": True, "ai_use_cases": ["CHECK", "FIND_CAUSE", "COMPARE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-01", "duration_days": 5},
    {"id": "productivity_spike", "name": "생산성 급증", "description": "예상보다 높은 생산성을 보이는 상황", "category": ScenarioCategory.MES_PRODUCTION, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "TREND"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-15", "duration_days": 7},
    {"id": "cycle_time_increase", "name": "사이클 타임 증가", "description": "표준 사이클 타임보다 실제 사이클 타임이 증가", "category": ScenarioCategory.MES_PRODUCTION, "enabled": True, "ai_use_cases": ["TREND", "FIND_CAUSE", "PREDICT"], "trigger_type": TriggerType.CONDITION},
    {"id": "work_order_delay", "name": "작업지시 지연 누적", "description": "작업지시 완료 지연이 누적되는 상황", "category": ScenarioCategory.MES_PRODUCTION, "enabled": False, "ai_use_cases": ["TREND", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-10", "duration_days": 10},
    {"id": "night_shift_efficiency", "name": "야간 생산 효율 저하", "description": "야간 시프트의 생산 효율이 주간 대비 낮음", "category": ScenarioCategory.MES_PRODUCTION, "enabled": True, "ai_use_cases": ["COMPARE", "FIND_CAUSE", "WHAT_IF"], "trigger_type": TriggerType.ALWAYS},

    # MES - 설비관리
    {"id": "predictive_maintenance", "name": "예지보전 필요", "description": "센서 데이터 기반 고장 예측", "category": ScenarioCategory.MES_EQUIPMENT, "enabled": True, "ai_use_cases": ["PREDICT", "DETECT_ANOMALY", "CHECK"], "trigger_type": TriggerType.CONDITION},
    {"id": "sudden_breakdown", "name": "돌발 고장", "description": "예기치 않은 설비 고장 발생", "category": ScenarioCategory.MES_EQUIPMENT, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "NOTIFY"], "trigger_type": TriggerType.RANDOM},
    {"id": "oee_degradation", "name": "OEE 저하", "description": "특정 라인의 OEE 점진적 저하", "category": ScenarioCategory.MES_EQUIPMENT, "enabled": True, "ai_use_cases": ["TREND", "CHECK", "COMPARE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-01", "duration_days": 7},
    {"id": "utilization_variance", "name": "설비 가동률 편차", "description": "동일 유형 설비간 가동률 차이", "category": ScenarioCategory.MES_EQUIPMENT, "enabled": False, "ai_use_cases": ["COMPARE", "RANK", "FIND_CAUSE"], "trigger_type": TriggerType.ALWAYS},
    {"id": "maintenance_overdue", "name": "보전 주기 초과", "description": "예방보전 주기를 초과한 설비 존재", "category": ScenarioCategory.MES_EQUIPMENT, "enabled": True, "ai_use_cases": ["CHECK", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.CONDITION},

    # MES - 품질관리
    {"id": "defect_rate_spike", "name": "불량률 급증", "description": "특정 라인에서 불량률이 급격히 증가", "category": ScenarioCategory.MES_QUALITY, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "CHECK"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-15", "duration_days": 3},
    {"id": "gradual_quality_degradation", "name": "점진적 품질 저하", "description": "설비 마모로 인한 품질 저하", "category": ScenarioCategory.MES_QUALITY, "enabled": True, "ai_use_cases": ["TREND", "PREDICT", "FIND_CAUSE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-01", "duration_days": 14},
    {"id": "spc_out_of_control", "name": "SPC 이탈", "description": "통계적 공정 관리 한계 이탈", "category": ScenarioCategory.MES_QUALITY, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "NOTIFY", "FIND_CAUSE"], "trigger_type": TriggerType.CONDITION},
    {"id": "product_quality_variance", "name": "제품별 품질 편차", "description": "특정 제품의 불량률이 높음", "category": ScenarioCategory.MES_QUALITY, "enabled": False, "ai_use_cases": ["COMPARE", "RANK", "FIND_CAUSE"], "trigger_type": TriggerType.ALWAYS},
    {"id": "inspection_error", "name": "검사 오류", "description": "AOI 검사 오탐지 증가", "category": ScenarioCategory.MES_QUALITY, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "CHECK"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-11-01", "duration_days": 5},

    # MES - 자재관리
    {"id": "vendor_quality_issue", "name": "공급업체 품질 문제", "description": "특정 공급업체 자재의 품질 문제", "category": ScenarioCategory.MES_MATERIAL, "enabled": True, "ai_use_cases": ["FIND_CAUSE", "DETECT_ANOMALY", "COMPARE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-20", "duration_days": 5},
    {"id": "feeder_error_increase", "name": "피더 에러 증가", "description": "SMT 피더 에러로 인한 부품 누락", "category": ScenarioCategory.MES_MATERIAL, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "TREND"], "trigger_type": TriggerType.CONDITION},
    {"id": "material_traceability", "name": "자재 추적성 이슈", "description": "불량 발생 시 LOT 추적 필요", "category": ScenarioCategory.MES_MATERIAL, "enabled": False, "ai_use_cases": ["FIND_CAUSE", "CHECK", "REPORT"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-05", "duration_days": 3},
    {"id": "material_input_error", "name": "자재 투입 오류", "description": "잘못된 자재가 투입된 상황", "category": ScenarioCategory.MES_MATERIAL, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "NOTIFY", "FIND_CAUSE"], "trigger_type": TriggerType.RANDOM},
    {"id": "inventory_shortage", "name": "재고 부족 예측", "description": "특정 자재의 재고 부족 예측", "category": ScenarioCategory.MES_MATERIAL, "enabled": True, "ai_use_cases": ["PREDICT", "NOTIFY", "CHECK"], "trigger_type": TriggerType.CONDITION},

    # MES - 시스템
    {"id": "seasonal_effect", "name": "계절적 영향", "description": "계절에 따른 환경 변화의 품질 영향", "category": ScenarioCategory.MES_SYSTEM, "enabled": True, "ai_use_cases": ["FIND_CAUSE", "TREND", "PREDICT"], "trigger_type": TriggerType.ALWAYS},
    {"id": "temperature_fluctuation", "name": "온도 급변", "description": "공장 내 온도 급격한 변화", "category": ScenarioCategory.MES_SYSTEM, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE"], "trigger_type": TriggerType.RANDOM},
    {"id": "system_latency", "name": "시스템 지연", "description": "MES 시스템 응답 지연", "category": ScenarioCategory.MES_SYSTEM, "enabled": False, "ai_use_cases": ["DETECT_ANOMALY", "NOTIFY", "CHECK"], "trigger_type": TriggerType.RANDOM},
    {"id": "shift_handover", "name": "교대 인수인계 이슈", "description": "교대 시점 정보 전달 누락", "category": ScenarioCategory.MES_SYSTEM, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "COMPARE"], "trigger_type": TriggerType.ALWAYS},
    {"id": "worker_skill_impact", "name": "작업자 숙련도 영향", "description": "작업자 숙련도에 따른 품질 차이", "category": ScenarioCategory.MES_SYSTEM, "enabled": True, "ai_use_cases": ["COMPARE", "FIND_CAUSE", "WHAT_IF"], "trigger_type": TriggerType.ALWAYS},

    # ERP - 영업관리
    {"id": "urgent_large_order", "name": "긴급 대량 수주", "description": "예상치 못한 대량 주문", "category": ScenarioCategory.ERP_SALES, "enabled": True, "ai_use_cases": ["WHAT_IF", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-10", "duration_days": 3},
    {"id": "order_cancellation", "name": "주문 취소 급증", "description": "주문 취소가 급격히 증가", "category": ScenarioCategory.ERP_SALES, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "TREND", "FIND_CAUSE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-11-15", "duration_days": 7},
    {"id": "delivery_delay_risk", "name": "납기 지연 위험", "description": "여러 주문의 납기일 준수 어려움", "category": ScenarioCategory.ERP_SALES, "enabled": True, "ai_use_cases": ["PREDICT", "CHECK", "NOTIFY"], "trigger_type": TriggerType.CONDITION},
    {"id": "seasonal_demand", "name": "계절성 수요 변동", "description": "계절에 따른 수요 패턴 변화", "category": ScenarioCategory.ERP_SALES, "enabled": True, "ai_use_cases": ["TREND", "PREDICT", "REPORT"], "trigger_type": TriggerType.ALWAYS},
    {"id": "customer_credit_risk", "name": "고객 신용 위험", "description": "특정 고객의 결제 지연 증가", "category": ScenarioCategory.ERP_SALES, "enabled": False, "ai_use_cases": ["DETECT_ANOMALY", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.CONDITION},

    # ERP - 구매관리
    {"id": "supplier_delay", "name": "공급업체 납기 지연", "description": "주요 공급업체의 납기 지연", "category": ScenarioCategory.ERP_PURCHASE, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-25", "duration_days": 10},
    {"id": "material_price_surge", "name": "원자재 가격 급등", "description": "특정 원자재의 가격 급등", "category": ScenarioCategory.ERP_PURCHASE, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "TREND", "WHAT_IF"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-01", "duration_days": 30},
    {"id": "purchase_optimization", "name": "발주 최적화 필요", "description": "발주 패턴이 비효율적", "category": ScenarioCategory.ERP_PURCHASE, "enabled": False, "ai_use_cases": ["FIND_CAUSE", "WHAT_IF", "REPORT"], "trigger_type": TriggerType.ALWAYS},
    {"id": "vendor_grade_change", "name": "공급업체 품질 등급 변동", "description": "공급업체의 품질 등급 변동", "category": ScenarioCategory.ERP_PURCHASE, "enabled": True, "ai_use_cases": ["TREND", "COMPARE", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-01", "duration_days": 60},
    {"id": "import_clearance", "name": "수입 통관 지연", "description": "수입 자재의 통관 지연", "category": ScenarioCategory.ERP_PURCHASE, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.RANDOM},

    # ERP - 재고관리
    {"id": "excess_inventory", "name": "과잉 재고", "description": "특정 자재의 재고 과다", "category": ScenarioCategory.ERP_INVENTORY, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "REPORT"], "trigger_type": TriggerType.CONDITION},
    {"id": "inventory_accuracy", "name": "재고 정확도 불일치", "description": "시스템과 실물 재고 차이", "category": ScenarioCategory.ERP_INVENTORY, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "CHECK"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-01", "duration_days": 30},
    {"id": "turnover_decline", "name": "재고 회전율 저하", "description": "재고 회전율이 목표 대비 낮음", "category": ScenarioCategory.ERP_INVENTORY, "enabled": False, "ai_use_cases": ["TREND", "COMPARE", "FIND_CAUSE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-01", "duration_days": 90},
    {"id": "safety_stock_shortage", "name": "안전재고 부족", "description": "주요 자재의 안전재고 미달", "category": ScenarioCategory.ERP_INVENTORY, "enabled": True, "ai_use_cases": ["CHECK", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.CONDITION},
    {"id": "warehouse_space", "name": "창고 공간 부족", "description": "창고 저장 공간 부족", "category": ScenarioCategory.ERP_INVENTORY, "enabled": True, "ai_use_cases": ["PREDICT", "WHAT_IF", "NOTIFY"], "trigger_type": TriggerType.CONDITION},

    # ERP - 회계관리
    {"id": "cost_increase_trend", "name": "원가 상승 추이", "description": "제품 원가 지속적 상승", "category": ScenarioCategory.ERP_ACCOUNTING, "enabled": True, "ai_use_cases": ["TREND", "FIND_CAUSE", "PREDICT"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-07-01", "duration_days": 180},
    {"id": "cost_variance", "name": "원가 차이 분석", "description": "표준원가와 실제원가 차이", "category": ScenarioCategory.ERP_ACCOUNTING, "enabled": True, "ai_use_cases": ["COMPARE", "FIND_CAUSE", "REPORT"], "trigger_type": TriggerType.ALWAYS},
    {"id": "profitability_decline", "name": "수익성 악화", "description": "특정 제품의 수익성 악화", "category": ScenarioCategory.ERP_ACCOUNTING, "enabled": False, "ai_use_cases": ["TREND", "COMPARE", "FIND_CAUSE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-01", "duration_days": 90},
    {"id": "ar_aging", "name": "매출채권 연체 증가", "description": "매출채권 연체 증가", "category": ScenarioCategory.ERP_ACCOUNTING, "enabled": True, "ai_use_cases": ["TREND", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-01", "duration_days": 60},
    {"id": "budget_overrun", "name": "예산 초과 경고", "description": "특정 비용 항목 예산 초과", "category": ScenarioCategory.ERP_ACCOUNTING, "enabled": True, "ai_use_cases": ["CHECK", "PREDICT", "NOTIFY"], "trigger_type": TriggerType.CONDITION},

    # ERP - 인사관리
    {"id": "workforce_shortage", "name": "인력 부족 예측", "description": "생산 증가 대비 인력 부족", "category": ScenarioCategory.ERP_HR, "enabled": True, "ai_use_cases": ["PREDICT", "WHAT_IF", "NOTIFY"], "trigger_type": TriggerType.CONDITION},
    {"id": "overtime_surge", "name": "초과근무 급증", "description": "초과근무가 급격히 증가", "category": ScenarioCategory.ERP_HR, "enabled": True, "ai_use_cases": ["TREND", "DETECT_ANOMALY", "FIND_CAUSE"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-15", "duration_days": 14},
    {"id": "turnover_increase", "name": "이직률 상승", "description": "특정 부서의 이직률 상승", "category": ScenarioCategory.ERP_HR, "enabled": False, "ai_use_cases": ["TREND", "FIND_CAUSE", "PREDICT"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-08-01", "duration_days": 120},
    {"id": "absenteeism", "name": "결근율 이상", "description": "결근율이 비정상적으로 높음", "category": ScenarioCategory.ERP_HR, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "FIND_CAUSE", "COMPARE"], "trigger_type": TriggerType.CONDITION},
    {"id": "payroll_error", "name": "급여 계산 오류", "description": "급여 계산에 오류 발생", "category": ScenarioCategory.ERP_HR, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "CHECK", "NOTIFY"], "trigger_type": TriggerType.RANDOM},

    # ERP - 기준정보
    {"id": "bom_change_impact", "name": "BOM 변경 영향", "description": "BOM 변경이 원가/재고에 미치는 영향", "category": ScenarioCategory.ERP_MASTER, "enabled": True, "ai_use_cases": ["WHAT_IF", "REPORT", "PREDICT"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-09-01", "duration_days": 7},
    {"id": "master_data_inconsistency", "name": "마스터 데이터 불일치", "description": "ERP-MES간 마스터 데이터 불일치", "category": ScenarioCategory.ERP_MASTER, "enabled": True, "ai_use_cases": ["DETECT_ANOMALY", "CHECK", "NOTIFY"], "trigger_type": TriggerType.ALWAYS},
    {"id": "new_product_intro", "name": "신규 제품 도입", "description": "신규 제품 도입 시 준비 상태 점검", "category": ScenarioCategory.ERP_MASTER, "enabled": False, "ai_use_cases": ["CHECK", "REPORT", "NOTIFY"], "trigger_type": TriggerType.SCHEDULED, "start_date": "2024-10-15", "duration_days": 30},
    {"id": "vendor_master_change", "name": "공급업체 마스터 변경", "description": "공급업체 정보 변경 필요", "category": ScenarioCategory.ERP_MASTER, "enabled": True, "ai_use_cases": ["CHECK", "NOTIFY", "REPORT"], "trigger_type": TriggerType.RANDOM},
    {"id": "price_update_required", "name": "단가 갱신 필요", "description": "자재/제품 단가 갱신 필요", "category": ScenarioCategory.ERP_MASTER, "enabled": True, "ai_use_cases": ["CHECK", "COMPARE", "NOTIFY"], "trigger_type": TriggerType.CONDITION},
]


@router.get("/scenarios", response_model=ApiResponse)
async def get_scenarios(
    category: ScenarioCategory = None,
    enabled: bool = None
):
    """Get all scenarios with optional filtering"""
    result = SCENARIOS.copy()

    if category:
        result = [s for s in result if s["category"] == category]

    if enabled is not None:
        result = [s for s in result if s["enabled"] == enabled]

    return ApiResponse(success=True, data=result)


@router.get("/scenarios/{scenario_id}", response_model=ApiResponse)
async def get_scenario(scenario_id: str):
    """Get a specific scenario by ID"""
    for scenario in SCENARIOS:
        if scenario["id"] == scenario_id:
            return ApiResponse(success=True, data=scenario)

    raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")


@router.patch("/scenarios/{scenario_id}", response_model=ApiResponse)
async def update_scenario(scenario_id: str, update: ScenarioUpdate):
    """Update scenario enabled status"""
    for scenario in SCENARIOS:
        if scenario["id"] == scenario_id:
            scenario["enabled"] = update.enabled
            return ApiResponse(success=True, data=scenario)

    raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
