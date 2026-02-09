"""
FastAPI Application Entry Point
GreenBoard Electronics ERP/MES Simulator API
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.database import init_db, close_db
from api.routers.mes.production import router as production_router
from api.routers.mes.equipment import router as equipment_router
from api.routers.mes.quality import router as quality_router
from api.routers.mes.material import router as material_router
from api.routers.mes.master import router as mes_master_router
from api.routers.mes.interface import router as interface_router
from api.routers.mes.system import router as system_router
from api.routers.erp.master import router as erp_master_router
from api.routers.erp.inventory import router as erp_inventory_router
from api.routers.erp.sales import router as erp_sales_router
from api.routers.erp.purchase import router as erp_purchase_router
from api.routers.erp.production import router as erp_production_router
from api.routers.erp.accounting import router as accounting_router
from api.routers.erp.hr import router as hr_router
from api.routers.dashboard import router as dashboard_router
from api.routers.generator import router as generator_router
from api.websocket.handlers import router as websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    # await init_db()  # Uncomment to auto-create tables
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## GreenBoard Electronics ERP/MES API

    Enterprise Resource Planning & Manufacturing Execution System API for PCB/SMT production management.

    ### Features
    - **Dashboard**: ERP/MES KPIs, real-time monitoring
    - **Production Management**: Work orders, production results, realtime monitoring
    - **Equipment Management**: Equipment status, OEE, downtime tracking
    - **Quality Management**: Inspections, defect analysis, SPC, traceability
    - **Material Management**: Feeder setup, consumption, requests, inventory
    - **Master Data**: Products, customers, vendors, BOM, routing

    ### Dashboard APIs
    - ERP Dashboard: /api/v1/dashboard/erp
    - MES Dashboard: /api/v1/dashboard/mes

    ### MES Modules
    - 생산관리 (Production Management)
    - 설비관리 (Equipment Management)
    - 품질관리 (Quality Management)
    - 자재관리 (Material Management)
    - 기준정보관리 (Master Data)
    - I/F연계 (Interface)
    - 시스템관리 (System Management)

    ### ERP Modules
    - 기준정보 (Master Data)
    - 재고관리 (Inventory)
    - 영업관리 (Sales)
    - 구매관리 (Purchase)
    - 생산관리 (Production - BOM/Routing)
    - 회계관리 (Accounting)
    - 인사급여관리 (HR & Payroll)
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS - Allow all localhost origins for development
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dashboard routes (대시보드 API)
app.include_router(dashboard_router, prefix="/api/v1")

# Include MES routers
app.include_router(production_router, prefix="/api/v1/mes")
app.include_router(equipment_router, prefix="/api/v1/mes")
app.include_router(quality_router, prefix="/api/v1/mes")
app.include_router(material_router, prefix="/api/v1/mes")
app.include_router(mes_master_router, prefix="/api/v1/mes")
app.include_router(interface_router, prefix="/api/v1/mes")
app.include_router(system_router, prefix="/api/v1/mes")

# Include ERP routers
app.include_router(erp_master_router, prefix="/api/v1/erp")
app.include_router(erp_inventory_router, prefix="/api/v1/erp")
app.include_router(erp_sales_router, prefix="/api/v1/erp")
app.include_router(erp_purchase_router, prefix="/api/v1/erp")
app.include_router(erp_production_router, prefix="/api/v1/erp")
app.include_router(accounting_router, prefix="/api/v1/erp")
app.include_router(hr_router, prefix="/api/v1/erp")

# Generator routes (데이터 생성기 API)
app.include_router(generator_router, prefix="/api/v1")

# WebSocket routes
app.include_router(websocket_router)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "api_prefix": "/api/v1",
        "modules": {
            "dashboard": {
                "erp": "/api/v1/dashboard/erp",
                "mes": "/api/v1/dashboard/mes",
            },
            "mes": {
                "production": "/api/v1/mes/production",
                "equipment": "/api/v1/mes/equipment",
                "quality": "/api/v1/mes/quality",
                "material": "/api/v1/mes/material",
                "master": "/api/v1/mes/master",
                "interface": "/api/v1/mes/interface",
                "system": "/api/v1/mes/system",
            },
            "erp": {
                "master": "/api/v1/erp/master",
                "inventory": "/api/v1/erp/inventory",
                "sales": "/api/v1/erp/sales",
                "purchase": "/api/v1/erp/purchase",
                "production": "/api/v1/erp/production",
                "accounting": "/api/v1/erp/accounting",
                "hr": "/api/v1/erp/hr",
            },
            "generator": {
                "scenarios": "/api/v1/generator/scenarios",
                "jobs": "/api/v1/generator/jobs",
                "config": "/api/v1/generator/config",
                "websocket": "/api/v1/generator/ws/generator",
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
