"""
Dashboard API Router
- ERP Dashboard KPIs
- MES Dashboard KPIs
"""
from fastapi import APIRouter

from api.routers.dashboard.erp import router as erp_dashboard_router
from api.routers.dashboard.mes import router as mes_dashboard_router

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

router.include_router(erp_dashboard_router)
router.include_router(mes_dashboard_router)
