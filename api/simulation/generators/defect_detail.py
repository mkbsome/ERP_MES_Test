"""
Defect Detail Generator (120초 주기)
불량 상세 데이터 생성 - 개별 불량 건 기록
"""
import random
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .base import BaseRealtimeGenerator, DEFECT_CODES


class DefectDetailGenerator(BaseRealtimeGenerator):
    """120초마다 불량 상세 레코드 생성"""

    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, is_phase2=True)
        self.name = "DefectDetail"
        self.interval = 120  # 120초

        # 검출 포인트별 설정
        self.detection_points = [
            ("spi", 0.25),    # SPI 검사
            ("aoi", 0.35),    # AOI 검사
            ("xray", 0.15),   # X-Ray 검사
            ("ict", 0.10),    # ICT 검사
            ("fct", 0.10),    # FCT 검사
            ("visual", 0.05), # 육안 검사
        ]

        # 불량 카테고리별 코드 매핑
        self.defect_mapping = {
            "solder": ["BRIDGE", "INSUF", "COLD", "CRACK"],
            "component": ["MISSING", "TOMBSTONE", "SHIFT", "POLARITY"],
            "placement": ["SHIFT", "ROTATE", "MISSING"],
            "short": ["BRIDGE", "SHORT"],
            "open": ["OPEN", "COLD"],
            "bridge": ["BRIDGE"],
            "insufficient": ["INSUF", "VOID"],
            "void": ["VOID"],
            "crack": ["CRACK"],
            "contamination": ["CONTAM"],
            "mechanical": ["SCRATCH", "BENT"],
        }

        # 불량 심각도
        self.severity_weights = [
            ("critical", 0.05),
            ("major", 0.25),
            ("minor", 0.70),
        ]

        # 부품 참조 (Reference designator)
        self.component_refs = [
            "R", "C", "U", "Q", "L", "D", "J", "SW", "F", "FB",
        ]

        # 수리 결과 (DB CHECK 제약조건에 맞는 값만 사용)
        self.repair_results = [
            ("repaired", 0.65),
            ("scrapped", 0.15),
            ("pending", 0.20),
        ]

        # 근본 원인 카테고리 (4M)
        self.root_cause_categories = [
            ("Man", 0.15),
            ("Machine", 0.35),
            ("Material", 0.25),
            ("Method", 0.25),
        ]

    async def generate(self, timestamp: datetime = None) -> list[dict[str, Any]]:
        """
        불량 상세 레코드 생성

        Args:
            timestamp: 지정된 시간으로 데이터 생성 (Gap-Fill용). None이면 현재 시간 사용.
                      timestamp는 로컬 시간 (Asia/Seoul)으로 전달됨
        """
        await self._ensure_master_data()

        if not self.lines or not self.products or not self.equipments:
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
        records = []

        # 불량 발생 수 결정 (0~5개)
        num_defects = random.choices(
            [0, 1, 2, 3, 4, 5],
            weights=[0.3, 0.35, 0.2, 0.1, 0.04, 0.01]
        )[0]

        for _ in range(num_defects):
            # 라인 및 설비 선택
            line = random.choice(self.lines)
            line_code = line["line_code"]

            # 해당 라인의 설비 선택
            line_equipments = [e for e in self.equipments if e.get("line_code") == line_code]
            if not line_equipments:
                continue
            equipment = random.choice(line_equipments)

            # 제품 선택
            product = random.choice(self.products)

            # 검출 포인트 선택
            detection_point = self.weighted_choice(self.detection_points)

            # 불량 카테고리 및 코드 선택
            defect_category = random.choice(list(self.defect_mapping.keys()))
            defect_code = random.choice(self.defect_mapping[defect_category])

            # 불량 설명 가져오기
            defect_info = DEFECT_CODES.get(defect_code, {"desc": "Unknown defect"})
            defect_description = defect_info.get("desc", defect_code)

            # 심각도
            severity = self.weighted_choice(self.severity_weights)

            # 부품 위치 생성
            ref_prefix = random.choice(self.component_refs)
            ref_number = random.randint(1, 999)
            component_ref = f"{ref_prefix}{ref_number}"

            # 좌표 생성 (mm 단위)
            x_position = round(random.uniform(0, 200), 3)
            y_position = round(random.uniform(0, 150), 3)

            # 로트 및 패널 ID 생성
            lot_no = f"LOT{now.strftime('%Y%m%d%H')}-{random.randint(100, 999)}"
            panel_id = f"PNL-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            pcb_serial = f"PCB{now.strftime('%y%m%d')}{random.randint(10000, 99999)}"

            # 생산지시 번호
            production_order_no = f"PO{now.strftime('%Y%m%d')}-{line_code[-3:]}"

            # 검출 방법
            detection_methods = {
                "spi": "Automatic",
                "aoi": "Automatic",
                "xray": "Automatic",
                "ict": "Automatic",
                "fct": "Automatic",
                "visual": "Manual",
            }

            # 수리 결과 및 근본 원인
            repair_result = self.weighted_choice(self.repair_results)
            root_cause_category = self.weighted_choice(self.root_cause_categories)

            record = {
                "id": str(uuid4()),
                "tenant_id": self.tenant_id,
                "defect_timestamp": now,  # datetime 객체 직접 전달
                "detection_point": detection_point,
                "equipment_code": equipment["equipment_code"],
                "line_code": line_code,
                "production_order_no": production_order_no,
                "product_code": product["product_code"],
                "lot_no": lot_no,
                "panel_id": panel_id,
                "pcb_serial": pcb_serial,
                "defect_category": defect_category,
                "defect_code": defect_code,
                "defect_description": defect_description,
                "defect_location": component_ref,
                "component_ref": component_ref,
                "component_code": f"COMP-{ref_prefix}-{random.randint(1000, 9999)}",
                "x_position": x_position,
                "y_position": y_position,
                "defect_qty": random.choices([1, 2, 3], weights=[0.85, 0.12, 0.03])[0],
                "severity": severity,
                "detected_by": f"OP{random.randint(1, 6):03d}",
                "detection_method": detection_methods.get(detection_point, "Unknown"),
                "repair_result": repair_result,
                "root_cause_category": root_cause_category,
            }

            records.append(record)

        return records

    async def save(self, records: list[dict[str, Any]], pool) -> int:
        """불량 상세 저장 (실제 DB 스키마에 맞춤)

        실제 DB 컬럼: id, tenant_id, production_order_no, product_code,
        defect_timestamp, detection_point, line_code, equipment_code,
        defect_code, defect_category, severity, defect_qty, defect_location,
        lot_no, repair_result, root_cause_category, worker_id, inspector_id
        """
        if not records:
            return 0

        async with pool.acquire() as conn:
            count = 0
            for record in records:
                try:
                    await conn.execute("""
                        INSERT INTO mes_defect_detail (
                            id, tenant_id, production_order_no, product_code,
                            defect_timestamp, detection_point, line_code, equipment_code,
                            defect_code, defect_category, severity, defect_qty,
                            defect_location, lot_no, repair_result, root_cause_category,
                            worker_id, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15, $16, $17, NOW()
                        )
                    """,
                        record["id"],
                        record["tenant_id"],
                        record["production_order_no"],
                        record["product_code"],
                        record["defect_timestamp"],
                        record["detection_point"],
                        record["line_code"],
                        record["equipment_code"],
                        record["defect_code"],
                        record["defect_category"],
                        record["severity"],
                        record["defect_qty"],
                        record["defect_location"],
                        record["lot_no"],
                        record["repair_result"],
                        record["root_cause_category"],
                        record["detected_by"],  # maps to worker_id
                    )
                    count += 1
                except Exception as e:
                    print(f"[DefectDetail] Insert error: {e}")

            return count

    async def _ensure_partition(self, conn, table_name: str, timestamp_column: str, timestamp_value: str):
        """필요한 파티션이 있는지 확인하고 없으면 생성"""
        ts = datetime.fromisoformat(timestamp_value.replace('Z', '+00:00'))
        year = ts.year
        half = "h1" if ts.month <= 6 else "h2"

        partition_name = f"{table_name}_{year}_{half}"

        if half == "h1":
            start_date = f"{year}-01-01"
            end_date = f"{year}-07-01"
        else:
            start_date = f"{year}-07-01"
            end_date = f"{year + 1}-01-01"

        exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM pg_tables
                WHERE tablename = $1
            )
        """, partition_name)

        if not exists:
            try:
                await conn.execute(f"""
                    CREATE TABLE IF NOT EXISTS {partition_name}
                    PARTITION OF {table_name}
                    FOR VALUES FROM ('{start_date}') TO ('{end_date}')
                """)
                print(f"[{self.name}] Created partition: {partition_name}")
            except Exception as e:
                if "already exists" not in str(e):
                    print(f"[{self.name}] Partition creation warning: {e}")
