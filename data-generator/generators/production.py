"""
생산 모듈 데이터 생성기
제조오더 → MES작업 → 생산실적 흐름
"""
import random
from datetime import datetime, timedelta
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, insert_returning, execute
from config import TENANT_ID

class ProductionDataGenerator(BaseGenerator):
    """생산 데이터 생성기"""

    def __init__(self):
        super().__init__('production.yaml')
        self.cfg = self.scenario['production_scenario']
        self.products = []
        self.lines = []
        self.sales_orders = []

    def generate(self):
        """생산 데이터 생성"""
        print("=== 생산 모듈 데이터 생성 ===")
        self._load_master_data()
        self.generate_work_orders()
        self.generate_production_orders()
        self.generate_production_results()
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
        wo_no = f"WO{plan_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"

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
        mo_seq = 1  # 시퀀스 카운터 추가
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

                mo_no = f"MO{wo['planned_start'].strftime('%Y%m%d')}{str(mo_seq).zfill(6)}"
                mo_seq += 1
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
