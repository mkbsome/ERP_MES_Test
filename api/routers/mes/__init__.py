# MES API Routers
from api.routers.mes.production import router as production_router
from api.routers.mes.equipment import router as equipment_router
from api.routers.mes.quality import router as quality_router
from api.routers.mes.material import router as material_router
from api.routers.mes.master import router as mes_master_router
from api.routers.mes.interface import router as interface_router
from api.routers.mes.system import router as system_router

__all__ = [
    "production_router",
    "equipment_router",
    "quality_router",
    "material_router",
    "mes_master_router",
    "interface_router",
    "system_router",
]
