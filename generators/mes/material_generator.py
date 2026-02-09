"""
MES Material Data Generator
Generates material consumption, feeder setup, and inventory movement data
Supports AI use case scenarios for material management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Generator
from dataclasses import dataclass, field
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot, ShiftType
from generators.core.scenario_manager import ScenarioManager, AIUseCase


class MaterialMovementType(Enum):
    ISSUE = "issue"  # 출고
    RETURN = "return"  # 반납
    TRANSFER = "transfer"  # 이동
    BACKFLUSH = "backflush"  # 백플러시
    ADJUSTMENT = "adjustment"  # 조정
    SCRAP = "scrap"  # 폐기


class FeederStatus(Enum):
    SETUP = "setup"
    RUNNING = "running"
    EMPTY = "empty"
    ERROR = "error"
    STANDBY = "standby"


@dataclass
class MaterialState:
    """State tracking for materials on line"""
    material_code: str
    lot_no: str
    line_code: str
    feeder_no: str
    initial_qty: int
    remaining_qty: int
    setup_time: datetime
    expiry_time: Optional[datetime] = None


class MaterialDataGenerator:
    """
    MES Material Data Generator

    Generates:
    - Material consumption (자재 소비)
    - Feeder setup (피더 셋업)
    - Material requests (자재 요청)
    - Material movements (자재 이동)
    - Material alerts (자재 알림)

    AI Use Cases:
    - CHECK: 자재 현황 조회
    - TREND: 자재 소비 트렌드
    - PREDICT: 자재 소진 예측
    - DETECT_ANOMALY: 자재 소비 이상 감지
    - NOTIFY: 자재 부족 알림
    - WHAT_IF: 자재 변경 시뮬레이션
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

        random.seed(random_seed)
        np.random.seed(random_seed)

        self.factories = company_profile.get('factories', [])
        self.vendors = company_profile.get('vendors', [])

        # Track material states per line
        self.material_states: Dict[str, List[MaterialState]] = {}

        # Generated data storage
        self.data = {
            'material_consumption': [],
            'feeder_setups': [],
            'material_requests': [],
            'material_movements': [],
            'material_alerts': [],
            'reel_changes': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_material_consumption(
        self,
        time_slot: TimeSlot,
        production_result: Dict[str, Any],
        bom_components: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate material consumption records for production"""
        consumptions = []
        scenario_data = self._apply_material_scenarios(time_slot, context, production_result)

        total_produced = production_result.get('total_qty', 0)
        line_code = production_result.get('line_code', '')

        for component in bom_components:
            material_code = component.get('component_code', component.get('material_code'))
            qty_per = component.get('qty_per', 1)

            # Calculate planned consumption
            planned_qty = total_produced * qty_per

            # Apply scrap rate
            scrap_rate = component.get('scrap_rate', 1.0) / 100
            actual_qty = planned_qty * (1 + scrap_rate)

            # Apply scenario effects (waste increase, etc.)
            waste_factor = scenario_data.get('waste_factor', 1.0)
            actual_qty *= waste_factor

            # Add variation
            actual_qty *= (1 + random.gauss(0, 0.02))
            actual_qty = round(actual_qty, 4)

            variance_qty = actual_qty - planned_qty

            consumption = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'consumption_no': f"CON-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
                'production_order_id': production_result.get('production_order_id'),
                'lot_no': production_result.get('lot_no'),
                'product_code': production_result.get('product_code'),
                'line_code': line_code,
                'material_code': material_code,
                'material_lot_no': f"ML{time_slot.date.strftime('%Y%m%d')}{random.randint(1000, 9999)}",
                'consumption_datetime': time_slot.timestamp,
                'shift': time_slot.shift.value,
                'consumption_type': 'backflush',
                'planned_qty': round(planned_qty, 4),
                'actual_qty': actual_qty,
                'variance_qty': round(variance_qty, 4),
                'variance_pct': round((variance_qty / planned_qty * 100) if planned_qty > 0 else 0, 2),
                'unit': component.get('unit', 'EA'),
                'feeder_no': f"F{random.randint(1, 120):03d}",
                'operation_no': component.get('operation_no', 30),
                'active_scenarios': scenario_data.get('active_scenarios', []),
                'created_at': datetime.now()
            }

            consumptions.append(consumption)

            # Check for high variance alert
            if abs(variance_qty / planned_qty) > 0.1 if planned_qty > 0 else False:
                self._generate_material_alert(
                    time_slot, consumption, 'HIGH_VARIANCE',
                    f"자재 소비 편차 {consumption['variance_pct']:.1f}% 발생"
                )

        self.data['material_consumption'].extend(consumptions)
        return consumptions

    def generate_feeder_setup(
        self,
        time_slot: TimeSlot,
        line_code: str,
        product_code: str,
        bom_components: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate feeder setup records for product changeover"""
        setups = []
        scenario_data = self._apply_material_scenarios(time_slot, context, {'line_code': line_code})

        feeder_no = 1
        for component in bom_components[:60]:  # Max 60 feeders
            material_code = component.get('component_code', component.get('material_code'))

            # Determine feeder type based on component
            feeder_type = self._get_feeder_type(component)

            # Generate lot info
            lot_no = f"RL{time_slot.date.strftime('%Y%m%d')}{random.randint(10000, 99999)}"
            initial_qty = self._get_reel_quantity(component)
            remaining_qty = int(initial_qty * random.uniform(0.3, 1.0))

            setup = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'setup_no': f"FDR-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
                'line_code': line_code,
                'equipment_code': f"{line_code}-MOUNTER-01",
                'product_code': product_code,
                'feeder_no': f"F{feeder_no:03d}",
                'feeder_type': feeder_type,
                'slot_no': feeder_no,
                'material_code': material_code,
                'lot_no': lot_no,
                'vendor_lot_no': f"VL{random.randint(100000, 999999)}",
                'reel_id': f"REEL-{lot_no}",
                'initial_qty': initial_qty,
                'remaining_qty': remaining_qty,
                'unit': component.get('unit', 'EA'),
                'setup_datetime': time_slot.timestamp,
                'setup_by': f"OP{random.randint(1, 50):03d}",
                'status': 'running',
                'verified': True,
                'verified_by': f"QC{random.randint(1, 10):03d}",
                'verified_at': time_slot.timestamp + timedelta(minutes=5),
                'expiry_datetime': time_slot.timestamp + timedelta(hours=random.randint(24, 72)),
                'created_at': datetime.now()
            }

            setups.append(setup)

            # Track state
            state = MaterialState(
                material_code=material_code,
                lot_no=lot_no,
                line_code=line_code,
                feeder_no=setup['feeder_no'],
                initial_qty=initial_qty,
                remaining_qty=remaining_qty,
                setup_time=time_slot.timestamp,
                expiry_time=setup['expiry_datetime']
            )

            if line_code not in self.material_states:
                self.material_states[line_code] = []
            self.material_states[line_code].append(state)

            feeder_no += 1

        self.data['feeder_setups'].extend(setups)

        # Apply setup time scenario
        setup_time = scenario_data.get('setup_time_increase', 0)
        if setup_time > 30:
            self._generate_material_alert(
                time_slot, {'line_code': line_code}, 'LONG_SETUP',
                f"셋업 시간 {setup_time}분 초과"
            )

        return setups

    def generate_material_request(
        self,
        time_slot: TimeSlot,
        line_code: str,
        material_code: str,
        required_qty: int,
        reason: str = 'production',
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate material request from production line"""
        context = context or {}
        scenario_data = self._apply_material_scenarios(time_slot, context, {'line_code': line_code})

        # Determine urgency
        if scenario_data.get('material_shortage'):
            urgency = 'urgent'
            priority = 1
        elif required_qty > 10000:
            urgency = 'high'
            priority = 2
        else:
            urgency = 'normal'
            priority = 3

        request = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'request_no': f"MRQ-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'line_code': line_code,
            'request_datetime': time_slot.timestamp,
            'requester_id': f"OP{random.randint(1, 50):03d}",
            'material_code': material_code,
            'required_qty': required_qty,
            'unit': 'EA',
            'reason': reason,
            'urgency': urgency,
            'priority': priority,
            'requested_delivery_time': time_slot.timestamp + timedelta(minutes=30 if urgency == 'urgent' else 60),
            'warehouse_code': 'WH-RM',
            'status': 'pending',
            'fulfilled_qty': 0,
            'fulfilled_at': None,
            'fulfilled_by': None,
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['material_requests'].append(request)

        # Generate alert for urgent requests
        if urgency == 'urgent':
            self._generate_material_alert(
                time_slot, request, 'URGENT_REQUEST',
                f"긴급 자재 요청 - {material_code}"
            )

        return request

    def generate_material_movement(
        self,
        time_slot: TimeSlot,
        material_code: str,
        lot_no: str,
        qty: int,
        movement_type: MaterialMovementType,
        from_location: str,
        to_location: str,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate material movement record"""
        movement = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'movement_no': f"MMV-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'movement_type': movement_type.value,
            'movement_datetime': time_slot.timestamp,
            'material_code': material_code,
            'lot_no': lot_no,
            'qty': qty,
            'unit': 'EA',
            'from_location': from_location,
            'to_location': to_location,
            'from_warehouse': from_location.split('-')[0] if '-' in from_location else 'WH-RM',
            'to_warehouse': to_location.split('-')[0] if '-' in to_location else 'WH-WIP',
            'operator_id': f"OP{random.randint(1, 50):03d}",
            'reference_doc': '',
            'reason': self._get_movement_reason(movement_type),
            'status': 'completed',
            'created_at': datetime.now()
        }

        self.data['material_movements'].append(movement)
        return movement

    def generate_reel_change(
        self,
        time_slot: TimeSlot,
        feeder_setup: Dict[str, Any],
        reason: str = 'empty'
    ) -> Dict[str, Any]:
        """Generate reel change record"""
        old_reel = feeder_setup.get('reel_id', '')
        new_lot = f"RL{time_slot.date.strftime('%Y%m%d')}{random.randint(10000, 99999)}"
        new_qty = self._get_reel_quantity({'unit': feeder_setup.get('unit', 'EA')})

        change = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'change_no': f"RCH-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'line_code': feeder_setup['line_code'],
            'feeder_no': feeder_setup['feeder_no'],
            'material_code': feeder_setup['material_code'],
            'change_datetime': time_slot.timestamp,
            'change_reason': reason,
            'old_reel_id': old_reel,
            'old_lot_no': feeder_setup.get('lot_no'),
            'old_remaining_qty': feeder_setup.get('remaining_qty', 0),
            'new_reel_id': f"REEL-{new_lot}",
            'new_lot_no': new_lot,
            'new_qty': new_qty,
            'change_by': f"OP{random.randint(1, 50):03d}",
            'verification_required': True,
            'verified': True,
            'verified_by': f"QC{random.randint(1, 10):03d}",
            'change_duration_seconds': random.randint(30, 120),
            'status': 'completed',
            'created_at': datetime.now()
        }

        self.data['reel_changes'].append(change)
        return change

    def _generate_material_alert(
        self,
        time_slot: TimeSlot,
        reference: Dict[str, Any],
        alert_type: str,
        message: str
    ) -> Dict[str, Any]:
        """Generate material-related alert"""
        severity_map = {
            'LOW_STOCK': 'high',
            'SHORTAGE': 'critical',
            'EXPIRY_WARNING': 'medium',
            'HIGH_VARIANCE': 'medium',
            'URGENT_REQUEST': 'high',
            'LONG_SETUP': 'low',
            'LOT_MISMATCH': 'critical'
        }

        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'alert_no': f"MAL-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': severity_map.get(alert_type, 'medium'),
            'alert_datetime': time_slot.timestamp,
            'line_code': reference.get('line_code', ''),
            'material_code': reference.get('material_code', ''),
            'message': message,
            'reference_no': reference.get('consumption_no') or reference.get('request_no', ''),
            'status': 'active',
            'acknowledged': False,
            'created_at': datetime.now()
        }

        self.data['material_alerts'].append(alert)
        return alert

    def _apply_material_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any],
        reference: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to material parameters"""
        result = {
            'waste_factor': 1.0,
            'material_shortage': False,
            'setup_time_increase': 0,
            'active_scenarios': []
        }

        line_code = reference.get('line_code', '')

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context,
            line_code
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            # Material waste increase
            if 'waste_increase' in effect.affected_metrics:
                result['waste_factor'] *= (1 + effect.affected_metrics['waste_increase'])

            # Material shortage
            if 'material_shortage' in effect.additional_data:
                result['material_shortage'] = True

            # Setup time increase
            if 'setup_time_increase' in effect.affected_metrics:
                result['setup_time_increase'] += effect.affected_metrics['setup_time_increase']

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def _get_feeder_type(self, component: Dict[str, Any]) -> str:
        """Determine feeder type based on component"""
        width = component.get('tape_width', 8)
        feeder_types = {
            8: '8mm_tape',
            12: '12mm_tape',
            16: '16mm_tape',
            24: '24mm_tape',
            32: '32mm_tape',
            44: '44mm_tape'
        }
        return feeder_types.get(width, '8mm_tape')

    def _get_reel_quantity(self, component: Dict[str, Any]) -> int:
        """Get standard reel quantity based on component"""
        unit = component.get('unit', 'EA')
        # Standard reel quantities
        if unit in ['EA', 'PCS']:
            return random.choice([1000, 2000, 3000, 4000, 5000, 10000])
        elif unit == 'M':
            return random.choice([100, 200, 500])
        else:
            return 1000

    def _get_movement_reason(self, movement_type: MaterialMovementType) -> str:
        """Get reason description for movement type"""
        reasons = {
            MaterialMovementType.ISSUE: '생산 출고',
            MaterialMovementType.RETURN: '생산 잔량 반납',
            MaterialMovementType.TRANSFER: '창고 간 이동',
            MaterialMovementType.BACKFLUSH: '백플러시 자동 차감',
            MaterialMovementType.ADJUSTMENT: '재고 조정',
            MaterialMovementType.SCRAP: '불량 폐기'
        }
        return reasons.get(movement_type, '')

    def check_material_levels(
        self,
        time_slot: TimeSlot,
        line_code: str,
        threshold_pct: float = 0.2
    ) -> List[Dict[str, Any]]:
        """Check material levels and generate alerts for low stock"""
        alerts = []

        if line_code not in self.material_states:
            return alerts

        for state in self.material_states[line_code]:
            remaining_pct = state.remaining_qty / state.initial_qty if state.initial_qty > 0 else 0

            if remaining_pct < threshold_pct:
                alert = self._generate_material_alert(
                    time_slot,
                    {
                        'line_code': line_code,
                        'material_code': state.material_code
                    },
                    'LOW_STOCK',
                    f"자재 {state.material_code} 잔량 {remaining_pct*100:.1f}% - 피더 {state.feeder_no}"
                )
                alerts.append(alert)

                # Generate material request
                self.generate_material_request(
                    time_slot,
                    line_code,
                    state.material_code,
                    state.initial_qty,  # Request full reel
                    reason='low_stock'
                )

            # Check expiry
            if state.expiry_time and time_slot.timestamp > state.expiry_time - timedelta(hours=4):
                alert = self._generate_material_alert(
                    time_slot,
                    {
                        'line_code': line_code,
                        'material_code': state.material_code
                    },
                    'EXPIRY_WARNING',
                    f"자재 {state.material_code} LOT {state.lot_no} 유효기간 임박"
                )
                alerts.append(alert)

        return alerts

    def generate_for_production(
        self,
        time_slot: TimeSlot,
        production_results: List[Dict[str, Any]],
        bom_data: Dict[str, List[Dict[str, Any]]],
        context: Dict[str, Any]
    ) -> Dict[str, List]:
        """Generate material data for production results"""
        all_consumptions = []

        for result in production_results:
            product_code = result.get('product_code', '')
            bom_components = bom_data.get(product_code, [])

            if bom_components:
                consumptions = self.generate_material_consumption(
                    time_slot, result, bom_components, context
                )
                all_consumptions.extend(consumptions)

        # Check material levels
        lines_processed = set(r.get('line_code') for r in production_results)
        for line_code in lines_processed:
            self.check_material_levels(time_slot, line_code)

        return {
            'consumptions': all_consumptions,
            'requests': [r for r in self.data['material_requests']
                        if r['request_datetime'].date() == time_slot.date],
            'alerts': [a for a in self.data['material_alerts']
                      if a['alert_datetime'].date() == time_slot.date]
        }

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_consumption = sum(c['actual_qty'] for c in self.data['material_consumption'])
        total_planned = sum(c['planned_qty'] for c in self.data['material_consumption'])

        return {
            'total_consumption_records': len(self.data['material_consumption']),
            'total_consumed_qty': round(total_consumption, 2),
            'total_planned_qty': round(total_planned, 2),
            'overall_variance_pct': round((total_consumption - total_planned) / total_planned * 100, 2) if total_planned > 0 else 0,
            'total_feeder_setups': len(self.data['feeder_setups']),
            'total_requests': len(self.data['material_requests']),
            'total_movements': len(self.data['material_movements']),
            'total_reel_changes': len(self.data['reel_changes']),
            'total_alerts': len(self.data['material_alerts'])
        }
