"""
Correlation Engine for Data Generation
Maintains realistic correlations between different data points
"""
from dataclasses import dataclass
from typing import Dict, Any, List, Callable, Optional
from enum import Enum
import math
import yaml


class CorrelationType(Enum):
    LINEAR = "linear"
    MULTIPLICATIVE = "multiplicative"
    THRESHOLD = "threshold"
    EXPONENTIAL = "exponential"
    STEP = "step"


@dataclass
class Correlation:
    """Definition of a correlation between two metrics"""
    source_path: str  # e.g., "equipment.temperature"
    target_path: str  # e.g., "defect_rate"
    correlation_type: CorrelationType
    parameters: Dict[str, float]


class CorrelationEngine:
    """
    Maintains correlations between data points for realistic simulation

    Correlation types:
    - linear: target = source * coefficient + intercept
    - multiplicative: target *= factor
    - threshold: apply factor if source > threshold
    - exponential: target = base^((source - reference) * scale)
    - step: apply different factors based on value ranges
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.correlations: List[Correlation] = []

        if config:
            self._load_config(config)

    def _load_config(self, config: Dict[str, Any]) -> None:
        """Load correlations from configuration"""
        correlation_rules = config.get('correlation_rules', {})

        for category, rules in correlation_rules.items():
            for rule in rules:
                correlation = Correlation(
                    source_path=rule['source'],
                    target_path=rule['target'],
                    correlation_type=CorrelationType(rule['correlation_type']),
                    parameters=rule.get('parameters', {})
                )
                self.correlations.append(correlation)

    def add_correlation(
        self,
        source: str,
        target: str,
        corr_type: CorrelationType,
        parameters: Dict[str, float]
    ) -> None:
        """Add a new correlation rule"""
        correlation = Correlation(
            source_path=source,
            target_path=target,
            correlation_type=corr_type,
            parameters=parameters
        )
        self.correlations.append(correlation)

    def apply_correlations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply all correlations to the data

        Args:
            data: Input data dictionary

        Returns:
            Data with correlations applied
        """
        result = self._deep_copy(data)

        for correlation in self.correlations:
            source_value = self._get_nested_value(result, correlation.source_path)

            if source_value is not None:
                effect = self._calculate_effect(source_value, correlation)
                result = self._apply_effect(result, correlation.target_path, effect, correlation)

        return result

    def _calculate_effect(self, source_value: float, correlation: Correlation) -> float:
        """Calculate the correlation effect"""
        params = correlation.parameters
        corr_type = correlation.correlation_type

        if corr_type == CorrelationType.LINEAR:
            coefficient = params.get('coefficient', 1.0)
            intercept = params.get('intercept', 0.0)
            return source_value * coefficient + intercept

        elif corr_type == CorrelationType.MULTIPLICATIVE:
            # Get factor based on source value (e.g., grade mapping)
            if isinstance(params, dict):
                # Check if source value matches any key
                for key, factor in params.items():
                    if str(source_value) == str(key):
                        return factor
            return params.get('factor', 1.0)

        elif corr_type == CorrelationType.THRESHOLD:
            threshold = params.get('threshold', 0)
            below_factor = params.get('below_factor', params.get('below_threshold_factor', 1.0))
            above_factor = params.get('above_factor', params.get('above_threshold_factor', 1.0))

            if source_value > threshold:
                return above_factor
            return below_factor

        elif corr_type == CorrelationType.EXPONENTIAL:
            base = params.get('base', math.e)
            reference = params.get('reference', 0)
            scale = params.get('scale', 1.0)

            delta = (source_value - reference) * scale
            return base ** delta

        elif corr_type == CorrelationType.STEP:
            steps = params.get('steps', [])
            for step in steps:
                if source_value <= step.get('max', float('inf')):
                    return step.get('factor', 1.0)
            return 1.0

        return 1.0

    def _apply_effect(
        self,
        data: Dict[str, Any],
        target_path: str,
        effect: float,
        correlation: Correlation
    ) -> Dict[str, Any]:
        """Apply the calculated effect to the target"""
        result = data

        # Parse target path
        parts = target_path.split('.')

        # Navigate to parent
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]

        # Get final key
        final_key = parts[-1]

        # Apply effect based on correlation type
        if correlation.correlation_type == CorrelationType.MULTIPLICATIVE:
            # Multiply existing value
            if final_key in current:
                current[final_key] = current[final_key] * effect
            else:
                current[final_key] = effect
        elif correlation.correlation_type == CorrelationType.LINEAR:
            # Add to existing value or set
            if final_key in current:
                current[final_key] = current[final_key] + effect
            else:
                current[final_key] = effect
        else:
            # For threshold/exponential, multiply
            if final_key in current:
                current[final_key] = current[final_key] * effect
            else:
                current[final_key] = effect

        return result

    def _get_nested_value(self, data: Dict[str, Any], path: str) -> Optional[Any]:
        """Get nested value from dictionary using dot notation"""
        parts = path.split('.')
        current = data

        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None

        return current

    def _set_nested_value(self, data: Dict[str, Any], path: str, value: Any) -> None:
        """Set nested value in dictionary using dot notation"""
        parts = path.split('.')
        current = data

        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]

        current[parts[-1]] = value

    def _deep_copy(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a deep copy of dictionary"""
        import copy
        return copy.deepcopy(data)

    def get_correlations_for_target(self, target_path: str) -> List[Correlation]:
        """Get all correlations that affect a specific target"""
        return [c for c in self.correlations if c.target_path == target_path]

    def get_correlations_from_source(self, source_path: str) -> List[Correlation]:
        """Get all correlations that originate from a specific source"""
        return [c for c in self.correlations if c.source_path == source_path]

    def explain_correlation(self, source_value: float, correlation: Correlation) -> Dict[str, Any]:
        """Generate explanation for a correlation calculation"""
        effect = self._calculate_effect(source_value, correlation)

        return {
            'source': correlation.source_path,
            'source_value': source_value,
            'target': correlation.target_path,
            'correlation_type': correlation.correlation_type.value,
            'parameters': correlation.parameters,
            'calculated_effect': effect,
            'explanation': self._generate_explanation(source_value, effect, correlation)
        }

    def _generate_explanation(
        self,
        source_value: float,
        effect: float,
        correlation: Correlation
    ) -> str:
        """Generate human-readable explanation"""
        params = correlation.parameters
        corr_type = correlation.correlation_type

        if corr_type == CorrelationType.THRESHOLD:
            threshold = params.get('threshold', 0)
            if source_value > threshold:
                return f"{correlation.source_path}({source_value}) > threshold({threshold}): applying factor {effect}"
            return f"{correlation.source_path}({source_value}) <= threshold({threshold}): no effect"

        elif corr_type == CorrelationType.EXPONENTIAL:
            reference = params.get('reference', 0)
            return f"{correlation.source_path}({source_value}) deviates {source_value - reference} from reference({reference}): effect = {effect:.3f}"

        elif corr_type == CorrelationType.LINEAR:
            coeff = params.get('coefficient', 1.0)
            return f"{correlation.source_path}({source_value}) * {coeff} = {effect:.3f}"

        elif corr_type == CorrelationType.MULTIPLICATIVE:
            return f"Applying factor {effect} based on {correlation.source_path} = {source_value}"

        return f"Effect: {effect}"


# Pre-defined correlation sets for common manufacturing scenarios
class ManufacturingCorrelations:
    """Pre-defined correlations for PCB/SMT manufacturing"""

    @staticmethod
    def get_smt_correlations() -> List[Dict[str, Any]]:
        """Get standard SMT manufacturing correlations"""
        return [
            # Temperature → Defect Rate
            {
                'source': 'equipment.temperature',
                'target': 'defect_rate',
                'correlation_type': 'threshold',
                'parameters': {
                    'threshold': 270,
                    'below_factor': 1.0,
                    'above_factor': 1.5
                }
            },
            # Vibration → Defect Rate
            {
                'source': 'equipment.vibration',
                'target': 'defect_rate',
                'correlation_type': 'linear',
                'parameters': {
                    'coefficient': 0.02,
                    'intercept': 1.0
                }
            },
            # Humidity → Tombstone Defect
            {
                'source': 'environment.humidity',
                'target': 'defect.TOMBSTONE',
                'correlation_type': 'exponential',
                'parameters': {
                    'base': 1.02,
                    'reference': 50,
                    'scale': 1.0
                }
            },
            # Run Hours / MTBF → Failure Probability
            {
                'source': 'equipment.run_hours_ratio',
                'target': 'equipment.failure_probability',
                'correlation_type': 'exponential',
                'parameters': {
                    'base': 2.0,
                    'scale': 1.0,
                    'reference': 0
                }
            },
            # Vendor Quality Grade → Defect Rate
            {
                'source': 'material.vendor_quality_grade',
                'target': 'defect_rate',
                'correlation_type': 'multiplicative',
                'parameters': {
                    'A': 0.8,
                    'B': 1.0,
                    'C': 1.5
                }
            },
            # Stencil Print Count → Insufficient Solder
            {
                'source': 'equipment.stencil_print_count',
                'target': 'defect.INSUFFICIENT',
                'correlation_type': 'threshold',
                'parameters': {
                    'threshold': 10000,
                    'below_factor': 1.0,
                    'above_factor': 1.8
                }
            }
        ]

    @staticmethod
    def create_engine() -> CorrelationEngine:
        """Create a correlation engine with SMT manufacturing defaults"""
        config = {
            'correlation_rules': {
                'smt': ManufacturingCorrelations.get_smt_correlations()
            }
        }
        return CorrelationEngine(config)
