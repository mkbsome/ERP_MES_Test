"""
Generator API Router
"""
from fastapi import APIRouter
from .scenarios import router as scenarios_router
from .jobs import router as jobs_router
from .config import router as config_router
from .websocket import router as ws_router
from .realtime_scenarios import router as realtime_scenarios_router

router = APIRouter(prefix="/generator", tags=["Generator"])

router.include_router(scenarios_router)
router.include_router(jobs_router)
router.include_router(config_router)
router.include_router(ws_router)
router.include_router(realtime_scenarios_router)
