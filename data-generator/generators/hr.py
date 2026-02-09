"""
HR 모듈 데이터 생성기
부서/직급/직원 → 근태 → 급여 흐름
"""
import random
from datetime import datetime, timedelta, date
from faker import Faker
from .base import BaseGenerator
from db_connection import execute_batch, fetch_all, execute
from config import TENANT_ID

fake = Faker('ko_KR')

class HRDataGenerator(BaseGenerator):
    """HR 데이터 생성기"""

    def __init__(self):
        super().__init__('hr.yaml')
        self.cfg = self.scenario['hr_scenario']
        self.departments = []
        self.positions = []
        self.employees = []

    def generate(self):
        """HR 데이터 생성"""
        print("=== HR 모듈 데이터 생성 ===")
        self.generate_departments()
        self.generate_positions()
        self.generate_employees()
        self.generate_attendance()
        self.generate_payroll()
        print("=== HR 모듈 완료 ===\n")

    def generate_departments(self):
        """부서 생성"""
        org = self.cfg['organization']
        dept_data = []

        for dept in org['departments']:
            # 본부 (department_code, department_name, parent_code)
            dept_data.append((
                TENANT_ID, dept['code'], dept['name'], None,
                f"CC{dept['code'][-3:]}", True, datetime.now()
            ))

            # 하위 팀
            for child in dept.get('children', []):
                dept_data.append((
                    TENANT_ID, child['code'], child['name'], dept['code'],
                    f"CC{child['code'][-3:]}", True, datetime.now()
                ))

        execute_batch("""
            INSERT INTO erp_department
            (tenant_id, department_code, department_name, parent_code,
             cost_center_code, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """, dept_data)

        self.departments = [d[1] for d in dept_data]
        print(f"  부서: {len(dept_data)}건 생성")

    def generate_positions(self):
        """직급 생성"""
        pos_data = []
        for pos in self.cfg['organization']['positions']:
            pos_data.append((
                TENANT_ID, pos['code'], pos['name'], pos['level'],
                True, datetime.now()
            ))

        execute_batch("""
            INSERT INTO erp_position
            (tenant_id, position_code, position_name, position_level,
             is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """, pos_data)

        self.positions = self.cfg['organization']['positions']
        print(f"  직급: {len(pos_data)}건 생성")

    def generate_employees(self):
        """직원 생성"""
        emp_cfg = self.cfg['employees']
        total = emp_cfg['total_count']

        emp_data = []
        emp_idx = 1

        for pos in self.positions:
            for _ in range(pos['count']):
                if emp_idx > total:
                    break

                emp_id = f"EMP{str(emp_idx).zfill(5)}"
                name = fake.name()
                dept = random.choice(self.departments)

                # 고용형태 (regular, contract, part_time, intern)
                emp_type_map = {'정규직': 'regular', '계약직': 'contract', '파트타임': 'part_time', '인턴': 'intern'}
                raw_type = self.weighted_choice(emp_cfg['employment_type'])
                emp_type = emp_type_map.get(raw_type, 'regular')

                # 상태 (active, leave, resigned)
                status_map = {'재직': 'active', '휴직': 'leave', '퇴직': 'resigned'}
                raw_status = self.weighted_choice(emp_cfg['status'])
                status = status_map.get(raw_status, 'active')

                # 입사일
                tenure = self.weighted_choice(emp_cfg['tenure_years'])
                if tenure == '0-1년':
                    hire_date = fake.date_between(start_date='-1y', end_date='today')
                elif tenure == '1-3년':
                    hire_date = fake.date_between(start_date='-3y', end_date='-1y')
                elif tenure == '3-5년':
                    hire_date = fake.date_between(start_date='-5y', end_date='-3y')
                elif tenure == '5-10년':
                    hire_date = fake.date_between(start_date='-10y', end_date='-5y')
                else:
                    hire_date = fake.date_between(start_date='-15y', end_date='-10y')

                base_salary = random.randint(pos['salary_min'], pos['salary_max'])
                birth = fake.date_of_birth(minimum_age=22, maximum_age=60)

                # employee_id (not employee_code), department_code (not dept_code)
                emp_data.append((
                    TENANT_ID, emp_id, name, dept, pos['code'],
                    hire_date, fake.email(), fake.phone_number(),
                    birth, random.choice(['M', 'F']), fake.address(),
                    base_salary, emp_type, status, datetime.now()
                ))

                emp_idx += 1

        execute_batch("""
            INSERT INTO erp_employee
            (tenant_id, employee_id, employee_name, department_code, position_code,
             hire_date, email, phone, birth_date, gender, address,
             base_salary, employment_type, status, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """, emp_data)

        self.employees = fetch_all(
            "SELECT employee_id, base_salary FROM erp_employee WHERE tenant_id=%s",
            (TENANT_ID,)
        )
        print(f"  직원: {len(emp_data)}건 생성")

    def generate_attendance(self):
        """근태 데이터 생성"""
        att_cfg = self.cfg['attendance']
        att_data = []

        # 최근 3개월 근태 데이터
        start_date = max(self.period_start, self.period_end - timedelta(days=90))
        current = start_date

        while current <= self.period_end:
            if current.weekday() < 5:  # 평일
                for emp in self.employees:
                    # 출근율 적용
                    if random.random() > float(att_cfg['attendance_rate'].replace('%', '')) / 100:
                        # 결근/휴가 (DB: absent, leave, holiday)
                        status = random.choice(['absent', 'leave'])
                        check_in = None
                        check_out = None
                    else:
                        is_late = random.random() < float(att_cfg['late_rate'].replace('%', '')) / 100

                        if is_late:
                            status = 'late'
                            check_in = datetime.combine(current, datetime.strptime('09:00', '%H:%M').time()) + \
                                       timedelta(minutes=random.randint(5, 60))
                        else:
                            status = 'present'
                            check_in = datetime.combine(current, datetime.strptime('09:00', '%H:%M').time()) - \
                                       timedelta(minutes=random.randint(0, 30))

                        overtime = random.random() < 0.2
                        if overtime:
                            check_out = datetime.combine(current, datetime.strptime('18:00', '%H:%M').time()) + \
                                        timedelta(hours=random.randint(1, 4))
                        else:
                            check_out = datetime.combine(current, datetime.strptime('18:00', '%H:%M').time()) + \
                                        timedelta(minutes=random.randint(0, 30))

                    work_hours = 0
                    overtime_hours = 0
                    if check_in and check_out:
                        total_minutes = (check_out - check_in).seconds / 60
                        work_hours = min(total_minutes / 60, 8)
                        overtime_hours = max(0, (total_minutes / 60) - 9)

                    # employee_id (not employee_code), check_in/check_out (not check_in_time/check_out_time)
                    att_data.append((
                        TENANT_ID, emp['employee_id'], current,
                        check_in, check_out, round(work_hours, 1),
                        round(overtime_hours, 1), status, datetime.now()
                    ))

            current += timedelta(days=1)

        if att_data:
            execute_batch("""
                INSERT INTO erp_attendance
                (tenant_id, employee_id, work_date, check_in,
                 check_out, work_hours, overtime_hours, status, created_at)
                VALUES %s ON CONFLICT DO NOTHING
            """, att_data)

        print(f"  근태: {len(att_data)}건 생성")

    def generate_payroll(self):
        """급여 데이터 생성"""
        pay_cfg = self.cfg['payroll']
        pay_data = []

        months = self.get_months_in_period()

        for month in months:
            pay_date = month.replace(day=pay_cfg['pay_day'])
            if pay_date > self.period_end:
                continue

            for emp in self.employees:
                base = float(emp['base_salary']) / 12
                payroll_no = f"PAY{month.strftime('%Y%m')}{emp['employee_id'][-5:]}"

                overtime_pay = base * random.uniform(0, 0.15)
                bonus = base * 0.07 if month.month in [3, 6, 9, 12] else 0
                allowances = base * 0.13  # 식비+교통비+직책수당 합산

                gross = base + overtime_pay + bonus + allowances

                income_tax = gross * 0.05
                social_insurance = gross * 0.0895  # 국민연금+건강+고용 합산
                other_deductions = gross * 0.01

                total_deductions = income_tax + social_insurance + other_deductions
                net_pay = gross - total_deductions

                # payroll_no, pay_year, pay_month (별도 컬럼)
                pay_data.append((
                    TENANT_ID, payroll_no, emp['employee_id'],
                    month.year, month.month,
                    base, overtime_pay, bonus, allowances, gross,
                    income_tax, social_insurance, other_deductions,
                    total_deductions, net_pay, pay_date, 'paid', datetime.now()
                ))

        if pay_data:
            execute_batch("""
                INSERT INTO erp_payroll
                (tenant_id, payroll_no, employee_id, pay_year, pay_month,
                 base_salary, overtime_pay, bonus, allowances, gross_pay,
                 income_tax, social_insurance, other_deductions,
                 total_deductions, net_pay, payment_date, status, created_at)
                VALUES %s ON CONFLICT DO NOTHING
            """, pay_data)

        print(f"  급여: {len(pay_data)}건 생성")
