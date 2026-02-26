"""
EquipmentStatusGenerator - 설비 상태 데이터 생성

주기: 10초
테이블: mes_equipment_status
"""

import random
from datetime import datetime
from typing import List, Dict, Any
import logging

from .base import BaseRealtimeGenerator, EQUIPMENT_STATUS_CODES

logger = logging.getLogger(__name__)


class EquipmentStatusGenerator(BaseRealtimeGenerator):
    """
    설비 상태 Generator

    - 각 설비별 현재 상태, 온도, 압력 등 생성
    - 10초 주기로 실행
    """

    def __init__(self, tenant_id: str = None):
        super().__init__("equipment_status")
        if tenant_id:
            self.tenant_id = tenant_id

        # 설비별 상태 추적
        self._equipment_states: Dict[str, Dict[str, Any]] = {}

    async def generate(self, db_pool, config) -> List[Dict[str, Any]]:
        """설비 상태 데이터 생성"""
        if not db_pool:
            logger.warning(f"[{self.name}] No database pool")
            return []

        # 마스터 데이터 로드 (최초 1회)
        if not self._master_data:
            await self.load_master_data(db_pool, config.tenant_id)

        equipments = self._master_data.get('equipments', [])
        if not equipments:
            logger.warning(f"[{self.name}] No equipments found")
            return []

        records = []
        now = datetime.now()

        async with db_pool.acquire() as conn:
            for equipment in equipments:
                equipment_code = equipment['equipment_code']

                # 설비 상태 초기화 또는 업데이트
                if equipment_code not in self._equipment_states:
                    self._equipment_states[equipment_code] = self._init_equipment_state(equipment)

                state = self._equipment_states[equipment_code]

                # 상태 전이 (확률적)
                new_status = self._transition_status(state['status'])
                state['status'] = new_status

                # 센서 값 생성
                temperature = self._generate_temperature(state, new_status)
                pressure = self._generate_pressure(state, new_status)
                vibration = self._generate_vibration(state, new_status)
                power_consumption = self._generate_power(state, new_status)

                state['temperature'] = temperature
                state['pressure'] = pressure

                # 알람 상태 결정
                alarm_status = self._check_alarm(temperature, pressure, vibration)

                record = {
                    'tenant_id': config.tenant_id,
                    'equipment_id': equipment['id'],
                    'equipment_code': equipment_code,
                    'line_code': equipment['line_code'],
                    'status_timestamp': now,
                    'status': new_status,
                    'temperature': temperature,
                    'pressure': pressure,
                    'vibration': vibration,
                    'power_consumption': power_consumption,
                    'operating_hours': state['operating_hours'],
                    'alarm_status': alarm_status,
                    'alarm_code': 'TEMP_HIGH' if alarm_status == 'WARNING' and temperature > 85 else None,
                }

                # 가동 중이면 운전시간 증가
                if new_status == 'RUNNING':
                    state['operating_hours'] += 10 / 3600  # 10초를 시간으로 환산

                # DB 저장 (기존 스키마에 맞춤: mes_equipment_status)
                # 스키마: status VARCHAR(20) CHECK (status IN ('running', 'idle', 'setup', 'breakdown', 'maintenance', 'off'))
                try:
                    await conn.execute("""
                        INSERT INTO mes_equipment_status
                        (tenant_id, equipment_id, equipment_code, status_timestamp, status,
                         previous_status, production_order_no, product_code,
                         speed_rpm, temperature, pressure, alarm_code, alarm_message,
                         operator_id, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    """,
                        record['tenant_id'],
                        record['equipment_id'],
                        record['equipment_code'],
                        record['status_timestamp'],
                        record['status'].lower(),  # 소문자로 저장
                        state.get('previous_status', '').lower() if state.get('previous_status') else None,
                        None,  # production_order_no
                        None,  # product_code
                        None,  # speed_rpm
                        record['temperature'],
                        record['pressure'],
                        record['alarm_code'],
                        f"Temperature: {record['temperature']}C, Pressure: {record['pressure']} bar" if record['alarm_code'] else None,
                        None,  # operator_id
                        now
                    )
                    # 이전 상태 업데이트
                    state['previous_status'] = new_status
                    records.append(record)
                except Exception as e:
                    logger.error(f"[{self.name}] Failed to insert record for {equipment_code}: {e}")

        logger.debug(f"[{self.name}] Generated {len(records)} records")
        return records

    def _init_equipment_state(self, equipment: Dict) -> Dict[str, Any]:
        """설비 초기 상태 설정"""
        # 초기 상태는 대부분 가동 중
        initial_status = self.weighted_choice({
            'RUNNING': 0.7,
            'IDLE': 0.2,
            'SETUP': 0.05,
            'MAINTENANCE': 0.05
        })

        return {
            'equipment_code': equipment['equipment_code'],
            'status': initial_status,
            'base_temperature': random.uniform(40, 60),  # 기준 온도
            'base_pressure': random.uniform(2, 5),       # 기준 압력 (bar)
            'temperature': None,
            'pressure': None,
            'operating_hours': random.uniform(0, 1000),  # 초기 운전시간
        }

    def _transition_status(self, current_status: str) -> str:
        """상태 전이 (마르코프 체인 방식)"""
        transitions = {
            'RUNNING': {'RUNNING': 0.95, 'IDLE': 0.03, 'SETUP': 0.01, 'BREAKDOWN': 0.005, 'MAINTENANCE': 0.005},
            'IDLE': {'IDLE': 0.7, 'RUNNING': 0.25, 'SETUP': 0.03, 'MAINTENANCE': 0.02},
            'SETUP': {'SETUP': 0.6, 'RUNNING': 0.35, 'IDLE': 0.05},
            'MAINTENANCE': {'MAINTENANCE': 0.8, 'IDLE': 0.15, 'RUNNING': 0.05},
            'BREAKDOWN': {'BREAKDOWN': 0.7, 'MAINTENANCE': 0.2, 'IDLE': 0.1},
            'CLEANING': {'CLEANING': 0.5, 'IDLE': 0.3, 'RUNNING': 0.2},
        }

        probs = transitions.get(current_status, {'IDLE': 1.0})
        return self.weighted_choice(probs)

    def _generate_temperature(self, state: Dict, status: str) -> float:
        """온도 생성"""
        base = state['base_temperature']

        if status == 'RUNNING':
            # 가동 중: 기준 온도 + 20~40도
            temp = base + random.uniform(20, 40)
        elif status == 'BREAKDOWN':
            # 고장: 높은 온도 가능
            temp = base + random.uniform(30, 60)
        else:
            # 기타: 기준 온도 근처
            temp = base + random.uniform(-5, 10)

        # 이전 온도와 급격한 변화 방지 (이동 평균)
        if state['temperature'] is not None:
            temp = state['temperature'] * 0.7 + temp * 0.3

        return round(temp, 1)

    def _generate_pressure(self, state: Dict, status: str) -> float:
        """압력 생성 (bar)"""
        base = state['base_pressure']

        if status == 'RUNNING':
            pressure = base + random.uniform(0.5, 2)
        elif status == 'BREAKDOWN':
            # 고장 시 압력 불안정
            pressure = base + random.uniform(-1, 3)
        else:
            pressure = base + random.uniform(-0.5, 0.5)

        # 이전 압력과 급격한 변화 방지
        if state['pressure'] is not None:
            pressure = state['pressure'] * 0.7 + pressure * 0.3

        return round(max(0, pressure), 2)

    def _generate_vibration(self, state: Dict, status: str) -> float:
        """진동 생성 (mm/s)"""
        if status == 'RUNNING':
            vibration = random.uniform(1, 5)
        elif status == 'BREAKDOWN':
            # 고장 시 높은 진동
            vibration = random.uniform(5, 15)
        else:
            vibration = random.uniform(0, 1)

        return round(vibration, 2)

    def _generate_power(self, state: Dict, status: str) -> float:
        """전력 소비량 생성 (kW)"""
        if status == 'RUNNING':
            power = random.uniform(10, 50)
        elif status in ('IDLE', 'SETUP'):
            power = random.uniform(1, 5)
        else:
            power = random.uniform(0, 2)

        return round(power, 2)

    def _check_alarm(self, temperature: float, pressure: float, vibration: float) -> str:
        """알람 상태 확인"""
        if temperature > 95 or pressure > 8 or vibration > 12:
            return 'CRITICAL'
        elif temperature > 85 or pressure > 6.5 or vibration > 8:
            return 'WARNING'
        else:
            return 'NORMAL'

    def reset_states(self):
        """설비 상태 리셋"""
        self._equipment_states.clear()
