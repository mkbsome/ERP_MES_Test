"""
ERP 트랜잭션 데이터 생성
"""
from faker import Faker
from datetime import datetime, timedelta
import random
from config import TENANT_ID, DATA_COUNTS
from db_connection import execute_batch

fake = Faker('ko_KR')

def generate_sales_orders():
    """수주 데이터 생성"""
    data = []
    for i in range(DATA_COUNTS['sales_orders']):
        order_no = f"SO{datetime.now().strftime('%Y%m')}{str(i+1).zfill(5)}"
        order_date = fake.date_between(start_date='-6m', end_date='today')
        cust_code = f"CUST{str(random.randint(1, DATA_COUNTS['customers'])).zfill(4)}"
        amount = random.randint(100000, 10000000)
        data.append((
            TENANT_ID, order_no, order_date, cust_code,
            amount, random.choice(['DRAFT', 'CONFIRMED', 'SHIPPED', 'CLOSED']),
            order_date + timedelta(days=random.randint(7, 30)),
            datetime.now()
        ))

    query = """
        INSERT INTO erp_sales_order
        (tenant_id, order_no, order_date, customer_code,
         total_amount, status, delivery_date, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} sales orders")

def generate_purchase_orders():
    """발주 데이터 생성"""
    data = []
    for i in range(DATA_COUNTS['purchase_orders']):
        po_no = f"PO{datetime.now().strftime('%Y%m')}{str(i+1).zfill(5)}"
        order_date = fake.date_between(start_date='-6m', end_date='today')
        vend_code = f"VEND{str(random.randint(1, DATA_COUNTS['vendors'])).zfill(4)}"
        amount = random.randint(50000, 5000000)
        data.append((
            TENANT_ID, po_no, order_date, vend_code,
            amount, random.choice(['DRAFT', 'APPROVED', 'RECEIVED', 'CLOSED']),
            order_date + timedelta(days=random.randint(7, 21)),
            datetime.now()
        ))

    query = """
        INSERT INTO erp_purchase_order
        (tenant_id, po_no, order_date, vendor_code,
         total_amount, status, expected_date, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} purchase orders")

def generate_work_orders():
    """제조오더 데이터 생성"""
    data = []
    for i in range(DATA_COUNTS['work_orders']):
        wo_no = f"WO{datetime.now().strftime('%Y%m')}{str(i+1).zfill(5)}"
        prod_code = f"PROD{str(random.randint(1, DATA_COUNTS['products'])).zfill(4)}"
        plan_date = fake.date_between(start_date='-3m', end_date='+1m')
        qty = random.randint(100, 5000)
        data.append((
            TENANT_ID, wo_no, prod_code, qty,
            plan_date, plan_date + timedelta(days=random.randint(1, 5)),
            random.choice(['PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED']),
            datetime.now()
        ))

    query = """
        INSERT INTO erp_work_order
        (tenant_id, work_order_no, product_code, order_qty,
         planned_start_date, planned_end_date, status, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} work orders")

def run():
    """ERP 트랜잭션 생성 실행"""
    print("=== ERP 트랜잭션 생성 시작 ===")
    generate_sales_orders()
    generate_purchase_orders()
    generate_work_orders()
    print("=== ERP 트랜잭션 생성 완료 ===")

if __name__ == '__main__':
    run()
