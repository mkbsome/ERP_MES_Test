"""
RealtimeProductionGenerator - 실시간 생산 현황 데이터 생성

주기: 5초
테이블: mes_realtime_production (또는 기존 mes_production_result 활용)
"""

import random
from datetime import datetime
from typing import List, Dict, Any
import logging

from .base import BaseRealtimeGenerator

logger = logging.getLogger(__name__)


class RealtimeProductionGenerator(BaseRealtimeGenerator):
    """
    실시간 생산 현황 Generator

    - 각 라인별 현재 생산 상태 생성
    - 5초 주기로 실행
    """

    def __init__(self, tenant_id: str = None):
        super().__init__("realtime_production")
        if tenant_id:
            self.tenant_id = tenant_id

        # 라인별 상태 추적 (시뮬레이션 상태 유지)
        self._line_states: Dict[str, Dict[str, Any]] = {}

    async def generate(self, db_pool, config) -> List[Dict[str, Any]]:
        """실시간 생산 데이터 생성"""
        if not db_pool:
            logger.warning(f"[{self.name}] No database pool")
            return []

        # 마스터 데이터 로드 (최초 1회)
        if not self._master_data:
            await self.load_master_data(db_pool, config.tenant_id)

        lines = self._master_data.get('lines', [])
        if not lines:
            logger.warning(f"[{self.name}] No production lines found")
            return []

        records = []
        now = datetime.now()

        async with db_pool.acquire() as conn:
            for line in lines:
                line_code = line['line_code']

                # 라인 상태 초기화 또는 업데이트
                if line_code not in self._line_states:
                    self._line_states[line_code] = self._init_line_state(line_code)

                state = self._line_states[line_code]

                # 생산 상태 결정 (90% 가동, 10% 비가동)
                is_running = random.random() < 0.9

                if is_running:
                    # 생산량 증가
                    production_rate = self.apply_variance(
                        state['base_rate'],
                        config.production_variance * 100
                    )
                    produced = max(1, int(production_rate / 12))  # 5초당 생산량

                    # 불량 발생 여부
                    defect_rate = config.base_defect_rate
                    defects = 0
                    for _ in range(produced):
                        if random.random() < defect_rate:
                            defects += 1

                    good_qty = produced - defects
                    state['produced_qty'] += produced
                    state['good_qty'] += good_qty
                    state['defect_qty'] += defects

                else:
                    produced = 0
                    good_qty = 0
                    defects = 0

                # 데이터 저장
                record = {
                    'tenant_id': config.tenant_id,
                    'line_code': line_code,
                    'record_timestamp': now,
                    'status': 'RUNNING' if is_running else 'IDLE',
                    'current_product': state.get('current_product'),
                    'current_order': state.get('current_order'),
                    'produced_qty': produced,
                    'good_qty': good_qty,
                    'defect_qty': defects,
                    'cumulative_produced': state['produced_qty'],
                    'cumulative_good': state['good_qty'],
                    'cumulative_defect': state['defect_qty'],
                    'cycle_time': round(random.uniform(8, 15), 2) if is_running else None,
                    'target_rate': state['target_rate'],
                    'actual_rate': round(produced * 12, 2) if is_running else 0,  # 분당 환산
                }

                # DB 저장 (기존 스키마에 맞춤: mes_realtime_production)
                try:
                    await conn.execute("""
                        INSERT INTO mes_realtime_production
                        (tenant_id, timestamp, line_code, equipment_code, production_order_no,
                         product_code, takt_count, good_count, defect_count,
                         cycle_time_ms, target_cycle_time_ms, equipment_status,
                         speed_rpm, temperature_celsius, pressure_bar, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    """,
                        record['tenant_id'],
                        record['record_timestamp'],
                        record['line_code'],
                        None,  # equipment_code
                        record['current_order'],
                        record['current_product'],
                        record['produced_qty'],  # takt_count
                        record['good_qty'],  # good_count
                        record['defect_qty'],  # defect_count
                        int(record['cycle_time'] * 1000) if record['cycle_time'] else None,  # cycle_time_ms
                        10000,  # target_cycle_time_ms (10초)
                        record['status'].lower(),  # equipment_status (소문자)
                        None,  # speed_rpm
                        None,  # temperature_celsius
                        None,  # pressure_bar
                        now
                    )
                    records.append(record)
                except Exception as e:
                    logger.error(f"[{self.name}] Failed to insert record for {line_code}: {e}")

        logger.debug(f"[{self.name}] Generated {len(records)} records")
        return records

    def _init_line_state(self, line_code: str) -> Dict[str, Any]:
        """라인 초기 상태 설정"""
        # 랜덤 제품 할당
        product = self.get_random_product()

        # 기본 생산율 (분당)
        base_rate = random.uniform(10, 30)

        return {
            'line_code': line_code,
            'current_product': product['product_code'] if product else None,
            'current_order': None,  # TODO: 실제 생산지시와 연동
            'base_rate': base_rate,
            'target_rate': round(base_rate, 2),
            'produced_qty': 0,
            'good_qty': 0,
            'defect_qty': 0,
            'shift_start': datetime.now(),
        }

    def reset_line_states(self):
        """라인 상태 리셋 (시뮬레이션 리셋 시)"""
        self._line_states.clear()
