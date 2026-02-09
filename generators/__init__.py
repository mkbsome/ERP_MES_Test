"""
ERP/MES Data Simulator
GreenBoard Electronics - PCB Manufacturing Simulation

AI Use Case driven data generation engine for:
- Judgment Engine testing (Quality, Equipment, RCA)
- BI Service testing (Trend, Compare, Rank, Anomaly)
- Workflow Service testing (Alerts, Automation)

Modules:
- core: Time management, scenario management, correlation engine
- mes: Production, equipment, quality, material generators
- erp: Sales, purchase, inventory, accounting, HR generators
- runner: Main orchestrator for data generation

Usage:
    from generators.runner import DataGeneratorRunner

    runner = DataGeneratorRunner(config_dir='generators/config')
    runner.generate_all()
    runner.save_to_json('output/')
"""

__version__ = "2.0.0"
__author__ = "SolutionTree"

# Core components
from generators.core.engine import DataGeneratorEngine
from generators.core.scenario_manager import ScenarioManager, AIUseCase
from generators.core.correlation_engine import CorrelationEngine, ManufacturingCorrelations
from generators.core.time_manager import TimeManager

# MES generators
from generators.mes import (
    ProductionDataGenerator,
    EquipmentDataGenerator,
    QualityDataGenerator,
    MaterialDataGenerator
)

# ERP generators
from generators.erp import (
    SalesDataGenerator,
    PurchaseDataGenerator,
    InventoryDataGenerator,
    AccountingDataGenerator,
    HRDataGenerator
)

# Main runner
from generators.runner import DataGeneratorRunner

__all__ = [
    # Core
    'DataGeneratorEngine',
    'ScenarioManager',
    'AIUseCase',
    'CorrelationEngine',
    'ManufacturingCorrelations',
    'TimeManager',

    # MES
    'ProductionDataGenerator',
    'EquipmentDataGenerator',
    'QualityDataGenerator',
    'MaterialDataGenerator',

    # ERP
    'SalesDataGenerator',
    'PurchaseDataGenerator',
    'InventoryDataGenerator',
    'AccountingDataGenerator',
    'HRDataGenerator',

    # Runner
    'DataGeneratorRunner'
]
