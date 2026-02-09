"""
Transaction Data Generator
Generates daily transaction data for ERP/MES Simulator
"""

import uuid
import random
from datetime import date, datetime, timedelta
from typing import Any, Optional
import json

import yaml
import numpy as np
from faker import Faker
from tqdm import tqdm


class TransactionDataGenerator:
    """Transaction Data Generator for GreenBoard Electronics"""

    def __init__(self, config_path: str, master_data: dict, seed: int = 42):
        """
        Initialize generator with config and master data

        Args:
            config_path: Path to company configuration YAML
            master_data: Dictionary containing all master data
            seed: Random seed for reproducibility
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        random.seed(seed)
        np.random.seed(seed)

        self.fake = Faker(['ko_KR', 'en_US'])
        Faker.seed(seed)

        self.master = master_data
        self.tenant_id = master_data['tenants'][0]['id']

        # Simulation period
        sim_config = self.config['simulation']
        self.start_date = datetime.strptime(sim_config['start_date'], '%Y-%m-%d').date()
        self.end_date = datetime.strptime(sim_config['end_date'], '%Y-%m-%d').date()

        # Scenario configurations
        self.scenarios = self.config['scenarios']
        self.data_volumes = self.config['data_volumes']['daily_transactions']

        # Generated transaction data storage
        self.data = {
            # ERP Transactions
            'sales_orders': [],
            'sales_order_lines': [],
            'purchase_orders': [],
            'purchase_order_lines': [],
            'goods_receipts': [],
            'goods_receipt_lines': [],
            'work_orders': [],
            'work_order_operations': [],
            'work_order_materials': [],
            'inventory_transactions': [],

            # MES Transactions
            'production_orders': [],
            'production_results': [],
            'realtime_production': [],
            'equipment_status': [],
            'equipment_oee': [],
            'downtime_events': [],
            'defect_details': [],
            'inspection_results': [],
            'material_consumption': [],
            'feeder_setups': [],
            'traceability': [],

            # Interface Transactions
            'erp_mes_work_order_if': [],
            'mes_erp_production_if': [],
            'mes_erp_goods_movement_if': [],
        }

        # Sequence counters
        self.sequences = {
            'sales_order': 1000,
            'purchase_order': 1000,
            'goods_receipt': 1000,
            'work_order': 1000,
            'production_order': 1000,
            'lot': 1000,
        }

        # Working day calendar
        self.working_days = self._generate_working_days()

    def _generate_working_days(self) -> list[date]:
        """Generate list of working days in simulation period"""
        working_days = []
        current = self.start_date

        while current <= self.end_date:
            # Monday=0, Sunday=6
            if current.weekday() < 5:  # Mon-Fri
                working_days.append(current)
            current += timedelta(days=1)

        return working_days

    def _get_next_sequence(self, seq_type: str) -> str:
        """Get next sequence number"""
        self.sequences[seq_type] += 1
        return str(self.sequences[seq_type]).zfill(6)

    def _is_scenario_active(self, scenario_name: str, current_date: date) -> bool:
        """Check if a scenario is active on given date"""
        scenario = self.scenarios.get(scenario_name, {})
        trigger_dates = scenario.get('trigger_dates', [])
        duration_days = scenario.get('duration_days', 0)

        for trigger_date_str in trigger_dates:
            trigger_date = datetime.strptime(trigger_date_str, '%Y-%m-%d').date()
            end_date = trigger_date + timedelta(days=duration_days)

            if trigger_date <= current_date <= end_date:
                return True

        return False

    def _get_defect_rate(self, current_date: date, line_code: str = None) -> float:
        """Get defect rate considering scenarios"""
        base_rate = self.scenarios['normal']['defect_rate_mean']
        base_std = self.scenarios['normal']['defect_rate_std']

        # Check quality issue scenario
        if self._is_scenario_active('quality_issue', current_date):
            quality_scenario = self.scenarios['quality_issue']
            affected_lines = quality_scenario.get('affected_lines', [])

            if line_code is None or line_code in affected_lines:
                multiplier = quality_scenario.get('defect_rate_multiplier', 1.0)
                base_rate *= multiplier

        # Add random variation
        rate = np.random.normal(base_rate, base_std)
        return max(0.001, min(rate, 0.20))  # Clamp between 0.1% and 20%

    def _get_oee_factor(self, current_date: date, equipment_code: str = None) -> float:
        """Get OEE factor considering scenarios"""
        base_oee = self.scenarios['normal']['oee_mean']

        # Check equipment issue scenario
        if self._is_scenario_active('equipment_issue', current_date):
            equip_scenario = self.scenarios['equipment_issue']
            affected_equipment = equip_scenario.get('affected_equipment', [])

            if equipment_code is None or equipment_code in affected_equipment:
                downtime_mult = equip_scenario.get('downtime_multiplier', 1.0)
                base_oee *= (1 / downtime_mult)

        # Add random variation
        oee = np.random.normal(base_oee, 0.05)
        return max(0.40, min(oee, 0.98))

    def generate_all(self) -> dict:
        """Generate all transaction data for the simulation period"""
        print("\n" + "=" * 60)
        print("Starting Transaction Data Generation")
        print(f"Period: {self.start_date} to {self.end_date}")
        print(f"Working days: {len(self.working_days)}")
        print("=" * 60)

        for current_date in tqdm(self.working_days, desc="Processing days"):
            self._generate_daily_transactions(current_date)

        print("\n" + "=" * 60)
        print("Transaction Data Generation Complete")
        print("=" * 60)

        # Print summary
        print("\nGenerated Data Summary:")
        for key, value in self.data.items():
            if value:
                print(f"  {key}: {len(value)} records")

        return self.data

    def _generate_daily_transactions(self, current_date: date):
        """Generate all transactions for a single day"""
        # 1. Sales Orders (demand generation)
        self._generate_sales_orders(current_date)

        # 2. Work Orders (based on sales demand and MPS)
        self._generate_work_orders(current_date)

        # 3. Purchase Orders (based on material requirements)
        self._generate_purchase_orders(current_date)

        # 4. Goods Receipts (for open POs)
        self._generate_goods_receipts(current_date)

        # 5. Production Results (MES level)
        self._generate_production_results(current_date)

        # 6. Quality Inspections and Defects
        self._generate_quality_data(current_date)

        # 7. Equipment Status and OEE
        self._generate_equipment_data(current_date)

        # 8. Material Consumption
        self._generate_material_consumption(current_date)

        # 9. Interface Data
        self._generate_interface_data(current_date)

    def _generate_sales_orders(self, current_date: date):
        """Generate sales orders for the day"""
        num_orders = random.randint(*self.data_volumes['sales_orders'])
        customers = self.master['customers']
        products = self.master['products']

        for _ in range(num_orders):
            customer = random.choice(customers)
            order_no = f"SO-{current_date.strftime('%Y%m%d')}-{self._get_next_sequence('sales_order')}"

            order = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'order_no': order_no,
                'customer_code': customer['customer_code'],
                'order_date': current_date,
                'requested_date': current_date + timedelta(days=random.randint(5, 21)),
                'order_type': random.choices(['normal', 'urgent', 'sample'], weights=[0.8, 0.15, 0.05])[0],
                'status': 'open',
                'currency': customer.get('currency', 'KRW'),
                'total_amount': 0,
                'created_at': datetime.combine(current_date, datetime.min.time())
            }

            total_amount = 0
            num_lines = random.randint(1, 5)

            for line_no in range(1, num_lines + 1):
                product = random.choice(products)
                qty = random.choice([100, 200, 300, 500, 1000, 2000]) * random.randint(1, 5)
                unit_price = product.get('standard_cost', 50000) * random.uniform(1.1, 1.5)
                line_amount = qty * unit_price

                line = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'order_id': order['id'],
                    'line_no': line_no * 10,
                    'material_code': product['material_code'],
                    'order_qty': qty,
                    'unit': 'EA',
                    'unit_price': round(unit_price, 2),
                    'amount': round(line_amount, 2),
                    'requested_date': order['requested_date'],
                    'status': 'open'
                }

                self.data['sales_order_lines'].append(line)
                total_amount += line_amount

            order['total_amount'] = round(total_amount, 2)
            self.data['sales_orders'].append(order)

    def _generate_work_orders(self, current_date: date):
        """Generate work orders based on demand"""
        num_orders = random.randint(*self.data_volumes['work_orders'])
        products = self.master['products']
        lines = self.master['lines']

        for _ in range(num_orders):
            product = random.choice(products)
            line = random.choice([l for l in lines if l['line_type'].startswith('smt')])

            wo_no = f"WO-{current_date.strftime('%Y%m%d')}-{self._get_next_sequence('work_order')}"
            lot_no = f"L{current_date.strftime('%Y%m%d')}{self._get_next_sequence('lot')}"

            qty = random.choice([100, 200, 500, 1000]) * random.randint(1, 3)

            work_order = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'work_order_no': wo_no,
                'material_code': product['material_code'],
                'order_qty': qty,
                'unit': 'EA',
                'plan_start_date': current_date,
                'plan_end_date': current_date + timedelta(days=random.randint(1, 3)),
                'target_line_code': line['line_code'],
                'priority': random.randint(1, 10),
                'lot_no': lot_no,
                'status': 'released',
                'created_at': datetime.combine(current_date, datetime.min.time())
            }

            self.data['work_orders'].append(work_order)

            # Create MES production order
            mes_order = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'production_order_no': f"MO-{wo_no[3:]}",
                'erp_work_order_no': wo_no,
                'product_code': product['material_code'],
                'product_name': product['name'],
                'order_qty': qty,
                'good_qty': 0,
                'defect_qty': 0,
                'unit': 'EA',
                'line_code': line['line_code'],
                'lot_no': lot_no,
                'plan_start_date': current_date,
                'plan_end_date': current_date + timedelta(days=random.randint(1, 3)),
                'status': 'scheduled',
                'created_at': datetime.combine(current_date, datetime.min.time())
            }

            self.data['production_orders'].append(mes_order)

    def _generate_purchase_orders(self, current_date: date):
        """Generate purchase orders for materials"""
        num_orders = random.randint(*self.data_volumes['purchase_orders'])
        vendors = [v for v in self.master['vendors'] if v['vendor_type'] == 'material']
        materials = [m for m in self.master['materials'] if m['material_type'] == 'component']

        for _ in range(num_orders):
            vendor = random.choice(vendors)
            po_no = f"PO-{current_date.strftime('%Y%m%d')}-{self._get_next_sequence('purchase_order')}"

            order = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'po_no': po_no,
                'vendor_code': vendor['vendor_code'],
                'po_date': current_date,
                'delivery_date': current_date + timedelta(days=vendor.get('lead_time_days', 7)),
                'po_type': 'normal',
                'status': 'open',
                'currency': vendor.get('currency', 'KRW'),
                'total_amount': 0,
                'created_at': datetime.combine(current_date, datetime.min.time())
            }

            total_amount = 0
            num_lines = random.randint(1, 10)

            for line_no in range(1, num_lines + 1):
                material = random.choice(materials)
                qty = material.get('min_order_qty', 1000) * random.randint(1, 5)
                unit_price = material.get('standard_cost', 10)
                line_amount = qty * unit_price

                line = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'po_id': order['id'],
                    'line_no': line_no * 10,
                    'material_code': material['material_code'],
                    'order_qty': qty,
                    'received_qty': 0,
                    'unit': material['unit'],
                    'unit_price': unit_price,
                    'amount': line_amount,
                    'delivery_date': order['delivery_date'],
                    'status': 'open'
                }

                self.data['purchase_order_lines'].append(line)
                total_amount += line_amount

            order['total_amount'] = round(total_amount, 2)
            self.data['purchase_orders'].append(order)

    def _generate_goods_receipts(self, current_date: date):
        """Generate goods receipts for due POs"""
        # Find POs due on or before current date
        due_pos = [
            po for po in self.data['purchase_orders']
            if po['status'] == 'open' and po['delivery_date'] <= current_date
        ]

        for po in due_pos[:random.randint(5, 15)]:  # Process some due POs
            gr_no = f"GR-{current_date.strftime('%Y%m%d')}-{self._get_next_sequence('goods_receipt')}"

            receipt = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'gr_no': gr_no,
                'po_id': po['id'],
                'po_no': po['po_no'],
                'vendor_code': po['vendor_code'],
                'receipt_date': current_date,
                'warehouse_code': 'WH-RM',
                'status': 'posted',
                'created_at': datetime.combine(current_date, datetime.min.time())
            }

            # Get PO lines
            po_lines = [l for l in self.data['purchase_order_lines'] if l['po_id'] == po['id']]

            for po_line in po_lines:
                received_qty = po_line['order_qty']  # Full receipt

                line = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'gr_id': receipt['id'],
                    'line_no': po_line['line_no'],
                    'po_line_id': po_line['id'],
                    'material_code': po_line['material_code'],
                    'received_qty': received_qty,
                    'unit': po_line['unit'],
                    'lot_no': f"VL{current_date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                    'inspection_status': 'pending'
                }

                self.data['goods_receipt_lines'].append(line)

                # Update PO line
                po_line['received_qty'] = received_qty
                po_line['status'] = 'received'

            self.data['goods_receipts'].append(receipt)
            po['status'] = 'received'

    def _generate_production_results(self, current_date: date):
        """Generate production results from MES"""
        # Get scheduled production orders
        scheduled_orders = [
            po for po in self.data['production_orders']
            if po['status'] in ['scheduled', 'in_progress'] and po['plan_start_date'] <= current_date
        ]

        for order in scheduled_orders[:random.randint(10, 30)]:
            line_code = order['line_code']
            defect_rate = self._get_defect_rate(current_date, line_code)

            # Calculate production quantities
            target_qty = order['order_qty'] - order['good_qty']
            if target_qty <= 0:
                continue

            # Produce portion of order
            produced_qty = min(target_qty, random.randint(100, 500))
            defect_qty = int(produced_qty * defect_rate)
            good_qty = produced_qty - defect_qty

            # Generate results for each shift
            for shift in ['1', '2', '3']:
                shift_qty = good_qty // 3 + (1 if shift == '1' else 0)
                shift_defect = defect_qty // 3

                if shift_qty <= 0:
                    continue

                result = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'production_order_id': order['id'],
                    'lot_no': order['lot_no'],
                    'product_code': order['product_code'],
                    'line_code': line_code,
                    'production_date': current_date,
                    'shift': shift,
                    'good_qty': shift_qty,
                    'defect_qty': shift_defect,
                    'total_qty': shift_qty + shift_defect,
                    'unit': 'EA',
                    'cycle_time_avg': random.uniform(30, 60),
                    'start_time': datetime.combine(current_date, datetime.min.time()) + timedelta(hours=int(shift) * 8 - 8),
                    'end_time': datetime.combine(current_date, datetime.min.time()) + timedelta(hours=int(shift) * 8),
                    'status': 'confirmed',
                    'created_at': datetime.now()
                }

                self.data['production_results'].append(result)

            # Update order quantities
            order['good_qty'] += good_qty
            order['defect_qty'] += defect_qty

            if order['good_qty'] >= order['order_qty']:
                order['status'] = 'completed'
            else:
                order['status'] = 'in_progress'

    def _generate_quality_data(self, current_date: date):
        """Generate quality inspection and defect data"""
        # Generate inspection results based on production results
        today_results = [r for r in self.data['production_results']
                        if r['production_date'] == current_date]

        defect_types = ['BRIDGE', 'OPEN', 'MISSING', 'TOMBSTONE', 'SHIFT', 'COLD', 'INSUFFICIENT']

        for result in today_results:
            # AOI inspection
            inspection = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'inspection_no': f"INS-{current_date.strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                'inspection_type': 'AOI',
                'production_order_id': result['production_order_id'],
                'lot_no': result['lot_no'],
                'product_code': result['product_code'],
                'line_code': result['line_code'],
                'inspection_datetime': result['end_time'],
                'shift': result['shift'],
                'result': 'FAIL' if result['defect_qty'] > 0 else 'PASS',
                'total_inspected': result['total_qty'],
                'pass_qty': result['good_qty'],
                'fail_qty': result['defect_qty'],
                'created_at': datetime.now()
            }

            self.data['inspection_results'].append(inspection)

            # Generate defect details
            if result['defect_qty'] > 0:
                remaining_defects = result['defect_qty']

                while remaining_defects > 0:
                    defect_code = random.choice(defect_types)
                    qty = min(remaining_defects, random.randint(1, 5))

                    defect = {
                        'id': str(uuid.uuid4()),
                        'tenant_id': self.tenant_id,
                        'defect_no': f"DEF-{current_date.strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                        'production_order_id': result['production_order_id'],
                        'lot_no': result['lot_no'],
                        'product_code': result['product_code'],
                        'line_code': result['line_code'],
                        'detection_datetime': result['end_time'],
                        'defect_code': defect_code,
                        'defect_qty': qty,
                        'unit': 'EA',
                        'detected_at': random.choice(['AOI', 'SPI', 'MANUAL']),
                        'severity': random.choice(['major', 'minor', 'critical']),
                        'status': 'detected',
                        'created_at': datetime.now()
                    }

                    self.data['defect_details'].append(defect)
                    remaining_defects -= qty

    def _generate_equipment_data(self, current_date: date):
        """Generate equipment status and OEE data"""
        equipment_list = self.master['equipment']

        for equip in equipment_list:
            oee_factor = self._get_oee_factor(current_date, equip['equipment_code'])

            # Generate OEE for each shift
            for shift in ['1', '2', '3']:
                planned_time = 480  # 8 hours = 480 minutes
                downtime = int(planned_time * (1 - oee_factor) * random.uniform(0.3, 0.5))
                running_time = planned_time - downtime

                availability = running_time / planned_time if planned_time > 0 else 0
                performance = random.uniform(0.85, 0.98)
                quality = 1 - self._get_defect_rate(current_date, equip.get('line_code'))

                oee = availability * performance * quality

                oee_record = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'equipment_id': equip['id'],
                    'oee_date': current_date,
                    'shift': shift,
                    'planned_time_min': planned_time,
                    'running_time_min': running_time,
                    'downtime_min': downtime,
                    'availability': round(availability, 4),
                    'performance': round(performance, 4),
                    'quality': round(quality, 4),
                    'oee': round(oee, 4),
                    'target_output': int(planned_time * equip.get('max_capacity_per_hour', 100) / 60),
                    'actual_output': int(running_time * equip.get('max_capacity_per_hour', 100) / 60 * performance),
                    'created_at': datetime.now()
                }

                self.data['equipment_oee'].append(oee_record)

                # Generate downtime events if significant
                if downtime > 30:
                    downtime_causes = [
                        ('setup_changeover', 'Setup'),
                        ('material_shortage', 'Material'),
                        ('equipment_failure', 'Machine'),
                        ('quality_issue', 'Quality'),
                        ('planned_maintenance', 'PM')
                    ]
                    cause_code, cause_type = random.choice(downtime_causes)

                    event = {
                        'id': str(uuid.uuid4()),
                        'tenant_id': self.tenant_id,
                        'equipment_id': equip['id'],
                        'downtime_type': random.choice(['planned', 'unplanned']),
                        'cause_code': cause_code,
                        'start_time': datetime.combine(current_date, datetime.min.time()) +
                                     timedelta(hours=int(shift) * 8 - 8 + random.randint(0, 6)),
                        'end_time': None,
                        'duration_minutes': downtime,
                        'description': f'{cause_type} related downtime',
                        'created_at': datetime.now()
                    }

                    self.data['downtime_events'].append(event)

    def _generate_material_consumption(self, current_date: date):
        """Generate material consumption records"""
        today_results = [r for r in self.data['production_results']
                        if r['production_date'] == current_date]

        for result in today_results:
            # Find BOM for product
            product_boms = [b for b in self.master['bom_headers']
                          if b['product_code'] == result['product_code']]

            if not product_boms:
                continue

            bom = product_boms[0]
            bom_components = [c for c in self.master['bom_components'] if c['bom_id'] == bom['id']]

            for comp in bom_components[:10]:  # Limit to first 10 components
                planned_qty = comp['qty_per'] * result['total_qty']
                scrap_rate = comp.get('scrap_rate', 1.0) / 100
                actual_qty = planned_qty * (1 + scrap_rate + random.uniform(-0.02, 0.05))

                consumption = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'consumption_no': f"CON-{current_date.strftime('%Y%m%d')}-{random.randint(10000, 99999)}",
                    'production_order_id': result['production_order_id'],
                    'lot_no': result['lot_no'],
                    'product_code': result['product_code'],
                    'line_code': result['line_code'],
                    'material_code': comp['component_code'],
                    'consumption_datetime': result['end_time'],
                    'consumption_type': 'backflush',
                    'planned_qty': round(planned_qty, 4),
                    'actual_qty': round(actual_qty, 4),
                    'unit': comp['unit'],
                    'variance_qty': round(actual_qty - planned_qty, 4),
                    'operation_no': comp.get('operation_no', 30),
                    'created_at': datetime.now()
                }

                self.data['material_consumption'].append(consumption)

    def _generate_interface_data(self, current_date: date):
        """Generate ERP-MES interface data"""
        # Work Order Interface (ERP → MES)
        today_work_orders = [wo for wo in self.data['work_orders']
                           if wo['plan_start_date'] == current_date]

        for wo in today_work_orders:
            interface = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'interface_no': f"IF-WO-{current_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                'interface_type': 'CREATE',
                'interface_datetime': datetime.combine(current_date, datetime.min.time()),
                'status': 'completed',
                'erp_work_order_no': wo['work_order_no'],
                'material_code': wo['material_code'],
                'order_qty': wo['order_qty'],
                'unit': wo['unit'],
                'plan_start_date': wo['plan_start_date'],
                'plan_end_date': wo['plan_end_date'],
                'target_line_code': wo['target_line_code'],
                'created_at': datetime.now()
            }

            self.data['erp_mes_work_order_if'].append(interface)

        # Production Result Interface (MES → ERP)
        today_results = [r for r in self.data['production_results']
                        if r['production_date'] == current_date]

        for result in today_results:
            # Find work order
            prod_order = next((po for po in self.data['production_orders']
                              if po['id'] == result['production_order_id']), None)

            if not prod_order:
                continue

            interface = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'interface_no': f"IF-PR-{current_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                'interface_datetime': datetime.now(),
                'status': 'pending',
                'mes_production_order_id': result['production_order_id'],
                'erp_work_order_no': prod_order.get('erp_work_order_no', ''),
                'material_code': result['product_code'],
                'production_date': result['production_date'],
                'shift': result['shift'],
                'line_code': result['line_code'],
                'good_qty': result['good_qty'],
                'defect_qty': result['defect_qty'],
                'scrap_qty': 0,
                'unit': result['unit'],
                'lot_no': result['lot_no'],
                'created_at': datetime.now()
            }

            self.data['mes_erp_production_if'].append(interface)


if __name__ == "__main__":
    import os

    # Get paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, '..', '..', 'config', 'company.yaml')

    # First generate master data
    from generators.master.master_generator import MasterDataGenerator

    print("Generating master data first...")
    master_gen = MasterDataGenerator(config_path)
    master_data = master_gen.generate_all()

    print("\nGenerating transaction data...")
    tx_gen = TransactionDataGenerator(config_path, master_data)
    tx_data = tx_gen.generate_all()

    print("\nTransaction Data Summary:")
    for key, value in tx_data.items():
        if value:
            print(f"  {key}: {len(value)} records")
