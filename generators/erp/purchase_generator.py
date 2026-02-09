"""
ERP Purchase Data Generator
Generates purchase orders, receipts, and vendor data
Supports AI use case scenarios for purchase management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot
from generators.core.scenario_manager import ScenarioManager


class POStatus(Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    ORDERED = "ordered"
    PARTIAL = "partial"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class ReceiptStatus(Enum):
    PENDING = "pending"
    INSPECTING = "inspecting"
    PASSED = "passed"
    REJECTED = "rejected"
    POSTED = "posted"


class PurchaseDataGenerator:
    """
    ERP Purchase Data Generator

    Generates:
    - Purchase orders (발주)
    - Goods receipts (입고)
    - Vendor evaluations (공급업체 평가)
    - Purchase invoices (매입)

    AI Use Cases:
    - CHECK: 발주/입고 현황
    - TREND: 구매 트렌드
    - COMPARE: 공급업체 비교
    - RANK: 공급업체 순위
    - PREDICT: 납기 예측
    - DETECT_ANOMALY: 납기 지연 감지
    """

    def __init__(
        self,
        time_manager: TimeManager,
        scenario_manager: ScenarioManager,
        company_profile: Dict[str, Any],
        master_data: Dict[str, Any],
        tenant_id: str,
        random_seed: int = 42
    ):
        self.time_manager = time_manager
        self.scenario_manager = scenario_manager
        self.company_profile = company_profile
        self.master_data = master_data
        self.tenant_id = tenant_id

        random.seed(random_seed)
        np.random.seed(random_seed)

        self.vendors = master_data.get('vendors', company_profile.get('vendors', []))
        self.materials = master_data.get('materials', [])

        # Generated data
        self.data = {
            'purchase_orders': [],
            'purchase_order_lines': [],
            'goods_receipts': [],
            'goods_receipt_lines': [],
            'purchase_invoices': [],
            'vendor_evaluations': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_purchase_order(
        self,
        time_slot: TimeSlot,
        material_requirements: Optional[List[Dict[str, Any]]] = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate a purchase order"""
        context = context or {}
        scenario_data = self._apply_purchase_scenarios(time_slot, context)

        # Select vendor
        material_vendors = [v for v in self.vendors if v.get('vendor_type') == 'material']
        if not material_vendors:
            material_vendors = self.vendors
        vendor = random.choice(material_vendors)

        lead_time = vendor.get('lead_time_days', 7)

        # Apply scenario effects on lead time
        if scenario_data.get('lead_time_increase'):
            lead_time += scenario_data['lead_time_increase']

        po_id = str(uuid.uuid4())
        po_no = f"PO-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        po = {
            'id': po_id,
            'tenant_id': self.tenant_id,
            'po_no': po_no,
            'vendor_id': vendor.get('id'),
            'vendor_code': vendor.get('vendor_code'),
            'vendor_name': vendor.get('name'),
            'po_date': time_slot.date,
            'delivery_date': time_slot.date + timedelta(days=lead_time),
            'po_type': 'normal',
            'status': POStatus.ORDERED.value,
            'currency': vendor.get('currency', 'KRW'),
            'exchange_rate': 1.0 if vendor.get('currency', 'KRW') == 'KRW' else random.uniform(1300, 1400),
            'payment_terms': vendor.get('payment_terms', 'NET30'),
            'total_amount': 0,
            'tax_amount': 0,
            'buyer_id': f"BY{random.randint(1, 10):03d}",
            'warehouse_code': 'WH-RM',
            'notes': '',
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.combine(time_slot.date, datetime.min.time())
        }

        # Generate lines
        if material_requirements:
            materials_to_order = material_requirements
        else:
            # Random materials
            materials_to_order = random.sample(
                [m for m in self.materials if m.get('material_type') == 'component'],
                min(random.randint(3, 10), len(self.materials))
            ) if self.materials else []

        total_amount = 0
        lines = []

        for idx, material in enumerate(materials_to_order, 1):
            if isinstance(material, dict):
                mat_code = material.get('material_code', material.get('component_code', ''))
                min_order = material.get('min_order_qty', 1000)
                unit_cost = material.get('standard_cost', material.get('unit_price', 10))
                unit = material.get('unit', 'EA')
            else:
                continue

            qty = min_order * random.randint(1, 5)
            line_amount = qty * unit_cost

            line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'po_id': po_id,
                'line_no': idx * 10,
                'material_code': mat_code,
                'material_name': material.get('name', mat_code),
                'order_qty': qty,
                'received_qty': 0,
                'remaining_qty': qty,
                'unit': unit,
                'unit_price': unit_cost,
                'amount': round(line_amount, 2),
                'delivery_date': po['delivery_date'],
                'status': 'open',
                'created_at': datetime.now()
            }

            lines.append(line)
            total_amount += line_amount

        tax_amount = total_amount * 0.1
        po['total_amount'] = round(total_amount + tax_amount, 2)
        po['tax_amount'] = round(tax_amount, 2)

        self.data['purchase_orders'].append(po)
        self.data['purchase_order_lines'].extend(lines)

        return po

    def generate_goods_receipt(
        self,
        time_slot: TimeSlot,
        purchase_order: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        """Generate goods receipt for a purchase order"""
        context = context or {}
        scenario_data = self._apply_purchase_scenarios(time_slot, context)

        po_lines = [l for l in self.data['purchase_order_lines']
                    if l['po_id'] == purchase_order['id'] and l['remaining_qty'] > 0]

        if not po_lines:
            return None

        gr_id = str(uuid.uuid4())
        gr_no = f"GR-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        gr = {
            'id': gr_id,
            'tenant_id': self.tenant_id,
            'gr_no': gr_no,
            'po_id': purchase_order['id'],
            'po_no': purchase_order['po_no'],
            'vendor_code': purchase_order['vendor_code'],
            'vendor_name': purchase_order['vendor_name'],
            'receipt_date': time_slot.date,
            'warehouse_code': purchase_order['warehouse_code'],
            'total_qty': 0,
            'status': ReceiptStatus.POSTED.value,
            'receiver_id': f"WH{random.randint(1, 10):03d}",
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        total_qty = 0
        gr_lines = []

        # Check for vendor quality issue scenario
        quality_issue = scenario_data.get('vendor_quality_issue', False)
        affected_vendor = scenario_data.get('affected_vendor', '')

        for po_line in po_lines:
            # Determine received quantity
            receive_qty = po_line['remaining_qty']

            # Apply partial delivery scenario
            if scenario_data.get('partial_delivery') and random.random() < 0.3:
                receive_qty = int(receive_qty * random.uniform(0.5, 0.9))

            if receive_qty <= 0:
                continue

            lot_no = f"VL{time_slot.date.strftime('%Y%m%d')}{random.randint(10000, 99999)}"

            # Determine inspection status
            if quality_issue and purchase_order['vendor_code'] == affected_vendor:
                inspection_status = random.choices(
                    ['passed', 'rejected'],
                    weights=[0.7, 0.3]
                )[0]
            else:
                inspection_status = random.choices(
                    ['passed', 'rejected'],
                    weights=[0.98, 0.02]
                )[0]

            gr_line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'gr_id': gr_id,
                'po_line_id': po_line['id'],
                'line_no': po_line['line_no'],
                'material_code': po_line['material_code'],
                'material_name': po_line['material_name'],
                'received_qty': receive_qty,
                'accepted_qty': receive_qty if inspection_status == 'passed' else int(receive_qty * 0.8),
                'rejected_qty': 0 if inspection_status == 'passed' else int(receive_qty * 0.2),
                'unit': po_line['unit'],
                'lot_no': lot_no,
                'vendor_lot_no': f"VND{random.randint(100000, 999999)}",
                'inspection_status': inspection_status,
                'storage_location': f"RM-{random.randint(1, 50):02d}-{random.randint(1, 10):02d}",
                'expiry_date': time_slot.date + timedelta(days=random.randint(180, 365)),
                'created_at': datetime.now()
            }

            gr_lines.append(gr_line)
            total_qty += receive_qty

            # Update PO line
            po_line['received_qty'] += receive_qty
            po_line['remaining_qty'] -= receive_qty
            if po_line['remaining_qty'] <= 0:
                po_line['status'] = 'received'

        if not gr_lines:
            return None

        gr['total_qty'] = total_qty

        self.data['goods_receipts'].append(gr)
        self.data['goods_receipt_lines'].extend(gr_lines)

        # Update PO status
        all_received = all(l['remaining_qty'] <= 0 for l in po_lines)
        if all_received:
            purchase_order['status'] = POStatus.RECEIVED.value
        else:
            purchase_order['status'] = POStatus.PARTIAL.value

        # Generate vendor evaluation
        self._generate_vendor_evaluation(time_slot, purchase_order, gr, gr_lines)

        return gr

    def _generate_vendor_evaluation(
        self,
        time_slot: TimeSlot,
        po: Dict[str, Any],
        gr: Dict[str, Any],
        gr_lines: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate vendor evaluation based on delivery performance"""
        # Calculate metrics
        expected_date = po['delivery_date']
        actual_date = gr['receipt_date']
        delay_days = (actual_date - expected_date).days

        # Quality score
        total_received = sum(l['received_qty'] for l in gr_lines)
        total_rejected = sum(l['rejected_qty'] for l in gr_lines)
        quality_score = ((total_received - total_rejected) / total_received * 100) if total_received > 0 else 100

        # Delivery score
        if delay_days <= 0:
            delivery_score = 100
        elif delay_days <= 3:
            delivery_score = 90
        elif delay_days <= 7:
            delivery_score = 70
        else:
            delivery_score = 50

        # Quantity accuracy
        ordered_qty = sum(l['order_qty'] for l in self.data['purchase_order_lines']
                        if l['po_id'] == po['id'])
        qty_accuracy = (total_received / ordered_qty * 100) if ordered_qty > 0 else 100

        evaluation = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'evaluation_no': f"VE-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'vendor_code': po['vendor_code'],
            'vendor_name': po['vendor_name'],
            'po_no': po['po_no'],
            'gr_no': gr['gr_no'],
            'evaluation_date': time_slot.date,
            'evaluation_period': time_slot.date.strftime('%Y-%m'),
            'quality_score': round(quality_score, 1),
            'delivery_score': round(delivery_score, 1),
            'qty_accuracy_score': round(min(100, qty_accuracy), 1),
            'overall_score': round((quality_score + delivery_score + qty_accuracy) / 3, 1),
            'delay_days': max(0, delay_days),
            'rejection_rate': round(total_rejected / total_received * 100 if total_received > 0 else 0, 2),
            'grade': self._calculate_vendor_grade(quality_score, delivery_score, qty_accuracy),
            'comments': '',
            'created_at': datetime.now()
        }

        self.data['vendor_evaluations'].append(evaluation)
        return evaluation

    def _calculate_vendor_grade(
        self,
        quality: float,
        delivery: float,
        qty_accuracy: float
    ) -> str:
        """Calculate vendor grade"""
        avg = (quality + delivery + qty_accuracy) / 3
        if avg >= 95:
            return 'A'
        elif avg >= 85:
            return 'B'
        elif avg >= 70:
            return 'C'
        else:
            return 'D'

    def _apply_purchase_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to purchase parameters"""
        result = {
            'lead_time_increase': 0,
            'partial_delivery': False,
            'vendor_quality_issue': False,
            'affected_vendor': '',
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            if 'lead_time_increase' in effect.affected_metrics:
                result['lead_time_increase'] = int(effect.affected_metrics['lead_time_increase'])

            if 'partial_delivery' in effect.additional_data:
                result['partial_delivery'] = True

            if 'vendor_quality_issue' in effect.additional_data:
                result['vendor_quality_issue'] = True
                result['affected_vendor'] = effect.additional_data.get('affected_vendor', '')

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def generate_daily_orders(
        self,
        time_slot: TimeSlot,
        num_orders: int = 20
    ) -> List[Dict[str, Any]]:
        """Generate daily purchase orders"""
        orders = []
        context = {}

        for _ in range(random.randint(num_orders - 5, num_orders + 5)):
            po = self.generate_purchase_order(time_slot, context=context)
            orders.append(po)

        return orders

    def process_pending_receipts(
        self,
        time_slot: TimeSlot
    ) -> List[Dict[str, Any]]:
        """Process pending POs for receipt"""
        receipts = []
        context = {}

        # Find POs due for delivery
        due_pos = [
            po for po in self.data['purchase_orders']
            if po['status'] in [POStatus.ORDERED.value, POStatus.PARTIAL.value]
            and po['delivery_date'] <= time_slot.date
        ]

        for po in due_pos[:random.randint(5, 15)]:
            gr = self.generate_goods_receipt(time_slot, po, context)
            if gr:
                receipts.append(gr)

        return receipts

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_amount = sum(po['total_amount'] for po in self.data['purchase_orders'])
        avg_eval_score = np.mean([e['overall_score'] for e in self.data['vendor_evaluations']]) if self.data['vendor_evaluations'] else 0

        return {
            'total_purchase_orders': len(self.data['purchase_orders']),
            'total_po_lines': len(self.data['purchase_order_lines']),
            'total_goods_receipts': len(self.data['goods_receipts']),
            'total_purchase_amount': round(total_amount, 2),
            'total_evaluations': len(self.data['vendor_evaluations']),
            'average_vendor_score': round(avg_eval_score, 1)
        }
