"""
MES Production Data Generator
Generates production orders, results, and real-time production data
Supports AI use case scenarios for production management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Generator
from dataclasses import dataclass, field
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot, ShiftType
from generators.core.scenario_manager import ScenarioManager, AIUseCase


@dataclass
class ProductionState:
    """State tracking for production orders"""
    order_id: str
    product_code: str
    line_code: str
    lot_no: str
    order_qty: int
    good_qty: int = 0
    defect_qty: int = 0
    status: str = 'scheduled'
    start_time: Optional[datetime] = None
    cycle_time_seconds: float = 45.0
    target_rate_per_hour: int = 80


@dataclass
class ProductionResult:
    """Single production result record"""
    id: str
    production_order_id: str
    lot_no: str
    product_code: str
    line_code: str
    production_date: date
    shift: str
    hour: int
    good_qty: int
    defect_qty: int
    total_qty: int
    cycle_time_avg: float
    start_time: datetime
    end_time: datetime
    status: str = 'confirmed'


class ProductionDataGenerator:
    """
    MES Production Data Generator

    Generates:
    - Production orders (작업지시)
    - Production results (생산실적)
    - Real-time production data (실시간 생산현황)

    AI Use Cases:
    - CHECK: 현재 생산현황 조회
    - TREND: 생산량 트렌드 분석
    - COMPARE: 라인별/교대별 생산성 비교
    - DETECT_ANOMALY: 생산량 이상 감지
    - PREDICT: 생산 완료 예측
    """

    def __init__(
        self,
        time_manager: TimeManager,
        scenario_manager: ScenarioManager,
        company_profile: Dict[str, Any],
        tenant_id: str,
        random_seed: int = 42
    ):
        self.time_manager = time_manager
        self.scenario_manager = scenario_manager
        self.company_profile = company_profile
        self.tenant_id = tenant_id

        # Initialize random seeds
        random.seed(random_seed)
        np.random.seed(random_seed)

        # Extract configurations
        self.factories = company_profile.get('factories', [])
        self.products = company_profile.get('products', [])
        self.shifts = company_profile.get('shifts', [])

        # State tracking
        self.production_orders: Dict[str, ProductionState] = {}
        self.sequence_counter = 10000

        # Generated data storage
        self.data = {
            'production_orders': [],
            'production_results': [],
            'realtime_production': [],
            'production_order_operations': []
        }

    def _get_next_sequence(self) -> str:
        """Get next sequence number"""
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_production_order(
        self,
        time_slot: TimeSlot,
        line: Dict[str, Any],
        product: Dict[str, Any],
        order_qty: int,
        erp_work_order_no: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a single production order"""
        order_id = str(uuid.uuid4())
        date_str = time_slot.date.strftime('%Y%m%d')

        order_no = f"MO-{date_str}-{self._get_next_sequence()}"
        lot_no = f"L{date_str}{self._get_next_sequence()}"

        # Calculate plan dates based on capacity
        capacity_per_hour = line.get('capacity_per_hour', 3000)
        hours_needed = max(1, order_qty // capacity_per_hour)
        plan_end_date = time_slot.date + timedelta(days=(hours_needed // 24) + 1)

        order = {
            'id': order_id,
            'tenant_id': self.tenant_id,
            'production_order_no': order_no,
            'erp_work_order_no': erp_work_order_no or f"WO-{date_str}-{self._get_next_sequence()}",
            'product_code': product['material_code'],
            'product_name': product['name'],
            'order_qty': order_qty,
            'good_qty': 0,
            'defect_qty': 0,
            'unit': 'EA',
            'line_code': line['line_code'],
            'factory_code': line.get('factory_code', 'P1'),
            'lot_no': lot_no,
            'priority': random.randint(1, 10),
            'plan_start_date': time_slot.date,
            'plan_end_date': plan_end_date,
            'actual_start_date': None,
            'actual_end_date': None,
            'status': 'scheduled',
            'created_at': datetime.combine(time_slot.date, datetime.min.time()),
            'updated_at': datetime.combine(time_slot.date, datetime.min.time())
        }

        # Track state
        self.production_orders[order_id] = ProductionState(
            order_id=order_id,
            product_code=product['material_code'],
            line_code=line['line_code'],
            lot_no=lot_no,
            order_qty=order_qty,
            cycle_time_seconds=product.get('cycle_time_seconds', 45),
            target_rate_per_hour=capacity_per_hour
        )

        self.data['production_orders'].append(order)
        return order

    def generate_production_result(
        self,
        time_slot: TimeSlot,
        production_order: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate production result for a time slot"""
        order_id = production_order['id']
        state = self.production_orders.get(order_id)

        if not state or state.status == 'completed':
            return None

        # Calculate remaining quantity
        remaining_qty = state.order_qty - state.good_qty - state.defect_qty
        if remaining_qty <= 0:
            state.status = 'completed'
            return None

        # Get scenario-adjusted production parameters
        scenario_data = self._apply_production_scenarios(time_slot, context, state)

        # Calculate production for this time slot (1 hour)
        base_rate = state.target_rate_per_hour * time_slot.production_factor
        production_variation = np.random.normal(1.0, 0.05)
        hourly_production = int(base_rate * production_variation * scenario_data.get('production_multiplier', 1.0))

        # Limit to remaining quantity
        total_qty = min(hourly_production, remaining_qty)

        # Calculate defects
        base_defect_rate = 0.015 * time_slot.quality_factor
        adjusted_defect_rate = base_defect_rate * scenario_data.get('defect_rate_multiplier', 1.0)
        defect_qty = int(total_qty * adjusted_defect_rate)
        good_qty = total_qty - defect_qty

        # Update state
        state.good_qty += good_qty
        state.defect_qty += defect_qty

        if state.status == 'scheduled':
            state.status = 'in_progress'
            state.start_time = time_slot.timestamp

        if state.good_qty + state.defect_qty >= state.order_qty:
            state.status = 'completed'

        # Calculate cycle time with variation
        base_cycle_time = state.cycle_time_seconds
        cycle_time = base_cycle_time * scenario_data.get('cycle_time_multiplier', 1.0)
        cycle_time += np.random.normal(0, base_cycle_time * 0.1)

        result = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'production_order_id': order_id,
            'lot_no': state.lot_no,
            'product_code': state.product_code,
            'line_code': state.line_code,
            'production_date': time_slot.date,
            'shift': time_slot.shift.value,
            'hour': time_slot.hour,
            'good_qty': good_qty,
            'defect_qty': defect_qty,
            'total_qty': total_qty,
            'unit': 'EA',
            'cycle_time_avg': round(max(10, cycle_time), 2),
            'cycle_time_min': round(max(5, cycle_time * 0.8), 2),
            'cycle_time_max': round(cycle_time * 1.2, 2),
            'start_time': time_slot.timestamp,
            'end_time': time_slot.timestamp + timedelta(hours=1),
            'operator_id': self._get_random_operator(time_slot.shift),
            'status': 'confirmed',
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['production_results'].append(result)

        # Update production order
        self._update_production_order(order_id, state)

        return result

    def generate_realtime_production(
        self,
        time_slot: TimeSlot,
        production_result: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate real-time production records (every 5 minutes)"""
        records = []

        total_qty = production_result['total_qty']
        intervals = 12  # 60 minutes / 5 minutes
        qty_per_interval = total_qty // intervals

        for i in range(intervals):
            interval_time = time_slot.timestamp + timedelta(minutes=i * 5)
            cumulative_qty = (i + 1) * qty_per_interval

            # Add some variation
            interval_qty = qty_per_interval + random.randint(-5, 5)
            interval_qty = max(0, interval_qty)

            record = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'production_order_id': production_result['production_order_id'],
                'line_code': production_result['line_code'],
                'timestamp': interval_time,
                'interval_seconds': 300,  # 5 minutes
                'good_qty': max(0, interval_qty - random.randint(0, 2)),
                'defect_qty': random.randint(0, 2),
                'total_qty': interval_qty,
                'cumulative_good_qty': cumulative_qty,
                'cycle_time_current': production_result['cycle_time_avg'] + random.uniform(-2, 2),
                'status': 'active',
                'created_at': interval_time
            }

            records.append(record)

        self.data['realtime_production'].extend(records)
        return records

    def _apply_production_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any],
        state: ProductionState
    ) -> Dict[str, Any]:
        """Apply active scenarios to production parameters"""
        result = {
            'production_multiplier': 1.0,
            'defect_rate_multiplier': 1.0,
            'cycle_time_multiplier': 1.0,
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context,
            state.line_code
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            # Apply production multiplier
            if 'production_drop' in effect.affected_metrics:
                result['production_multiplier'] *= (1 - effect.affected_metrics['production_drop'])

            # Apply defect rate multiplier
            if 'defect_rate_multiplier' in effect.affected_metrics:
                result['defect_rate_multiplier'] *= effect.affected_metrics['defect_rate_multiplier']

            if 'defect_increase_factor' in effect.affected_metrics:
                result['defect_rate_multiplier'] *= effect.affected_metrics['defect_increase_factor']

            # Apply cycle time multiplier
            if 'cycle_time_increase' in effect.affected_metrics:
                result['cycle_time_multiplier'] *= (1 + effect.affected_metrics['cycle_time_increase'])

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def _update_production_order(self, order_id: str, state: ProductionState) -> None:
        """Update production order with current state"""
        for order in self.data['production_orders']:
            if order['id'] == order_id:
                order['good_qty'] = state.good_qty
                order['defect_qty'] = state.defect_qty
                order['status'] = state.status
                order['updated_at'] = datetime.now()

                if state.status == 'in_progress' and order['actual_start_date'] is None:
                    order['actual_start_date'] = state.start_time.date() if state.start_time else None

                if state.status == 'completed':
                    order['actual_end_date'] = datetime.now().date()

                break

    def _get_random_operator(self, shift: ShiftType) -> str:
        """Get random operator ID for shift"""
        shift_operators = {
            ShiftType.DAY: ['OP001', 'OP002', 'OP003', 'OP004', 'OP005'],
            ShiftType.EVENING: ['OP011', 'OP012', 'OP013', 'OP014', 'OP015'],
            ShiftType.NIGHT: ['OP021', 'OP022', 'OP023', 'OP024', 'OP025']
        }
        return random.choice(shift_operators.get(shift, ['OP001']))

    def generate_daily_orders(
        self,
        time_slot: TimeSlot,
        num_orders: int = 10
    ) -> List[Dict[str, Any]]:
        """Generate daily production orders"""
        orders = []

        for factory in self.factories:
            for line in factory.get('lines', []):
                # Generate orders for SMT lines
                if 'SMT' in line['line_code'] or 'smt' in line.get('line_type', ''):
                    num_line_orders = random.randint(1, max(1, num_orders // 5))

                    for _ in range(num_line_orders):
                        product = random.choice(self.products)
                        order_qty = random.choice([500, 1000, 2000, 3000, 5000])

                        order = self.generate_production_order(
                            time_slot, line, product, order_qty
                        )
                        orders.append(order)

        return orders

    def generate_time_range(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        orders_per_day: int = 15
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generate production data for a time range

        Yields:
            Dictionary containing production data for each time slot
        """
        current_date = None

        for time_slot in self.time_manager.iterate_time_slots(start, end):
            # Generate new orders at start of each day
            if current_date != time_slot.date:
                current_date = time_slot.date
                if time_slot.is_working_day:
                    self.generate_daily_orders(time_slot, orders_per_day)

            # Skip non-working hours and holidays
            if not time_slot.is_working_day:
                continue

            # Build context for scenarios
            context = {
                'environment': {
                    'temperature': 25 + random.gauss(0, 2),
                    'humidity': 50 + random.gauss(0, 5)
                },
                'equipment': {},
                'material': {}
            }

            # Generate results for active production orders
            results = []
            for order in self.data['production_orders']:
                if order['status'] in ['scheduled', 'in_progress']:
                    if order['plan_start_date'] <= time_slot.date:
                        result = self.generate_production_result(
                            time_slot, order, context
                        )
                        if result:
                            results.append(result)
                            # Generate real-time data
                            self.generate_realtime_production(time_slot, result)

            yield {
                'timestamp': time_slot.timestamp.isoformat(),
                'time_slot': {
                    'date': time_slot.date.isoformat(),
                    'shift': time_slot.shift.value,
                    'hour': time_slot.hour
                },
                'production_results': results,
                'active_orders': len([o for o in self.data['production_orders']
                                     if o['status'] in ['scheduled', 'in_progress']])
            }

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        completed_orders = [o for o in self.data['production_orders'] if o['status'] == 'completed']
        total_good = sum(o['good_qty'] for o in self.data['production_orders'])
        total_defect = sum(o['defect_qty'] for o in self.data['production_orders'])

        return {
            'total_orders': len(self.data['production_orders']),
            'completed_orders': len(completed_orders),
            'total_results': len(self.data['production_results']),
            'total_realtime_records': len(self.data['realtime_production']),
            'total_good_qty': total_good,
            'total_defect_qty': total_defect,
            'overall_defect_rate': total_defect / (total_good + total_defect) if (total_good + total_defect) > 0 else 0
        }
