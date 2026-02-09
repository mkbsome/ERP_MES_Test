"""
영업 모듈 데이터 생성기
수주 → 출하 → 매출 흐름
"""
import random
from datetime import datetime, timedelta
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, insert_returning
from config import TENANT_ID

class SalesDataGenerator(BaseGenerator):
    """영업 데이터 생성기"""

    def __init__(self):
        super().__init__('sales.yaml')
        self.cfg = self.scenario['sales_scenario']
        self.customers = []
        self.products = []

    def generate(self):
        """영업 데이터 생성"""
        print("=== 영업 모듈 데이터 생성 ===")
        self._load_master_data()
        self.generate_sales_orders()
        self.generate_shipments()
        print("=== 영업 모듈 완료 ===\n")

    def _load_master_data(self):
        """마스터 데이터 로드"""
        self.customers = fetch_all(
            "SELECT customer_code, customer_grade FROM erp_customer_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.products = fetch_all(
            "SELECT product_code, selling_price FROM erp_product_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )

    def generate_sales_orders(self):
        """수주 데이터 생성"""
        so_cfg = self.cfg['sales_orders']
        months = self.get_months_in_period()
        order_count = 0

        print(f"    총 {len(months)}개월 데이터 생성 예정...")

        for month in months:
            print(f"    {month.strftime('%Y-%m')} 처리 중...", end=" ", flush=True)
            # 월별 수주 건수 (편차 적용)
            base_count = so_cfg['monthly_count']
            variance = int(base_count * float(so_cfg['variance'].replace('%', '')) / 100)
            monthly_orders = base_count + random.randint(-variance, variance)

            for _ in range(monthly_orders):
                order_date = self.random_date(
                    month,
                    min(month.replace(day=28), self.period_end)
                )

                # 상태 결정 (과거/현재에 따라) - DB 스키마: 소문자
                if order_date < self.period_end - timedelta(days=30):
                    status = self.weighted_choice({
                        'shipped': 70, 'closed': 20, 'cancelled': 10
                    })
                elif order_date < self.period_end - timedelta(days=7):
                    status = self.weighted_choice({
                        'in_production': 40, 'shipped': 50, 'confirmed': 10
                    })
                else:
                    status = self.weighted_choice({
                        'draft': 20, 'confirmed': 50, 'in_production': 30
                    })

                self._create_sales_order(order_date, status)
                order_count += 1

            print(f"{monthly_orders}건 완료")

        print(f"  수주: {order_count}건 생성")

    def _create_sales_order(self, order_date, status):
        """개별 수주 생성"""
        # 고객 선택 (등급 가중치 적용)
        grade_weights = self.cfg['sales_orders']['customer_grade_weight']
        grade = self.weighted_choice(grade_weights)
        grade_customers = [c for c in self.customers if c['customer_grade'] == grade]
        if not grade_customers:
            grade_customers = self.customers
        customer = random.choice(grade_customers)

        # 수주번호 생성
        order_no = f"SO{order_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}"

        # 납기일
        delivery_days = random.randint(
            self.cfg['sales_orders']['delivery_days']['min'],
            self.cfg['sales_orders']['delivery_days']['max']
        )
        delivery_date = order_date + timedelta(days=delivery_days)

        # 수주 헤더 생성
        order_id = insert_returning("""
            INSERT INTO erp_sales_order
            (tenant_id, order_no, order_date, customer_code, status,
             delivery_date, total_amount, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s)
            RETURNING id
        """, (TENANT_ID, order_no, order_date, customer['customer_code'],
              status, delivery_date, datetime.now()))

        # 수주 품목 생성
        items_count = random.randint(
            self.cfg['sales_orders']['items_per_order']['min'],
            self.cfg['sales_orders']['items_per_order']['max']
        )
        selected_products = random.sample(self.products, min(items_count, len(self.products)))

        total_amount = 0
        items_data = []
        line_no = 1
        for prod in selected_products:
            qty = random.randint(
                self.cfg['sales_orders']['quantity_range']['min'],
                self.cfg['sales_orders']['quantity_range']['max']
            )
            price = prod['selling_price'] or random.randint(10000, 100000)
            amount = qty * float(price)
            total_amount += amount

            items_data.append((
                order_id, line_no, prod['product_code'],
                qty, price, datetime.now()
            ))
            line_no += 1

        if items_data:
            execute_batch("""
                INSERT INTO erp_sales_order_item
                (order_id, line_no, product_code, order_qty,
                 unit_price, created_at)
                VALUES %s
            """, items_data)

        # 총액 업데이트
        from db_connection import execute
        execute("UPDATE erp_sales_order SET total_amount=%s WHERE id=%s",
                (total_amount, order_id))

        return order_no

    def generate_shipments(self):
        """출하 데이터 생성"""
        # shipped/closed 상태 수주 조회
        orders = fetch_all("""
            SELECT id, order_no, customer_code, order_date, delivery_date
            FROM erp_sales_order
            WHERE tenant_id=%s AND status IN ('shipped', 'closed')
        """, (TENANT_ID,))

        ship_data = []
        for order in orders:
            ship_no = f"SH{order['order_date'].strftime('%Y%m%d')}{random.randint(1000, 9999)}"
            ship_date = order['delivery_date'] - timedelta(days=random.randint(0, 3))

            ship_data.append((
                TENANT_ID, ship_no, ship_date,
                order['id'], order['order_no'],
                order['customer_code'], 'delivered', datetime.now()
            ))

        if ship_data:
            execute_batch("""
                INSERT INTO erp_shipment
                (tenant_id, shipment_no, shipment_date,
                 order_id, order_no, customer_code, status, created_at)
                VALUES %s
            """, ship_data)

        print(f"  출하: {len(ship_data)}건 생성")
