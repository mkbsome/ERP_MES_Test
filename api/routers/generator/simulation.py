"""
Simulation API Router - 실시간 시뮬레이션 API

API Endpoints:
- POST /start     - 시뮬레이션 시작
- POST /stop      - 시뮬레이션 정지
- POST /pause     - 일시정지
- POST /resume    - 재개
- POST /reset     - 리셋
- GET  /status    - 현재 상태
- GET  /stats     - 통계
- PATCH /config   - 설정 변경
- WS   /ws        - 실시간 업데이트
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging

from ...simulation.engine import get_simulation_engine, SimulationState
from ...simulation.generators import (
    RealtimeProductionGenerator,
    EquipmentStatusGenerator,
    ProductionResultGenerator,
    DefectDetailGenerator,
    OEECalculator,
    ERPTransactionGenerator,
)
from ...database import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulation", tags=["Simulation"])

# WebSocket 연결 관리
active_websockets: List[WebSocket] = []


class SimulationConfigUpdate(BaseModel):
    """시뮬레이션 설정 업데이트 모델"""
    tenant_id: Optional[str] = None
    realtime_production_interval: Optional[int] = None
    equipment_status_interval: Optional[int] = None
    production_result_interval: Optional[int] = None
    defect_detail_interval: Optional[int] = None
    oee_calculation_interval: Optional[int] = None
    erp_transaction_interval: Optional[int] = None
    enabled_scenarios: Optional[List[str]] = None
    base_defect_rate: Optional[float] = None
    production_variance: Optional[float] = None
    auto_gap_fill: Optional[bool] = None
    min_gap_seconds: Optional[int] = None


class SimulationStartRequest(BaseModel):
    """시뮬레이션 시작 요청 모델"""
    skip_gap_fill: bool = False  # True면 Gap-Fill 스킵


class SimulationResponse(BaseModel):
    """시뮬레이션 응답 모델"""
    success: bool
    message: str
    state: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


async def get_engine():
    """SimulationEngine 의존성"""
    db_pool = await get_db_pool()
    engine = get_simulation_engine(db_pool)

    # Generator 등록 (최초 1회)
    if not engine._generators:
        tenant_id = engine.config.tenant_id

        # Phase 1 Generators
        engine.register_generator("realtime_production", RealtimeProductionGenerator(tenant_id))
        engine.register_generator("equipment_status", EquipmentStatusGenerator(tenant_id))

        # Phase 2 Generators
        engine.register_generator("production_result", ProductionResultGenerator(tenant_id))
        engine.register_generator("defect_detail", DefectDetailGenerator(tenant_id))
        engine.register_generator("oee_calculation", OEECalculator(tenant_id))
        engine.register_generator("erp_transaction", ERPTransactionGenerator(tenant_id))

        logger.info("All 6 generators registered to SimulationEngine")

    return engine


@router.post("/start", response_model=SimulationResponse)
async def start_simulation(
    request: Optional[SimulationStartRequest] = None,
    engine=Depends(get_engine)
):
    """
    시뮬레이션 시작

    - skip_gap_fill=False (기본): Gap 감지 후 자동으로 채우고 실시간 모드 시작
    - skip_gap_fill=True: Gap-Fill 스킵하고 바로 실시간 모드 시작
    """
    try:
        skip_gap_fill = request.skip_gap_fill if request else False
        success = await engine.start(skip_gap_fill=skip_gap_fill)
        if success:
            return SimulationResponse(
                success=True,
                message="시뮬레이션이 시작되었습니다" + (" (Gap-Fill 스킵)" if skip_gap_fill else ""),
                state=engine.state.value
            )
        else:
            return SimulationResponse(
                success=False,
                message="시뮬레이션이 이미 실행 중입니다",
                state=engine.state.value
            )
    except Exception as e:
        logger.error(f"Failed to start simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop", response_model=SimulationResponse)
async def stop_simulation(engine=Depends(get_engine)):
    """시뮬레이션 정지"""
    try:
        success = await engine.stop()
        if success:
            return SimulationResponse(
                success=True,
                message="시뮬레이션이 정지되었습니다",
                state=engine.state.value,
                data=engine._get_stats_dict()
            )
        else:
            return SimulationResponse(
                success=False,
                message="시뮬레이션이 이미 정지 상태입니다",
                state=engine.state.value
            )
    except Exception as e:
        logger.error(f"Failed to stop simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pause", response_model=SimulationResponse)
async def pause_simulation(engine=Depends(get_engine)):
    """시뮬레이션 일시정지"""
    try:
        success = await engine.pause()
        if success:
            return SimulationResponse(
                success=True,
                message="시뮬레이션이 일시정지되었습니다",
                state=engine.state.value
            )
        else:
            return SimulationResponse(
                success=False,
                message="시뮬레이션을 일시정지할 수 없습니다 (실행 중이 아님)",
                state=engine.state.value
            )
    except Exception as e:
        logger.error(f"Failed to pause simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume", response_model=SimulationResponse)
async def resume_simulation(engine=Depends(get_engine)):
    """시뮬레이션 재개"""
    try:
        success = await engine.resume()
        if success:
            return SimulationResponse(
                success=True,
                message="시뮬레이션이 재개되었습니다",
                state=engine.state.value
            )
        else:
            return SimulationResponse(
                success=False,
                message="시뮬레이션을 재개할 수 없습니다 (일시정지 상태가 아님)",
                state=engine.state.value
            )
    except Exception as e:
        logger.error(f"Failed to resume simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset", response_model=SimulationResponse)
async def reset_simulation(engine=Depends(get_engine)):
    """시뮬레이션 리셋"""
    try:
        await engine.reset()
        return SimulationResponse(
            success=True,
            message="시뮬레이션이 리셋되었습니다",
            state=engine.state.value
        )
    except Exception as e:
        logger.error(f"Failed to reset simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_simulation_status(engine=Depends(get_engine)):
    """시뮬레이션 현재 상태 조회"""
    return engine.get_status()


@router.get("/stats")
async def get_simulation_stats(engine=Depends(get_engine)):
    """시뮬레이션 통계 조회"""
    return engine._get_stats_dict()


@router.patch("/config", response_model=SimulationResponse)
async def update_simulation_config(
    config: SimulationConfigUpdate,
    engine=Depends(get_engine)
):
    """시뮬레이션 설정 변경"""
    try:
        # 실행 중에는 일부 설정만 변경 가능
        if engine.state == SimulationState.RUNNING:
            # 실행 중 변경 가능한 설정만 적용
            allowed_keys = ['enabled_scenarios', 'base_defect_rate', 'production_variance']
            update_dict = {k: v for k, v in config.dict(exclude_unset=True).items() if k in allowed_keys}

            if not update_dict:
                return SimulationResponse(
                    success=False,
                    message="실행 중에는 시나리오, 불량률, 생산 편차만 변경할 수 있습니다",
                    state=engine.state.value
                )
        else:
            update_dict = config.dict(exclude_unset=True)

        engine.update_config(**update_dict)

        return SimulationResponse(
            success=True,
            message="설정이 변경되었습니다",
            state=engine.state.value,
            data={"updated": list(update_dict.keys())}
        )
    except Exception as e:
        logger.error(f"Failed to update config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gaps")
async def detect_gaps(engine=Depends(get_engine)):
    """
    데이터 Gap 감지

    각 테이블의 마지막 레코드 시간과 현재 시간 사이의 gap을 계산합니다.
    실제로 채우지는 않고 감지만 수행합니다.
    """
    try:
        gaps = await engine.detect_gaps()
        return {
            "success": True,
            "gaps": gaps,
            "total_records_to_generate": sum(g["records_to_generate"] for g in gaps)
        }
    except Exception as e:
        logger.error(f"Failed to detect gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gaps/fill", response_model=SimulationResponse)
async def fill_gaps(engine=Depends(get_engine)):
    """
    수동으로 Gap 채우기

    시뮬레이션이 정지된 상태에서만 실행 가능합니다.
    감지된 모든 gap을 채웁니다.
    """
    try:
        result = await engine.fill_gaps_manual()
        return SimulationResponse(
            success=result.get("success", False),
            message=result.get("message", "Gap-Fill completed"),
            state=engine.state.value,
            data=result.get("progress")
        )
    except Exception as e:
        logger.error(f"Failed to fill gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gaps/cancel", response_model=SimulationResponse)
async def cancel_gap_fill(engine=Depends(get_engine)):
    """Gap-Fill 취소"""
    try:
        cancelled = engine.cancel_gap_fill()
        return SimulationResponse(
            success=cancelled,
            message="Gap-Fill이 취소되었습니다" if cancelled else "취소할 Gap-Fill이 없습니다",
            state=engine.state.value
        )
    except Exception as e:
        logger.error(f"Failed to cancel gap fill: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 연결 - 실시간 이벤트 수신"""
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"WebSocket connected. Total: {len(active_websockets)}")

    # 엔진에 이벤트 리스너 등록
    engine = get_simulation_engine()

    async def broadcast_handler(event: Dict[str, Any]):
        """이벤트를 WebSocket으로 전송"""
        for ws in active_websockets:
            try:
                await ws.send_json(event)
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {e}")

    engine.add_event_listener(broadcast_handler)

    try:
        # 연결 유지 및 메시지 수신
        while True:
            data = await websocket.receive_text()
            # 클라이언트로부터의 메시지 처리 (필요시)
            logger.debug(f"Received WebSocket message: {data}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        active_websockets.remove(websocket)
        engine.remove_event_listener(broadcast_handler)
        logger.info(f"WebSocket removed. Total: {len(active_websockets)}")
