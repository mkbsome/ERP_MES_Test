"""
생산 모듈 데이터 생성기
제조오더 → MES작업 → 생산실적 → 불량/비가동 흐름
"""
import random
import uuid
from datetime import datetime, timedelta
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, insert_returning, execute
from config import TENANT_ID

# 불량 코드 정의
DEFECT_CODES = [
    ('DEF_SCRATCH', 'SURFACE', '스크래치'),
    ('DEF_DENT', 'SURFACE', '찍힘'),
    ('DEF_DIMENSION', 'DIMENSION', '치수불량'),
    ('DEF_COMPONENT', 'COMPONENT', '부품불량'),
    ('DEF_ASSEMBLY', 'ASSEMBLY', '조립불량'),
    ('DEF_PAINT', 'SURFACE', '도장불량'),
    ('DEF_FUNCTION', 'FUNCTION', '기능불량'),
    ('DEF_LEAK', 'FUNCTION', '누출'),
]

# 비가동 코드 정의 (downtime_type: breakdown, setup, material, quality, planned, other)
DOWNTIME_CODES = [
    ('DT_BREAKDOWN', 'breakdown', '설비고장'),
    ('DT_CHANGEOVER', 'setup', '품종교체'),
    ('DT_MAINTENANCE', 'planned', '정기점검'),
    ('DT_MATERIAL', 'material', '자재대기'),
    ('DT_QUALITY', 'quality', '품질이슈'),
    ('DT_MEETING', 'planned', '회의'),
    ('DT_CLEANING', 'planned', '청소'),
    ('DT_POWER', 'other', '전력문제'),
]

class ProductionDataGenerator(BaseGenerator):
    """생산 데이터 생성기"""

    def __init__(self):
        super().__init__('production.yaml')
        self.cfg = self.scenario['production_scenario']
        self.products = []
        self.lines = []
        self.sales_orders = []
        self.equipments = []

    def generate(self):
        """생산 데이터 생성"""
        print("=== 생산 모듈 데이터 생성 ===")
        self._load_master_data()
        self.generate_work_orders()
        self.generate_production_orders()
        self.generate_production_results()
        self.generate_defect_details()
        self.generate_downtime_events()
        print("=== 생산 모듈 완료 ===\n")

    def _load_master_data(self):
        """마스터 데이터 로드"""
        self.products = fetch_all(
            "SELECT product_code FROM erp_product_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.lines = fetch_all(
            "SELECT line_code FROM mes_production_line WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.sales_orders = fetch_all(
            "SELECT id, order_no FROM erp_sales_order WHERE tenant_id=%s AND status != 'cancelled'",
            (TENANT_ID,)
        )
        self.equipments = fetch_all(
            "SELECT id, equipment_code, line_code FROM mes_equipment WHERE tenant_id=%s",
            (TENANT_ID,)
        )

    def generate_work_orders(self):
        """제조오더 생성"""
        wo_cfg = self.cfg['work_orders']
        months = self.get_months_in_period()
        wo_count = 0

        for month in months:
            base_count = wo_cfg['monthly_count']
            variance = int(base_count * float(wo_cfg['variance'].replace('%', '')) / 100)
            monthly_orders = base_count + random.randint(-variance, variance)

            for _ in range(monthly_orders):
                plan_date = self.random_date(
                    month,
                    min(month.replace(day=28), self.period_end)
                )

                # 상태 결정 (소문자: planned, released, in_progress, completed, closed, cancelled)
                if plan_date < self.period_end - timedelta(days=14):
                    status = self.weighted_choice({
                        'completed': 75, 'cancelled': 5, 'in_progress': 20
                    })
                else:
                    status = self.weighted_choice({
                        'planned': 20, 'released': 30, 'in_progress': 40, 'completed': 10
                    })

                self._create_work_order(plan_date, status)
                wo_count += 1

        print(f"  제조오더: {wo_count}건 생성")

    def _create_work_order(self, plan_date, status):
        """개별 제조오더 생성"""
        product = random.choice(self.products)
        wo_no = self.generate_doc_no("WO", plan_date)

        # 수주 연계
        so_linked = random.random() < float(self.cfg['work_orders']['sales_order_linked'].replace('%', '')) / 100
        so_id = random.choice(self.sales_orders)['id'] if so_linked and self.sales_orders else None

        qty = random.randint(
            self.cfg['work_orders']['quantity_range']['min'],
            self.cfg['work_orders']['quantity_range']['max']
        )
        plan_end = plan_date + timedelta(days=random.randint(1, 7))

        # 완료 수량
        completed_qty = qty if status == 'completed' else (
            int(qty * random.uniform(0.3, 0.9)) if status == 'in_progress' else 0
        )

        # order_date 필수, planned_start, planned_end
        execute("""
            INSERT INTO erp_work_order
            (tenant_id, work_order_no, order_date, product_code,
             order_qty, completed_qty, sales_order_id, planned_start, planned_end,
             status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (TENANT_ID, wo_no, plan_date, product['product_code'],
              qty, completed_qty, so_id, plan_date, plan_end, status, datetime.now()))

        return wo_no

    def generate_production_orders(self):
        """MES 작업지시 생성"""
        work_orders = fetch_all("""
            SELECT work_order_no, product_code, order_qty, planned_start, status
            FROM erp_work_order
            WHERE tenant_id=%s AND status != 'cancelled'
        """, (TENANT_ID,))

        mo_count = 0
        for wo in work_orders:
            # 제조오더당 1~3개 작업지시
            mo_per_wo = random.randint(
                self.cfg['production_orders']['per_work_order']['min'],
                self.cfg['production_orders']['per_work_order']['max']
            )

            remaining_qty = float(wo['order_qty'])
            for i in range(mo_per_wo):
                if remaining_qty <= 0:
                    break

                mo_no = self.generate_doc_no("MO", wo['planned_start'])
                line = random.choice(self.lines) if self.lines else {'line_code': 'LINE001'}

                # 수량 분배
                if i == mo_per_wo - 1:
                    mo_qty = remaining_qty
                else:
                    mo_qty = random.randint(int(remaining_qty * 0.3), int(remaining_qty * 0.6))
                remaining_qty -= mo_qty

                # 상태 결정 (소문자: planned, released, started, paused, completed, closed, cancelled)
                if wo['status'] == 'completed':
                    mo_status = 'completed'
                elif wo['status'] == 'in_progress':
                    mo_status = self.weighted_choice({'started': 50, 'completed': 50})
                else:
                    mo_status = 'planned'

                # 양품/불량 (완료 시)
                if mo_status == 'completed':
                    yield_rate = random.uniform(
                        float(self.cfg['production_results']['yield_rate']['min'].replace('%', '')) / 100,
                        float(self.cfg['production_results']['yield_rate']['max'].replace('%', '')) / 100
                    )
                    good_qty = int(mo_qty * yield_rate)
                    defect_qty = int(mo_qty) - good_qty
                    produced_qty = int(mo_qty)
                else:
                    good_qty = 0
                    defect_qty = 0
                    produced_qty = 0

                # order_date, target_qty (not planned_qty)
                execute("""
                    INSERT INTO mes_production_order
                    (tenant_id, production_order_no, erp_work_order_no, order_date,
                     product_code, line_code, target_qty, produced_qty, good_qty, defect_qty,
                     status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (TENANT_ID, mo_no, wo['work_order_no'], wo['planned_start'],
                      wo['product_code'], line['line_code'], mo_qty, produced_qty, good_qty, defect_qty,
                      mo_status, datetime.now()))

                mo_count += 1

        print(f"  MES 작업지시: {mo_count}건 생성")

    def generate_production_results(self):
        """생산실적 데이터"""
        completed_orders = fetch_all("""
            SELECT id, production_order_no, product_code, line_code, good_qty, defect_qty, order_date
            FROM mes_production_order
            WHERE tenant_id=%s AND status='completed' AND good_qty > 0
        """, (TENANT_ID,))

        result_count = 0
        for order in completed_orders:
            input_qty = float(order['good_qty']) + float(order['defect_qty'])
            output_qty = input_qty
            yield_rate = float(order['good_qty']) / input_qty * 100 if input_qty > 0 else 0

            execute("""
                INSERT INTO mes_production_result
                (tenant_id, production_order_id, production_order_no, result_timestamp,
                 line_code, product_code, input_qty, output_qty, good_qty, defect_qty,
                 yield_rate, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (TENANT_ID, order['id'], order['production_order_no'],
                  self.random_datetime(order['order_date']),
                  order['line_code'], order['product_code'],
                  input_qty, output_qty, order['good_qty'], order['defect_qty'],
                  yield_rate, datetime.now()))

            result_count += 1

        print(f"  생산실적: {result_count}건 생성")

    def generate_defect_details(self):
        """불량 상세 데이터 생성 - 2년치"""
        # 완료된 생산지시에서 불량이 있는 것만 조회
        orders_with_defects = fetch_all("""
            SELECT id, production_order_no, product_code, line_code, defect_qty, order_date
            FROM mes_production_order
            WHERE tenant_id=%s AND status='completed' AND defect_qty > 0
        """, (TENANT_ID,))

        defect_data = []
        batch_size = 2000

        for order in orders_with_defects:
            defect_qty = int(order['defect_qty'])
            # 불량 건당 1~5개씩 분할 기록
            remaining = defect_qty
            while remaining > 0:
                qty = min(remaining, random.randint(1, 5))
                remaining -= qty

                defect_code, category, _ = random.choice(DEFECT_CODES)
                severity = random.choices(['MINOR', 'MAJOR', 'CRITICAL'], weights=[60, 35, 5])[0]
                detection_point = random.choice(['INLINE', 'FINAL', 'SHIPPING'])

                defect_timestamp = self.random_datetime(order['order_date'])

                # repair_result: repaired, scrapped, pending, returned (소문자)
                repair_result = random.choice(['repaired', 'scrapped', 'pending']) if severity != 'CRITICAL' else 'scrapped'

                defect_data.append((
                    TENANT_ID,
                    order['id'],
                    order['production_order_no'],
                    order['product_code'],
                    defect_timestamp,
                    detection_point,
                    order['line_code'],
                    None,  # equipment_code
                    defect_code,
                    category,
                    severity,
                    qty,
                    None,  # defect_location
                    None,  # lot_no
                    repair_result,
                    None,  # root_cause_category
                    None,  # root_cause_detail
                    None,  # corrective_action
                    None,  # worker_id
                    'INSPECTOR001',
                    datetime.now()
                ))

                # 배치 처리
                if len(defect_data) >= batch_size:
                    execute_batch("""
                        INSERT INTO mes_defect_detail
                        (tenant_id, production_order_id, production_order_no, product_code,
                         defect_timestamp, detection_point, line_code, equipment_code,
                         defect_code, defect_category, severity, defect_qty, defect_location,
                         lot_no, repair_result, root_cause_category, root_cause_detail,
                         corrective_action, worker_id, inspector_id, created_at)
                        VALUES %s
                    """, defect_data)
                    defect_data = []

        # 남은 데이터 처리
        if defect_data:
            execute_batch("""
                INSERT INTO mes_defect_detail
                (tenant_id, production_order_id, production_order_no, product_code,
                 defect_timestamp, detection_point, line_code, equipment_code,
                 defect_code, defect_category, severity, defect_qty, defect_location,
                 lot_no, repair_result, root_cause_category, root_cause_detail,
                 corrective_action, worker_id, inspector_id, created_at)
                VALUES %s
            """, defect_data)

        result = fetch_all("SELECT COUNT(*) as cnt FROM mes_defect_detail WHERE tenant_id=%s", (TENANT_ID,))
        print(f"  불량상세: {result[0]['cnt']}건 생성")

    def generate_downtime_events(self):
        """비가동 이벤트 생성 - 2년치"""
        if not self.equipments:
            print("  비가동: 0건 (설비 없음)")
            return

        downtime_data = []
        batch_size = 2000
        months = self.get_months_in_period()

        for month in months:
            # 월별 비가동 이벤트 수 (설비당 평균 2~5건)
            events_per_month = len(self.equipments) * random.randint(2, 5)

            for _ in range(events_per_month):
                equipment = random.choice(self.equipments)
                code, dtype, reason = random.choice(DOWNTIME_CODES)

                # 비가동 시작 시간 (해당 월 내)
                start_date = self.random_date(month, min(month.replace(day=28), self.period_end))
                start_hour = random.randint(6, 20)
                start_time = datetime.combine(start_date, datetime.min.time().replace(hour=start_hour, minute=random.randint(0, 59)))

                # 비가동 시간 (5분 ~ 4시간)
                duration_min = random.randint(5, 240)
                end_time = start_time + timedelta(minutes=duration_min)

                downtime_data.append((
                    TENANT_ID,
                    equipment['id'],
                    equipment['equipment_code'],
                    equipment['line_code'],
                    start_time,
                    end_time,
                    duration_min,
                    dtype,
                    code,
                    reason,
                    None,  # root_cause
                    None,  # corrective_action
                    'SYSTEM',  # reported_by
                    'SYSTEM' if end_time else None,  # resolved_by
                    None,  # production_order_no
                    datetime.now(),
                    datetime.now()
                ))

                # 배치 처리
                if len(downtime_data) >= batch_size:
                    execute_batch("""
                        INSERT INTO mes_downtime_event
                        (tenant_id, equipment_id, equipment_code, line_code,
                         start_time, end_time, duration_min, downtime_type, downtime_code,
                         downtime_reason, root_cause, corrective_action, reported_by,
                         resolved_by, production_order_no, created_at, updated_at)
                        VALUES %s
                    """, downtime_data)
                    downtime_data = []

        # 남은 데이터 처리
        if downtime_data:
            execute_batch("""
                INSERT INTO mes_downtime_event
                (tenant_id, equipment_id, equipment_code, line_code,
                 start_time, end_time, duration_min, downtime_type, downtime_code,
                 downtime_reason, root_cause, corrective_action, reported_by,
                 resolved_by, production_order_no, created_at, updated_at)
                VALUES %s
            """, downtime_data)

        result = fetch_all("SELECT COUNT(*) as cnt FROM mes_downtime_event WHERE tenant_id=%s", (TENANT_ID,))
        print(f"  비가동: {result[0]['cnt']}건 생성")
