"""
Production Result Generator (60초 주기)
생산 실적 데이터 생성 - 공정별 생산 결과
"""
import random
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .base import BaseRealtimeGenerator


class ProductionResultGenerator(BaseRealtimeGenerator):
    """60초마다 생산 실적 레코드 생성"""

    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, is_phase2=True)
        self.name = "ProductionResult"
        self.interval = 60  # 60초

        # 생산지시 상태 추적 (라인별)
        self.line_production_state: dict[str, dict] = {}

        # 공정 정의
        self.operations = [
            (10, "Solder Paste Print"),
            (20, "SPI Inspection"),
            (30, "Component Mount"),
            (40, "Reflow Soldering"),
            (50, "AOI Inspection"),
            (60, "Manual Assembly"),
            (70, "Final Test"),
        ]

        # 작업자 코드
        self.operators = [
            ("OP001", "김생산"), ("OP002", "이조립"), ("OP003", "박검사"),
            ("OP004", "최포장"), ("OP005", "정관리"), ("OP006", "한품질"),
        ]

    def _get_shift_code(self, dt: datetime) -> str:
        """현재 시간에 따른 교대조 반환"""
        hour = dt.hour
        if 6 <= hour < 14:
            return "1"  # 주간
        elif 14 <= hour < 22:
            return "2"  # 오후
        else:
            return "3"  # 야간

    def _init_line_state(self, line_code: str, product_code: str) -> dict:
        """라인별 생산 상태 초기화"""
        return {
            "production_order_no": f"PO{datetime.now().strftime('%Y%m%d')}-{line_code[-3:]}",
            "product_code": product_code,
            "lot_no": f"LOT{datetime.now().strftime('%Y%m%d%H%M')}-{random.randint(100, 999)}",
            "current_operation_idx": 0,
            "cumulative_input": 0,
            "cumulative_output": 0,
            "cumulative_good": 0,
            "cumulative_defect": 0,
        }

    async def generate(self, timestamp: datetime = None) -> list[dict[str, Any]]:
        """
        생산 실적 레코드 생성

        Args:
            timestamp: 지정된 시간으로 데이터 생성 (Gap-Fill용). None이면 현재 시간 사용.
                      timestamp는 로컬 시간 (Asia/Seoul)으로 전달됨
        """
        await self._ensure_master_data()

        if not self.lines or not self.products:
            return []

        # timestamp가 주어지면 그대로 사용, 아니면 현재 UTC 시간 사용
        # DB는 UTC로 저장하므로 UTC 시간 사용
        if timestamp:
            now = timestamp
            # timezone-aware면 naive로 변환
            if now.tzinfo is not None:
                now = now.replace(tzinfo=None)
        else:
            # 현재 UTC 시간 사용
            now = datetime.now(timezone.utc).replace(tzinfo=None)
        shift_code = self._get_shift_code(now)
        records = []

        # 각 라인에서 생산 실적 생성
        for line in self.lines:
            line_code = line["line_code"]

            # 라인 상태 초기화 또는 가져오기
            if line_code not in self.line_production_state:
                product = random.choice(self.products)
                self.line_production_state[line_code] = self._init_line_state(
                    line_code, product["product_code"]
                )

            state = self.line_production_state[line_code]

            # 공정 선택 (순차 진행)
            operation_no, operation_name = self.operations[state["current_operation_idx"]]

            # 생산량 계산 (분당 10~20개)
            base_qty = random.randint(10, 20)
            input_qty = base_qty

            # 수율 기반 출력 계산 (98~100%)
            yield_rate = random.uniform(0.98, 1.0)
            output_qty = int(input_qty * yield_rate)

            # 불량률 계산 (기본 1~3%, 시나리오에 따라 증가 가능)
            defect_rate = random.uniform(0.01, 0.03)
            defect_qty = max(0, int(output_qty * defect_rate))
            good_qty = output_qty - defect_qty

            # 재작업/스크랩 계산
            rework_qty = int(defect_qty * random.uniform(0.3, 0.7))
            scrap_qty = defect_qty - rework_qty

            # 시간 계산
            cycle_time_sec = random.uniform(2.5, 4.5)
            takt_time_sec = 3.0  # 목표 택트타임
            setup_time_min = random.uniform(0, 2) if random.random() < 0.1 else 0
            run_time_min = 1.0  # 1분 간격 기준
            idle_time_min = random.uniform(0, 0.2)

            # 작업자 선택
            operator_code, operator_name = random.choice(self.operators)

            # 라인에 해당하는 설비 찾기
            line_equipments = [e for e in self.equipments if e.get("line_code") == line_code]
            equipment_code = line_equipments[0]["equipment_code"] if line_equipments else None

            record = {
                "id": str(uuid4()),
                "tenant_id": self.tenant_id,
                "production_order_no": state["production_order_no"],
                "result_timestamp": now,  # datetime 객체 직접 전달
                "shift_code": shift_code,
                "line_code": line_code,
                "equipment_code": equipment_code,
                "operation_no": operation_no,
                "operation_name": operation_name,
                "product_code": state["product_code"],
                "lot_no": state["lot_no"],
                "input_qty": input_qty,
                "output_qty": output_qty,
                "good_qty": good_qty,
                "defect_qty": defect_qty,
                "rework_qty": rework_qty,
                "scrap_qty": scrap_qty,
                "unit": "PNL",
                "cycle_time_sec": round(cycle_time_sec, 2),
                "takt_time_sec": takt_time_sec,
                "setup_time_min": round(setup_time_min, 2),
                "run_time_min": round(run_time_min, 2),
                "idle_time_min": round(idle_time_min, 2),
                "operator_code": operator_code,
                "operator_name": operator_name,
                "result_type": "normal",
                "reported_by": operator_code,
            }

            records.append(record)

            # 상태 업데이트
            state["cumulative_input"] += input_qty
            state["cumulative_output"] += output_qty
            state["cumulative_good"] += good_qty
            state["cumulative_defect"] += defect_qty

            # 다음 공정으로 이동 (10% 확률로)
            if random.random() < 0.1:
                state["current_operation_idx"] = (state["current_operation_idx"] + 1) % len(self.operations)

        return records

    async def save(self, records: list[dict[str, Any]], pool) -> int:
        """생산 실적 저장 (실제 DB 스키마에 맞춤)

        실제 DB 컬럼:
        - shift (not shift_code)
        - operation_seq (not operation_no)
        - worker_id (not operator_code)
        - yield_rate, defect_rate (자동 계산 필드)
        """
        if not records:
            return 0

        async with pool.acquire() as conn:
            count = 0
            for record in records:
                try:
                    await conn.execute("""
                        INSERT INTO mes_production_result (
                            id, tenant_id, production_order_no, result_timestamp, shift,
                            line_code, equipment_code, operation_seq, product_code,
                            lot_no, input_qty, output_qty, good_qty, defect_qty,
                            scrap_qty, cycle_time_sec, worker_id, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15, $16, $17, NOW()
                        )
                    """,
                        record["id"],
                        record["tenant_id"],
                        record["production_order_no"],
                        record["result_timestamp"],
                        record["shift_code"],  # maps to 'shift'
                        record["line_code"],
                        record["equipment_code"],
                        record["operation_no"],  # maps to 'operation_seq'
                        record["product_code"],
                        record["lot_no"],
                        record["input_qty"],
                        record["output_qty"],
                        record["good_qty"],
                        record["defect_qty"],
                        record["scrap_qty"],
                        record["cycle_time_sec"],
                        record["operator_code"],  # maps to 'worker_id'
                    )
                    count += 1
                except Exception as e:
                    print(f"[ProductionResult] Insert error: {e}")

            return count
