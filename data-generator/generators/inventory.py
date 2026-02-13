"""
재고 모듈 데이터 생성기
입고 → 재고 트랜잭션 / 출고 → 재고 트랜잭션 흐름
"""
import random
import uuid
from datetime import datetime, timedelta
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, insert_returning, execute
from config import TENANT_ID

class InventoryDataGenerator(BaseGenerator):
    """재고 트랜잭션 데이터 생성기"""

    def __init__(self):
        super().__init__('purchase.yaml')  # 기본 설정용
        self.warehouses = []
        self.products = []

    def generate(self):
        """재고 트랜잭션 데이터 생성"""
        print("=== 재고 모듈 데이터 생성 ===")
        self._load_master_data()
        self.generate_receipt_transactions()
        self.generate_issue_transactions()
        self.generate_transfer_transactions()
        print("=== 재고 모듈 완료 ===\n")

    def _load_master_data(self):
        """마스터 데이터 로드"""
        self.warehouses = fetch_all(
            "SELECT warehouse_code, warehouse_type FROM erp_warehouse WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        self.products = fetch_all(
            "SELECT product_code, product_name, standard_cost FROM erp_product_master WHERE tenant_id=%s",
            (TENANT_ID,)
        )

    def generate_receipt_transactions(self):
        """입고 기반 재고 트랜잭션 생성"""
        # 입고 데이터 조회
        receipts = fetch_all("""
            SELECT gr.id, gr.receipt_no, gr.receipt_date, gr.warehouse_code,
                   gri.item_code, gri.accepted_qty, gri.unit_cost, gri.lot_no
            FROM erp_goods_receipt gr
            JOIN erp_goods_receipt_item gri ON gr.id = gri.receipt_id
            WHERE gr.tenant_id=%s AND gr.status = 'stored'
        """, (TENANT_ID,))

        trans_data = []
        for i, r in enumerate(receipts):
            trans_no = f"IT-IN-{r['receipt_no']}-{i:04d}-{uuid.uuid4().hex[:6]}"

            # 제품명 조회
            prod = next((p for p in self.products if p['product_code'] == r['item_code']), None)
            item_name = prod['product_name'] if prod else r['item_code']
            unit_cost = r['unit_cost'] or (prod['standard_cost'] if prod else 10000)
            total_cost = float(r['accepted_qty']) * float(unit_cost) if unit_cost else 0

            trans_data.append((
                TENANT_ID,
                trans_no,
                r['receipt_date'],
                'receipt',           # transaction_type
                'purchase',          # transaction_reason
                r['item_code'],
                item_name,
                None,                # from_warehouse (외부)
                r['warehouse_code'], # to_warehouse
                None,                # from_location
                'A01',               # to_location
                r['accepted_qty'],
                unit_cost,
                total_cost,
                r['lot_no'],
                'GOODS_RECEIPT',     # reference_type
                r['receipt_no'],     # reference_no
                None,                # remark
                datetime.now(),
                'SYSTEM'
            ))

        if trans_data:
            execute_batch("""
                INSERT INTO erp_inventory_transaction
                (tenant_id, transaction_no, transaction_date, transaction_type,
                 transaction_reason, item_code, item_name, from_warehouse, to_warehouse,
                 from_location, to_location, quantity, unit_cost, total_cost,
                 lot_no, reference_type, reference_no, remark, created_at, created_by)
                VALUES %s
            """, trans_data)

        print(f"  입고 트랜잭션: {len(trans_data)}건 생성")

    def generate_issue_transactions(self):
        """출고 기반 재고 트랜잭션 생성"""
        # 출하 데이터 조회
        shipments = fetch_all("""
            SELECT sh.id, sh.shipment_no, sh.shipment_date,
                   soi.product_code, soi.order_qty
            FROM erp_shipment sh
            JOIN erp_sales_order so ON sh.order_id = so.id
            JOIN erp_sales_order_item soi ON so.id = soi.order_id
            WHERE sh.tenant_id=%s AND sh.status = 'delivered'
        """, (TENANT_ID,))

        warehouse = self.warehouses[0] if self.warehouses else {'warehouse_code': 'WH001'}
        trans_data = []

        for i, s in enumerate(shipments):
            trans_no = f"IT-OUT-{s['shipment_no']}-{i:04d}-{uuid.uuid4().hex[:6]}"

            # 제품명 조회
            prod = next((p for p in self.products if p['product_code'] == s['product_code']), None)
            item_name = prod['product_name'] if prod else s['product_code']
            unit_cost = prod['standard_cost'] if prod else 10000
            total_cost = float(s['order_qty']) * float(unit_cost) if unit_cost else 0

            trans_data.append((
                TENANT_ID,
                trans_no,
                s['shipment_date'],
                'issue',             # transaction_type
                'sales',             # transaction_reason
                s['product_code'],
                item_name,
                warehouse['warehouse_code'],  # from_warehouse
                None,                # to_warehouse (외부)
                'A01',               # from_location
                None,                # to_location
                s['order_qty'],
                unit_cost,
                total_cost,
                None,                # lot_no
                'SHIPMENT',          # reference_type
                s['shipment_no'],    # reference_no
                None,                # remark
                datetime.now(),
                'SYSTEM'
            ))

        if trans_data:
            execute_batch("""
                INSERT INTO erp_inventory_transaction
                (tenant_id, transaction_no, transaction_date, transaction_type,
                 transaction_reason, item_code, item_name, from_warehouse, to_warehouse,
                 from_location, to_location, quantity, unit_cost, total_cost,
                 lot_no, reference_type, reference_no, remark, created_at, created_by)
                VALUES %s
            """, trans_data)

        print(f"  출고 트랜잭션: {len(trans_data)}건 생성")

    def generate_transfer_transactions(self):
        """창고 간 이동 트랜잭션 생성"""
        if len(self.warehouses) < 2:
            print("  이동 트랜잭션: 0건 (창고 부족)")
            return

        # 입고 트랜잭션에서 일부를 이동 트랜잭션으로 생성
        receipt_trans = fetch_all("""
            SELECT DISTINCT item_code, to_warehouse, lot_no, quantity, unit_cost,
                   transaction_date
            FROM erp_inventory_transaction
            WHERE tenant_id=%s AND transaction_type = 'receipt'
            ORDER BY transaction_date DESC
            LIMIT 100
        """, (TENANT_ID,))

        trans_data = []
        transfer_count = min(50, len(receipt_trans) // 2)  # 최대 50건 이동

        for i in range(transfer_count):
            r = receipt_trans[i]
            from_wh = r['to_warehouse']
            to_wh = random.choice([w['warehouse_code'] for w in self.warehouses if w['warehouse_code'] != from_wh])

            trans_date = r['transaction_date'] + timedelta(days=random.randint(1, 7))
            trans_no = f"IT-TRF-{trans_date.strftime('%Y%m%d')}-{i:04d}-{uuid.uuid4().hex[:6]}"

            prod = next((p for p in self.products if p['product_code'] == r['item_code']), None)
            item_name = prod['product_name'] if prod else r['item_code']

            transfer_qty = int(float(r['quantity']) * random.uniform(0.3, 0.8))
            if transfer_qty <= 0:
                continue

            total_cost = float(transfer_qty) * float(r['unit_cost']) if r['unit_cost'] else 0

            trans_data.append((
                TENANT_ID,
                trans_no,
                trans_date,
                'transfer',          # transaction_type
                'production',        # transaction_reason (생산용 이동)
                r['item_code'],
                item_name,
                from_wh,             # from_warehouse
                to_wh,               # to_warehouse
                'A01',               # from_location
                'B01',               # to_location
                transfer_qty,
                r['unit_cost'],
                total_cost,
                r['lot_no'],
                'INTERNAL',          # reference_type
                trans_no,            # reference_no
                '생산 라인 공급용',   # remark
                datetime.now(),
                'SYSTEM'
            ))

        if trans_data:
            execute_batch("""
                INSERT INTO erp_inventory_transaction
                (tenant_id, transaction_no, transaction_date, transaction_type,
                 transaction_reason, item_code, item_name, from_warehouse, to_warehouse,
                 from_location, to_location, quantity, unit_cost, total_cost,
                 lot_no, reference_type, reference_no, remark, created_at, created_by)
                VALUES %s
            """, trans_data)

        print(f"  이동 트랜잭션: {len(trans_data)}건 생성")
