"""
ERP Transaction Generator (1800초 주기)
ERP 거래 데이터 생성 - 수주/발주/재고 트랜잭션
"""
import random
from datetime import datetime, timezone, date, timedelta
from typing import Any
from uuid import uuid4
import json

from .base import BaseRealtimeGenerator


class ERPTransactionGenerator(BaseRealtimeGenerator):
    """1800초(30분)마다 ERP 트랜잭션 생성"""

    def __init__(self, tenant_id: str):
        super().__init__(tenant_id, is_phase2=True)
        self.name = "ERPTransaction"
        self.interval = 1800  # 30분

        # 고객 목록
        self.customers = [
            ("CUST001", "삼성전자", "electronics"),
            ("CUST002", "LG전자", "electronics"),
            ("CUST003", "SK하이닉스", "semiconductor"),
            ("CUST004", "현대모비스", "automotive"),
            ("CUST005", "LS산전", "industrial"),
            ("CUST006", "한화디펜스", "defense"),
        ]

        # 공급업체 목록
        self.vendors = [
            ("VEND001", "삼화콘덴서", "capacitor"),
            ("VEND002", "삼성전기", "mlcc"),
            ("VEND003", "LG이노텍", "pcb"),
            ("VEND004", "대덕전자", "substrate"),
            ("VEND005", "원익IPS", "equipment"),
        ]

        # 창고 코드
        self.warehouses = ["WH01", "WH02", "WH03"]

        # 재고 이동 유형
        self.transaction_types = [
            ("GR_PO", "IN", 0.25),      # 구매 입고
            ("GR_PROD", "IN", 0.30),     # 생산 입고
            ("GI_SO", "OUT", 0.25),      # 판매 출고
            ("GI_PROD", "OUT", 0.15),    # 생산 출고
            ("TRANSFER", "IN", 0.05),    # 이동
        ]

        # 순번 카운터
        self.sequence_counters = {
            "SO": 1000,
            "PO": 1000,
            "INV": 1000,
        }

    def _get_next_sequence(self, prefix: str) -> str:
        """순번 생성"""
        self.sequence_counters[prefix] = self.sequence_counters.get(prefix, 1000) + 1
        today = datetime.now().strftime("%Y%m%d")
        return f"{prefix}{today}-{self.sequence_counters[prefix]:04d}"

    async def generate(self) -> list[dict[str, Any]]:
        """ERP 트랜잭션 생성"""
        await self._ensure_master_data()

        if not self.products:
            return []

        now = datetime.now(timezone.utc)
        today = now.date()
        records = {
            "sales_orders": [],
            "purchase_orders": [],
            "inventory_transactions": [],
        }

        # 1. 판매 주문 생성 (20% 확률)
        if random.random() < 0.2:
            so = self._generate_sales_order(today)
            records["sales_orders"].append(so)

        # 2. 구매 주문 생성 (15% 확률)
        if random.random() < 0.15:
            po = self._generate_purchase_order(today)
            records["purchase_orders"].append(po)

        # 3. 재고 트랜잭션 생성 (항상 1~3건)
        num_txns = random.randint(1, 3)
        for _ in range(num_txns):
            txn = self._generate_inventory_transaction(now)
            records["inventory_transactions"].append(txn)

        return [records]

    def _generate_sales_order(self, today: date) -> dict:
        """판매 주문 생성"""
        customer_code, customer_name, _ = random.choice(self.customers)
        order_no = self._get_next_sequence("SO")
        requested_delivery = today + timedelta(days=random.randint(7, 30))

        # 주문 라인 생성 (1~3개)
        lines = []
        total_amount = 0
        for line_no in range(1, random.randint(2, 4)):
            product = random.choice(self.products)
            qty = random.randint(100, 1000) * 10
            unit_price = random.uniform(1000, 50000)
            line_amount = qty * unit_price
            tax_amount = line_amount * 0.1

            lines.append({
                "line_no": line_no,
                "product_code": product["product_code"],
                "product_name": product.get("product_name", product["product_code"]),
                "order_qty": qty,
                "unit": "EA",
                "unit_price": round(unit_price, 2),
                "line_amount": round(line_amount, 2),
                "tax_amount": round(tax_amount, 2),
                "requested_date": requested_delivery.isoformat(),
            })
            total_amount += line_amount + tax_amount

        return {
            "id": str(uuid4()),
            "tenant_id": self.tenant_id,
            "order_no": order_no,
            "order_type": "standard",
            "order_date": today.isoformat(),
            "customer_code": customer_code,
            "customer_name": customer_name,
            "sales_org": "SO01",
            "currency": "KRW",
            "subtotal": round(total_amount / 1.1, 2),
            "tax_amount": round(total_amount - total_amount / 1.1, 2),
            "total_amount": round(total_amount, 2),
            "requested_delivery_date": requested_delivery.isoformat(),
            "status": "confirmed",
            "lines": lines,
        }

    def _generate_purchase_order(self, today: date) -> dict:
        """구매 주문 생성"""
        vendor_code, vendor_name, _ = random.choice(self.vendors)
        po_no = self._get_next_sequence("PO")
        expected_delivery = today + timedelta(days=random.randint(5, 20))

        # 자재 목록 (products를 자재로 간주)
        materials = self.products[:min(5, len(self.products))]

        # 주문 라인 생성 (1~3개)
        lines = []
        total_amount = 0
        for line_no in range(1, random.randint(2, 4)):
            material = random.choice(materials)
            qty = random.randint(100, 500) * 10
            unit_price = random.uniform(500, 20000)
            line_amount = qty * unit_price
            tax_amount = line_amount * 0.1

            lines.append({
                "line_no": line_no,
                "material_code": material["product_code"],
                "material_name": material.get("product_name", material["product_code"]),
                "order_qty": qty,
                "unit": "EA",
                "unit_price": round(unit_price, 2),
                "line_amount": round(line_amount, 2),
                "tax_amount": round(tax_amount, 2),
                "required_date": expected_delivery.isoformat(),
            })
            total_amount += line_amount + tax_amount

        return {
            "id": str(uuid4()),
            "tenant_id": self.tenant_id,
            "po_no": po_no,
            "po_type": "standard",
            "po_date": today.isoformat(),
            "vendor_code": vendor_code,
            "vendor_name": vendor_name,
            "currency": "KRW",
            "subtotal": round(total_amount / 1.1, 2),
            "tax_amount": round(total_amount - total_amount / 1.1, 2),
            "total_amount": round(total_amount, 2),
            "expected_delivery_date": expected_delivery.isoformat(),
            "status": "approved",
            "lines": lines,
        }

    def _generate_inventory_transaction(self, now: datetime) -> dict:
        """재고 트랜잭션 생성"""
        # 트랜잭션 유형 선택 (weighted_choice는 첫 번째 요소만 반환)
        txn_type = self.weighted_choice([
            (t, w) for t, d, w in self.transaction_types
        ])
        # 선택된 유형의 direction 찾기
        direction = next(d for t, d, w in self.transaction_types if t == txn_type)

        product = random.choice(self.products)
        warehouse = random.choice(self.warehouses)
        qty = random.randint(10, 100) * 10
        unit_cost = random.uniform(1000, 10000)

        # 로트 번호 생성
        lot_no = f"LOT{now.strftime('%Y%m%d')}-{random.randint(100, 999)}"

        return {
            "id": str(uuid4()),
            "tenant_id": self.tenant_id,
            "transaction_no": self._get_next_sequence("INV"),
            "transaction_date": now.date().isoformat(),
            "posting_date": now.date().isoformat(),
            "transaction_type": txn_type,
            "material_code": product["product_code"],
            "material_name": product.get("product_name", product["product_code"]),
            "qty": qty,
            "unit": "EA",
            "direction": direction,
            "warehouse_code": warehouse,
            "lot_no": lot_no,
            "unit_cost": round(unit_cost, 2),
            "total_cost": round(qty * unit_cost, 2),
            "reference_doc_type": txn_type.split("_")[0] if "_" in txn_type else None,
        }

    async def save(self, records: list[dict[str, Any]], pool) -> int:
        """ERP 트랜잭션 저장"""
        if not records or not records[0]:
            return 0

        data = records[0]
        count = 0

        async with pool.acquire() as conn:
            # 재고 트랜잭션 저장
            for txn in data.get("inventory_transactions", []):
                try:
                    # 파티션 확인
                    await self._ensure_partition(conn, "erp_inventory_transaction", "transaction_date", txn["transaction_date"])

                    await conn.execute("""
                        INSERT INTO erp_inventory_transaction (
                            id, tenant_id, transaction_no, transaction_date, posting_date,
                            transaction_type, material_code, material_name, qty, unit,
                            direction, warehouse_code, lot_no, unit_cost, total_cost,
                            reference_doc_type, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15, $16, NOW()
                        )
                    """,
                        txn["id"],
                        txn["tenant_id"],
                        txn["transaction_no"],
                        txn["transaction_date"],
                        txn["posting_date"],
                        txn["transaction_type"],
                        txn["material_code"],
                        txn["material_name"],
                        txn["qty"],
                        txn["unit"],
                        txn["direction"],
                        txn["warehouse_code"],
                        txn["lot_no"],
                        txn["unit_cost"],
                        txn["total_cost"],
                        txn["reference_doc_type"],
                    )
                    count += 1
                except Exception as e:
                    print(f"[ERPTransaction] Inventory txn insert error: {e}")

            # 판매 주문 저장
            for so in data.get("sales_orders", []):
                try:
                    await conn.execute("""
                        INSERT INTO erp_sales_order (
                            id, tenant_id, order_no, order_type, order_date,
                            customer_code, customer_name, sales_org, currency,
                            subtotal, tax_amount, total_amount, requested_delivery_date,
                            status, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9,
                            $10, $11, $12, $13, $14, NOW(), NOW()
                        )
                    """,
                        so["id"],
                        so["tenant_id"],
                        so["order_no"],
                        so["order_type"],
                        so["order_date"],
                        so["customer_code"],
                        so["customer_name"],
                        so["sales_org"],
                        so["currency"],
                        so["subtotal"],
                        so["tax_amount"],
                        so["total_amount"],
                        so["requested_delivery_date"],
                        so["status"],
                    )

                    # 주문 라인 저장
                    for line in so.get("lines", []):
                        line_id = str(uuid4())
                        await conn.execute("""
                            INSERT INTO erp_sales_order_line (
                                id, tenant_id, order_id, line_no,
                                product_code, product_name, order_qty, unit, open_qty,
                                unit_price, line_amount, tax_amount, requested_date,
                                status, created_at, updated_at
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                                $10, $11, $12, $13, $14, NOW(), NOW()
                            )
                        """,
                            line_id,
                            so["tenant_id"],
                            so["id"],
                            line["line_no"],
                            line["product_code"],
                            line["product_name"],
                            line["order_qty"],
                            line["unit"],
                            line["order_qty"],  # open_qty = order_qty initially
                            line["unit_price"],
                            line["line_amount"],
                            line["tax_amount"],
                            line["requested_date"],
                            "open",
                        )
                    count += 1
                except Exception as e:
                    print(f"[ERPTransaction] Sales order insert error: {e}")

            # 구매 주문 저장
            for po in data.get("purchase_orders", []):
                try:
                    await conn.execute("""
                        INSERT INTO erp_purchase_order (
                            id, tenant_id, po_no, po_type, po_date,
                            vendor_code, vendor_name, currency,
                            subtotal, tax_amount, total_amount, expected_delivery_date,
                            status, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8,
                            $9, $10, $11, $12, $13, NOW(), NOW()
                        )
                    """,
                        po["id"],
                        po["tenant_id"],
                        po["po_no"],
                        po["po_type"],
                        po["po_date"],
                        po["vendor_code"],
                        po["vendor_name"],
                        po["currency"],
                        po["subtotal"],
                        po["tax_amount"],
                        po["total_amount"],
                        po["expected_delivery_date"],
                        po["status"],
                    )

                    # 주문 라인 저장
                    for line in po.get("lines", []):
                        line_id = str(uuid4())
                        await conn.execute("""
                            INSERT INTO erp_purchase_order_line (
                                id, tenant_id, po_id, line_no,
                                material_code, material_name, order_qty, unit,
                                unit_price, line_amount, tax_amount, required_date,
                                status, created_at, updated_at
                            ) VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8,
                                $9, $10, $11, $12, $13, NOW(), NOW()
                            )
                        """,
                            line_id,
                            po["tenant_id"],
                            po["id"],
                            line["line_no"],
                            line["material_code"],
                            line["material_name"],
                            line["order_qty"],
                            line["unit"],
                            line["unit_price"],
                            line["line_amount"],
                            line["tax_amount"],
                            line["required_date"],
                            "open",
                        )
                    count += 1
                except Exception as e:
                    print(f"[ERPTransaction] Purchase order insert error: {e}")

        return count

    async def _ensure_partition(self, conn, table_name: str, timestamp_column: str, date_value: str):
        """필요한 파티션이 있는지 확인하고 없으면 생성"""
        ts = datetime.fromisoformat(date_value)
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
