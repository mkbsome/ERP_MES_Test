"""
ERP Inventory Data Generator
Generates inventory transactions, stock levels, and warehouse data
Supports AI use case scenarios for inventory management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot
from generators.core.scenario_manager import ScenarioManager


class MovementType(Enum):
    GOODS_RECEIPT = "GR"  # 입고
    GOODS_ISSUE = "GI"  # 출고
    TRANSFER = "TR"  # 이동
    ADJUSTMENT_PLUS = "A+"  # 조정(+)
    ADJUSTMENT_MINUS = "A-"  # 조정(-)
    PRODUCTION_RECEIPT = "PR"  # 생산입고
    SCRAP = "SC"  # 폐기
    RETURN = "RT"  # 반품


class StockType(Enum):
    UNRESTRICTED = "unrestricted"  # 사용가능
    QUALITY_INSPECTION = "quality"  # 품질검사중
    BLOCKED = "blocked"  # 사용중지
    RESERVED = "reserved"  # 예약


@dataclass
class StockLevel:
    """Stock level tracking"""
    material_code: str
    warehouse_code: str
    location: str
    unrestricted_qty: float = 0
    quality_qty: float = 0
    blocked_qty: float = 0
    reserved_qty: float = 0

    @property
    def total_qty(self) -> float:
        return self.unrestricted_qty + self.quality_qty + self.blocked_qty

    @property
    def available_qty(self) -> float:
        return self.unrestricted_qty - self.reserved_qty


class InventoryDataGenerator:
    """
    ERP Inventory Data Generator

    Generates:
    - Inventory transactions (재고 이동)
    - Stock levels (재고 수준)
    - Stock counts (재고 실사)
    - Inventory alerts (재고 알림)

    AI Use Cases:
    - CHECK: 재고 현황
    - TREND: 재고 추이
    - PREDICT: 재고 소진 예측
    - DETECT_ANOMALY: 재고 이상 감지
    - WHAT_IF: 재고 시뮬레이션
    """

    WAREHOUSES = {
        'WH-RM': '원자재 창고',
        'WH-WIP': '재공품 창고',
        'WH-FG': '완제품 창고',
        'WH-QA': '품질검사 창고'
    }

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

        self.materials = master_data.get('materials', [])
        self.products = company_profile.get('products', [])

        # Stock tracking
        self.stock_levels: Dict[str, StockLevel] = {}
        self._initialize_stock()

        # Generated data
        self.data = {
            'inventory_transactions': [],
            'stock_snapshots': [],
            'stock_counts': [],
            'inventory_alerts': [],
            'reservation_records': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def _get_stock_key(self, material_code: str, warehouse_code: str) -> str:
        return f"{material_code}_{warehouse_code}"

    def _initialize_stock(self) -> None:
        """Initialize stock levels with random quantities"""
        # Initialize raw materials
        for material in self.materials:
            mat_code = material.get('material_code')
            if not mat_code:
                continue

            key = self._get_stock_key(mat_code, 'WH-RM')
            safety_stock = material.get('safety_stock', 1000)

            self.stock_levels[key] = StockLevel(
                material_code=mat_code,
                warehouse_code='WH-RM',
                location=f"RM-{random.randint(1, 50):02d}-{random.randint(1, 10):02d}",
                unrestricted_qty=safety_stock * random.uniform(1.5, 3.0)
            )

        # Initialize finished goods
        for product in self.products:
            mat_code = product.get('material_code')
            if not mat_code:
                continue

            key = self._get_stock_key(mat_code, 'WH-FG')
            self.stock_levels[key] = StockLevel(
                material_code=mat_code,
                warehouse_code='WH-FG',
                location=f"FG-{random.randint(1, 20):02d}-{random.randint(1, 10):02d}",
                unrestricted_qty=random.randint(100, 1000)
            )

    def generate_inventory_transaction(
        self,
        time_slot: TimeSlot,
        material_code: str,
        warehouse_code: str,
        movement_type: MovementType,
        qty: float,
        reference_doc: str = '',
        lot_no: str = '',
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate an inventory transaction"""
        context = context or {}
        scenario_data = self._apply_inventory_scenarios(time_slot, context)

        key = self._get_stock_key(material_code, warehouse_code)
        stock = self.stock_levels.get(key)

        if not stock:
            stock = StockLevel(
                material_code=material_code,
                warehouse_code=warehouse_code,
                location=f"{warehouse_code[:2]}-{random.randint(1, 50):02d}-{random.randint(1, 10):02d}"
            )
            self.stock_levels[key] = stock

        # Calculate before/after quantities
        qty_before = stock.unrestricted_qty

        # Apply movement
        if movement_type in [MovementType.GOODS_RECEIPT, MovementType.PRODUCTION_RECEIPT,
                            MovementType.ADJUSTMENT_PLUS, MovementType.RETURN]:
            stock.unrestricted_qty += qty
            qty_sign = qty
        else:
            stock.unrestricted_qty = max(0, stock.unrestricted_qty - qty)
            qty_sign = -qty

        qty_after = stock.unrestricted_qty

        transaction = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'transaction_no': f"IT-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'transaction_date': time_slot.date,
            'transaction_datetime': time_slot.timestamp,
            'material_code': material_code,
            'warehouse_code': warehouse_code,
            'location': stock.location,
            'movement_type': movement_type.value,
            'movement_name': self._get_movement_name(movement_type),
            'qty': qty_sign,
            'unit': 'EA',
            'qty_before': qty_before,
            'qty_after': qty_after,
            'lot_no': lot_no or f"L{time_slot.date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
            'reference_doc': reference_doc,
            'cost_center': f"CC{random.randint(100, 999)}",
            'operator_id': f"WH{random.randint(1, 20):03d}",
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['inventory_transactions'].append(transaction)

        # Check for low stock alert
        material = next((m for m in self.materials if m.get('material_code') == material_code), None)
        if material:
            safety_stock = material.get('safety_stock', 0)
            if qty_after < safety_stock:
                self._generate_inventory_alert(
                    time_slot, material_code, warehouse_code,
                    'LOW_STOCK', f"재고 {qty_after}EA - 안전재고({safety_stock}EA) 미달"
                )

        return transaction

    def generate_stock_snapshot(
        self,
        time_slot: TimeSlot
    ) -> List[Dict[str, Any]]:
        """Generate daily stock snapshot"""
        snapshots = []

        for key, stock in self.stock_levels.items():
            snapshot = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'snapshot_date': time_slot.date,
                'material_code': stock.material_code,
                'warehouse_code': stock.warehouse_code,
                'location': stock.location,
                'unrestricted_qty': stock.unrestricted_qty,
                'quality_qty': stock.quality_qty,
                'blocked_qty': stock.blocked_qty,
                'reserved_qty': stock.reserved_qty,
                'total_qty': stock.total_qty,
                'available_qty': stock.available_qty,
                'unit': 'EA',
                'valuation_price': random.uniform(10, 1000),
                'valuation_amount': stock.total_qty * random.uniform(10, 1000),
                'created_at': datetime.now()
            }

            snapshots.append(snapshot)

        self.data['stock_snapshots'].extend(snapshots)
        return snapshots

    def generate_stock_count(
        self,
        time_slot: TimeSlot,
        warehouse_code: str,
        count_type: str = 'cycle'  # cycle, annual, spot
    ) -> Dict[str, Any]:
        """Generate stock count/inventory audit"""
        count_id = str(uuid.uuid4())
        count_no = f"SC-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        # Get stocks in warehouse
        warehouse_stocks = [s for s in self.stock_levels.values()
                          if s.warehouse_code == warehouse_code]

        count_lines = []
        total_variance = 0
        variance_value = 0

        for stock in warehouse_stocks[:random.randint(10, 50)]:
            system_qty = stock.unrestricted_qty

            # Simulate count variance (usually small)
            variance_pct = random.gauss(0, 0.02)  # ~2% standard deviation
            physical_qty = max(0, system_qty * (1 + variance_pct))
            variance_qty = physical_qty - system_qty

            line = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'count_id': count_id,
                'material_code': stock.material_code,
                'location': stock.location,
                'system_qty': system_qty,
                'physical_qty': round(physical_qty),
                'variance_qty': round(variance_qty),
                'variance_pct': round(variance_pct * 100, 2),
                'unit': 'EA',
                'unit_cost': random.uniform(10, 1000),
                'variance_value': round(variance_qty * random.uniform(10, 1000), 2),
                'count_by': f"WH{random.randint(1, 20):03d}",
                'count_datetime': time_slot.timestamp,
                'status': 'counted'
            }

            count_lines.append(line)
            total_variance += abs(variance_qty)
            variance_value += abs(line['variance_value'])

        count = {
            'id': count_id,
            'tenant_id': self.tenant_id,
            'count_no': count_no,
            'warehouse_code': warehouse_code,
            'count_type': count_type,
            'count_date': time_slot.date,
            'total_items': len(count_lines),
            'counted_items': len(count_lines),
            'variance_items': sum(1 for l in count_lines if l['variance_qty'] != 0),
            'total_variance_qty': round(total_variance),
            'total_variance_value': round(variance_value, 2),
            'accuracy_rate': round((1 - total_variance / sum(l['system_qty'] for l in count_lines if l['system_qty'] > 0)) * 100, 2) if count_lines else 100,
            'status': 'completed',
            'approved_by': f"MGR{random.randint(1, 5):03d}",
            'approved_at': time_slot.timestamp + timedelta(hours=2),
            'created_at': datetime.now(),
            'lines': count_lines
        }

        self.data['stock_counts'].append(count)
        return count

    def generate_reservation(
        self,
        time_slot: TimeSlot,
        material_code: str,
        warehouse_code: str,
        qty: float,
        reference_doc: str,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate stock reservation"""
        key = self._get_stock_key(material_code, warehouse_code)
        stock = self.stock_levels.get(key)

        if not stock or stock.available_qty < qty:
            # Insufficient stock
            return None

        stock.reserved_qty += qty

        reservation = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'reservation_no': f"RSV-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'material_code': material_code,
            'warehouse_code': warehouse_code,
            'reserved_qty': qty,
            'unit': 'EA',
            'reference_doc': reference_doc,
            'reservation_date': time_slot.date,
            'required_date': time_slot.date + timedelta(days=random.randint(1, 7)),
            'status': 'active',
            'created_at': datetime.now()
        }

        self.data['reservation_records'].append(reservation)
        return reservation

    def _generate_inventory_alert(
        self,
        time_slot: TimeSlot,
        material_code: str,
        warehouse_code: str,
        alert_type: str,
        message: str
    ) -> Dict[str, Any]:
        """Generate inventory alert"""
        severity_map = {
            'LOW_STOCK': 'high',
            'STOCKOUT': 'critical',
            'EXCESS_STOCK': 'medium',
            'EXPIRING': 'medium',
            'VARIANCE': 'medium',
            'SLOW_MOVING': 'low'
        }

        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'alert_no': f"IAL-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': severity_map.get(alert_type, 'medium'),
            'alert_datetime': time_slot.timestamp,
            'material_code': material_code,
            'warehouse_code': warehouse_code,
            'message': message,
            'status': 'active',
            'acknowledged': False,
            'created_at': datetime.now()
        }

        self.data['inventory_alerts'].append(alert)
        return alert

    def _get_movement_name(self, movement_type: MovementType) -> str:
        """Get movement type name"""
        names = {
            MovementType.GOODS_RECEIPT: '입고',
            MovementType.GOODS_ISSUE: '출고',
            MovementType.TRANSFER: '이동',
            MovementType.ADJUSTMENT_PLUS: '조정(+)',
            MovementType.ADJUSTMENT_MINUS: '조정(-)',
            MovementType.PRODUCTION_RECEIPT: '생산입고',
            MovementType.SCRAP: '폐기',
            MovementType.RETURN: '반품'
        }
        return names.get(movement_type, '')

    def _apply_inventory_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to inventory parameters"""
        result = {
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context
        )

        for scenario in active_scenarios:
            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def process_goods_receipts(
        self,
        time_slot: TimeSlot,
        receipt_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Process goods receipts into inventory"""
        transactions = []

        for receipt in receipt_data:
            for line in receipt.get('lines', []):
                tx = self.generate_inventory_transaction(
                    time_slot,
                    line['material_code'],
                    receipt.get('warehouse_code', 'WH-RM'),
                    MovementType.GOODS_RECEIPT,
                    line['received_qty'],
                    reference_doc=receipt['gr_no'],
                    lot_no=line.get('lot_no', '')
                )
                transactions.append(tx)

        return transactions

    def process_goods_issues(
        self,
        time_slot: TimeSlot,
        issue_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Process goods issues from inventory"""
        transactions = []

        for issue in issue_data:
            tx = self.generate_inventory_transaction(
                time_slot,
                issue['material_code'],
                issue.get('warehouse_code', 'WH-RM'),
                MovementType.GOODS_ISSUE,
                issue['qty'],
                reference_doc=issue.get('reference_doc', ''),
                lot_no=issue.get('lot_no', '')
            )
            transactions.append(tx)

        return transactions

    def process_production_receipts(
        self,
        time_slot: TimeSlot,
        production_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Process production completions into inventory"""
        transactions = []

        for prod in production_data:
            tx = self.generate_inventory_transaction(
                time_slot,
                prod['product_code'],
                'WH-FG',
                MovementType.PRODUCTION_RECEIPT,
                prod['good_qty'],
                reference_doc=prod.get('production_order_no', ''),
                lot_no=prod.get('lot_no', '')
            )
            transactions.append(tx)

        return transactions

    def get_stock_level(self, material_code: str, warehouse_code: str) -> Optional[StockLevel]:
        """Get current stock level"""
        key = self._get_stock_key(material_code, warehouse_code)
        return self.stock_levels.get(key)

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_stock_value = sum(
            s.unrestricted_qty * 100  # Simplified valuation
            for s in self.stock_levels.values()
        )

        return {
            'total_transactions': len(self.data['inventory_transactions']),
            'total_snapshots': len(self.data['stock_snapshots']),
            'total_stock_counts': len(self.data['stock_counts']),
            'total_alerts': len(self.data['inventory_alerts']),
            'total_reservations': len(self.data['reservation_records']),
            'unique_materials': len(self.stock_levels),
            'estimated_stock_value': round(total_stock_value, 2)
        }
