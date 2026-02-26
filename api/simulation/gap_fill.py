"""
GapFillService - 데이터 공백 자동 채우기 서비스

시뮬레이션 시작 시 마지막 데이터와 현재 시간 사이의 gap을 감지하고
과거 데이터를 자동으로 생성합니다.

Note: All timestamps are handled in UTC for consistency with PostgreSQL.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class GapFillState(str, Enum):
    """Gap-Fill 상태"""
    IDLE = "idle"
    DETECTING = "detecting"
    FILLING = "filling"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class GapInfo:
    """Gap 정보"""
    table_name: str
    last_record_time: Optional[datetime]
    gap_duration: timedelta
    gap_seconds: float
    records_to_generate: int  # 예상 생성 레코드 수


@dataclass
class GapFillProgress:
    """Gap-Fill 진행 상황"""
    state: GapFillState
    total_gaps: int = 0
    gaps_filled: int = 0
    total_records_to_generate: int = 0
    records_generated: int = 0
    current_table: Optional[str] = None
    current_time: Optional[datetime] = None
    target_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


# 테이블별 설정: (테이블명, 평균 주기(초), 배치당 레코드 수)
# Phase 2 Generator만 Gap-Fill 지원 (timestamp 파라미터를 받는 Generator)
TABLE_CONFIGS = {
    # Phase 1 Generator (Gap-Fill 미지원 - 주석 처리)
    # "realtime_production": {
    #     "table": "mes_realtime_production",
    #     "interval": 5,
    #     "records_per_tick": 5,  # 5개 라인
    #     "timestamp_column": "created_at",
    # },
    # "equipment_status": {
    #     "table": "mes_equipment_status",
    #     "interval": 10,
    #     "records_per_tick": 25,  # 25개 설비
    #     "timestamp_column": "created_at",
    # },

    # Phase 2 Generator (Gap-Fill 지원)
    "production_result": {
        "table": "mes_production_result",
        "interval": 60,
        "records_per_tick": 5,
        "timestamp_column": "result_timestamp",  # 실제 이벤트 시점 기준
    },
    "defect_detail": {
        "table": "mes_defect_detail",
        "interval": 120,
        "records_per_tick": 1,  # 불량은 랜덤하게 발생
        "timestamp_column": "defect_timestamp",  # 실제 이벤트 시점 기준
    },
}


class GapFillService:
    """
    데이터 공백 자동 채우기 서비스

    시뮬레이션 시작 시:
    1. 각 테이블의 마지막 레코드 시간 확인
    2. 현재 시간과의 gap 계산
    3. gap이 임계값 이상이면 과거 데이터 배치 생성
    4. 완료 후 실시간 모드로 전환
    """

    def __init__(self, db_pool, tenant_id: str):
        self.db_pool = db_pool
        self.tenant_id = tenant_id
        self.progress = GapFillProgress(state=GapFillState.IDLE)
        self._generators: Dict[str, Any] = {}
        self._cancel_requested = False

        # 설정
        self.min_gap_seconds = 60  # 최소 gap (이 이상이면 채움)
        self.batch_size = 100  # 한 번에 생성할 레코드 수
        self.time_acceleration = 3600  # 1시간 = 1초 (가속 비율)

    def register_generator(self, name: str, generator):
        """Generator 등록"""
        self._generators[name] = generator

    async def detect_gaps(self) -> List[GapInfo]:
        """각 테이블의 데이터 gap 감지"""
        self.progress.state = GapFillState.DETECTING
        gaps = []
        # UTC 시간 사용 (DB가 UTC로 저장하므로)
        now = datetime.now(timezone.utc)

        async with self.db_pool.acquire() as conn:
            for gen_name, config in TABLE_CONFIGS.items():
                try:
                    # 마지막 레코드 시간 조회
                    query = f"""
                        SELECT MAX({config['timestamp_column']}) as last_time
                        FROM {config['table']}
                        WHERE tenant_id = $1
                    """
                    row = await conn.fetchrow(query, self.tenant_id)
                    last_time = row['last_time'] if row and row['last_time'] else None

                    if last_time is None:
                        # 데이터가 전혀 없음 - 기본 1년치 생성 대상
                        gap_duration = timedelta(days=365)
                        gap_seconds = gap_duration.total_seconds()
                    else:
                        # timezone-naive를 UTC로 변환 (DB가 UTC로 저장)
                        if last_time.tzinfo is None:
                            last_time = last_time.replace(tzinfo=timezone.utc)
                        gap_duration = now - last_time
                        gap_seconds = gap_duration.total_seconds()

                    # 예상 생성 레코드 수 계산
                    ticks = int(gap_seconds / config['interval'])
                    records_to_generate = ticks * config['records_per_tick']

                    gaps.append(GapInfo(
                        table_name=gen_name,
                        last_record_time=last_time,
                        gap_duration=gap_duration,
                        gap_seconds=gap_seconds,
                        records_to_generate=records_to_generate
                    ))

                    logger.info(f"[GapFill] {gen_name}: last={last_time}, gap={gap_duration}, records={records_to_generate}")

                except Exception as e:
                    logger.error(f"[GapFill] Error detecting gap for {gen_name}: {e}")

        return gaps

    async def fill_gaps(self, gaps: List[GapInfo], on_progress: Optional[callable] = None) -> bool:
        """
        감지된 gap들을 채움

        Args:
            gaps: 채울 gap 목록
            on_progress: 진행 상황 콜백 (optional)

        Returns:
            성공 여부
        """
        self._cancel_requested = False
        self.progress = GapFillProgress(
            state=GapFillState.FILLING,
            total_gaps=len(gaps),
            total_records_to_generate=sum(g.records_to_generate for g in gaps),
            started_at=datetime.now()
        )

        # UTC 시간 사용 (DB가 UTC로 저장하므로)
        now = datetime.now(timezone.utc)

        try:
            for gap in gaps:
                if self._cancel_requested:
                    logger.info("[GapFill] Cancelled by user")
                    self.progress.state = GapFillState.IDLE
                    return False

                # 이 gap이 임계값 미만이면 스킵
                if gap.gap_seconds < self.min_gap_seconds:
                    logger.info(f"[GapFill] Skipping {gap.table_name}: gap too small ({gap.gap_seconds}s)")
                    self.progress.gaps_filled += 1
                    continue

                generator = self._generators.get(gap.table_name)
                if not generator:
                    logger.warning(f"[GapFill] No generator for {gap.table_name}")
                    self.progress.gaps_filled += 1
                    continue

                self.progress.current_table = gap.table_name
                config = TABLE_CONFIGS[gap.table_name]

                # 시작 시간 결정 (UTC 기준)
                if gap.last_record_time:
                    last_time = gap.last_record_time
                    # timezone-naive를 UTC로 변환
                    if last_time.tzinfo is None:
                        last_time = last_time.replace(tzinfo=timezone.utc)
                    current_time = last_time + timedelta(seconds=config['interval'])
                else:
                    # 데이터가 없으면 1년 전부터 시작
                    current_time = now - timedelta(days=365)

                self.progress.current_time = current_time
                self.progress.target_time = now

                print(f"[GapFill] Filling {gap.table_name}: {current_time} -> {now}")

                # 시간을 진행하면서 데이터 생성
                records_batch = []
                tick_count = 0

                while current_time < now:
                    if self._cancel_requested:
                        break

                    # Generator로 해당 시점의 데이터 생성
                    records = await self._generate_for_time(generator, gap.table_name, current_time)
                    if records:
                        records_batch.extend(records)

                    # 배치 크기에 도달하면 저장
                    if len(records_batch) >= self.batch_size:
                        saved = await self._save_batch(generator, records_batch)
                        self.progress.records_generated += saved
                        records_batch = []

                        if on_progress:
                            await on_progress(self.progress)

                    current_time += timedelta(seconds=config['interval'])
                    self.progress.current_time = current_time
                    tick_count += 1

                    # 매 1000틱마다 진행상황 로그
                    if tick_count % 1000 == 0:
                        print(f"[GapFill] {gap.table_name}: {tick_count} ticks, {self.progress.records_generated} records")

                    # CPU 양보 (매 100틱마다)
                    if tick_count % 100 == 0:
                        await asyncio.sleep(0)

                # 남은 배치 저장
                if records_batch:
                    saved = await self._save_batch(generator, records_batch)
                    self.progress.records_generated += saved

                self.progress.gaps_filled += 1
                logger.info(f"[GapFill] Completed {gap.table_name}: {tick_count} ticks")

            self.progress.state = GapFillState.COMPLETED
            self.progress.completed_at = datetime.now()

            elapsed = (self.progress.completed_at - self.progress.started_at).total_seconds()
            logger.info(f"[GapFill] All gaps filled: {self.progress.records_generated} records in {elapsed:.1f}s")

            return True

        except Exception as e:
            logger.error(f"[GapFill] Error: {e}")
            self.progress.state = GapFillState.ERROR
            self.progress.error = str(e)
            return False

    async def _generate_for_time(self, generator, gen_name: str, timestamp: datetime) -> List[Dict]:
        """
        특정 시점의 데이터 생성

        Generator의 generate 메서드를 호출하되, timestamp를 전달
        """
        try:
            import inspect

            # Phase 2 Generator인지 확인 (save 메서드 존재)
            if hasattr(generator, 'save'):
                # generate 메서드 시그니처 확인
                sig = inspect.signature(generator.generate)
                params = list(sig.parameters.keys())

                # timestamp 파라미터를 지원하는지 확인
                if 'timestamp' in params:
                    records = await generator.generate(timestamp=timestamp)
                else:
                    # timestamp 파라미터가 없으면 기존 방식으로 호출 후 override
                    records = await generator.generate()

                    # timestamp 필드 override
                    for record in records:
                        if 'result_timestamp' in record:
                            record['result_timestamp'] = timestamp
                        if 'defect_timestamp' in record:
                            record['defect_timestamp'] = timestamp
                        if 'record_time' in record:
                            record['record_time'] = timestamp
                        if 'status_time' in record:
                            record['status_time'] = timestamp

                return records if records else []

            return []

        except Exception as e:
            logger.error(f"[GapFill] Generate error for {gen_name} at {timestamp}: {e}")
            return []

    async def _save_batch(self, generator, records: List[Dict]) -> int:
        """배치 저장"""
        try:
            if hasattr(generator, 'save'):
                return await generator.save(records, self.db_pool)
            return 0
        except Exception as e:
            logger.error(f"[GapFill] Save error: {e}")
            return 0

    def cancel(self):
        """Gap-Fill 취소"""
        self._cancel_requested = True

    def get_progress(self) -> Dict[str, Any]:
        """진행 상황 반환"""
        p = self.progress
        return {
            "state": p.state.value,
            "total_gaps": p.total_gaps,
            "gaps_filled": p.gaps_filled,
            "total_records_to_generate": p.total_records_to_generate,
            "records_generated": p.records_generated,
            "current_table": p.current_table,
            "current_time": p.current_time.isoformat() if p.current_time else None,
            "target_time": p.target_time.isoformat() if p.target_time else None,
            "started_at": p.started_at.isoformat() if p.started_at else None,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
            "error": p.error,
            "percent_complete": round(
                (p.records_generated / p.total_records_to_generate * 100)
                if p.total_records_to_generate > 0 else 0,
                1
            )
        }


# 싱글톤 인스턴스
_gap_fill_service: Optional[GapFillService] = None


def get_gap_fill_service(db_pool=None, tenant_id: str = None) -> Optional[GapFillService]:
    """GapFillService 싱글톤 인스턴스 반환"""
    global _gap_fill_service
    if _gap_fill_service is None and db_pool and tenant_id:
        _gap_fill_service = GapFillService(db_pool, tenant_id)
    return _gap_fill_service
