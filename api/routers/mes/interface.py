"""
MES Interface API Router (I/F 연계)
- ERP 연계 현황
- AI 플랫폼 연계 현황
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum

router = APIRouter(prefix="/interface", tags=["MES Interface"])


class InterfaceStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"
    PROCESSING = "processing"


class InterfaceDirection(str, Enum):
    ERP_TO_MES = "erp_to_mes"
    MES_TO_ERP = "mes_to_erp"
    AI_TO_MES = "ai_to_mes"
    MES_TO_AI = "mes_to_ai"


# ==================== ERP 수주정보 연계 ====================

@router.get("/erp/sales-orders")
async def get_erp_sales_orders(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    status: Optional[InterfaceStatus] = None,
):
    """ERP 수주정보 수신 현황"""
    orders = [
        {
            "id": 1,
            "interface_no": "IF-SO-2024-0001",
            "interface_date": "2024-01-22T09:00:00",
            "direction": "erp_to_mes",
            "erp_order_no": "SO-2024-0001",
            "customer_code": "C-001",
            "customer_name": "삼성전자",
            "product_code": "FG-MB-001",
            "product_name": "스마트폰 메인보드 A타입",
            "order_qty": 10000,
            "due_date": "2024-01-30T00:00:00",
            "status": "success",
            "message": "정상 수신",
            "created_at": "2024-01-22T09:00:00",
        },
        {
            "id": 2,
            "interface_no": "IF-SO-2024-0002",
            "interface_date": "2024-01-22T10:30:00",
            "direction": "erp_to_mes",
            "erp_order_no": "SO-2024-0002",
            "customer_code": "C-003",
            "customer_name": "현대모비스",
            "product_code": "FG-ECU-001",
            "product_name": "자동차 ECU 보드",
            "order_qty": 2500,
            "due_date": "2024-02-15T00:00:00",
            "status": "success",
            "message": "정상 수신",
            "created_at": "2024-01-22T10:30:00",
        },
        {
            "id": 3,
            "interface_no": "IF-SO-2024-0003",
            "interface_date": "2024-01-23T08:00:00",
            "direction": "erp_to_mes",
            "erp_order_no": "SO-2024-0005",
            "customer_code": "C-002",
            "customer_name": "LG전자",
            "product_code": "FG-LED-001",
            "product_name": "LED 드라이버 보드",
            "order_qty": 20000,
            "due_date": "2024-02-05T00:00:00",
            "status": "failed",
            "message": "품목코드 미등록",
            "created_at": "2024-01-23T08:00:00",
        },
    ]
    return {
        "items": orders,
        "total": len(orders),
        "summary": {
            "total_count": 3,
            "success_count": 2,
            "failed_count": 1,
            "success_rate": 66.7,
        }
    }


# ==================== ERP 품목정보 연계 ====================

@router.get("/erp/products")
async def get_erp_products(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """ERP 품목정보 동기화 현황"""
    products = [
        {
            "id": 1,
            "interface_no": "IF-PRD-2024-0001",
            "interface_date": "2024-01-22T01:00:00",
            "direction": "erp_to_mes",
            "sync_type": "daily",
            "total_items": 150,
            "new_items": 5,
            "updated_items": 12,
            "error_items": 0,
            "status": "success",
            "message": "일일 동기화 완료",
            "duration_sec": 45,
        },
        {
            "id": 2,
            "interface_no": "IF-PRD-2024-0002",
            "interface_date": "2024-01-23T01:00:00",
            "direction": "erp_to_mes",
            "sync_type": "daily",
            "total_items": 152,
            "new_items": 2,
            "updated_items": 8,
            "error_items": 1,
            "status": "success",
            "message": "일일 동기화 완료 (1건 오류)",
            "duration_sec": 48,
        },
    ]
    return {
        "items": products,
        "total": len(products),
        "last_sync": "2024-01-23T01:00:00",
        "next_sync": "2024-01-24T01:00:00",
    }


# ==================== ERP 제조오더 연계 ====================

@router.get("/erp/work-orders")
async def get_erp_work_orders(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    status: Optional[InterfaceStatus] = None,
):
    """ERP 제조오더정보 수신 현황"""
    orders = [
        {
            "id": 1,
            "interface_no": "IF-WO-2024-0001",
            "interface_date": "2024-01-22T09:30:00",
            "direction": "erp_to_mes",
            "erp_work_order_no": "MO-2024-0100",
            "mes_work_order_no": "WO-2024-0001",
            "product_code": "FG-MB-001",
            "product_name": "스마트폰 메인보드 A타입",
            "order_qty": 5000,
            "planned_start": "2024-01-25T08:00:00",
            "planned_end": "2024-01-26T17:00:00",
            "status": "success",
            "message": "작업지시 생성 완료",
        },
        {
            "id": 2,
            "interface_no": "IF-WO-2024-0002",
            "interface_date": "2024-01-22T10:00:00",
            "direction": "erp_to_mes",
            "erp_work_order_no": "MO-2024-0101",
            "mes_work_order_no": "WO-2024-0002",
            "product_code": "FG-ECU-001",
            "product_name": "자동차 ECU 보드",
            "order_qty": 500,
            "planned_start": "2024-01-26T08:00:00",
            "planned_end": "2024-01-27T17:00:00",
            "status": "success",
            "message": "작업지시 생성 완료",
        },
    ]
    return {
        "items": orders,
        "total": len(orders),
        "summary": {
            "today_received": 5,
            "success_count": 5,
            "failed_count": 0,
        }
    }


# ==================== 실적 전송 현황 ====================

@router.get("/erp/production-results")
async def get_production_result_transfer(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    status: Optional[InterfaceStatus] = None,
):
    """MES→ERP 실적 전송 현황"""
    results = [
        {
            "id": 1,
            "interface_no": "IF-PR-2024-0001",
            "interface_date": "2024-01-22T18:00:00",
            "direction": "mes_to_erp",
            "work_order_no": "WO-2024-0001",
            "line_code": "SMT-L01",
            "product_code": "FG-MB-001",
            "good_qty": 4950,
            "defect_qty": 50,
            "status": "success",
            "message": "실적 전송 완료",
        },
        {
            "id": 2,
            "interface_no": "IF-PR-2024-0002",
            "interface_date": "2024-01-22T18:05:00",
            "direction": "mes_to_erp",
            "work_order_no": "WO-2024-0002",
            "line_code": "SMT-L02",
            "product_code": "FG-ECU-001",
            "good_qty": 495,
            "defect_qty": 5,
            "status": "success",
            "message": "실적 전송 완료",
        },
        {
            "id": 3,
            "interface_no": "IF-PR-2024-0003",
            "interface_date": "2024-01-23T18:00:00",
            "direction": "mes_to_erp",
            "work_order_no": "WO-2024-0003",
            "line_code": "SMT-L01",
            "product_code": "FG-MB-001",
            "good_qty": 4900,
            "defect_qty": 100,
            "status": "pending",
            "message": "전송 대기 중",
        },
    ]
    return {
        "items": results,
        "total": len(results),
        "summary": {
            "today_transferred": 3,
            "success_count": 2,
            "pending_count": 1,
            "failed_count": 0,
        }
    }


# ==================== 불량 전송 현황 ====================

@router.get("/erp/defects")
async def get_defect_transfer(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """MES→ERP 불량정보 전송 현황"""
    defects = [
        {
            "id": 1,
            "interface_no": "IF-DF-2024-0001",
            "interface_date": "2024-01-22T18:00:00",
            "direction": "mes_to_erp",
            "work_order_no": "WO-2024-0001",
            "line_code": "SMT-L01",
            "product_code": "FG-MB-001",
            "defect_details": [
                {"defect_code": "DF01", "defect_name": "솔더 브릿지", "qty": 20},
                {"defect_code": "DF04", "defect_name": "부품 누락", "qty": 15},
                {"defect_code": "DF05", "defect_name": "위치 이탈", "qty": 15},
            ],
            "total_defect_qty": 50,
            "status": "success",
            "message": "불량정보 전송 완료",
        },
        {
            "id": 2,
            "interface_no": "IF-DF-2024-0002",
            "interface_date": "2024-01-22T18:05:00",
            "direction": "mes_to_erp",
            "work_order_no": "WO-2024-0002",
            "line_code": "SMT-L02",
            "product_code": "FG-ECU-001",
            "defect_details": [
                {"defect_code": "DF01", "defect_name": "솔더 브릿지", "qty": 3},
                {"defect_code": "DF02", "defect_name": "미납", "qty": 2},
            ],
            "total_defect_qty": 5,
            "status": "success",
            "message": "불량정보 전송 완료",
        },
    ]
    return {
        "items": defects,
        "total": len(defects),
    }


# ==================== AI 플랫폼 연계 현황 ====================

@router.get("/ai/status")
async def get_ai_interface_status():
    """AI 플랫폼 연계 현황 요약"""
    return {
        "connection_status": "connected",
        "last_heartbeat": datetime.utcnow().isoformat(),
        "data_sent_today": {
            "quality_data": 1250,
            "equipment_data": 3600,
            "production_data": 500,
        },
        "alerts_received_today": {
            "quality_alerts": 3,
            "equipment_alerts": 1,
            "process_optimization": 2,
        },
        "last_sync": "2024-01-23T14:30:00",
    }


@router.get("/ai/quality-data")
async def get_ai_quality_data_transfer(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """AI 플랫폼 품질 데이터 전송 현황"""
    transfers = [
        {
            "id": 1,
            "interface_no": "IF-AI-Q-2024-0001",
            "interface_date": "2024-01-23T10:00:00",
            "direction": "mes_to_ai",
            "data_type": "defect_rate",
            "line_code": "SMT-L01",
            "product_code": "FG-MB-001",
            "defect_rate": 2.8,
            "threshold": 2.5,
            "trigger_reason": "불량률 기준 초과",
            "status": "success",
            "ai_response": {
                "received": True,
                "analysis_id": "AI-ANA-2024-0050",
            }
        },
        {
            "id": 2,
            "interface_no": "IF-AI-Q-2024-0002",
            "interface_date": "2024-01-23T11:30:00",
            "direction": "mes_to_ai",
            "data_type": "spi_inspection",
            "line_code": "SMT-L01",
            "product_code": "FG-MB-001",
            "data_count": 500,
            "trigger_reason": "실시간 전송",
            "status": "success",
            "ai_response": {
                "received": True,
                "analysis_id": None,
            }
        },
    ]
    return {"items": transfers, "total": len(transfers)}


@router.get("/ai/equipment-data")
async def get_ai_equipment_data_transfer(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """AI 플랫폼 설비 데이터 전송 현황"""
    transfers = [
        {
            "id": 1,
            "interface_no": "IF-AI-E-2024-0001",
            "interface_date": "2024-01-23T09:00:00",
            "direction": "mes_to_ai",
            "data_type": "oee",
            "equipment_code": "SMT-CHIP-01",
            "equipment_name": "Chip Mounter #1",
            "oee_value": 72.5,
            "threshold": 75.0,
            "trigger_reason": "OEE 기준 미달",
            "status": "success",
            "ai_response": {
                "received": True,
                "prediction_id": "AI-PRD-2024-0030",
            }
        },
        {
            "id": 2,
            "interface_no": "IF-AI-E-2024-0002",
            "interface_date": "2024-01-23T14:00:00",
            "direction": "mes_to_ai",
            "data_type": "parameters",
            "equipment_code": "SMT-REFL-01",
            "equipment_name": "Reflow Oven #1",
            "data_count": 100,
            "trigger_reason": "실시간 전송",
            "status": "success",
            "ai_response": {
                "received": True,
                "prediction_id": None,
            }
        },
    ]
    return {"items": transfers, "total": len(transfers)}


@router.get("/ai/alerts")
async def get_ai_alerts(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """AI 플랫폼 분석 결과/알림 수신 현황"""
    alerts = [
        {
            "id": 1,
            "interface_no": "IF-AI-A-2024-0001",
            "interface_date": "2024-01-23T10:15:00",
            "direction": "ai_to_mes",
            "alert_type": "quality_warning",
            "analysis_id": "AI-ANA-2024-0050",
            "severity": "warning",
            "title": "품질 이상 감지",
            "message": "SMT-L01 라인의 FG-MB-001 제품 불량률이 증가 추세입니다. 솔더 프린터 압력 점검을 권고합니다.",
            "recommended_actions": [
                "솔더 프린터 스퀴지 압력 확인",
                "스텐실 청소 상태 점검",
                "솔더 페이스트 점도 확인"
            ],
            "target_equipment": "SMT-PRNT-01",
            "status": "acknowledged",
            "acknowledged_by": "김품질",
            "acknowledged_at": "2024-01-23T10:20:00",
        },
        {
            "id": 2,
            "interface_no": "IF-AI-A-2024-0002",
            "interface_date": "2024-01-23T09:30:00",
            "direction": "ai_to_mes",
            "alert_type": "equipment_prediction",
            "analysis_id": "AI-PRD-2024-0030",
            "severity": "info",
            "title": "설비 예방 보전 권고",
            "message": "SMT-CHIP-01 Chip Mounter의 노즐 교체 시기가 다가오고 있습니다. 3일 이내 교체를 권고합니다.",
            "recommended_actions": [
                "노즐 마모 상태 점검",
                "교체용 노즐 재고 확인",
                "보전 일정 계획"
            ],
            "target_equipment": "SMT-CHIP-01",
            "status": "pending",
            "acknowledged_by": None,
            "acknowledged_at": None,
        },
        {
            "id": 3,
            "interface_no": "IF-AI-A-2024-0003",
            "interface_date": "2024-01-23T11:00:00",
            "direction": "ai_to_mes",
            "alert_type": "process_optimization",
            "analysis_id": "AI-OPT-2024-0010",
            "severity": "info",
            "title": "공정 최적화 제안",
            "message": "Reflow 온도 프로파일 조정으로 Tombstone 불량을 15% 감소시킬 수 있습니다.",
            "recommended_actions": [
                "Zone 4 온도를 5°C 상향 조정",
                "컨베이어 속도 유지"
            ],
            "target_equipment": "SMT-REFL-01",
            "status": "implemented",
            "acknowledged_by": "박설비",
            "acknowledged_at": "2024-01-23T11:30:00",
        },
    ]
    return {
        "items": alerts,
        "total": len(alerts),
        "summary": {
            "total_alerts": 3,
            "pending": 1,
            "acknowledged": 1,
            "implemented": 1,
        }
    }


@router.post("/ai/alerts/{alert_id}/acknowledge")
async def acknowledge_ai_alert(alert_id: int, acknowledged_by: str = "시스템"):
    """AI 알림 확인 처리"""
    return {
        "alert_id": alert_id,
        "status": "acknowledged",
        "acknowledged_by": acknowledged_by,
        "acknowledged_at": datetime.utcnow().isoformat(),
        "message": "알림이 확인 처리되었습니다.",
    }


# ==================== 연계 통계 ====================

@router.get("/statistics")
async def get_interface_statistics(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    """연계 통계 조회"""
    return {
        "period": "2024-01-01 ~ 2024-01-23",
        "erp_interface": {
            "total_transactions": 1250,
            "success_count": 1230,
            "failed_count": 20,
            "success_rate": 98.4,
            "by_type": {
                "sales_orders": {"total": 150, "success": 148, "failed": 2},
                "work_orders": {"total": 200, "success": 198, "failed": 2},
                "product_sync": {"total": 23, "success": 23, "failed": 0},
                "production_results": {"total": 500, "success": 490, "failed": 10},
                "defect_data": {"total": 377, "success": 371, "failed": 6},
            }
        },
        "ai_interface": {
            "total_transactions": 5800,
            "data_sent": {
                "quality_data": 2500,
                "equipment_data": 3000,
                "production_data": 300,
            },
            "alerts_received": {
                "quality_alerts": 45,
                "equipment_alerts": 12,
                "process_optimization": 8,
            },
            "alert_response": {
                "acknowledged": 50,
                "implemented": 12,
                "pending": 3,
            }
        }
    }
