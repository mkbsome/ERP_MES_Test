"""
기준정보 마스터 데이터 생성기
"""
import random
from datetime import datetime
from faker import Faker
from .base import BaseGenerator
from db_connection import execute_batch
from config import TENANT_ID, KOREAN_DATA

fake = Faker('ko_KR')

def generate_business_no():
    """사업자번호 생성 (XXX-XX-XXXXX)"""
    return f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10000,99999)}"

class MasterDataGenerator(BaseGenerator):
    """기준정보 마스터 생성기"""

    def __init__(self):
        super().__init__('master.yaml')
        self.data = self.scenario['master_data']

    def generate(self):
        """전체 마스터 데이터 생성"""
        print("=== 기준정보 마스터 생성 ===")
        self.generate_customers()
        self.generate_vendors()
        self.generate_products()
        self.generate_warehouses()
        self.generate_lines()
        self.generate_equipment()
        print("=== 기준정보 마스터 완료 ===\n")

    def generate_customers(self):
        """고객 마스터"""
        cfg = self.data['customers']
        data = []

        for i in range(cfg['count']):
            code = f"{cfg['template']['code_prefix']}{str(i+1).zfill(4)}"
            name = fake.last_name() + random.choice(KOREAN_DATA['company_suffixes'])
            grade = self.weighted_choice(cfg['distribution'])
            grade = grade.replace('grade_', '').upper()
            ctype = random.choice(['domestic', 'overseas', 'group'])

            data.append((
                TENANT_ID, code, name, ctype, grade,
                generate_business_no(), fake.name(),
                fake.address(), fake.phone_number(), fake.email(),
                random.randint(10000000, 100000000),  # credit_limit
                random.choice(cfg['template']['payment_terms']),
                True, datetime.now()
            ))

        query = """
            INSERT INTO erp_customer_master
            (tenant_id, customer_code, customer_name, customer_type, customer_grade,
             business_no, ceo_name, address, phone, email,
             credit_limit, payment_terms, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  고객: {len(data)}건 생성")

    def generate_vendors(self):
        """공급업체 마스터"""
        cfg = self.data['vendors']
        data = []

        for i in range(cfg['count']):
            code = f"{cfg['template']['code_prefix']}{str(i+1).zfill(4)}"
            name = fake.last_name() + random.choice(KOREAN_DATA['company_suffixes'])
            grade = self.weighted_choice(cfg['distribution'])
            grade = grade.replace('grade_', '').upper()
            vtype = random.choice(['manufacturer', 'distributor', 'service'])

            data.append((
                TENANT_ID, code, name, vtype, grade,
                generate_business_no(), fake.name(),
                fake.address(), fake.phone_number(), fake.email(),
                random.choice(cfg['template']['payment_terms']),
                True, datetime.now()
            ))

        query = """
            INSERT INTO erp_vendor_master
            (tenant_id, vendor_code, vendor_name, vendor_type, vendor_grade,
             business_no, ceo_name, address, phone, email,
             payment_terms, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  공급업체: {len(data)}건 생성")

    def generate_products(self):
        """제품 마스터"""
        cfg = self.data['products']
        data = []

        for i in range(cfg['count']):
            code = f"{cfg['template']['code_prefix']}{str(i+1).zfill(4)}"
            ptype = random.choice(['FG', 'WIP', 'RM', 'PKG', 'MRO'])
            name = f"{random.choice(KOREAN_DATA['product_types'])}-{random.randint(100, 999)}"
            group = self.weighted_choice(cfg['categories'])

            unit_cost = random.randint(cfg['price_range']['min'], cfg['price_range']['max'])
            selling_price = unit_cost * random.uniform(1.2, 1.8)

            data.append((
                TENANT_ID, code, name, ptype, group,
                random.choice(cfg['template']['units']),
                unit_cost, selling_price,
                random.randint(50, 200),   # safety_stock
                random.randint(1, 30),     # lead_time_days
                True, datetime.now()
            ))

        query = """
            INSERT INTO erp_product_master
            (tenant_id, product_code, product_name, product_type, product_group,
             uom, standard_cost, selling_price,
             safety_stock, lead_time_days, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  제품: {len(data)}건 생성")

    def generate_warehouses(self):
        """창고 마스터"""
        cfg = self.data['warehouses']
        data = []

        for item in cfg['items']:
            data.append((
                TENANT_ID, item['code'], item['name'],
                item['type'], fake.address(),
                True, datetime.now()
            ))

        query = """
            INSERT INTO erp_warehouse
            (tenant_id, warehouse_code, warehouse_name,
             warehouse_type, location, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  창고: {len(data)}건 생성")

    def generate_lines(self):
        """생산라인"""
        cfg = self.data['production_lines']
        data = []

        for item in cfg['items']:
            data.append((
                TENANT_ID, item['code'], item['name'],
                item['type'], 'FACTORY01', item['capacity'],
                True, datetime.now()
            ))

        query = """
            INSERT INTO mes_production_line
            (tenant_id, line_code, line_name, line_type,
             factory_code, capacity_per_hour, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  생산라인: {len(data)}건 생성")

    def generate_equipment(self):
        """설비"""
        cfg = self.data['equipment']
        lines = self.data['production_lines']['items']
        data = []

        idx = 1
        for line in lines:
            for j in range(cfg['per_line']):
                code = f"{cfg['template']['code_prefix']}{str(idx).zfill(4)}"
                etype = random.choice(cfg['template']['types'])
                name = f"{etype}-{idx:02d}"
                manufacturer = random.choice(['Samsung', 'LG', 'Fanuc', 'Siemens', 'ABB'])
                model = f"Model-{random.randint(100, 999)}"

                data.append((
                    TENANT_ID, code, name, etype, line['code'],
                    manufacturer, model, f"SN{random.randint(100000, 999999)}",
                    datetime.now().date(), True, datetime.now()
                ))
                idx += 1

        query = """
            INSERT INTO mes_equipment
            (tenant_id, equipment_code, equipment_name, equipment_type, line_code,
             manufacturer, model, serial_no, install_date, is_active, created_at)
            VALUES %s ON CONFLICT DO NOTHING
        """
        execute_batch(query, data)
        print(f"  설비: {len(data)}건 생성")
