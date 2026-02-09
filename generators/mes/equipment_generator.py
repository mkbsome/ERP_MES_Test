"""
MES Equipment Data Generator
Generates equipment status, OEE, downtime, and maintenance data
Supports AI use case scenarios for equipment management
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


class EquipmentStatus(Enum):
    RUN = "RUN"
    IDLE = "IDLE"
    DOWN = "DOWN"
    SETUP = "SETUP"
    PM = "PM"  # Planned Maintenance


class DowntimeType(Enum):
    PLANNED = "planned"
    UNPLANNED = "unplanned"


@dataclass
class EquipmentState:
    """State tracking for equipment"""
    equipment_id: str
    equipment_code: str
    line_code: str
    status: EquipmentStatus = EquipmentStatus.RUN
    run_hours: float = 0.0
    mtbf_hours: float = 800.0
    temperature: float = 25.0
    vibration: float = 0.5
    power_consumption: float = 100.0
    last_maintenance: Optional[datetime] = None
    error_count: int = 0
    cumulative_downtime_minutes: int = 0


@dataclass
class OEEComponents:
    """OEE calculation components"""
    availability: float = 0.92
    performance: float = 0.90
    quality: float = 0.985

    @property
    def oee(self) -> float:
        return self.availability * self.performance * self.quality


class EquipmentDataGenerator:
    """
    MES Equipment Data Generator

    Generates:
    - Equipment status (설비 상태)
    - OEE records (설비 종합효율)
    - Downtime events (다운타임 이벤트)
    - Sensor data (센서 데이터)
    - Maintenance records (유지보수 이력)

    AI Use Cases:
    - CHECK: 설비 상태 확인
    - TREND: OEE 트렌드 분석
    - DETECT_ANOMALY: 설비 이상 감지
    - PREDICT: 설비 고장 예측
    - FIND_CAUSE: 다운타임 원인 분석
    """

    DOWNTIME_CAUSES = {
        'equipment_failure': ('기계고장', 'unplanned', 30, 180),
        'material_shortage': ('자재부족', 'unplanned', 15, 60),
        'quality_issue': ('품질문제', 'unplanned', 10, 45),
        'setup_changeover': ('셋업/품종전환', 'planned', 20, 90),
        'planned_maintenance': ('예방정비', 'planned', 60, 240),
        'operator_absence': ('작업자부재', 'unplanned', 5, 30),
        'power_outage': ('전원문제', 'unplanned', 10, 120),
        'software_error': ('소프트웨어오류', 'unplanned', 5, 60),
        'cleaning': ('청소', 'planned', 15, 45),
        'calibration': ('캘리브레이션', 'planned', 30, 60)
    }

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

        # Initialize equipment states
        self.equipment_states: Dict[str, EquipmentState] = {}
        self._initialize_equipment_states()

        # Generated data storage
        self.data = {
            'equipment_status': [],
            'equipment_oee': [],
            'downtime_events': [],
            'sensor_data': [],
            'maintenance_records': [],
            'equipment_alerts': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def _initialize_equipment_states(self) -> None:
        """Initialize states for all equipment"""
        for factory in self.factories:
            for line in factory.get('lines', []):
                for equipment in line.get('equipment', []):
                    eq_id = equipment['equipment_id']
                    self.equipment_states[eq_id] = EquipmentState(
                        equipment_id=eq_id,
                        equipment_code=equipment.get('equipment_code', eq_id),
                        line_code=line['line_code'],
                        mtbf_hours=equipment.get('mtbf_hours', 800),
                        temperature=self._get_base_temperature(equipment['type']),
                        vibration=0.5,
                        power_consumption=equipment.get('power_kw', 100)
                    )

    def _get_base_temperature(self, equipment_type: str) -> float:
        """Get base operating temperature by equipment type"""
        temp_ranges = {
            'LOADER': (25, 30),
            'PRINTER': (25, 35),
            'SPI': (25, 30),
            'MOUNTER': (30, 40),
            'REFLOW': (240, 260),
            'AOI': (25, 30),
            'UNLOADER': (25, 30),
            'WAVE': (250, 270),
            'SELECTIVE': (260, 280),
            'ICT': (25, 30),
            'FCT': (25, 35)
        }
        low, high = temp_ranges.get(equipment_type.upper(), (25, 30))
        return random.uniform(low, high)

    def generate_equipment_status(
        self,
        time_slot: TimeSlot,
        equipment: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate equipment status record"""
        eq_id = equipment['equipment_id']
        state = self.equipment_states.get(eq_id)

        if not state:
            return None

        # Apply scenarios
        scenario_data = self._apply_equipment_scenarios(time_slot, context, state)

        # Update run hours if working
        if time_slot.is_working_day and state.status == EquipmentStatus.RUN:
            state.run_hours += 1.0

        # Check for random failures based on MTBF
        failure_probability = self._calculate_failure_probability(state, scenario_data)
        if random.random() < failure_probability:
            state.status = EquipmentStatus.DOWN
            state.error_count += 1

        # Update sensor values with scenario effects
        self._update_sensor_values(state, time_slot, scenario_data)

        status_record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'equipment_id': eq_id,
            'equipment_code': state.equipment_code,
            'line_code': state.line_code,
            'timestamp': time_slot.timestamp,
            'status': state.status.value,
            'status_duration_minutes': random.randint(1, 60),
            'run_hours': round(state.run_hours, 1),
            'mtbf_hours': state.mtbf_hours,
            'run_hours_ratio': round(state.run_hours / state.mtbf_hours, 3) if state.mtbf_hours > 0 else 0,
            'temperature': round(state.temperature, 1),
            'vibration': round(state.vibration, 3),
            'power_consumption': round(state.power_consumption, 1),
            'error_count': state.error_count,
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['equipment_status'].append(status_record)

        # Generate alert if anomaly detected
        if scenario_data.get('generate_alert'):
            self._generate_alert(time_slot, state, scenario_data)

        return status_record

    def generate_oee_record(
        self,
        time_slot: TimeSlot,
        equipment: Dict[str, Any],
        production_data: Optional[Dict[str, Any]] = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate OEE record for a shift"""
        eq_id = equipment['equipment_id']
        state = self.equipment_states.get(eq_id)
        context = context or {}

        # Apply scenarios
        scenario_data = self._apply_equipment_scenarios(time_slot, context, state)

        # Calculate OEE components
        planned_time = 480  # 8 hours in minutes

        # Availability (affected by downtime)
        availability_drop = scenario_data.get('availability_drop', 0)
        base_availability = 0.92 - availability_drop
        downtime_minutes = int(planned_time * (1 - base_availability) * random.uniform(0.8, 1.2))
        running_time = planned_time - downtime_minutes
        availability = running_time / planned_time if planned_time > 0 else 0

        # Performance (affected by speed loss)
        performance_drop = scenario_data.get('performance_drop', 0)
        performance = max(0.5, 0.90 - performance_drop + random.gauss(0, 0.02))

        # Quality (based on defect rate)
        defect_rate = 0.015 * scenario_data.get('defect_multiplier', 1.0)
        quality = max(0.8, 1 - defect_rate)

        # OEE
        oee = availability * performance * quality

        # Calculate output
        max_capacity = equipment.get('max_capacity_per_hour', 3000)
        target_output = int(planned_time * max_capacity / 60)
        actual_output = int(running_time * max_capacity / 60 * performance)

        oee_record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'equipment_id': eq_id,
            'equipment_code': state.equipment_code if state else eq_id,
            'line_code': state.line_code if state else '',
            'oee_date': time_slot.date,
            'shift': time_slot.shift.value,
            'planned_time_min': planned_time,
            'running_time_min': running_time,
            'downtime_min': downtime_minutes,
            'setup_time_min': random.randint(10, 30),
            'idle_time_min': random.randint(5, 20),
            'availability': round(availability, 4),
            'performance': round(performance, 4),
            'quality': round(quality, 4),
            'oee': round(oee, 4),
            'target_output': target_output,
            'actual_output': actual_output,
            'defect_count': int(actual_output * defect_rate),
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['equipment_oee'].append(oee_record)

        # Generate downtime event if significant
        if downtime_minutes > 30:
            self._generate_downtime_event(time_slot, state, downtime_minutes, scenario_data)

        # Update cumulative downtime
        if state:
            state.cumulative_downtime_minutes += downtime_minutes

        return oee_record

    def generate_sensor_data(
        self,
        time_slot: TimeSlot,
        equipment: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate sensor data records (every 5 minutes)"""
        eq_id = equipment['equipment_id']
        state = self.equipment_states.get(eq_id)
        records = []

        # Apply scenarios
        scenario_data = self._apply_equipment_scenarios(time_slot, context, state)

        for i in range(12):  # 12 intervals of 5 minutes
            interval_time = time_slot.timestamp + timedelta(minutes=i * 5)

            # Simulate sensor patterns
            sensor_patterns = scenario_data.get('sensor_patterns', {})

            # Temperature with potential degradation pattern
            temp_base = state.temperature if state else 25.0
            if sensor_patterns.get('temperature', {}).get('pattern') == 'increasing':
                temp_base += i * 0.5  # Gradual increase within hour
            temperature = temp_base + random.gauss(0, 1)

            # Vibration with potential degradation pattern
            vib_base = state.vibration if state else 0.5
            if sensor_patterns.get('vibration', {}).get('pattern') == 'increasing':
                vib_base += i * 0.02
            vibration = vib_base + random.gauss(0, 0.02)

            # Power consumption
            power_base = state.power_consumption if state else 100.0
            power = power_base + random.gauss(0, power_base * 0.05)

            record = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'equipment_id': eq_id,
                'timestamp': interval_time,
                'temperature': round(temperature, 2),
                'vibration': round(max(0, vibration), 4),
                'power_consumption': round(max(0, power), 2),
                'pressure': round(random.uniform(0.9, 1.1), 3),
                'humidity': round(50 + random.gauss(0, 5), 1),
                'rpm': random.randint(2800, 3200) if equipment['type'] in ['MOUNTER', 'REFLOW'] else None,
                'created_at': interval_time
            }

            records.append(record)

        self.data['sensor_data'].extend(records)

        # Update state with last sensor values
        if state and records:
            state.temperature = records[-1]['temperature']
            state.vibration = records[-1]['vibration']
            state.power_consumption = records[-1]['power_consumption']

        return records

    def _generate_downtime_event(
        self,
        time_slot: TimeSlot,
        state: EquipmentState,
        duration_minutes: int,
        scenario_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a downtime event"""
        # Determine cause based on scenario or random
        dominant_cause = scenario_data.get('dominant_downtime_cause')

        if dominant_cause and dominant_cause in self.DOWNTIME_CAUSES:
            cause_code = dominant_cause
        else:
            # Weight towards certain causes
            causes = list(self.DOWNTIME_CAUSES.keys())
            weights = [0.25, 0.15, 0.15, 0.15, 0.1, 0.05, 0.05, 0.05, 0.03, 0.02]
            cause_code = random.choices(causes, weights=weights)[0]

        cause_info = self.DOWNTIME_CAUSES[cause_code]
        cause_name, downtime_type, min_dur, max_dur = cause_info

        # Adjust duration based on cause typical range
        adjusted_duration = max(min_dur, min(max_dur, duration_minutes))

        start_time = time_slot.timestamp + timedelta(
            minutes=random.randint(0, max(0, 60 - adjusted_duration))
        )

        event = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'equipment_id': state.equipment_id if state else '',
            'equipment_code': state.equipment_code if state else '',
            'line_code': state.line_code if state else '',
            'downtime_no': f"DT-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'downtime_type': downtime_type,
            'cause_code': cause_code,
            'cause_name': cause_name,
            'start_time': start_time,
            'end_time': start_time + timedelta(minutes=adjusted_duration),
            'duration_minutes': adjusted_duration,
            'shift': time_slot.shift.value,
            'description': f"{cause_name} 발생으로 인한 설비 정지",
            'action_taken': self._get_corrective_action(cause_code),
            'operator_id': f"OP{random.randint(1, 50):03d}",
            'status': 'closed',
            'created_at': datetime.now()
        }

        self.data['downtime_events'].append(event)
        return event

    def _generate_alert(
        self,
        time_slot: TimeSlot,
        state: EquipmentState,
        scenario_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate equipment alert"""
        alert_type = scenario_data.get('alert_type', 'warning')
        alert_message = scenario_data.get('alert_message', '설비 이상 감지')

        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'equipment_id': state.equipment_id,
            'equipment_code': state.equipment_code,
            'line_code': state.line_code,
            'alert_no': f"ALT-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': scenario_data.get('severity', 'medium'),
            'alert_datetime': time_slot.timestamp,
            'message': alert_message,
            'current_value': state.temperature,
            'threshold_value': scenario_data.get('threshold', 280),
            'status': 'active',
            'acknowledged': False,
            'created_at': datetime.now()
        }

        self.data['equipment_alerts'].append(alert)
        return alert

    def _apply_equipment_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any],
        state: Optional[EquipmentState]
    ) -> Dict[str, Any]:
        """Apply active scenarios to equipment parameters"""
        result = {
            'availability_drop': 0,
            'performance_drop': 0,
            'defect_multiplier': 1.0,
            'sensor_patterns': {},
            'generate_alert': False,
            'active_scenarios': []
        }

        if not state:
            return result

        # Build equipment context
        eq_context = {
            'equipment': {
                state.equipment_id: {
                    'run_hours': state.run_hours,
                    'mtbf': state.mtbf_hours,
                    'run_hours_ratio': state.run_hours / state.mtbf_hours if state.mtbf_hours > 0 else 0,
                    'temperature': state.temperature,
                    'vibration': state.vibration
                }
            },
            'environment': context.get('environment', {})
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            eq_context,
            state.equipment_id
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, eq_context)

            if 'availability_drop' in effect.affected_metrics:
                result['availability_drop'] += effect.affected_metrics['availability_drop']

            if 'performance_drop' in effect.affected_metrics:
                result['performance_drop'] += effect.affected_metrics['performance_drop']

            if 'defect_rate_multiplier' in effect.affected_metrics:
                result['defect_multiplier'] *= effect.affected_metrics['defect_rate_multiplier']

            if 'sensor_patterns' in effect.additional_data:
                result['sensor_patterns'].update(effect.additional_data['sensor_patterns'])

            # Check for alert conditions
            if effect.affected_metrics.get('availability_drop', 0) > 0.1:
                result['generate_alert'] = True
                result['alert_type'] = 'oee_drop'
                result['alert_message'] = f"OEE 급격한 하락 감지 - 가동률 {effect.affected_metrics['availability_drop']*100:.1f}% 감소"

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def _calculate_failure_probability(
        self,
        state: EquipmentState,
        scenario_data: Dict[str, Any]
    ) -> float:
        """Calculate failure probability based on state and scenarios"""
        # Base probability from run hours ratio (Weibull-like)
        run_ratio = state.run_hours / state.mtbf_hours if state.mtbf_hours > 0 else 0
        base_prob = 0.001 * (run_ratio ** 2)

        # Adjust for scenarios
        if scenario_data.get('availability_drop', 0) > 0.1:
            base_prob *= 3

        return min(0.05, base_prob)  # Cap at 5%

    def _update_sensor_values(
        self,
        state: EquipmentState,
        time_slot: TimeSlot,
        scenario_data: Dict[str, Any]
    ) -> None:
        """Update equipment sensor values"""
        sensor_patterns = scenario_data.get('sensor_patterns', {})

        # Temperature update
        temp_pattern = sensor_patterns.get('temperature', {})
        if temp_pattern.get('pattern') == 'increasing':
            daily_increase = temp_pattern.get('daily_increase', 2)
            state.temperature += daily_increase / 24  # Per hour increase

        # Vibration update
        vib_pattern = sensor_patterns.get('vibration', {})
        if vib_pattern.get('pattern') == 'increasing':
            daily_increase = vib_pattern.get('daily_increase', 0.1)
            state.vibration += daily_increase / 24

        # Add random noise
        state.temperature += random.gauss(0, 0.5)
        state.vibration += random.gauss(0, 0.01)

    def _get_corrective_action(self, cause_code: str) -> str:
        """Get corrective action description for downtime cause"""
        actions = {
            'equipment_failure': '부품 교체 및 설비 재가동',
            'material_shortage': '자재 보충 후 가동 재개',
            'quality_issue': '품질 문제 원인 파악 및 조치',
            'setup_changeover': '품종 전환 완료',
            'planned_maintenance': '예방정비 완료',
            'operator_absence': '작업자 배치 완료',
            'power_outage': '전원 복구 및 재가동',
            'software_error': '소프트웨어 재시작 및 업데이트',
            'cleaning': '청소 완료',
            'calibration': '캘리브레이션 완료'
        }
        return actions.get(cause_code, '조치 완료')

    def generate_time_range(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """Generate equipment data for a time range"""
        current_shift = None

        for time_slot in self.time_manager.iterate_time_slots(start, end):
            if not time_slot.is_working_day:
                continue

            context = {
                'environment': {
                    'temperature': 25 + random.gauss(0, 2),
                    'humidity': 50 + random.gauss(0, 5)
                }
            }

            # Generate status for each equipment
            status_records = []
            for factory in self.factories:
                for line in factory.get('lines', []):
                    for equipment in line.get('equipment', []):
                        status = self.generate_equipment_status(time_slot, equipment, context)
                        if status:
                            status_records.append(status)

                        # Generate sensor data
                        self.generate_sensor_data(time_slot, equipment, context)

            # Generate OEE at shift change
            shift_key = f"{time_slot.date}_{time_slot.shift.value}"
            if shift_key != current_shift:
                current_shift = shift_key
                for factory in self.factories:
                    for line in factory.get('lines', []):
                        for equipment in line.get('equipment', []):
                            self.generate_oee_record(time_slot, equipment, context=context)

            yield {
                'timestamp': time_slot.timestamp.isoformat(),
                'equipment_status_count': len(status_records),
                'oee_records': len([r for r in self.data['equipment_oee']
                                   if r['oee_date'] == time_slot.date]),
                'downtime_events': len([e for e in self.data['downtime_events']
                                       if e['start_time'].date() == time_slot.date])
            }

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        oee_records = self.data['equipment_oee']
        avg_oee = np.mean([r['oee'] for r in oee_records]) if oee_records else 0
        avg_availability = np.mean([r['availability'] for r in oee_records]) if oee_records else 0

        return {
            'total_status_records': len(self.data['equipment_status']),
            'total_oee_records': len(self.data['equipment_oee']),
            'total_downtime_events': len(self.data['downtime_events']),
            'total_sensor_records': len(self.data['sensor_data']),
            'total_alerts': len(self.data['equipment_alerts']),
            'average_oee': round(avg_oee, 4),
            'average_availability': round(avg_availability, 4),
            'total_downtime_minutes': sum(e['duration_minutes'] for e in self.data['downtime_events'])
        }
