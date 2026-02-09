"""
Master Data Generator
Generates all master data for ERP/MES Simulator
"""

import uuid
import random
from datetime import date, datetime, timedelta
from typing import Any

import yaml
import numpy as np
from faker import Faker
from faker.providers import BaseProvider

# Korean company name provider
class KoreanCompanyProvider(BaseProvider):
    """Custom provider for Korean company names"""

    prefixes = ['삼성', '현대', '에스케이', '엘지', '한화', '롯데', '신세계', '두산',
                '대우', '금호', '동양', '태평양', '미래', '한국', '대한', '세계',
                '글로벌', '유니온', '하나', '코리아', '아시아', '퍼시픽']

    suffixes_electronics = ['전자', '반도체', '디스플레이', '전기', 'LED', '시스템',
                           '테크', '일렉', '마이크로', '옵틱스', '센서']

    suffixes_generic = ['산업', '상사', '물산', '인더스트리', '코퍼레이션',
                       '엔터프라이즈', '그룹', '홀딩스']

    def korean_company_name(self, suffix_type='electronics'):
        prefix = self.random_element(self.prefixes)
        if suffix_type == 'electronics':
            suffix = self.random_element(self.suffixes_electronics)
        else:
            suffix = self.random_element(self.suffixes_generic)
        return f"{prefix}{suffix}"


class MasterDataGenerator:
    """Master Data Generator for GreenBoard Electronics"""

    def __init__(self, config_path: str, seed: int = 42):
        """Initialize generator with config file"""
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        # Set random seed for reproducibility
        random.seed(seed)
        np.random.seed(seed)

        # Initialize Faker with Korean locale
        self.fake = Faker(['ko_KR', 'en_US'])
        self.fake.add_provider(KoreanCompanyProvider)
        Faker.seed(seed)

        # Tenant ID (will be set after tenant creation)
        self.tenant_id = None

        # Generated data storage
        self.data = {
            'tenants': [],
            'customers': [],
            'vendors': [],
            'materials': [],
            'products': [],
            'bom_headers': [],
            'bom_components': [],
            'routing_headers': [],
            'routing_operations': [],
            'equipment': [],
            'lines': [],
            'operators': [],
            'warehouses': [],
            'departments': [],
            'cost_centers': [],
            'work_centers': [],
        }

    def generate_all(self) -> dict:
        """Generate all master data"""
        print("=" * 60)
        print("Starting Master Data Generation")
        print("=" * 60)

        # 1. Generate tenant
        self._generate_tenant()
        print(f"✓ Tenant: {self.config['company']['name']}")

        # 2. Generate organizational structure
        self._generate_departments()
        self._generate_cost_centers()
        self._generate_warehouses()
        print(f"✓ Organization: {len(self.data['departments'])} depts, {len(self.data['warehouses'])} warehouses")

        # 3. Generate customers
        self._generate_customers()
        print(f"✓ Customers: {len(self.data['customers'])}")

        # 4. Generate vendors
        self._generate_vendors()
        print(f"✓ Vendors: {len(self.data['vendors'])}")

        # 5. Generate materials (components)
        self._generate_materials()
        print(f"✓ Materials: {len(self.data['materials'])}")

        # 6. Generate products and BOMs
        self._generate_products_and_boms()
        print(f"✓ Products: {len(self.data['products'])}")
        print(f"✓ BOMs: {len(self.data['bom_headers'])} headers, {len(self.data['bom_components'])} components")

        # 7. Generate production lines and equipment
        self._generate_lines_and_equipment()
        print(f"✓ Lines: {len(self.data['lines'])}")
        print(f"✓ Equipment: {len(self.data['equipment'])}")

        # 8. Generate routings
        self._generate_routings()
        print(f"✓ Routings: {len(self.data['routing_headers'])} headers, {len(self.data['routing_operations'])} operations")

        # 9. Generate operators
        self._generate_operators()
        print(f"✓ Operators: {len(self.data['operators'])}")

        print("=" * 60)
        print("Master Data Generation Complete")
        print("=" * 60)

        return self.data

    def _generate_tenant(self):
        """Generate tenant record"""
        company = self.config['company']
        tenant = {
            'id': str(uuid.uuid4()),
            'code': company['code'],
            'name': company['name'],
            'name_en': company['name_en'],
            'business_no': company['business_no'],
            'settings': {
                'currency': company['currency'],
                'timezone': company['timezone'],
                'fiscal_year_start': '01-01'
            },
            'is_active': True
        }
        self.tenant_id = tenant['id']
        self.data['tenants'].append(tenant)

    def _generate_departments(self):
        """Generate department records from config"""
        for dept in self.config['organization']['departments']:
            self.data['departments'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'department_code': dept['code'],
                'department_name': dept['name'],
                'department_type': dept['type'],
                'is_active': True
            })

    def _generate_cost_centers(self):
        """Generate cost center records from config"""
        for cc in self.config['organization']['cost_centers']:
            self.data['cost_centers'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'cost_center_code': cc['code'],
                'name': cc['name'],
                'cost_center_type': cc['type'],
                'department_code': cc.get('department'),
                'is_active': True
            })

    def _generate_warehouses(self):
        """Generate warehouse records"""
        warehouses = [
            ('WH-RM', '원자재 창고', 'storage'),
            ('WH-WIP', '재공품 창고', 'production'),
            ('WH-FG', '완제품 창고', 'storage'),
            ('WH-SHIP', '출하 창고', 'shipping'),
            ('WH-RECV', '입고 창고', 'receiving'),
            ('WH-QC', '품질검사 창고', 'quality'),
            ('WH-SCRAP', '불량/폐기 창고', 'scrap'),
        ]
        for code, name, wh_type in warehouses:
            self.data['warehouses'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'warehouse_code': code,
                'warehouse_name': name,
                'warehouse_type': wh_type,
                'is_active': True
            })

    def _generate_customers(self):
        """Generate customer master records"""
        num_customers = self.config['data_volumes']['master']['customers']

        # Customer types distribution: 70% domestic, 30% export
        domestic_count = int(num_customers * 0.7)
        export_count = num_customers - domestic_count

        # Korean cities for domestic customers
        korean_cities = ['서울', '부산', '인천', '대구', '대전', '광주', '울산', '수원', '성남', '화성', '용인', '천안']

        # Export countries
        export_countries = [
            ('US', 'United States'), ('CN', 'China'), ('JP', 'Japan'),
            ('DE', 'Germany'), ('VN', 'Vietnam'), ('TW', 'Taiwan'),
            ('IN', 'India'), ('MX', 'Mexico'), ('PL', 'Poland')
        ]

        # Generate domestic customers
        for i in range(domestic_count):
            customer_code = f"CUST-{str(i+1).zfill(4)}"
            company_name = self.fake.korean_company_name()
            city = random.choice(korean_cities)

            self.data['customers'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'customer_code': customer_code,
                'customer_name': f"(주){company_name}",
                'customer_name_en': f"{company_name} Co., Ltd.",
                'customer_type': 'domestic',
                'business_no': self.fake.bothify(text='###-##-#####'),
                'ceo_name': self.fake.name(),
                'industry': random.choice(['전자', '가전', '자동차', '통신', '의료기기', 'IT', '조명']),
                'address': f"{city}시 {self.fake.street_name()}",
                'city': city,
                'country': 'KR',
                'phone': self.fake.phone_number(),
                'email': f"contact@{company_name.lower().replace(' ', '')}.co.kr",
                'payment_terms': random.choice(['NET30', 'NET45', 'NET60']),
                'credit_limit': random.randint(1, 50) * 10000000,  # 1천만 ~ 5억
                'currency': 'KRW',
                'customer_group': random.choice(['A', 'B', 'C']),
                'is_active': True
            })

        # Generate export customers
        for i in range(export_count):
            customer_code = f"CUST-{str(domestic_count + i + 1).zfill(4)}"
            country_code, country_name = random.choice(export_countries)

            self.data['customers'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'customer_code': customer_code,
                'customer_name': self.fake.company(),
                'customer_name_en': self.fake.company(),
                'customer_type': 'export',
                'industry': random.choice(['Electronics', 'Automotive', 'Consumer', 'Industrial', 'Medical']),
                'city': self.fake.city(),
                'country': country_code,
                'phone': self.fake.phone_number(),
                'email': self.fake.company_email(),
                'payment_terms': random.choice(['NET30', 'NET60', 'LC']),
                'credit_limit': random.randint(5, 100) * 10000,  # USD
                'currency': 'USD',
                'customer_group': random.choice(['A', 'B', 'C']),
                'is_active': True
            })

    def _generate_vendors(self):
        """Generate vendor master records"""
        num_vendors = self.config['data_volumes']['master']['vendors']

        # Vendor categories with specific characteristics
        vendor_categories = [
            {'type': 'material', 'prefix': 'VEND-M', 'count': int(num_vendors * 0.6),
             'names': ['부품', '전자', '반도체', '소재', '테크', '마이크로']},
            {'type': 'service', 'prefix': 'VEND-S', 'count': int(num_vendors * 0.15),
             'names': ['서비스', '솔루션', '테크', 'IT']},
            {'type': 'subcontract', 'prefix': 'VEND-C', 'count': int(num_vendors * 0.15),
             'names': ['제조', '가공', '정밀', 'PCB']},
            {'type': 'equipment', 'prefix': 'VEND-E', 'count': int(num_vendors * 0.1),
             'names': ['장비', '설비', '시스템', '오토메이션']}
        ]

        vendor_idx = 0
        for cat in vendor_categories:
            for i in range(cat['count']):
                vendor_idx += 1
                vendor_code = f"{cat['prefix']}{str(vendor_idx).zfill(3)}"
                suffix = random.choice(cat['names'])

                self.data['vendors'].append({
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'vendor_code': vendor_code,
                    'vendor_name': f"(주){random.choice(self.fake.generator.providers[0].prefixes)}{suffix}",
                    'vendor_type': cat['type'],
                    'business_no': self.fake.bothify(text='###-##-#####'),
                    'ceo_name': self.fake.name(),
                    'address': f"{random.choice(['서울', '경기', '인천', '충남', '충북'])} {self.fake.street_name()}",
                    'country': 'KR',
                    'phone': self.fake.phone_number(),
                    'email': f"sales@vendor{vendor_idx}.co.kr",
                    'payment_terms': random.choice(['NET30', 'NET45', 'NET60']),
                    'currency': 'KRW',
                    'lead_time_days': random.randint(3, 30),
                    'quality_rating': random.choice(['A', 'A', 'A', 'B', 'B', 'C']),
                    'delivery_rating': random.choice(['A', 'A', 'B', 'B', 'C']),
                    'is_active': True
                })

    def _generate_materials(self):
        """Generate material master (components for PCB)"""

        # Component categories for SMT
        component_types = [
            # Passive components
            {'group': 'RESISTOR', 'prefix': 'R', 'packages': ['0201', '0402', '0603', '0805', '1206'],
             'values': ['1R', '10R', '100R', '1K', '4.7K', '10K', '47K', '100K', '1M'],
             'count': 400, 'price_range': (1, 10)},

            {'group': 'CAPACITOR', 'prefix': 'C', 'packages': ['0201', '0402', '0603', '0805', '1206'],
             'values': ['10pF', '100pF', '1nF', '10nF', '100nF', '1uF', '10uF', '100uF'],
             'count': 400, 'price_range': (2, 50)},

            {'group': 'INDUCTOR', 'prefix': 'L', 'packages': ['0402', '0603', '0805', '1008'],
             'values': ['1nH', '10nH', '100nH', '1uH', '10uH', '100uH'],
             'count': 150, 'price_range': (10, 100)},

            # Active components
            {'group': 'IC_LOGIC', 'prefix': 'IC', 'packages': ['SOIC-8', 'SOIC-14', 'SOIC-16', 'TSSOP-20', 'QFP-48'],
             'values': ['74HC00', '74HC04', '74HC14', '74HC595', 'SN74LVC'],
             'count': 200, 'price_range': (50, 500)},

            {'group': 'IC_MCU', 'prefix': 'MCU', 'packages': ['QFN-32', 'QFN-48', 'QFP-64', 'QFP-100', 'BGA-144'],
             'values': ['STM32F0', 'STM32F1', 'STM32F4', 'ESP32', 'NRF52'],
             'count': 50, 'price_range': (500, 5000)},

            {'group': 'IC_POWER', 'prefix': 'PWR', 'packages': ['SOT-23', 'SOT-223', 'TO-252', 'QFN-16'],
             'values': ['LM7805', 'AMS1117', 'TPS62', 'MP1584', 'RT8059'],
             'count': 100, 'price_range': (100, 1000)},

            {'group': 'TRANSISTOR', 'prefix': 'Q', 'packages': ['SOT-23', 'SOT-223', 'TO-252'],
             'values': ['2N7002', 'BSS138', 'IRLML6402', 'BC847', 'MMBT3904'],
             'count': 150, 'price_range': (5, 50)},

            {'group': 'DIODE', 'prefix': 'D', 'packages': ['SOD-123', 'SOD-323', 'SMA', 'SMB'],
             'values': ['1N4148', '1N5819', 'SS14', 'BAT54', 'SMBJ5.0A'],
             'count': 150, 'price_range': (3, 30)},

            {'group': 'LED', 'prefix': 'LED', 'packages': ['0402', '0603', '0805', '1206', '3528'],
             'values': ['RED', 'GREEN', 'BLUE', 'WHITE', 'AMBER'],
             'count': 100, 'price_range': (10, 100)},

            # Connectors
            {'group': 'CONNECTOR', 'prefix': 'CN', 'packages': ['SMD', 'THT'],
             'values': ['USB-C', 'USB-A', 'HDMI', 'RJ45', 'JST', 'FPC', 'PIN_HEADER'],
             'count': 150, 'price_range': (50, 2000)},

            # Mechanical
            {'group': 'CRYSTAL', 'prefix': 'Y', 'packages': ['HC49', '3215', '2012'],
             'values': ['8MHz', '12MHz', '16MHz', '24MHz', '32.768kHz'],
             'count': 50, 'price_range': (100, 500)},

            # PCB
            {'group': 'PCB', 'prefix': 'PCB', 'packages': ['2L', '4L', '6L', '8L'],
             'values': ['FR4', 'HIGH-TG', 'FLEX', 'RIGID-FLEX'],
             'count': 50, 'price_range': (1000, 50000)},

            # Consumables
            {'group': 'CONSUMABLE', 'prefix': 'CON', 'packages': [''],
             'values': ['SOLDER_PASTE', 'FLUX', 'CLEANING', 'TAPE', 'LABEL'],
             'count': 50, 'price_range': (5000, 100000)},
        ]

        material_idx = 0
        vendors = [v['vendor_code'] for v in self.data['vendors'] if v['vendor_type'] == 'material']

        for comp_type in component_types:
            for i in range(comp_type['count']):
                material_idx += 1

                package = random.choice(comp_type['packages']) if comp_type['packages'][0] else ''
                value = random.choice(comp_type['values'])

                material_code = f"{comp_type['prefix']}-{package}-{value}-{str(i+1).zfill(3)}".replace('--', '-')

                # Determine material type
                if comp_type['group'] in ['PCB']:
                    mat_type = 'raw'
                elif comp_type['group'] in ['CONSUMABLE']:
                    mat_type = 'consumable'
                else:
                    mat_type = 'component'

                price = random.uniform(*comp_type['price_range'])

                self.data['materials'].append({
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'material_code': material_code,
                    'material_type': mat_type,
                    'material_group': comp_type['group'],
                    'name': f"{comp_type['group']} {value} {package}".strip(),
                    'unit': 'EA' if mat_type != 'consumable' else random.choice(['EA', 'KG', 'L', 'M']),
                    'package_type': package if package else None,
                    'procurement_type': 'purchase',
                    'primary_vendor_code': random.choice(vendors) if vendors else None,
                    'lead_time_days': random.randint(3, 21),
                    'safety_stock': random.randint(100, 10000),
                    'reorder_point': random.randint(200, 20000),
                    'min_order_qty': random.choice([100, 500, 1000, 2500, 5000]),
                    'standard_cost': round(price, 2),
                    'moving_avg_price': round(price * random.uniform(0.95, 1.05), 2),
                    'abc_class': random.choices(['A', 'B', 'C'], weights=[0.2, 0.3, 0.5])[0],
                    'is_active': True
                })

    def _generate_products_and_boms(self):
        """Generate finished products and their BOMs"""

        product_families = self.config['product_families']
        products_per_family = self.config['data_volumes']['master']['products_per_family']

        for family in product_families:
            for i in range(products_per_family):
                product_code = f"{family['code']}-{str(i+1).zfill(3)}"
                product_name = f"{family['name']} 모델 {chr(65 + i)}"

                # Create product (as finished material)
                product_id = str(uuid.uuid4())
                self.data['products'].append({
                    'id': product_id,
                    'tenant_id': self.tenant_id,
                    'material_code': product_code,
                    'material_type': 'finished',
                    'material_group': family['code'],
                    'name': product_name,
                    'name_en': f"{family['name_en']} Model {chr(65 + i)}",
                    'unit': 'EA',
                    'procurement_type': 'manufacture',
                    'standard_cost': random.randint(*family['unit_price_range']),
                    'abc_class': 'A',
                    'is_active': True
                })

                # Create BOM header
                bom_id = str(uuid.uuid4())
                num_components = random.randint(*family['components_range'])

                self.data['bom_headers'].append({
                    'id': bom_id,
                    'tenant_id': self.tenant_id,
                    'bom_no': f"BOM-{product_code}",
                    'bom_version': 1,
                    'product_code': product_code,
                    'product_name': product_name,
                    'bom_type': 'production',
                    'base_qty': 1,
                    'unit': 'EA',
                    'valid_from': date(2024, 1, 1),
                    'status': 'active',
                    'total_components': num_components
                })

                # Create BOM components
                self._generate_bom_components(bom_id, product_code, num_components)

    def _generate_bom_components(self, bom_id: str, product_code: str, num_components: int):
        """Generate BOM components for a product"""

        # Filter available materials by type
        components = [m for m in self.data['materials'] if m['material_type'] == 'component']
        raw_materials = [m for m in self.data['materials'] if m['material_type'] == 'raw']

        # Component distribution
        # Passives (R, C, L): 60%
        # ICs: 20%
        # Others: 20%

        passives = [c for c in components if c['material_group'] in ['RESISTOR', 'CAPACITOR', 'INDUCTOR']]
        ics = [c for c in components if c['material_group'].startswith('IC_')]
        others = [c for c in components if c['material_group'] not in ['RESISTOR', 'CAPACITOR', 'INDUCTOR'] and not c['material_group'].startswith('IC_')]

        num_passives = int(num_components * 0.6)
        num_ics = int(num_components * 0.2)
        num_others = num_components - num_passives - num_ics

        selected_components = []

        if passives:
            selected_components.extend(random.choices(passives, k=min(num_passives, len(passives))))
        if ics:
            selected_components.extend(random.choices(ics, k=min(num_ics, len(ics))))
        if others:
            selected_components.extend(random.choices(others, k=min(num_others, len(others))))

        # Add PCB
        pcbs = [m for m in raw_materials if m['material_group'] == 'PCB']
        if pcbs:
            selected_components.append(random.choice(pcbs))

        # Create BOM lines
        for item_no, comp in enumerate(selected_components, start=1):
            qty_per = random.randint(1, 20) if comp['material_group'] != 'PCB' else 1

            # Generate position designators for passives/components
            position_designator = None
            if comp['material_group'] in ['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'LED', 'DIODE']:
                prefix = comp['material_group'][0]
                positions = [f"{prefix}{random.randint(1, 500)}" for _ in range(qty_per)]
                position_designator = ','.join(positions[:min(5, len(positions))])  # Limit for display

            self.data['bom_components'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'bom_id': bom_id,
                'item_no': item_no * 10,
                'component_code': comp['material_code'],
                'component_name': comp['name'],
                'component_type': 'material' if comp['material_type'] != 'raw' else 'material',
                'qty_per': qty_per,
                'unit': comp['unit'],
                'scrap_rate': random.uniform(0.5, 3.0),
                'operation_no': 30 if comp['material_group'] != 'PCB' else 10,  # PCB loaded first
                'position_designator': position_designator,
                'is_backflush': True,
                'is_critical': comp['material_group'].startswith('IC_')
            })

    def _generate_lines_and_equipment(self):
        """Generate production lines and equipment"""

        line_configs = self.config['production_lines']
        equipment_vendors = self.config['equipment_vendors']

        for line_type, config in line_configs.items():
            for line_code in config['lines']:
                # Create line record
                line_id = str(uuid.uuid4())
                self.data['lines'].append({
                    'id': line_id,
                    'tenant_id': self.tenant_id,
                    'line_code': line_code,
                    'line_name': f"{line_type.upper()} {line_code}",
                    'line_type': line_type,
                    'capacity_per_shift': config['capacity_per_shift'],
                    'is_active': True
                })

                # Create equipment for this line
                position = 0
                for equip_config in config.get('equipment_sequence', []):
                    equip_type = equip_config['type']
                    count = equip_config['count']

                    for eq_idx in range(count):
                        position += 1
                        equipment_code = f"{equip_type.upper()}-{line_code}-{str(eq_idx+1).zfill(2)}"

                        # Get vendor info
                        vendor_info = equipment_vendors.get(equip_type, [{'name': 'Generic', 'models': ['Standard']}])
                        vendor = random.choice(vendor_info)

                        self.data['equipment'].append({
                            'id': str(uuid.uuid4()),
                            'tenant_id': self.tenant_id,
                            'equipment_code': equipment_code,
                            'equipment_name': f"{equip_type.title()} {line_code}-{eq_idx+1}",
                            'equipment_type': equip_type,
                            'equipment_category': line_type.upper(),
                            'line_code': line_code,
                            'position_in_line': position,
                            'manufacturer': vendor['name'],
                            'model': random.choice(vendor['models']),
                            'serial_no': f"SN{random.randint(100000, 999999)}",
                            'install_date': date(2020 + random.randint(0, 4), random.randint(1, 12), random.randint(1, 28)),
                            'standard_cycle_time_sec': random.uniform(3, 15),
                            'max_capacity_per_hour': random.randint(1000, 5000),
                            'pm_interval_days': random.choice([7, 14, 30]),
                            'status': 'active'
                        })

    def _generate_routings(self):
        """Generate routings for all products"""

        # Standard SMT routing template
        smt_operations = [
            (10, 'PCB Loading', 'loader', 'machine', 0, 2, False),
            (20, 'Solder Paste Printing', 'printer', 'machine', 5, 5, False),
            (25, 'SPI Inspection', 'spi', 'inspection', 0, 3, True),
            (30, 'Component Placement - Chip', 'mounter', 'machine', 10, 8, False),
            (40, 'Component Placement - IC', 'mounter', 'machine', 5, 10, False),
            (50, 'Reflow Soldering', 'reflow', 'machine', 15, 12, False),
            (60, 'AOI Inspection', 'aoi', 'inspection', 0, 5, True),
            (70, 'Manual Inspection', 'inspection', 'manual', 0, 8, True),
        ]

        for product in self.data['products']:
            product_code = product['material_code']
            routing_id = str(uuid.uuid4())

            self.data['routing_headers'].append({
                'id': routing_id,
                'tenant_id': self.tenant_id,
                'routing_no': f"RTG-{product_code}",
                'routing_version': 1,
                'product_code': product_code,
                'product_name': product['name'],
                'routing_type': 'standard',
                'valid_from': date(2024, 1, 1),
                'status': 'active',
                'total_operations': len(smt_operations)
            })

            for op_no, op_name, equip_type, op_type, setup_time, run_time, is_inspection in smt_operations:
                self.data['routing_operations'].append({
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'routing_id': routing_id,
                    'operation_no': op_no,
                    'operation_name': op_name,
                    'work_center_code': f"WC-{equip_type.upper()}",
                    'operation_type': op_type,
                    'setup_time': setup_time,
                    'run_time': run_time,
                    'time_unit': 'sec',
                    'is_inspection_required': is_inspection,
                    'inspection_type': 'AOI' if equip_type == 'aoi' else ('SPI' if equip_type == 'spi' else None)
                })

    def _generate_operators(self):
        """Generate operator records"""
        num_operators = self.config['data_volumes']['master']['operators']
        operators_per_shift = num_operators // 3

        departments = ['MFG1', 'MFG2', 'THT', 'ASM', 'QC']
        roles = ['operator', 'leader', 'technician', 'engineer', 'inspector']
        skill_levels = ['trainee', 'basic', 'intermediate', 'advanced', 'expert']

        for i in range(num_operators):
            shift = (i // operators_per_shift) + 1
            operator_code = f"OP-{str(i+1).zfill(4)}"

            self.data['operators'].append({
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'operator_code': operator_code,
                'operator_name': self.fake.name(),
                'department_code': random.choice(departments),
                'default_shift': str(min(shift, 3)),
                'role': random.choices(roles, weights=[0.6, 0.15, 0.1, 0.1, 0.05])[0],
                'skill_level': random.choices(skill_levels, weights=[0.1, 0.2, 0.3, 0.3, 0.1])[0],
                'hire_date': date(2015 + random.randint(0, 9), random.randint(1, 12), random.randint(1, 28)),
                'is_active': True
            })


if __name__ == "__main__":
    import os

    # Get config path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, '..', '..', 'config', 'company.yaml')

    # Generate master data
    generator = MasterDataGenerator(config_path)
    data = generator.generate_all()

    # Print summary
    print("\nGenerated Data Summary:")
    for key, value in data.items():
        print(f"  {key}: {len(value)} records")
