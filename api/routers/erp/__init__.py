# ERP Routers
from api.routers.erp.master import router as master_router
from api.routers.erp.inventory import router as inventory_router
from api.routers.erp.sales import router as sales_router
from api.routers.erp.purchase import router as purchase_router
from api.routers.erp.accounting import router as accounting_router
from api.routers.erp.hr import router as hr_router

__all__ = [
    "master_router",
    "inventory_router",
    "sales_router",
    "purchase_router",
    "accounting_router",
    "hr_router",
]
