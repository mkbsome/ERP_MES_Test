"""
Data Generator Engine
Main orchestrator for ERP/MES data generation
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Generator
from dataclasses import dataclass, field
from pathlib import Path
import yaml
import random
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot
from generators.core.scenario_manager import ScenarioManager, AIUseCase
from generators.core.correlation_engine import CorrelationEngine, ManufacturingCorrelations


@dataclass
class GenerationConfig:
    """Configuration for data generation"""
    company_profile_path: str
    scenarios_path: str
    time_config_path: str
    output_mode: str = "database"  # database, file, stream
    random_seed: int = 42
    batch_size: int = 1000


@dataclass
class CompanyProfile:
    """Company and factory configuration"""
    name: str
    factories: List[Dict[str, Any]]
    products: List[Dict[str, Any]]
    defect_types: List[Dict[str, Any]]
    vendors: List[Dict[str, Any]]
    shifts: List[Dict[str, Any]]


class DataGeneratorEngine:
    """
    Main engine for generating ERP/MES simulation data

    Features:
    - Time-based data generation with realistic patterns
    - Scenario-driven anomaly injection for AI testing
    - Correlation-aware data for root cause analysis
    - Support for V7 Intent AI use cases
    """

    def __init__(self, config: GenerationConfig):
        self.config = config

        # Initialize random seeds
        random.seed(config.random_seed)
        np.random.seed(config.random_seed)

        # Load configurations
        self.company = self._load_company_profile(config.company_profile_path)
        self.time_manager = TimeManager(config.time_config_path)
        self.scenario_manager = ScenarioManager(config.scenarios_path)
        self.correlation_engine = ManufacturingCorrelations.create_engine()

        # State tracking
        self.current_time: Optional[datetime] = None
        self.equipment_state: Dict[str, Dict[str, Any]] = {}
        self.material_state: Dict[str, Dict[str, Any]] = {}
        self.environment_state: Dict[str, float] = {}

        # Initialize states
        self._initialize_states()

    def _load_company_profile(self, path: str) -> CompanyProfile:
        """Load company profile from YAML"""
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)

        return CompanyProfile(
            name=data.get('company', {}).get('name', 'Unknown'),
            factories=data.get('factories', []),
            products=data.get('products', []),
            defect_types=data.get('defect_types', []),
            vendors=data.get('vendors', []),
            shifts=data.get('shifts', [])
        )

    def _initialize_states(self) -> None:
        """Initialize equipment and material states"""
        for factory in self.company.factories:
            for line in factory.get('lines', []):
                for equipment in line.get('equipment', []):
                    self.equipment_state[equipment['equipment_id']] = {
                        'status': 'RUN',
                        'run_hours': 0,
                        'mtbf': equipment.get('mtbf_hours', 800),
                        'temperature': 25.0,
                        'vibration': 0.5,
                        'last_maintenance': None,
                        'error_count': 0
                    }

        self.environment_state = {
            'temperature': 25.0,
            'humidity': 50.0,
            'temp_delta': 0.0
        }

    def generate_time_range(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generate data for a time range

        Yields:
            Dictionary containing all generated data for each time slot
        """
        for time_slot in self.time_manager.iterate_time_slots(start, end):
            self.current_time = time_slot.timestamp

            # Update environment
            self._update_environment(time_slot)

            # Generate data for each factory/line
            for factory in self.company.factories:
                for line in factory.get('lines', []):
                    data = self._generate_line_data(time_slot, factory, line)
                    yield data

    def _update_environment(self, time_slot: TimeSlot) -> None:
        """Update environment conditions based on time and scenarios"""
        # Base seasonal adjustments
        if time_slot.month in [6, 7, 8]:  # Summer
            base_temp = 28 + random.gauss(0, 2)
            base_humidity = 65 + random.gauss(0, 5)
        elif time_slot.month in [12, 1, 2]:  # Winter
            base_temp = 18 + random.gauss(0, 2)
            base_humidity = 40 + random.gauss(0, 5)
        else:
            base_temp = 23 + random.gauss(0, 2)
            base_humidity = 50 + random.gauss(0, 5)

        # Track temperature delta
        prev_temp = self.environment_state['temperature']
        self.environment_state['temperature'] = base_temp
        self.environment_state['humidity'] = max(30, min(80, base_humidity))
        self.environment_state['temp_delta'] = abs(base_temp - prev_temp)

    def _generate_line_data(
        self,
        time_slot: TimeSlot,
        factory: Dict[str, Any],
        line: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate data for a single production line"""
        line_id = line['line_id']

        # Build context for scenario evaluation
        context = self._build_context(line)

        # Base production data
        base_data = self._generate_base_production(time_slot, line)

        # Apply scenarios
        data_with_scenarios = self.scenario_manager.apply_scenarios(
            base_data, time_slot.timestamp, context, line_id
        )

        # Apply correlations
        final_data = self.correlation_engine.apply_correlations(data_with_scenarios)

        # Generate equipment data
        equipment_data = self._generate_equipment_data(time_slot, line, final_data)

        # Generate quality data
        quality_data = self._generate_quality_data(time_slot, line, final_data)

        return {
            'timestamp': time_slot.timestamp.isoformat(),
            'factory_id': factory['factory_id'],
            'line_id': line_id,
            'time_slot': {
                'shift': time_slot.shift.value,
                'is_working_day': time_slot.is_working_day,
                'production_factor': time_slot.production_factor,
                'quality_factor': time_slot.quality_factor
            },
            'production': final_data,
            'equipment': equipment_data,
            'quality': quality_data,
            'environment': self.environment_state.copy(),
            'active_scenarios': final_data.get('active_scenarios', [])
        }

    def _build_context(self, line: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for scenario evaluation"""
        line_equipment = line.get('equipment', [])
        equipment_states = {
            eq['equipment_id']: self.equipment_state.get(eq['equipment_id'], {})
            for eq in line_equipment
        }

        # Calculate run_hours/mtbf ratio for equipment
        for eq_id, state in equipment_states.items():
            mtbf = state.get('mtbf', 800)
            run_hours = state.get('run_hours', 0)
            state['run_hours_ratio'] = run_hours / mtbf if mtbf > 0 else 0

        return {
            'environment': self.environment_state,
            'equipment': equipment_states,
            'material': self.material_state
        }

    def _generate_base_production(
        self,
        time_slot: TimeSlot,
        line: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate base production data without scenarios"""
        capacity = line.get('capacity_per_hour', 3000)

        # Apply time-based factors
        effective_capacity = int(capacity * time_slot.production_factor)

        # Add random variation
        noise = random.gauss(0, 0.05)
        production_count = int(effective_capacity * (1 + noise))
        production_count = max(0, production_count)

        # Base defect rate (1.5%)
        base_defect_rate = 0.015 * time_slot.quality_factor
        defect_rate = base_defect_rate * (1 + random.gauss(0, 0.1))
        defect_rate = max(0.001, min(0.2, defect_rate))

        defect_count = int(production_count * defect_rate)
        good_count = production_count - defect_count

        # OEE components
        availability = 0.92 + random.gauss(0, 0.02)
        performance = 0.90 + random.gauss(0, 0.02)
        quality_rate = 1 - defect_rate

        return {
            'production_count': production_count,
            'good_count': good_count,
            'defect_count': defect_count,
            'defect_rate': defect_rate,
            'availability': max(0.5, min(1.0, availability)),
            'performance': max(0.5, min(1.0, performance)),
            'quality_rate': max(0.8, min(1.0, quality_rate)),
            'oee': availability * performance * quality_rate,
            'cycle_time': line.get('cycle_time', 15)
        }

    def _generate_equipment_data(
        self,
        time_slot: TimeSlot,
        line: Dict[str, Any],
        production_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate equipment status and sensor data"""
        equipment_list = []

        for equipment in line.get('equipment', []):
            eq_id = equipment['equipment_id']
            state = self.equipment_state.get(eq_id, {})

            # Update run hours
            if time_slot.is_working_day:
                state['run_hours'] = state.get('run_hours', 0) + 1

            # Check for active scenarios affecting this equipment
            sensor_patterns = production_data.get('sensor_patterns', {})

            # Generate sensor data
            base_temp = 250 if 'REFLOW' in eq_id else 25
            base_vibration = 0.5

            # Apply sensor pattern if scenario active
            temp_pattern = sensor_patterns.get('temperature', {})
            vib_pattern = sensor_patterns.get('vibration', {})

            if temp_pattern.get('pattern') == 'increasing':
                days_active = 1  # Would be calculated from scenario start
                daily_increase = temp_pattern.get('daily_increase', 0)
                base_temp += daily_increase * days_active

            if vib_pattern.get('pattern') == 'increasing':
                daily_increase = vib_pattern.get('daily_increase', 0)
                base_vibration += daily_increase

            # Add noise
            temperature = base_temp + random.gauss(0, 2)
            vibration = base_vibration + random.gauss(0, 0.05)

            state['temperature'] = temperature
            state['vibration'] = vibration

            # Update equipment state
            self.equipment_state[eq_id] = state

            equipment_list.append({
                'equipment_id': eq_id,
                'type': equipment['type'],
                'status': state.get('status', 'RUN'),
                'run_hours': state['run_hours'],
                'mtbf': equipment.get('mtbf_hours', 800),
                'temperature': round(temperature, 1),
                'vibration': round(vibration, 3),
                'run_hours_ratio': state['run_hours'] / equipment.get('mtbf_hours', 800)
            })

        return equipment_list

    def _generate_quality_data(
        self,
        time_slot: TimeSlot,
        line: Dict[str, Any],
        production_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate quality/defect data"""
        defect_count = production_data.get('defect_count', 0)

        if defect_count == 0:
            return {
                'inspection_count': production_data.get('production_count', 0),
                'pass_count': production_data.get('production_count', 0),
                'fail_count': 0,
                'defects_by_type': {}
            }

        # Distribute defects by type based on base rates
        defects_by_type = {}
        remaining_defects = defect_count

        for defect_type in self.company.defect_types:
            code = defect_type['code']
            base_rate = defect_type.get('base_rate', 0.1)

            # Check if scenario affects specific defect type
            affected_defect = production_data.get('dominant_defect')
            if affected_defect == code:
                type_count = int(defect_count * 0.5)  # 50% of defects
            else:
                type_count = int(remaining_defects * base_rate * random.uniform(0.8, 1.2))

            type_count = min(type_count, remaining_defects)
            if type_count > 0:
                defects_by_type[code] = type_count
                remaining_defects -= type_count

        return {
            'inspection_count': production_data.get('production_count', 0),
            'pass_count': production_data.get('good_count', 0),
            'fail_count': defect_count,
            'defects_by_type': defects_by_type,
            'defect_rate': production_data.get('defect_rate', 0)
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of generator configuration"""
        return {
            'company': self.company.name,
            'factories': len(self.company.factories),
            'products': len(self.company.products),
            'time_config': self.time_manager.get_simulation_summary(),
            'scenarios': self.scenario_manager.get_scenario_summary(),
            'random_seed': self.config.random_seed
        }

    def get_scenarios_for_ai_testing(self, use_case: AIUseCase) -> List[Dict[str, Any]]:
        """
        Get scenarios designed for testing a specific AI use case

        Args:
            use_case: V7 Intent AI use case

        Returns:
            List of scenario configurations for the AI use case
        """
        scenarios = self.scenario_manager.get_scenarios_for_ai_use_case(use_case)

        return [
            {
                'id': s.id,
                'name': s.name,
                'description': s.description,
                'trigger': {
                    'type': s.trigger.type.value,
                    'start_date': s.trigger.start_date.isoformat() if s.trigger.start_date else None,
                    'condition': s.trigger.condition
                },
                'expected_response': s.expected_ai_response
            }
            for s in scenarios
        ]
