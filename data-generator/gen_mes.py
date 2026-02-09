"""
MES 데이터 생성
"""
from faker import Faker
from datetime import datetime, timedelta
import random
from config import TENANT_ID, DATA_COUNTS
from db_connection import execute_batch

fake = Faker('ko_KR')

def generate_lines():
    """생산라인 생성"""
    names = ['SMT-1라인', 'SMT-2라인', 'AI조립라인', '검사라인', '포장라인']
    data = []
    for i, name in enumerate(names[:DATA_COUNTS['lines']]):
        code = f"LINE{str(i+1).zfill(3)}"
        data.append((
            TENANT_ID, code, name,
            random.choice(['SMT', 'ASSEMBLY', 'INSPECTION', 'PACKING']),
            random.randint(100, 500), True, datetime.now()
        ))

    query = """
        INSERT INTO mes_production_line
        (tenant_id, line_code, line_name, line_type,
         capacity_per_hour, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} production lines")

def generate_equipment():
    """설비 생성"""
    equip_types = ['MOUNTER', 'REFLOW', 'AOI', 'SPI', 'PRINTER', 'LOADER']
    data = []
    for i in range(DATA_COUNTS['equipment']):
        code = f"EQP{str(i+1).zfill(4)}"
        line = f"LINE{str((i % DATA_COUNTS['lines']) + 1).zfill(3)}"
        etype = random.choice(equip_types)
        data.append((
            TENANT_ID, code, f"{etype}-{i+1}", line,
            etype, random.choice(['RUNNING', 'IDLE', 'MAINTENANCE']),
            True, datetime.now()
        ))

    query = """
        INSERT INTO mes_equipment
        (tenant_id, equipment_code, equipment_name, line_code,
         equipment_type, status, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} equipment")

def generate_production_orders():
    """MES 작업지시 생성"""
    data = []
    for i in range(DATA_COUNTS['production_orders']):
        order_no = f"MO{datetime.now().strftime('%Y%m')}{str(i+1).zfill(5)}"
        wo_no = f"WO{datetime.now().strftime('%Y%m')}{str(random.randint(1, DATA_COUNTS['work_orders'])).zfill(5)}"
        line = f"LINE{str(random.randint(1, DATA_COUNTS['lines'])).zfill(3)}"
        plan_date = fake.date_between(start_date='-3m', end_date='+1m')
        plan_qty = random.randint(100, 2000)
        good_qty = int(plan_qty * random.uniform(0.95, 1.0))
        defect_qty = plan_qty - good_qty
        data.append((
            TENANT_ID, order_no, wo_no, line,
            plan_date, plan_qty, good_qty, defect_qty,
            random.choice(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED']),
            datetime.now()
        ))

    query = """
        INSERT INTO mes_production_order
        (tenant_id, production_order_no, erp_work_order_no, line_code,
         planned_date, planned_qty, good_qty, defect_qty, status, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} MES production orders")

def run():
    """MES 데이터 생성 실행"""
    print("=== MES 데이터 생성 시작 ===")
    generate_lines()
    generate_equipment()
    generate_production_orders()
    print("=== MES 데이터 생성 완료 ===")

if __name__ == '__main__':
    run()
