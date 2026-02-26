"""
OEE Calculator Generator (3600초 주기)
설비 OEE 계산 및 저장 - 시간당 OEE 지표
"""
import random
from datetime import datetime, timezone, date
from typing import Any
from uuid import uuid4
import json

from .base import BaseRealtimeGenerator


class OEECalculator(BaseRealtimeGenerator):
    """3600초(1시간)마다 OEE 계산 및 저장"""

    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, is_phase2=True)
        self.name = "OEECalculator"
        self.interval = 3600  # 1시간

        # OEE 누적 데이터 (설비별)
        self.equipment_metrics: dict[str, dict] = {}

        # 비가동 사유
        self.downtime_reasons = [
            ("breakdown", 0.15),
            ("planned_maintenance", 0.10),
            ("setup", 0.20),
            ("changeover", 0.15),
            ("material_shortage", 0.10),
            ("quality_issue", 0.10),
            ("operator_absence", 0.05),
            ("waiting", 0.15),
        ]

    def _get_shift_code(self, dt: datetime) -> str:
        """현재 시간에 따른 교대조 반환"""
        hour = dt.hour
        if 6 <= hour < 14:
            return "1"
        elif 14 <= hour < 22:
            return "2"
        else:
            return "3"

    def _init_equipment_metrics(self, equipment_code: str) -> dict:
        """설비별 메트릭 초기화"""
        return {
            "planned_time_min": 60.0,  # 1시간
            "actual_run_time_min": 0.0,
            "downtime_min": 0.0,
            "setup_time_min": 0.0,
            "idle_time_min": 0.0,
            "total_count": 0,
            "good_count": 0,
            "defect_count": 0,
            "downtime_breakdown": [],
            "defect_breakdown": [],
        }

    async def generate(self) -> list[dict[str, Any]]:
        """OEE 레코드 생성"""
        await self._ensure_master_data()

        if not self.equipments or not self.lines:
            return []

        now = datetime.now(timezone.utc)
        calculation_date = now.date()
        shift_code = self._get_shift_code(now)
        records = []

        for equipment in self.equipments:
            equipment_code = equipment["equipment_code"]
            line_code = equipment.get("line_code", "LINE001")

            # 메트릭 초기화
            metrics = self._init_equipment_metrics(equipment_code)

            # 시뮬레이션: 가동률 70~95%
            availability_target = random.uniform(0.70, 0.95)
            actual_run_time = metrics["planned_time_min"] * availability_target

            # 비가동 시간 분배
            total_downtime = metrics["planned_time_min"] - actual_run_time
            downtime_breakdown = []

            remaining_downtime = total_downtime
            for reason, weight in self.downtime_reasons:
                if remaining_downtime <= 0:
                    break
                downtime_min = min(remaining_downtime, total_downtime * weight * random.uniform(0.5, 1.5))
                if downtime_min > 0.5:  # 30초 이상만 기록
                    downtime_breakdown.append({
                        "reason": reason,
                        "minutes": round(downtime_min, 2)
                    })
                    remaining_downtime -= downtime_min

            # Setup/Idle 시간 계산
            setup_time = sum(d["minutes"] for d in downtime_breakdown if d["reason"] in ["setup", "changeover"])
            idle_time = sum(d["minutes"] for d in downtime_breakdown if d["reason"] in ["waiting", "operator_absence"])

            # 생산량 계산 (분당 20~30개)
            production_rate = random.uniform(20, 30)
            total_count = int(actual_run_time * production_rate)

            # 품질률 계산 (97~99.5%)
            quality_rate = random.uniform(0.97, 0.995)
            good_count = int(total_count * quality_rate)
            defect_count = total_count - good_count

            # 불량 내역
            defect_breakdown = []
            if defect_count > 0:
                defect_types = ["BRIDGE", "INSUF", "MISSING", "SHIFT", "COLD"]
                remaining_defects = defect_count
                for defect_code in random.sample(defect_types, min(3, len(defect_types))):
                    if remaining_defects <= 0:
                        break
                    count = random.randint(1, remaining_defects)
                    defect_breakdown.append({
                        "defect_code": defect_code,
                        "count": count
                    })
                    remaining_defects -= count

            # 사이클 타임
            ideal_cycle_time_sec = random.uniform(2.0, 3.0)
            actual_cycle_time_sec = ideal_cycle_time_sec * random.uniform(1.0, 1.2)

            # OEE 계산
            availability = actual_run_time / metrics["planned_time_min"] if metrics["planned_time_min"] > 0 else 0
            performance = (total_count * ideal_cycle_time_sec / 60.0) / actual_run_time if actual_run_time > 0 else 0
            quality = good_count / total_count if total_count > 0 else 0
            oee = availability * performance * quality

            record = {
                "id": str(uuid4()),
                "tenant_id": self.tenant_id,
                "calculation_date": calculation_date.isoformat(),
                "shift_code": shift_code,
                "equipment_code": equipment_code,
                "line_code": line_code,
                "planned_time_min": round(metrics["planned_time_min"], 2),
                "actual_run_time_min": round(actual_run_time, 2),
                "downtime_min": round(total_downtime, 2),
                "setup_time_min": round(setup_time, 2),
                "idle_time_min": round(idle_time, 2),
                "ideal_cycle_time_sec": round(ideal_cycle_time_sec, 2),
                "actual_cycle_time_sec": round(actual_cycle_time_sec, 2),
                "total_count": total_count,
                "good_count": good_count,
                "defect_count": defect_count,
                "oee": round(oee, 4),
                "downtime_breakdown": json.dumps(downtime_breakdown),
                "defect_breakdown": json.dumps(defect_breakdown),
            }

            records.append(record)

        return records

    async def save(self, records: list[dict[str, Any]], pool) -> int:
        """OEE 저장"""
        if not records:
            return 0

        async with pool.acquire() as conn:
            count = 0
            for record in records:
                try:
                    # UPSERT: 동일 날짜/교대/설비에 대해 업데이트
                    await conn.execute("""
                        INSERT INTO mes_equipment_oee (
                            id, tenant_id, calculation_date, shift_code, equipment_code,
                            line_code, planned_time_min, actual_run_time_min, downtime_min,
                            setup_time_min, idle_time_min, ideal_cycle_time_sec,
                            actual_cycle_time_sec, total_count, good_count, defect_count,
                            oee, downtime_breakdown, defect_breakdown, calculated_at, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, NOW(), NOW()
                        )
                        ON CONFLICT (tenant_id, calculation_date, COALESCE(shift_code, ''), equipment_code)
                        DO UPDATE SET
                            planned_time_min = mes_equipment_oee.planned_time_min + EXCLUDED.planned_time_min,
                            actual_run_time_min = mes_equipment_oee.actual_run_time_min + EXCLUDED.actual_run_time_min,
                            downtime_min = mes_equipment_oee.downtime_min + EXCLUDED.downtime_min,
                            setup_time_min = mes_equipment_oee.setup_time_min + EXCLUDED.setup_time_min,
                            idle_time_min = mes_equipment_oee.idle_time_min + EXCLUDED.idle_time_min,
                            total_count = mes_equipment_oee.total_count + EXCLUDED.total_count,
                            good_count = mes_equipment_oee.good_count + EXCLUDED.good_count,
                            defect_count = mes_equipment_oee.defect_count + EXCLUDED.defect_count,
                            oee = EXCLUDED.oee,
                            calculated_at = NOW()
                    """,
                        record["id"],
                        record["tenant_id"],
                        record["calculation_date"],
                        record["shift_code"],
                        record["equipment_code"],
                        record["line_code"],
                        record["planned_time_min"],
                        record["actual_run_time_min"],
                        record["downtime_min"],
                        record["setup_time_min"],
                        record["idle_time_min"],
                        record["ideal_cycle_time_sec"],
                        record["actual_cycle_time_sec"],
                        record["total_count"],
                        record["good_count"],
                        record["defect_count"],
                        record["oee"],
                        record["downtime_breakdown"],
                        record["defect_breakdown"],
                    )
                    count += 1
                except Exception as e:
                    print(f"[OEECalculator] Insert error: {e}")

            return count
