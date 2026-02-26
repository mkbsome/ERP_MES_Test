"""
SimulationEngine - 실시간 시뮬레이션 엔진

상태 관리 및 전체 시뮬레이션 조율
Gap-Fill 기능으로 데이터 공백 자동 채우기 지원
"""

import asyncio
from enum import Enum
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
import logging

from .gap_fill import GapFillService, GapFillState

logger = logging.getLogger(__name__)


class SimulationState(str, Enum):
    """시뮬레이션 상태"""
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"


@dataclass
class SimulationConfig:
    """시뮬레이션 설정"""
    tenant_id: str = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"  # Default tenant UUID

    # Generator 주기 설정 (초)
    realtime_production_interval: int = 5      # 실시간 생산 현황
    equipment_status_interval: int = 10        # 설비 상태
    production_result_interval: int = 60       # 생산 실적
    defect_detail_interval: int = 120          # 불량 상세
    oee_calculation_interval: int = 3600       # OEE 계산 (1시간)
    erp_transaction_interval: int = 1800       # ERP 트랜잭션 (30분)

    # 시나리오 설정
    enabled_scenarios: List[str] = field(default_factory=list)

    # 생성 파라미터
    base_defect_rate: float = 0.02   # 기본 불량률 2%
    production_variance: float = 0.1  # 생산량 편차 10%

    # Gap-Fill 설정
    auto_gap_fill: bool = True       # 시작 시 자동 Gap-Fill
    min_gap_seconds: int = 60        # 최소 gap 임계값 (초)


@dataclass
class SimulationStats:
    """시뮬레이션 통계"""
    started_at: Optional[datetime] = None
    total_records_generated: int = 0
    records_by_generator: Dict[str, int] = field(default_factory=dict)
    scenarios_triggered: int = 0
    errors: int = 0
    last_error: Optional[str] = None


class SimulationEngine:
    """
    실시간 공장 시뮬레이션 엔진

    - 상태 관리 (STOPPED/RUNNING/PAUSED)
    - 여러 Generator 조율
    - 이벤트 브로드캐스트 (WebSocket용)
    """

    def __init__(self, db_pool=None):
        self._state = SimulationState.STOPPED
        self._config = SimulationConfig()
        self._stats = SimulationStats()
        self._db_pool = db_pool

        # Ticker들 (Generator별)
        self._tickers: Dict[str, Any] = {}

        # 이벤트 리스너들 (WebSocket 브로드캐스트용)
        self._event_listeners: List[Callable] = []

        # 메인 루프 태스크
        self._main_task: Optional[asyncio.Task] = None

        # Generator 인스턴스들
        self._generators: Dict[str, Any] = {}

        # Gap-Fill 서비스
        self._gap_fill_service: Optional[GapFillService] = None

    @property
    def state(self) -> SimulationState:
        return self._state

    @property
    def config(self) -> SimulationConfig:
        return self._config

    @property
    def stats(self) -> SimulationStats:
        return self._stats

    @property
    def is_running(self) -> bool:
        return self._state == SimulationState.RUNNING

    def add_event_listener(self, listener: Callable):
        """이벤트 리스너 추가 (WebSocket 브로드캐스트용)"""
        self._event_listeners.append(listener)

    def remove_event_listener(self, listener: Callable):
        """이벤트 리스너 제거"""
        if listener in self._event_listeners:
            self._event_listeners.remove(listener)

    async def _broadcast_event(self, event_type: str, data: Dict[str, Any]):
        """모든 리스너에게 이벤트 브로드캐스트"""
        event = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        for listener in self._event_listeners:
            try:
                if asyncio.iscoroutinefunction(listener):
                    await listener(event)
                else:
                    listener(event)
            except Exception as e:
                logger.error(f"Error broadcasting event: {e}")

    def update_config(self, **kwargs):
        """설정 업데이트"""
        for key, value in kwargs.items():
            if hasattr(self._config, key):
                setattr(self._config, key, value)

    def register_generator(self, name: str, generator):
        """Generator 등록"""
        self._generators[name] = generator
        logger.info(f"Generator registered: {name}")

    async def start(self, skip_gap_fill: bool = False) -> bool:
        """
        시뮬레이션 시작

        Args:
            skip_gap_fill: True면 Gap-Fill 스킵하고 바로 실시간 모드 시작
        """
        if self._state == SimulationState.RUNNING:
            logger.warning("Simulation is already running")
            return False

        logger.info("Starting simulation...")

        # Gap-Fill 처리 (설정에 따라)
        if self._config.auto_gap_fill and not skip_gap_fill and self._db_pool:
            await self._handle_gap_fill()

        self._state = SimulationState.RUNNING
        self._stats.started_at = datetime.now()

        # Generator별 Ticker 시작
        await self._start_tickers()

        await self._broadcast_event("simulation_started", {
            "state": self._state.value,
            "config": {
                "tenant_id": self._config.tenant_id,
                "enabled_scenarios": self._config.enabled_scenarios,
            }
        })

        logger.info("Simulation started successfully")
        return True

    async def _handle_gap_fill(self):
        """Gap-Fill 처리"""
        logger.info("Checking for data gaps...")

        # Gap-Fill 서비스 초기화
        self._gap_fill_service = GapFillService(
            self._db_pool,
            self._config.tenant_id
        )
        self._gap_fill_service.min_gap_seconds = self._config.min_gap_seconds

        # Generator들 등록
        for name, generator in self._generators.items():
            self._gap_fill_service.register_generator(name, generator)

        # Gap 감지
        gaps = await self._gap_fill_service.detect_gaps()

        # 채울 gap이 있는지 확인
        gaps_to_fill = [g for g in gaps if g.gap_seconds >= self._config.min_gap_seconds]

        if not gaps_to_fill:
            logger.info("No significant gaps found, starting realtime mode")
            return

        total_records = sum(g.records_to_generate for g in gaps_to_fill)
        logger.info(f"Found {len(gaps_to_fill)} gaps with {total_records} records to generate")

        # 이벤트 브로드캐스트
        await self._broadcast_event("gap_fill_started", {
            "gaps": [
                {
                    "table": g.table_name,
                    "last_record": g.last_record_time.isoformat() if g.last_record_time else None,
                    "gap_seconds": g.gap_seconds,
                    "records_to_generate": g.records_to_generate
                }
                for g in gaps_to_fill
            ],
            "total_records": total_records
        })

        # Gap 채우기 (진행 상황 콜백 포함)
        async def on_progress(progress):
            await self._broadcast_event("gap_fill_progress", self._gap_fill_service.get_progress())

        success = await self._gap_fill_service.fill_gaps(gaps_to_fill, on_progress)

        if success:
            await self._broadcast_event("gap_fill_completed", self._gap_fill_service.get_progress())
            logger.info("Gap-Fill completed, starting realtime mode")
        else:
            await self._broadcast_event("gap_fill_error", self._gap_fill_service.get_progress())
            logger.warning("Gap-Fill failed or cancelled")

    async def stop(self) -> bool:
        """시뮬레이션 정지"""
        if self._state == SimulationState.STOPPED:
            logger.warning("Simulation is already stopped")
            return False

        logger.info("Stopping simulation...")

        # Ticker들 정지
        await self._stop_tickers()

        self._state = SimulationState.STOPPED

        await self._broadcast_event("simulation_stopped", {
            "state": self._state.value,
            "stats": self._get_stats_dict()
        })

        logger.info("Simulation stopped")
        return True

    async def pause(self) -> bool:
        """시뮬레이션 일시정지"""
        if self._state != SimulationState.RUNNING:
            logger.warning("Cannot pause: simulation is not running")
            return False

        logger.info("Pausing simulation...")

        # Ticker들 일시정지
        for ticker in self._tickers.values():
            ticker.pause()

        self._state = SimulationState.PAUSED

        await self._broadcast_event("simulation_paused", {
            "state": self._state.value
        })

        return True

    async def resume(self) -> bool:
        """시뮬레이션 재개"""
        if self._state != SimulationState.PAUSED:
            logger.warning("Cannot resume: simulation is not paused")
            return False

        logger.info("Resuming simulation...")

        # Ticker들 재개
        for ticker in self._tickers.values():
            ticker.resume()

        self._state = SimulationState.RUNNING

        await self._broadcast_event("simulation_resumed", {
            "state": self._state.value
        })

        return True

    async def reset(self):
        """시뮬레이션 리셋"""
        await self.stop()

        self._stats = SimulationStats()

        await self._broadcast_event("simulation_reset", {
            "state": self._state.value
        })

    async def _start_tickers(self):
        """모든 Ticker 시작"""
        from .ticker import Ticker, TickerConfig

        ticker_configs = {
            "realtime_production": TickerConfig(
                name="realtime_production",
                interval_seconds=self._config.realtime_production_interval
            ),
            "equipment_status": TickerConfig(
                name="equipment_status",
                interval_seconds=self._config.equipment_status_interval
            ),
            "production_result": TickerConfig(
                name="production_result",
                interval_seconds=self._config.production_result_interval
            ),
            "defect_detail": TickerConfig(
                name="defect_detail",
                interval_seconds=self._config.defect_detail_interval
            ),
            "oee_calculation": TickerConfig(
                name="oee_calculation",
                interval_seconds=self._config.oee_calculation_interval
            ),
            "erp_transaction": TickerConfig(
                name="erp_transaction",
                interval_seconds=self._config.erp_transaction_interval
            ),
        }

        for name, config in ticker_configs.items():
            generator = self._generators.get(name)
            if generator:
                ticker = Ticker(
                    config=config,
                    callback=self._create_ticker_callback(name, generator),
                    on_error=self._on_ticker_error
                )
                self._tickers[name] = ticker
                await ticker.start()
                logger.info(f"Ticker started: {name} (interval: {config.interval_seconds}s)")
            else:
                logger.warning(f"No generator registered for: {name}")

    async def _stop_tickers(self):
        """모든 Ticker 정지"""
        for name, ticker in self._tickers.items():
            await ticker.stop()
            logger.info(f"Ticker stopped: {name}")
        self._tickers.clear()

    def _create_ticker_callback(self, generator_name: str, generator):
        """Ticker 콜백 생성"""
        async def callback():
            try:
                # Generator 패턴 감지:
                # - Phase 1 패턴: generate(db_pool, config) - 직접 저장
                # - Phase 2 패턴: generate() -> save(records, pool) - 분리 저장
                import inspect
                sig = inspect.signature(generator.generate)
                params = list(sig.parameters.keys())

                if 'db_pool' in params and 'config' in params:
                    # Phase 1 패턴: generate가 직접 저장
                    records = await generator.generate(
                        db_pool=self._db_pool,
                        config=self._config
                    )
                    count = len(records) if records else 0
                else:
                    # Phase 2 패턴: generate 후 save 호출
                    records = await generator.generate()
                    if records and self._db_pool:
                        count = await generator.save(records, self._db_pool)
                    else:
                        count = 0

                self._stats.total_records_generated += count

                if generator_name not in self._stats.records_by_generator:
                    self._stats.records_by_generator[generator_name] = 0
                self._stats.records_by_generator[generator_name] += count

                await self._broadcast_event("data_generated", {
                    "generator": generator_name,
                    "count": count,
                    "total": self._stats.total_records_generated
                })

            except Exception as e:
                logger.error(f"Error in generator {generator_name}: {e}")
                self._stats.errors += 1
                self._stats.last_error = str(e)
                raise

        return callback

    async def _on_ticker_error(self, ticker_name: str, error: Exception):
        """Ticker 에러 핸들러"""
        logger.error(f"Ticker error [{ticker_name}]: {error}")
        self._stats.errors += 1
        self._stats.last_error = f"[{ticker_name}] {str(error)}"

        await self._broadcast_event("generator_error", {
            "generator": ticker_name,
            "error": str(error)
        })

    def _get_stats_dict(self) -> Dict[str, Any]:
        """통계를 딕셔너리로 반환"""
        return {
            "started_at": self._stats.started_at.isoformat() if self._stats.started_at else None,
            "total_records_generated": self._stats.total_records_generated,
            "records_by_generator": self._stats.records_by_generator,
            "scenarios_triggered": self._stats.scenarios_triggered,
            "errors": self._stats.errors,
            "last_error": self._stats.last_error
        }

    def get_status(self) -> Dict[str, Any]:
        """현재 상태 반환"""
        elapsed = None
        if self._stats.started_at and self._state != SimulationState.STOPPED:
            elapsed = (datetime.now() - self._stats.started_at).total_seconds()

        ticker_status = {}
        for name, ticker in self._tickers.items():
            ticker_status[name] = {
                "interval": ticker.config.interval_seconds,
                "last_run": ticker.last_run.isoformat() if ticker.last_run else None,
                "run_count": ticker.run_count,
                "is_running": ticker.is_running
            }

        # Gap-Fill 상태 포함
        gap_fill_status = None
        if self._gap_fill_service:
            gap_fill_status = self._gap_fill_service.get_progress()

        return {
            "state": self._state.value,
            "config": {
                "tenant_id": self._config.tenant_id,
                "enabled_scenarios": self._config.enabled_scenarios,
                "base_defect_rate": self._config.base_defect_rate,
                "production_variance": self._config.production_variance,
                "auto_gap_fill": self._config.auto_gap_fill
            },
            "stats": self._get_stats_dict(),
            "elapsed_seconds": elapsed,
            "tickers": ticker_status,
            "gap_fill": gap_fill_status
        }

    async def detect_gaps(self) -> List[Dict[str, Any]]:
        """Gap 감지만 수행 (채우지 않음)"""
        if not self._db_pool:
            return []

        service = GapFillService(self._db_pool, self._config.tenant_id)
        for name, generator in self._generators.items():
            service.register_generator(name, generator)

        gaps = await service.detect_gaps()

        return [
            {
                "table": g.table_name,
                "last_record": g.last_record_time.isoformat() if g.last_record_time else None,
                "gap_duration_hours": round(g.gap_seconds / 3600, 1),
                "gap_seconds": g.gap_seconds,
                "records_to_generate": g.records_to_generate
            }
            for g in gaps
        ]

    async def fill_gaps_manual(self) -> Dict[str, Any]:
        """수동으로 Gap-Fill 실행"""
        if self._state == SimulationState.RUNNING:
            return {"success": False, "error": "Cannot fill gaps while simulation is running"}

        if not self._db_pool:
            return {"success": False, "error": "No database connection"}

        # Gap-Fill 서비스 초기화
        self._gap_fill_service = GapFillService(
            self._db_pool,
            self._config.tenant_id
        )

        for name, generator in self._generators.items():
            self._gap_fill_service.register_generator(name, generator)

        # Gap 감지
        gaps = await self._gap_fill_service.detect_gaps()
        gaps_to_fill = [g for g in gaps if g.gap_seconds >= self._config.min_gap_seconds]

        if not gaps_to_fill:
            return {"success": True, "message": "No gaps to fill"}

        # Gap 채우기
        success = await self._gap_fill_service.fill_gaps(gaps_to_fill)

        return {
            "success": success,
            "progress": self._gap_fill_service.get_progress()
        }

    def cancel_gap_fill(self):
        """Gap-Fill 취소"""
        if self._gap_fill_service:
            self._gap_fill_service.cancel()
            return True
        return False


# 싱글톤 인스턴스
_engine_instance: Optional[SimulationEngine] = None


def get_simulation_engine(db_pool=None) -> SimulationEngine:
    """SimulationEngine 싱글톤 인스턴스 반환"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = SimulationEngine(db_pool=db_pool)
    elif db_pool is not None and _engine_instance._db_pool is None:
        _engine_instance._db_pool = db_pool
    return _engine_instance
