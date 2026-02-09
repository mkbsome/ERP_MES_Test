"""
ERP HR 데이터 생성
"""
from faker import Faker
from datetime import datetime, timedelta
import random
from config import TENANT_ID, DATA_COUNTS, KOREAN_DATA
from db_connection import execute_batch, fetch_all

fake = Faker('ko_KR')

def generate_departments():
    """부서 마스터 생성"""
    depts = KOREAN_DATA['departments']
    data = []
    for i, name in enumerate(depts[:DATA_COUNTS['departments']]):
        code = f"DEPT{str(i+1).zfill(3)}"
        parent = None if i == 0 else f"DEPT001"
        data.append((
            TENANT_ID, code, name, parent,
            random.choice(['CC001', 'CC002', 'CC003']),
            True, datetime.now()
        ))

    query = """
        INSERT INTO erp_department
        (tenant_id, dept_code, dept_name, parent_dept_code,
         cost_center_code, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} departments")

def generate_positions():
    """직급 마스터 생성"""
    positions = KOREAN_DATA['positions']
    salary_ranges = [
        (200000000, 500000000), (120000000, 200000000),
        (90000000, 120000000), (70000000, 90000000),
        (55000000, 70000000), (45000000, 55000000),
        (38000000, 45000000), (30000000, 38000000),
        (24000000, 30000000)
    ]
    data = []
    for i, name in enumerate(positions[:DATA_COUNTS['positions']]):
        code = f"POS{str(i+1).zfill(3)}"
        sal_min, sal_max = salary_ranges[i]
        data.append((
            TENANT_ID, code, name, i+1,
            sal_min, sal_max, True, datetime.now()
        ))

    query = """
        INSERT INTO erp_position
        (tenant_id, position_code, position_name, position_level,
         base_salary_min, base_salary_max, is_active, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} positions")

def generate_employees():
    """직원 마스터 생성"""
    data = []
    depts = [f"DEPT{str(i+1).zfill(3)}" for i in range(DATA_COUNTS['departments'])]
    positions = [f"POS{str(i+1).zfill(3)}" for i in range(DATA_COUNTS['positions'])]

    for i in range(DATA_COUNTS['employees']):
        code = f"EMP{str(i+1).zfill(5)}"
        name = fake.name()
        pos_idx = min(i // 15, len(positions)-1)
        hire_date = fake.date_between(start_date='-10y', end_date='-1m')
        birth = fake.date_of_birth(minimum_age=22, maximum_age=60)
        data.append((
            TENANT_ID, code, name,
            random.choice(depts), positions[pos_idx],
            hire_date, random.choice(['정규직', '계약직']),
            random.choice(['재직', '휴직']),
            birth, random.choice(['M', 'F']),
            fake.phone_number(), fake.email(),
            fake.address(), datetime.now()
        ))

    query = """
        INSERT INTO erp_employee
        (tenant_id, employee_code, employee_name,
         dept_code, position_code, hire_date, employment_type,
         status, birth_date, gender, phone, email, address, created_at)
        VALUES %s
    """
    execute_batch(query, data)
    print(f"Generated {len(data)} employees")

def run():
    """ERP HR 생성 실행"""
    print("=== ERP HR 데이터 생성 시작 ===")
    generate_departments()
    generate_positions()
    generate_employees()
    print("=== ERP HR 데이터 생성 완료 ===")

if __name__ == '__main__':
    run()
