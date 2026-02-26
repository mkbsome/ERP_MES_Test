"""
Generator API Router

Architecture:
1. Base Data Generator - Creates realistic normal business flow data
2. Scenario Modifier - Modifies existing data to inject anomalies for AI testing
3. Realtime Scenarios - Legacy INSERT-based scenario execution
4. Realtime Simulation - Continuous real-time data generation with scenario injection

For AI anomaly detection testing:
- First use base_data to generate normal patterns
- Then use scenario_modifier to UPDATE existing records with anomalies
- OR use simulation for continuous real-time data generation
"""
from fastapi import APIRouter
from .scenarios import router as scenarios_router
from .jobs import router as jobs_router
from .config import router as config_router
from .websocket import router as ws_router
from .realtime_scenarios import router as realtime_scenarios_router
from .base_data import router as base_data_router
from .scenario_modifier import router as scenario_modifier_router
from .simulation import router as simulation_router

router = APIRouter(prefix="/generator", tags=["Generator"])

# Core data generation
router.include_router(base_data_router)  # NEW: Generate base normal data
router.include_router(scenario_modifier_router)  # NEW: Modify existing data

# Realtime simulation
router.include_router(simulation_router)  # NEW: Continuous real-time simulation

# Legacy scenario execution
router.include_router(scenarios_router)
router.include_router(jobs_router)
router.include_router(config_router)
router.include_router(ws_router)
router.include_router(realtime_scenarios_router)
