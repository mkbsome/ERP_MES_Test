"""
MES Quality Data Generator
Generates inspection results, defect records, SPC data, and traceability
Supports AI use case scenarios for quality management
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


class InspectionType(Enum):
    SPI = "SPI"  # Solder Paste Inspection
    AOI = "AOI"  # Automated Optical Inspection
    ICT = "ICT"  # In-Circuit Test
    FCT = "FCT"  # Functional Test
    XRAY = "XRAY"  # X-Ray Inspection
    VISUAL = "VISUAL"  # Visual Inspection
    FINAL = "FINAL"  # Final Inspection


class InspectionResult(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    CONDITIONAL = "CONDITIONAL"


class DefectSeverity(Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


@dataclass
class DefectType:
    """Defect type definition"""
    code: str
    name: str
    category: str
    base_rate: float
    severity: DefectSeverity


class QualityDataGenerator:
    """
    MES Quality Data Generator

    Generates:
    - Inspection results (검사 결과)
    - Defect details (불량 상세)
    - SPC data (통계적 공정관리)
    - Traceability records (추적성)
    - Quality alerts (품질 알림)

    AI Use Cases:
    - CHECK: 품질 현황 조회
    - TREND: 불량률 트렌드
    - COMPARE: 라인/설비별 품질 비교
    - RANK: 불량 유형 순위
    - FIND_CAUSE: 불량 원인 분석
    - DETECT_ANOMALY: 품질 이상 감지
    - PREDICT: 품질 예측
    """

    # SMT/PCB 관련 불량 유형 정의
    DEFECT_TYPES = {
        'BRIDGE': DefectType('BRIDGE', '솔더브릿지', 'soldering', 0.25, DefectSeverity.MAJOR),
        'OPEN': DefectType('OPEN', '오픈(미접합)', 'soldering', 0.15, DefectSeverity.CRITICAL),
        'MISSING': DefectType('MISSING', '부품누락', 'placement', 0.12, DefectSeverity.CRITICAL),
        'TOMBSTONE': DefectType('TOMBSTONE', '툼스톤', 'placement', 0.10, DefectSeverity.MAJOR),
        'SHIFT': DefectType('SHIFT', '부품틀어짐', 'placement', 0.10, DefectSeverity.MINOR),
        'COLD': DefectType('COLD', '냉납', 'soldering', 0.08, DefectSeverity.MAJOR),
        'INSUFFICIENT': DefectType('INSUFFICIENT', '납부족', 'soldering', 0.08, DefectSeverity.MINOR),
        'EXCESS': DefectType('EXCESS', '납과다', 'soldering', 0.05, DefectSeverity.MINOR),
        'POLARITY': DefectType('POLARITY', '극성불량', 'placement', 0.03, DefectSeverity.CRITICAL),
        'WRONG_PART': DefectType('WRONG_PART', '오삽', 'placement', 0.02, DefectSeverity.CRITICAL),
        'CRACK': DefectType('CRACK', '크랙', 'mechanical', 0.01, DefectSeverity.CRITICAL),
        'CONTAMINATION': DefectType('CONTAMINATION', '이물질', 'cleanliness', 0.01, DefectSeverity.MINOR)
    }

    # SPC 관리 파라미터
    SPC_PARAMETERS = {
        'solder_paste_height': {'target': 150, 'usl': 180, 'lsl': 120, 'unit': 'um'},
        'solder_paste_volume': {'target': 100, 'usl': 130, 'lsl': 70, 'unit': '%'},
        'reflow_peak_temp': {'target': 245, 'usl': 255, 'lsl': 235, 'unit': '°C'},
        'reflow_time_above_liquidus': {'target': 60, 'usl': 90, 'lsl': 40, 'unit': 'sec'},
        'component_offset_x': {'target': 0, 'usl': 0.15, 'lsl': -0.15, 'unit': 'mm'},
        'component_offset_y': {'target': 0, 'usl': 0.15, 'lsl': -0.15, 'unit': 'mm'}
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

        self.defect_types = company_profile.get('defect_types', [])
        self.factories = company_profile.get('factories', [])

        # Generated data storage
        self.data = {
            'inspection_results': [],
            'defect_details': [],
            'spc_data': [],
            'traceability': [],
            'quality_alerts': [],
            'quality_holds': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_inspection_result(
        self,
        time_slot: TimeSlot,
        production_result: Dict[str, Any],
        inspection_type: InspectionType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate inspection result for a production batch"""
        # Apply scenarios
        scenario_data = self._apply_quality_scenarios(time_slot, context, production_result)

        total_inspected = production_result.get('total_qty', 0)
        defect_rate = scenario_data.get('defect_rate', 0.015)

        # Calculate pass/fail quantities
        fail_qty = int(total_inspected * defect_rate)
        pass_qty = total_inspected - fail_qty

        # Determine result
        if fail_qty == 0:
            result = InspectionResult.PASS
        elif fail_qty / total_inspected > 0.05:
            result = InspectionResult.FAIL
        else:
            result = InspectionResult.CONDITIONAL

        inspection = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'inspection_no': f"INS-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'inspection_type': inspection_type.value,
            'production_order_id': production_result.get('production_order_id'),
            'lot_no': production_result.get('lot_no'),
            'product_code': production_result.get('product_code'),
            'line_code': production_result.get('line_code'),
            'equipment_code': self._get_inspection_equipment(inspection_type, production_result.get('line_code')),
            'inspection_datetime': time_slot.timestamp,
            'shift': time_slot.shift.value,
            'inspector_id': f"QC{random.randint(1, 20):03d}",
            'result': result.value,
            'total_inspected': total_inspected,
            'pass_qty': pass_qty,
            'fail_qty': fail_qty,
            'defect_rate': round(defect_rate, 4),
            'sampling_type': 'full' if inspection_type in [InspectionType.AOI, InspectionType.SPI] else 'sampling',
            'sample_size': total_inspected if inspection_type in [InspectionType.AOI, InspectionType.SPI] else min(100, total_inspected),
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['inspection_results'].append(inspection)

        # Generate defect details if any failures
        if fail_qty > 0:
            self._generate_defect_details(time_slot, inspection, fail_qty, scenario_data)

        # Generate SPC data for applicable inspection types
        if inspection_type in [InspectionType.SPI, InspectionType.AOI]:
            self._generate_spc_data(time_slot, inspection, scenario_data)

        # Generate traceability record
        self._generate_traceability(time_slot, inspection, production_result)

        # Check for quality alerts
        if defect_rate > 0.03 or result == InspectionResult.FAIL:
            self._generate_quality_alert(time_slot, inspection, scenario_data)

        return inspection

    def _generate_defect_details(
        self,
        time_slot: TimeSlot,
        inspection: Dict[str, Any],
        total_defects: int,
        scenario_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate detailed defect records"""
        defects = []
        remaining = total_defects

        # Check for dominant defect from scenario
        dominant_defect = scenario_data.get('dominant_defect')

        # Distribute defects by type
        defect_types = list(self.DEFECT_TYPES.values())

        while remaining > 0:
            # Select defect type
            if dominant_defect and dominant_defect in self.DEFECT_TYPES and random.random() < 0.6:
                defect_type = self.DEFECT_TYPES[dominant_defect]
            else:
                # Weight by base rate
                weights = [dt.base_rate for dt in defect_types]
                defect_type = random.choices(defect_types, weights=weights)[0]

            # Determine quantity
            qty = min(remaining, random.randint(1, max(1, remaining // 3)))

            defect = {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'defect_no': f"DEF-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
                'inspection_id': inspection['id'],
                'inspection_no': inspection['inspection_no'],
                'production_order_id': inspection['production_order_id'],
                'lot_no': inspection['lot_no'],
                'product_code': inspection['product_code'],
                'line_code': inspection['line_code'],
                'detection_datetime': time_slot.timestamp,
                'defect_code': defect_type.code,
                'defect_name': defect_type.name,
                'defect_category': defect_type.category,
                'defect_qty': qty,
                'unit': 'EA',
                'severity': defect_type.severity.value,
                'detected_at': inspection['inspection_type'],
                'location': self._generate_defect_location(),
                'component_reference': f"R{random.randint(1, 999)}" if random.random() < 0.7 else f"U{random.randint(1, 99)}",
                'rework_possible': defect_type.severity != DefectSeverity.CRITICAL,
                'rework_done': False,
                'root_cause': scenario_data.get('root_cause', ''),
                'corrective_action': '',
                'status': 'detected',
                'created_at': datetime.now()
            }

            defects.append(defect)
            remaining -= qty

        self.data['defect_details'].extend(defects)
        return defects

    def _generate_spc_data(
        self,
        time_slot: TimeSlot,
        inspection: Dict[str, Any],
        scenario_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate SPC measurement data"""
        spc_records = []

        # Get scenario effects on SPC
        spc_drift = scenario_data.get('spc_drift', {})

        for param_name, param_spec in self.SPC_PARAMETERS.items():
            # Skip if not relevant to inspection type
            if inspection['inspection_type'] == 'SPI' and 'solder_paste' not in param_name:
                if 'reflow' not in param_name:
                    continue
            elif inspection['inspection_type'] == 'AOI' and 'solder_paste' in param_name:
                continue

            # Generate measurements (typically 5-10 samples)
            num_samples = random.randint(5, 10)
            target = param_spec['target']
            usl = param_spec['usl']
            lsl = param_spec['lsl']

            # Apply drift from scenarios
            drift = spc_drift.get(param_name, 0)
            mean = target + drift

            # Calculate sigma (assume Cp=1.33 normally)
            sigma = (usl - lsl) / 8

            # Generate sample values
            for i in range(num_samples):
                value = np.random.normal(mean, sigma)

                # Determine if out of spec
                out_of_spec = value > usl or value < lsl

                record = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'inspection_id': inspection['id'],
                    'lot_no': inspection['lot_no'],
                    'product_code': inspection['product_code'],
                    'line_code': inspection['line_code'],
                    'measurement_datetime': time_slot.timestamp + timedelta(seconds=i * 10),
                    'parameter_name': param_name,
                    'sample_no': i + 1,
                    'measured_value': round(value, 3),
                    'target_value': target,
                    'usl': usl,
                    'lsl': lsl,
                    'unit': param_spec['unit'],
                    'out_of_spec': out_of_spec,
                    'rule_violation': self._check_spc_rules(value, target, sigma, usl, lsl),
                    'created_at': datetime.now()
                }

                spc_records.append(record)

        self.data['spc_data'].extend(spc_records)
        return spc_records

    def _check_spc_rules(
        self,
        value: float,
        target: float,
        sigma: float,
        usl: float,
        lsl: float
    ) -> Optional[str]:
        """Check Western Electric SPC rules"""
        # Rule 1: Point beyond 3 sigma
        if value > target + 3 * sigma or value < target - 3 * sigma:
            return 'RULE_1_BEYOND_3SIGMA'

        # Rule 2: Would need historical data for runs
        # Simplified: check if beyond 2 sigma
        if value > target + 2 * sigma or value < target - 2 * sigma:
            if random.random() < 0.3:  # Simulate occasional rule 2 violation
                return 'RULE_2_WARNING'

        return None

    def _generate_traceability(
        self,
        time_slot: TimeSlot,
        inspection: Dict[str, Any],
        production_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate traceability record"""
        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'trace_no': f"TRC-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'lot_no': inspection['lot_no'],
            'product_code': inspection['product_code'],
            'production_order_id': inspection['production_order_id'],
            'line_code': inspection['line_code'],
            'process_step': inspection['inspection_type'],
            'step_datetime': time_slot.timestamp,
            'operator_id': inspection.get('inspector_id'),
            'equipment_code': inspection.get('equipment_code'),
            'input_lot_nos': [f"MAT-{random.randint(10000, 99999)}" for _ in range(random.randint(3, 8))],
            'output_qty': inspection['pass_qty'],
            'scrap_qty': inspection['fail_qty'],
            'quality_result': inspection['result'],
            'inspection_id': inspection['id'],
            'environmental_conditions': {
                'temperature': round(25 + random.gauss(0, 2), 1),
                'humidity': round(50 + random.gauss(0, 5), 1)
            },
            'created_at': datetime.now()
        }

        self.data['traceability'].append(record)
        return record

    def _generate_quality_alert(
        self,
        time_slot: TimeSlot,
        inspection: Dict[str, Any],
        scenario_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate quality alert"""
        defect_rate = inspection['defect_rate']

        if defect_rate > 0.05:
            severity = 'critical'
            alert_type = 'DEFECT_RATE_CRITICAL'
        elif defect_rate > 0.03:
            severity = 'high'
            alert_type = 'DEFECT_RATE_HIGH'
        else:
            severity = 'medium'
            alert_type = 'DEFECT_RATE_WARNING'

        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'alert_no': f"QAL-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': severity,
            'alert_datetime': time_slot.timestamp,
            'line_code': inspection['line_code'],
            'product_code': inspection['product_code'],
            'lot_no': inspection['lot_no'],
            'inspection_id': inspection['id'],
            'message': f"불량률 {defect_rate*100:.2f}% 발생 - 기준치 초과",
            'current_value': defect_rate,
            'threshold_value': 0.03,
            'recommended_action': scenario_data.get('recommended_action', '품질 점검 및 원인 분석 필요'),
            'status': 'active',
            'acknowledged': False,
            'acknowledged_by': None,
            'acknowledged_at': None,
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['quality_alerts'].append(alert)

        # Generate quality hold if critical
        if severity == 'critical':
            self._generate_quality_hold(time_slot, inspection, alert)

        return alert

    def _generate_quality_hold(
        self,
        time_slot: TimeSlot,
        inspection: Dict[str, Any],
        alert: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate quality hold record"""
        hold = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'hold_no': f"QHL-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'hold_type': 'defect_rate',
            'lot_no': inspection['lot_no'],
            'product_code': inspection['product_code'],
            'line_code': inspection['line_code'],
            'quantity': inspection['total_inspected'],
            'unit': 'EA',
            'hold_datetime': time_slot.timestamp,
            'hold_reason': f"불량률 기준 초과 ({inspection['defect_rate']*100:.2f}%)",
            'alert_id': alert['id'],
            'inspection_id': inspection['id'],
            'status': 'held',
            'disposition': None,
            'disposition_by': None,
            'disposition_at': None,
            'release_qty': 0,
            'scrap_qty': 0,
            'rework_qty': 0,
            'created_at': datetime.now()
        }

        self.data['quality_holds'].append(hold)
        return hold

    def _apply_quality_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any],
        production_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to quality parameters"""
        result = {
            'defect_rate': 0.015 * time_slot.quality_factor,
            'dominant_defect': None,
            'root_cause': '',
            'spc_drift': {},
            'recommended_action': '',
            'active_scenarios': []
        }

        line_code = production_result.get('line_code', '')

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context,
            line_code
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            # Apply defect rate modifications
            if 'defect_rate' in effect.affected_metrics:
                result['defect_rate'] = effect.affected_metrics['defect_rate']
            elif 'defect_rate_multiplier' in effect.affected_metrics:
                result['defect_rate'] *= effect.affected_metrics['defect_rate_multiplier']
            elif 'defect_increase_factor' in effect.affected_metrics:
                result['defect_rate'] *= effect.affected_metrics['defect_increase_factor']

            # Get dominant defect type
            correlation = scenario.correlation
            if 'dominant_defect' in correlation:
                result['dominant_defect'] = correlation['dominant_defect']

            # Get root cause
            if 'root_cause' in correlation:
                result['root_cause'] = correlation['root_cause']

            # Get SPC drift
            if 'spc_drift' in effect.additional_data:
                result['spc_drift'].update(effect.additional_data['spc_drift'])

            # Get recommended action
            if scenario.expected_ai_response:
                result['recommended_action'] = scenario.expected_ai_response.get('action', '')

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        # Clamp defect rate
        result['defect_rate'] = max(0.001, min(0.20, result['defect_rate']))

        return result

    def _get_inspection_equipment(self, inspection_type: InspectionType, line_code: str) -> str:
        """Get inspection equipment code based on type"""
        equipment_mapping = {
            InspectionType.SPI: 'SPI',
            InspectionType.AOI: 'AOI',
            InspectionType.ICT: 'ICT',
            InspectionType.FCT: 'FCT',
            InspectionType.XRAY: 'XRAY',
            InspectionType.VISUAL: 'VIS',
            InspectionType.FINAL: 'FIN'
        }
        prefix = equipment_mapping.get(inspection_type, 'INS')
        return f"{line_code}-{prefix}-01"

    def _generate_defect_location(self) -> Dict[str, Any]:
        """Generate random defect location on PCB"""
        return {
            'board_side': random.choice(['TOP', 'BOTTOM']),
            'x_coord': round(random.uniform(0, 300), 2),
            'y_coord': round(random.uniform(0, 200), 2),
            'panel_no': random.randint(1, 4),
            'board_no': random.randint(1, 2)
        }

    def generate_for_production(
        self,
        time_slot: TimeSlot,
        production_results: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate quality data for production results"""
        inspections = []

        for result in production_results:
            # SPI inspection (after printing)
            if random.random() < 0.8:  # 80% coverage
                insp = self.generate_inspection_result(
                    time_slot, result, InspectionType.SPI, context
                )
                inspections.append(insp)

            # AOI inspection (after reflow)
            insp = self.generate_inspection_result(
                time_slot, result, InspectionType.AOI, context
            )
            inspections.append(insp)

            # ICT inspection (sampling)
            if random.random() < 0.5:
                insp = self.generate_inspection_result(
                    time_slot, result, InspectionType.ICT, context
                )
                inspections.append(insp)

        return inspections

    def generate_time_range(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        production_results: Optional[List[Dict[str, Any]]] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """Generate quality data for a time range"""
        for time_slot in self.time_manager.iterate_time_slots(start, end):
            if not time_slot.is_working_day:
                continue

            context = {
                'environment': {
                    'temperature': 25 + random.gauss(0, 2),
                    'humidity': 50 + random.gauss(0, 5)
                }
            }

            # Filter production results for this time slot if provided
            if production_results:
                slot_results = [
                    r for r in production_results
                    if r.get('production_date') == time_slot.date and
                       r.get('shift') == time_slot.shift.value
                ]

                if slot_results:
                    inspections = self.generate_for_production(time_slot, slot_results, context)

                    yield {
                        'timestamp': time_slot.timestamp.isoformat(),
                        'inspections': len(inspections),
                        'defects': len([d for d in self.data['defect_details']
                                       if d['detection_datetime'].date() == time_slot.date]),
                        'alerts': len([a for a in self.data['quality_alerts']
                                      if a['alert_datetime'].date() == time_slot.date])
                    }

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_inspected = sum(i['total_inspected'] for i in self.data['inspection_results'])
        total_defects = sum(d['defect_qty'] for d in self.data['defect_details'])

        # Defect distribution by type
        defect_by_type = {}
        for d in self.data['defect_details']:
            code = d['defect_code']
            defect_by_type[code] = defect_by_type.get(code, 0) + d['defect_qty']

        return {
            'total_inspections': len(self.data['inspection_results']),
            'total_inspected_qty': total_inspected,
            'total_defect_records': len(self.data['defect_details']),
            'total_defect_qty': total_defects,
            'overall_defect_rate': total_defects / total_inspected if total_inspected > 0 else 0,
            'total_spc_records': len(self.data['spc_data']),
            'total_traceability_records': len(self.data['traceability']),
            'total_alerts': len(self.data['quality_alerts']),
            'total_holds': len(self.data['quality_holds']),
            'defect_distribution': defect_by_type
        }
