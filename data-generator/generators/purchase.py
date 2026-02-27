"""
구매 모듈 데이터 생성기
발주 → 입고 → 재고 흐름
"""
import random
from datetime import datetime, timedelta
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, insert_returning, execute
from config import TENANT_ID

class PurchaseDataGenerator(BaseGenerator):
    """구매 데이터 생성기"""

    def __init__(self):
        super().__init__('purchase.yaml')
        self.cfg = self.scenario['purchase_scenario']
        self.vendors = []
        self.products = []
        self.warehouses = []

    def generate(self):
        """구매 데이터 생성"""
        print("=== 구매 모듈 데이터 생성 ===")
        self._load_master_data()
        self.generate_purchase_orders()
        self.generate_goods_receipts()
        print("=== 구매 모듈 완료 ===\n")

    def _load_master_data(self):
        """마스터 데이터 로드"""
        self.vendors = fetch_all(
            "SELECT vendor_code, vendor_grade FROM erp_vendor_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.products = fetch_all(
            "SELECT product_code, standard_cost, product_group FROM erp_product_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.warehouses = fetch_all(
            "SELECT warehouse_code, warehouse_type FROM erp_warehouse WHERE tenant_id=%s",
            (TENANT_ID,)
        )

    def generate_purchase_orders(self):
        """발주 데이터 생성"""
        po_cfg = self.cfg['purchase_orders']
        months = self.get_months_in_period()
        order_count = 0

        for month in months:
            base_count = po_cfg['monthly_count']
            variance = int(base_count * float(po_cfg['variance'].replace('%', '')) / 100)
            monthly_orders = base_count + random.randint(-variance, variance)

            for _ in range(monthly_orders):
                order_date = self.random_date(
                    month,
                    min(month.replace(day=28), self.period_end)
                )

                # 상태 결정 (DB: draft, requested, approved, sent, confirmed, partial, completed, cancelled)
                if order_date < self.period_end - timedelta(days=21):
                    status = self.weighted_choice({
                        'completed': 70, 'confirmed': 20, 'cancelled': 10
                    })
                elif order_date < self.period_end - timedelta(days=7):
                    status = self.weighted_choice({
                        'sent': 30, 'confirmed': 40, 'partial': 20, 'completed': 10
                    })
                else:
                    status = self.weighted_choice({
                        'draft': 20, 'approved': 40, 'sent': 40
                    })

                self._create_purchase_order(order_date, status)
                order_count += 1

        print(f"  발주: {order_count}건 생성")

    def _create_purchase_order(self, order_date, status):
        """개별 발주 생성"""
        vendor = random.choice(self.vendors)
        po_no = self.generate_doc_no("PO", order_date)
        expected_date = order_date + timedelta(days=random.randint(7, 30))

        # 발주 헤더 (po_date 사용)
        po_id = insert_returning("""
            INSERT INTO erp_purchase_order
            (tenant_id, po_no, po_date, vendor_code, status,
             expected_date, total_amount, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s)
            RETURNING id
        """, (TENANT_ID, po_no, order_date, vendor['vendor_code'],
              status, expected_date, datetime.now()))

        # 발주 품목 (원자재 위주)
        raw_materials = [p for p in self.products if p.get('product_group') == 'RM']
        if not raw_materials:
            raw_materials = self.products

        items_count = random.randint(
            self.cfg['purchase_orders']['items_per_order']['min'],
            self.cfg['purchase_orders']['items_per_order']['max']
        )
        selected = random.sample(raw_materials, min(items_count, len(raw_materials)))

        total_amount = 0
        items_data = []
        line_no = 1
        for prod in selected:
            qty = random.randint(
                self.cfg['purchase_orders']['quantity_range']['min'],
                self.cfg['purchase_orders']['quantity_range']['max']
            )
            price = prod['standard_cost'] or random.randint(1000, 50000)
            amount = qty * float(price)
            total_amount += amount

            # item_code 사용, amount 제외 (자동 계산)
            items_data.append((
                po_id, line_no, prod['product_code'],
                qty, price, datetime.now()
            ))
            line_no += 1

        if items_data:
            execute_batch("""
                INSERT INTO erp_purchase_order_item
                (po_id, line_no, item_code, order_qty,
                 unit_price, created_at)
                VALUES %s
            """, items_data)

        execute("UPDATE erp_purchase_order SET total_amount=%s WHERE id=%s",
                (total_amount, po_id))

        return po_no

    def generate_goods_receipts(self):
        """입고 데이터 생성"""
        orders = fetch_all("""
            SELECT po.id, po.po_no, po.vendor_code, po.expected_date
            FROM erp_purchase_order po
            WHERE po.tenant_id=%s AND po.status IN ('completed', 'confirmed', 'partial')
        """, (TENANT_ID,))

        warehouse = self.warehouses[0] if self.warehouses else {'warehouse_code': 'WH001'}
        gr_count = 0

        for order in orders:
            receipt_no = self.generate_doc_no("GR", order['expected_date'])

            # 납기 준수율 적용
            on_time = random.random() < float(self.cfg['goods_receipts']['on_time_rate'].replace('%', '')) / 100
            if on_time:
                receipt_date = order['expected_date'] - timedelta(days=random.randint(0, 2))
            else:
                delay = random.randint(1, self.cfg['goods_receipts']['delay_days']['max'])
                receipt_date = order['expected_date'] + timedelta(days=delay)

            # 입고 헤더 (gr_no -> receipt_no)
            gr_id = insert_returning("""
                INSERT INTO erp_goods_receipt
                (tenant_id, receipt_no, receipt_date, po_id, po_no, vendor_code,
                 warehouse_code, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'stored', %s)
                RETURNING id
            """, (TENANT_ID, receipt_no, receipt_date, order['id'], order['po_no'],
                  order['vendor_code'], warehouse['warehouse_code'], datetime.now()))

            # 입고 품목
            items = fetch_all("""
                SELECT id, item_code, order_qty, unit_price
                FROM erp_purchase_order_item WHERE po_id=%s
            """, (order['id'],))

            line_no = 1
            for item in items:
                recv_qty = int(float(item['order_qty']) * random.uniform(0.95, 1.0))
                lot_no = f"LOT{receipt_date.strftime('%Y%m%d')}{random.randint(100, 999)}"

                execute("""
                    INSERT INTO erp_goods_receipt_item
                    (receipt_id, line_no, po_item_id, item_code, receipt_qty,
                     accepted_qty, unit_cost, lot_no, inspection_result, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'PASS', %s)
                """, (gr_id, line_no, item['id'], item['item_code'],
                      recv_qty, recv_qty, item['unit_price'], lot_no, datetime.now()))
                line_no += 1

            gr_count += 1

        print(f"  입고: {gr_count}건 생성")
