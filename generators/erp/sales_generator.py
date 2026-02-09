"""
ERP Sales Data Generator
Generates sales orders, shipments, and revenue data
Supports AI use case scenarios for sales management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Generator
from dataclasses import dataclass
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot
from generators.core.scenario_manager import ScenarioManager, AIUseCase


class OrderType(Enum):
    NORMAL = "normal"
    URGENT = "urgent"
    SAMPLE = "sample"
    BLANKET = "blanket"


class OrderStatus(Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    INVOICED = "invoiced"
    CANCELLED = "cancelled"


class SalesDataGenerator:
    """
    ERP Sales Data Generator

    Generates:
    - Sales orders (수주)
    - Order lines (수주 라인)
    - Shipments (출하)
    - Sales invoices (매출)
    - Customer claims (클레임)

    AI Use Cases:
    - CHECK: 수주/매출 현황
    - TREND: 매출 트렌드
    - COMPARE: 고객/제품별 비교
    - RANK: 매출 순위
    - PREDICT: 수요 예측
    - DETECT_ANOMALY: 수주 이상 감지
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

        self.customers = master_data.get('customers', [])
        self.products = company_profile.get('products', [])

        # Generated data storage
        self.data = {
            'sales_orders': [],
            'sales_order_lines': [],
            'shipments': [],
            'shipment_lines': [],
            'sales_invoices': [],
            'invoice_lines': [],
            'customer_claims': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_sales_order(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a single sales order"""
        scenario_data = self._apply_sales_scenarios(time_slot, context)

        # Select customer
        customer = random.choice(self.customers)

        # Determine order type
        if scenario_data.get('urgent_order_increase'):
            order_type = random.choices(
                [OrderType.NORMAL, OrderType.URGENT, OrderType.SAMPLE],
                weights=[0.5, 0.4, 0.1]
            )[0]
        else:
            order_type = random.choices(
                [OrderType.NORMAL, OrderType.URGENT, OrderType.SAMPLE],
                weights=[0.8, 0.15, 0.05]
            )[0]

        # Calculate dates
        lead_time = 7 if order_type == OrderType.NORMAL else 3
        requested_date = time_slot.date + timedelta(days=random.randint(lead_time, lead_time + 14))

        order_id = str(uuid.uuid4())
        order_no = f"SO-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        order = {
            'id': order_id,
            'tenant_id': self.tenant_id,
            'order_no': order_no,
            'customer_id': customer.get('id'),
            'customer_code': customer.get('customer_code'),
            'customer_name': customer.get('name'),
            'order_date': time_slot.date,
            'requested_date': requested_date,
            'order_type': order_type.value,
            'status': OrderStatus.CONFIRMED.value,
            'currency': customer.get('currency', 'KRW'),
            'exchange_rate': 1.0 if customer.get('currency', 'KRW') == 'KRW' else random.uniform(1300, 1400),
            'payment_terms': customer.get('payment_terms', 'NET30'),
            'shipping_method': random.choice(['택배', '직송', '화물']),
            'total_amount': 0,
            'total_amount_local': 0,
            'tax_amount': 0,
            'discount_amount': 0,
            'sales_rep_id': f"SR{random.randint(1, 20):03d}",
            'notes': '',
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.combine(time_slot.date, datetime.min.time()),
            'updated_at': datetime.combine(time_slot.date, datetime.min.time())
        }

        # Generate order lines
        num_lines = random.randint(1, 5)
        total_amount = 0
        lines = []

        for line_no in range(1, num_lines + 1):
            product = random.choice(self.products)

            # Apply demand scenario
            base_qty = random.choice([100, 200, 300, 500, 1000, 2000])
            demand_factor = scenario_data.get('demand_factor', 1.0)
            qty = int(base_qty * demand_factor * random.uniform(0.8, 1.2))

            unit_price = product.get('standard_cost', 50000) * random.uniform(1.1, 1.5)
            discount_rate = random.choice([0, 0, 0, 0.03, 0.05, 0.1])
            line_amount = qty * unit_price * (1 - discount_rate)

            line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'order_id': order_id,
                'line_no': line_no * 10,
                'product_id': product.get('id'),
                'material_code': product.get('material_code'),
                'product_name': product.get('name'),
                'order_qty': qty,
                'shipped_qty': 0,
                'remaining_qty': qty,
                'unit': 'EA',
                'unit_price': round(unit_price, 2),
                'discount_rate': discount_rate,
                'amount': round(line_amount, 2),
                'requested_date': requested_date,
                'confirmed_date': None,
                'status': 'open',
                'created_at': datetime.now()
            }

            lines.append(line)
            total_amount += line_amount

        # Update order totals
        tax_amount = total_amount * 0.1
        order['total_amount'] = round(total_amount + tax_amount, 2)
        order['total_amount_local'] = round(order['total_amount'] * order['exchange_rate'], 2)
        order['tax_amount'] = round(tax_amount, 2)

        self.data['sales_orders'].append(order)
        self.data['sales_order_lines'].extend(lines)

        # Check for demand surge alert
        if scenario_data.get('demand_surge'):
            self._generate_demand_alert(time_slot, order, 'DEMAND_SURGE')

        return order

    def generate_shipment(
        self,
        time_slot: TimeSlot,
        sales_order: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate shipment for a sales order"""
        order_lines = [l for l in self.data['sales_order_lines']
                       if l['order_id'] == sales_order['id'] and l['remaining_qty'] > 0]

        if not order_lines:
            return None

        scenario_data = self._apply_sales_scenarios(time_slot, context)

        shipment_id = str(uuid.uuid4())
        shipment_no = f"SH-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        shipment = {
            'id': shipment_id,
            'tenant_id': self.tenant_id,
            'shipment_no': shipment_no,
            'order_id': sales_order['id'],
            'order_no': sales_order['order_no'],
            'customer_code': sales_order['customer_code'],
            'customer_name': sales_order['customer_name'],
            'shipment_date': time_slot.date,
            'delivery_date': time_slot.date + timedelta(days=random.randint(1, 3)),
            'shipping_method': sales_order['shipping_method'],
            'tracking_no': f"TRK{random.randint(1000000000, 9999999999)}",
            'total_qty': 0,
            'total_weight_kg': 0,
            'status': 'shipped',
            'shipped_by': f"WH{random.randint(1, 10):03d}",
            'created_at': datetime.now()
        }

        total_qty = 0
        total_weight = 0
        shipment_lines = []

        for line in order_lines:
            # Determine ship quantity (may be partial)
            ship_qty = line['remaining_qty']

            # Apply delivery delay scenario
            if scenario_data.get('delivery_delay') and random.random() < 0.3:
                ship_qty = int(ship_qty * 0.7)  # Partial shipment

            if ship_qty <= 0:
                continue

            shipment_line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'shipment_id': shipment_id,
                'order_line_id': line['id'],
                'line_no': line['line_no'],
                'material_code': line['material_code'],
                'product_name': line['product_name'],
                'shipped_qty': ship_qty,
                'unit': line['unit'],
                'lot_no': f"L{time_slot.date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                'weight_kg': round(ship_qty * 0.01, 2),  # Assume 10g per unit
                'created_at': datetime.now()
            }

            shipment_lines.append(shipment_line)
            total_qty += ship_qty
            total_weight += shipment_line['weight_kg']

            # Update order line
            line['shipped_qty'] += ship_qty
            line['remaining_qty'] -= ship_qty
            if line['remaining_qty'] <= 0:
                line['status'] = 'shipped'

        if not shipment_lines:
            return None

        shipment['total_qty'] = total_qty
        shipment['total_weight_kg'] = round(total_weight, 2)

        self.data['shipments'].append(shipment)
        self.data['shipment_lines'].extend(shipment_lines)

        # Update order status
        remaining = sum(l['remaining_qty'] for l in order_lines)
        if remaining <= 0:
            sales_order['status'] = OrderStatus.SHIPPED.value

        return shipment

    def generate_invoice(
        self,
        time_slot: TimeSlot,
        shipment: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate sales invoice for shipment"""
        order = next((o for o in self.data['sales_orders']
                      if o['id'] == shipment['order_id']), None)

        if not order:
            return None

        shipment_lines = [l for l in self.data['shipment_lines']
                          if l['shipment_id'] == shipment['id']]

        invoice_id = str(uuid.uuid4())
        invoice_no = f"INV-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        # Calculate amounts
        total_amount = 0
        invoice_lines = []

        for ship_line in shipment_lines:
            order_line = next((l for l in self.data['sales_order_lines']
                              if l['id'] == ship_line['order_line_id']), None)
            if not order_line:
                continue

            line_amount = ship_line['shipped_qty'] * order_line['unit_price'] * (1 - order_line['discount_rate'])

            inv_line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'invoice_id': invoice_id,
                'shipment_line_id': ship_line['id'],
                'line_no': ship_line['line_no'],
                'material_code': ship_line['material_code'],
                'product_name': ship_line['product_name'],
                'qty': ship_line['shipped_qty'],
                'unit': ship_line['unit'],
                'unit_price': order_line['unit_price'],
                'discount_rate': order_line['discount_rate'],
                'amount': round(line_amount, 2),
                'created_at': datetime.now()
            }

            invoice_lines.append(inv_line)
            total_amount += line_amount

        tax_amount = total_amount * 0.1

        invoice = {
            'id': invoice_id,
            'tenant_id': self.tenant_id,
            'invoice_no': invoice_no,
            'order_id': order['id'],
            'order_no': order['order_no'],
            'shipment_id': shipment['id'],
            'shipment_no': shipment['shipment_no'],
            'customer_code': order['customer_code'],
            'customer_name': order['customer_name'],
            'invoice_date': time_slot.date,
            'due_date': time_slot.date + timedelta(days=30),  # NET30
            'currency': order['currency'],
            'exchange_rate': order['exchange_rate'],
            'subtotal': round(total_amount, 2),
            'tax_amount': round(tax_amount, 2),
            'total_amount': round(total_amount + tax_amount, 2),
            'paid_amount': 0,
            'status': 'issued',
            'payment_status': 'unpaid',
            'created_at': datetime.now()
        }

        self.data['sales_invoices'].append(invoice)
        self.data['invoice_lines'].extend(invoice_lines)

        # Update order status
        order['status'] = OrderStatus.INVOICED.value

        return invoice

    def generate_customer_claim(
        self,
        time_slot: TimeSlot,
        shipment: Dict[str, Any],
        claim_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate customer claim/return"""
        shipment_lines = [l for l in self.data['shipment_lines']
                          if l['shipment_id'] == shipment['id']]

        claim_line = random.choice(shipment_lines) if shipment_lines else None

        claim = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'claim_no': f"CLM-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'shipment_id': shipment['id'],
            'shipment_no': shipment['shipment_no'],
            'customer_code': shipment['customer_code'],
            'customer_name': shipment['customer_name'],
            'claim_date': time_slot.date,
            'claim_type': claim_type,  # quality, shortage, damage, wrong_item
            'material_code': claim_line['material_code'] if claim_line else '',
            'claimed_qty': random.randint(1, 50),
            'unit': 'EA',
            'description': self._get_claim_description(claim_type),
            'status': 'open',
            'resolution': None,
            'resolution_date': None,
            'credit_amount': 0,
            'created_at': datetime.now()
        }

        self.data['customer_claims'].append(claim)
        return claim

    def _generate_demand_alert(
        self,
        time_slot: TimeSlot,
        order: Dict[str, Any],
        alert_type: str
    ) -> None:
        """Generate demand-related alert (would integrate with notification system)"""
        # This would typically create an alert in the system
        pass

    def _get_claim_description(self, claim_type: str) -> str:
        """Get claim description by type"""
        descriptions = {
            'quality': '품질 불량으로 인한 반품 요청',
            'shortage': '수량 부족 클레임',
            'damage': '운송 중 파손',
            'wrong_item': '오배송'
        }
        return descriptions.get(claim_type, '기타 클레임')

    def _apply_sales_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to sales parameters"""
        result = {
            'demand_factor': 1.0,
            'demand_surge': False,
            'urgent_order_increase': False,
            'delivery_delay': False,
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            if 'demand_increase' in effect.affected_metrics:
                result['demand_factor'] *= (1 + effect.affected_metrics['demand_increase'])
                result['demand_surge'] = True

            if 'urgent_order_rate' in effect.affected_metrics:
                result['urgent_order_increase'] = True

            if 'delivery_delay' in effect.additional_data:
                result['delivery_delay'] = True

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def generate_daily_orders(
        self,
        time_slot: TimeSlot,
        num_orders: int = 30
    ) -> List[Dict[str, Any]]:
        """Generate daily sales orders"""
        orders = []
        context = {'environment': {}}

        for _ in range(random.randint(num_orders - 10, num_orders + 10)):
            order = self.generate_sales_order(time_slot, context)
            orders.append(order)

        return orders

    def process_pending_shipments(
        self,
        time_slot: TimeSlot
    ) -> List[Dict[str, Any]]:
        """Process pending orders for shipment"""
        shipments = []
        context = {'environment': {}}

        # Find orders ready for shipment
        ready_orders = [
            o for o in self.data['sales_orders']
            if o['status'] in [OrderStatus.CONFIRMED.value, OrderStatus.IN_PRODUCTION.value]
            and o['requested_date'] <= time_slot.date + timedelta(days=3)
        ]

        for order in ready_orders[:random.randint(5, 15)]:
            shipment = self.generate_shipment(time_slot, order, context)
            if shipment:
                shipments.append(shipment)

                # Generate invoice
                self.generate_invoice(time_slot, shipment, context)

        return shipments

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_revenue = sum(i['total_amount'] for i in self.data['sales_invoices'])

        return {
            'total_orders': len(self.data['sales_orders']),
            'total_order_lines': len(self.data['sales_order_lines']),
            'total_shipments': len(self.data['shipments']),
            'total_invoices': len(self.data['sales_invoices']),
            'total_revenue': round(total_revenue, 2),
            'total_claims': len(self.data['customer_claims']),
            'average_order_value': round(total_revenue / len(self.data['sales_invoices']), 2) if self.data['sales_invoices'] else 0
        }
