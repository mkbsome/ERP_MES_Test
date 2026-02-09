"""
Scenario Manager for Data Generation
Manages AI use case scenarios and applies them to base data
"""
from abc import ABC, abstractmethod
from datetime import datetime, date
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field
from enum import Enum
import yaml
import random
from pathlib import Path


class TriggerType(Enum):
    SCHEDULED = "scheduled"
    CONDITION = "condition"
    RANDOM = "random"
    ALWAYS = "always"


class AIUseCase(Enum):
    """V7 Intent based AI use cases"""
    CHECK = "CHECK"
    TREND = "TREND"
    COMPARE = "COMPARE"
    RANK = "RANK"
    FIND_CAUSE = "FIND_CAUSE"
    DETECT_ANOMALY = "DETECT_ANOMALY"
    PREDICT = "PREDICT"
    WHAT_IF = "WHAT_IF"
    REPORT = "REPORT"
    NOTIFY = "NOTIFY"


@dataclass
class ScenarioTrigger:
    """Scenario activation trigger"""
    type: TriggerType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    condition: Optional[str] = None
    probability: Optional[float] = None


@dataclass
class ScenarioEffect:
    """Effects applied by a scenario"""
    affected_metrics: Dict[str, float] = field(default_factory=dict)
    affected_entities: List[str] = field(default_factory=list)
    correlation_data: Dict[str, Any] = field(default_factory=dict)
    additional_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Scenario:
    """Scenario definition"""
    id: str
    name: str
    description: str
    enabled: bool
    ai_use_cases: List[AIUseCase]
    trigger: ScenarioTrigger
    target: Dict[str, Any]
    parameters: Dict[str, Any]
    correlation: Dict[str, Any]
    expected_ai_response: Dict[str, Any]

    def is_active(self, current_time: datetime, context: Dict[str, Any]) -> bool:
        """Check if scenario is active at given time with given context"""
        if not self.enabled:
            return False

        trigger = self.trigger

        if trigger.type == TriggerType.ALWAYS:
            return True

        elif trigger.type == TriggerType.SCHEDULED:
            if trigger.start_date and trigger.duration_days:
                end_date = trigger.start_date
                from datetime import timedelta
                end_date = trigger.start_date + timedelta(days=trigger.duration_days)
                return trigger.start_date <= current_time.date() <= end_date
            return False

        elif trigger.type == TriggerType.RANDOM:
            if trigger.probability:
                return random.random() < trigger.probability
            return False

        elif trigger.type == TriggerType.CONDITION:
            if trigger.condition:
                return self._evaluate_condition(trigger.condition, context)
            return False

        return False

    def _evaluate_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """Evaluate condition string against context"""
        try:
            # Create safe evaluation environment
            safe_dict = {
                'humidity': context.get('environment', {}).get('humidity', 50),
                'temperature': context.get('environment', {}).get('temperature', 25),
                'run_hours': context.get('equipment', {}).get('run_hours', 0),
                'mtbf': context.get('equipment', {}).get('mtbf', 1000),
                'inventory_level': context.get('material', {}).get('inventory_level', 100),
                'safety_stock': context.get('material', {}).get('safety_stock', 50),
                'temp_delta': context.get('environment', {}).get('temp_delta', 0),
            }

            # Simple condition evaluation (production-ready would use safer parsing)
            return eval(condition, {"__builtins__": {}}, safe_dict)
        except Exception:
            return False

    def get_effect(self, current_time: datetime, context: Dict[str, Any]) -> ScenarioEffect:
        """Calculate scenario effect"""
        effect = ScenarioEffect()

        # Apply parameter-based effects
        params = self.parameters

        # Quality scenarios
        if 'spike_defect_rate' in params:
            effect.affected_metrics['defect_rate'] = params['spike_defect_rate']
        if 'defect_rate_multiplier' in params:
            effect.affected_metrics['defect_rate_multiplier'] = params['defect_rate_multiplier']
        if 'defect_increase_factor' in params:
            effect.affected_metrics['defect_increase_factor'] = params['defect_increase_factor']

        # Equipment scenarios
        if 'availability_drop' in params:
            effect.affected_metrics['availability_drop'] = params['availability_drop']
        if 'performance_drop' in params:
            effect.affected_metrics['performance_drop'] = params['performance_drop']

        # Sensor patterns
        if 'sensor_patterns' in params:
            effect.additional_data['sensor_patterns'] = params['sensor_patterns']

        # Target entities
        target = self.target
        if 'lines' in target:
            effect.affected_entities.extend(target['lines'])
        if 'equipment' in target:
            effect.affected_entities.extend(target['equipment'])
        if 'all_lines' in target and target['all_lines']:
            effect.additional_data['all_lines'] = True

        # Correlation data
        effect.correlation_data = self.correlation.copy()

        return effect


class ScenarioManager:
    """Manages all scenarios for data generation"""

    def __init__(self, config_path: Optional[str] = None):
        self.scenarios: Dict[str, Scenario] = {}
        self.active_scenarios: Set[str] = set()
        self.random_seed: int = 42

        if config_path:
            self.load_config(config_path)

    def load_config(self, config_path: str) -> None:
        """Load scenario configuration from YAML file"""
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)

        # Global settings
        settings = config.get('settings', {})
        self.random_seed = settings.get('random_seed', 42)
        random.seed(self.random_seed)

        # Load scenarios by category
        for category in ['quality_scenarios', 'equipment_scenarios',
                         'material_scenarios', 'production_scenarios',
                         'environment_scenarios']:
            scenarios_dict = config.get(category, {})
            for scenario_id, scenario_data in scenarios_dict.items():
                self._parse_scenario(f"{category}.{scenario_id}", scenario_data)

        # Load correlation rules
        self.correlation_rules = config.get('correlation_rules', {})

    def _parse_scenario(self, scenario_id: str, data: Dict[str, Any]) -> None:
        """Parse scenario data into Scenario object"""
        trigger_data = data.get('trigger', {})
        trigger = ScenarioTrigger(
            type=TriggerType(trigger_data.get('type', 'always')),
            start_date=self._parse_date(trigger_data.get('start_date')),
            duration_days=trigger_data.get('duration_days'),
            condition=trigger_data.get('condition'),
            probability=trigger_data.get('probability')
        )

        # Parse AI use cases
        use_cases = [
            AIUseCase(uc) for uc in data.get('ai_use_cases', [])
            if uc in [e.value for e in AIUseCase]
        ]

        scenario = Scenario(
            id=scenario_id,
            name=data.get('name', scenario_id),
            description=data.get('description', ''),
            enabled=data.get('enabled', True),
            ai_use_cases=use_cases,
            trigger=trigger,
            target=data.get('target', {}),
            parameters=data.get('parameters', {}),
            correlation=data.get('correlation', {}),
            expected_ai_response=data.get('expected_ai_response', {})
        )

        self.scenarios[scenario_id] = scenario

    def _parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse date string to date object"""
        if date_str:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        return None

    def get_active_scenarios(
        self,
        current_time: datetime,
        context: Dict[str, Any],
        target_entity: Optional[str] = None,
        ai_use_case: Optional[AIUseCase] = None
    ) -> List[Scenario]:
        """
        Get list of active scenarios for given time and context

        Args:
            current_time: Current simulation time
            context: Context data (environment, equipment status, etc.)
            target_entity: Optional entity to filter by (line_id, equipment_id)
            ai_use_case: Optional AI use case to filter by

        Returns:
            List of active scenarios
        """
        active = []

        for scenario in self.scenarios.values():
            if not scenario.is_active(current_time, context):
                continue

            # Filter by target entity
            if target_entity:
                target = scenario.target
                entities = (
                    target.get('lines', []) +
                    target.get('equipment', []) +
                    target.get('materials', [])
                )
                if entities and target_entity not in entities:
                    if not target.get('all_lines', False):
                        continue

            # Filter by AI use case
            if ai_use_case and ai_use_case not in scenario.ai_use_cases:
                continue

            active.append(scenario)

        return active

    def apply_scenarios(
        self,
        base_data: Dict[str, Any],
        current_time: datetime,
        context: Dict[str, Any],
        target_entity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Apply active scenarios to base data

        Args:
            base_data: Original data to modify
            current_time: Current simulation time
            context: Context data
            target_entity: Optional entity filter

        Returns:
            Modified data with scenario effects applied
        """
        result = base_data.copy()

        active_scenarios = self.get_active_scenarios(
            current_time, context, target_entity
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(current_time, context)
            result = self._apply_effect(result, effect, scenario)

        return result

    def _apply_effect(
        self,
        data: Dict[str, Any],
        effect: ScenarioEffect,
        scenario: Scenario
    ) -> Dict[str, Any]:
        """Apply a single scenario effect to data"""
        result = data.copy()

        # Apply defect rate modifications
        if 'defect_rate' in effect.affected_metrics:
            result['defect_rate'] = effect.affected_metrics['defect_rate']
        elif 'defect_rate_multiplier' in effect.affected_metrics:
            base_rate = result.get('defect_rate', 0.015)
            result['defect_rate'] = base_rate * effect.affected_metrics['defect_rate_multiplier']

        # Apply OEE modifications
        if 'availability_drop' in effect.affected_metrics:
            base_avail = result.get('availability', 0.92)
            result['availability'] = base_avail - effect.affected_metrics['availability_drop']
        if 'performance_drop' in effect.affected_metrics:
            base_perf = result.get('performance', 0.90)
            result['performance'] = base_perf - effect.affected_metrics['performance_drop']

        # Add scenario metadata
        if 'active_scenarios' not in result:
            result['active_scenarios'] = []
        result['active_scenarios'].append({
            'id': scenario.id,
            'name': scenario.name,
            'correlation': effect.correlation_data
        })

        # Add additional data
        result.update(effect.additional_data)

        return result

    def get_scenarios_for_ai_use_case(self, use_case: AIUseCase) -> List[Scenario]:
        """Get all scenarios that support a specific AI use case"""
        return [
            s for s in self.scenarios.values()
            if use_case in s.ai_use_cases and s.enabled
        ]

    def enable_scenario(self, scenario_id: str) -> None:
        """Enable a specific scenario"""
        if scenario_id in self.scenarios:
            self.scenarios[scenario_id].enabled = True

    def disable_scenario(self, scenario_id: str) -> None:
        """Disable a specific scenario"""
        if scenario_id in self.scenarios:
            self.scenarios[scenario_id].enabled = False

    def get_scenario_summary(self) -> Dict[str, Any]:
        """Get summary of all scenarios"""
        summary = {
            'total': len(self.scenarios),
            'enabled': sum(1 for s in self.scenarios.values() if s.enabled),
            'by_category': {},
            'by_ai_use_case': {}
        }

        for scenario_id, scenario in self.scenarios.items():
            # By category
            category = scenario_id.split('.')[0]
            if category not in summary['by_category']:
                summary['by_category'][category] = []
            summary['by_category'][category].append({
                'id': scenario_id,
                'name': scenario.name,
                'enabled': scenario.enabled
            })

            # By AI use case
            for use_case in scenario.ai_use_cases:
                if use_case.value not in summary['by_ai_use_case']:
                    summary['by_ai_use_case'][use_case.value] = []
                summary['by_ai_use_case'][use_case.value].append(scenario_id)

        return summary
