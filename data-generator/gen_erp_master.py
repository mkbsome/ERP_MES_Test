"""
ERP 기준정보 데이터 생성
"""
from faker import Faker
from datetime import datetime, timedelta
import random
from config import TENANT_ID, DATA_COUNTS, KOREAN_DATA
from db_connection import execute_batch

fake = Faker('ko_KR')

def generate_customers():
    """고객 마스터 생성"""
    data = []
    for i in range(DATA_COUNTS['customers']):
        code = f"CUST{str(i+1).zfill(4)}"
        suffix = random.choice(KOREAN_DATA['company_suffixes'])
        name = fake.last_name() + suffix
        data.append((
            TENANT_ID, code, name, fake.company(),
            fake.name(), fake.phone_number(), fake.email(),
            fake.address(), random.choice(['A', 'B', 'C']),
            random.randint(30, 90), True, datetime.now()
        ))

    query = """
        INSERT INTO erp_customer_master
        (tenant_id, customer_code, customer_name, business_no,
         contact_person, phone, email, address, credit_grade,
         payment_terms, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} customers")

def generate_vendors():
    """공급업체 마스터 생성"""
    data = []
    for i in range(DATA_COUNTS['vendors']):
        code = f"VEND{str(i+1).zfill(4)}"
        suffix = random.choice(KOREAN_DATA['company_suffixes'])
        name = fake.last_name() + suffix
        data.append((
            TENANT_ID, code, name, fake.company(),
            fake.name(), fake.phone_number(), fake.email(),
            fake.address(), random.choice(['A', 'B', 'C']),
            random.randint(30, 60), True, datetime.now()
        ))

    query = """
        INSERT INTO erp_vendor_master
        (tenant_id, vendor_code, vendor_name, business_no,
         contact_person, phone, email, address, vendor_grade,
         lead_time_days, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} vendors")

def generate_products():
    """제품 마스터 생성"""
    data = []
    types = KOREAN_DATA['product_types']
    for i in range(DATA_COUNTS['products']):
        code = f"PROD{str(i+1).zfill(4)}"
        ptype = random.choice(types)
        name = f"{ptype}-{fake.word().upper()}-{random.randint(100,999)}"
        unit_cost = random.randint(1000, 50000)
        data.append((
            TENANT_ID, code, name, ptype,
            random.choice(['EA', 'SET', 'BOX']),
            unit_cost, unit_cost * random.uniform(1.2, 1.5),
            random.randint(10, 100), random.randint(50, 200),
            True, datetime.now()
        ))

    query = """
        INSERT INTO erp_product_master
        (tenant_id, product_code, product_name, product_type,
         unit, standard_cost, selling_price,
         safety_stock, reorder_point, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} products")

def generate_warehouses():
    """창고 마스터 생성"""
    names = ['본사창고', '제1공장창고', '제2공장창고', '외주창고', '반품창고']
    data = []
    for i, name in enumerate(names[:DATA_COUNTS['warehouses']]):
        code = f"WH{str(i+1).zfill(3)}"
        data.append((
            TENANT_ID, code, name, fake.address(),
            random.choice(['MATERIAL', 'PRODUCT', 'MIXED']),
            True, datetime.now()
        ))

    query = """
        INSERT INTO erp_warehouse
        (tenant_id, warehouse_code, warehouse_name, address,
         warehouse_type, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} warehouses")

def run():
    """ERP 기준정보 생성 실행"""
    print("=== ERP 기준정보 생성 시작 ===")
    generate_customers()
    generate_vendors()
    generate_products()
    generate_warehouses()
    print("=== ERP 기준정보 생성 완료 ===")

if __name__ == '__main__':
    run()
