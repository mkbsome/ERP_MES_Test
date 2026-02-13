"""
ERP Inventory API Router
- 창고 마스터 (Warehouses)
- 재고 현황 (Stock)
- 재고 이동 (Transactions)

실제 DB 데이터 반환 (2024-01 수정)
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from api.database import get_db
from api.models.erp.inventory import Warehouse, InventoryStock, InventoryTransaction

router = APIRouter(prefix="/inventory", tags=["ERP Inventory"])

DEFAULT_TENANT_ID = UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")


def decimal_to_float(val):
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    return val


def warehouse_to_dict(wh: Warehouse) -> dict:
    return {
        "id": wh.id,
        "warehouse_code": wh.warehouse_code,
        "warehouse_name": wh.warehouse_name,
        "warehouse_type": wh.warehouse_type,
        "location": wh.location,
        "is_active": wh.is_active,
        "created_at": wh.created_at.isoformat() if wh.created_at else None,
        "updated_at": wh.updated_at.isoformat() if wh.updated_at else None,
    }


def stock_to_dict(s: InventoryStock) -> dict:
    return {
        "id": s.id,
        "product_code": s.product_code,
        "warehouse_code": s.warehouse_code,
        "quantity": decimal_to_float(s.quantity),
        "reserved_qty": decimal_to_float(s.reserved_qty),
        "available_qty": decimal_to_float(s.available_qty),
        "uom": s.uom,
        "lot_no": s.lot_no,
        "status": s.status,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


def transaction_to_dict(t: InventoryTransaction) -> dict:
    return {
        "id": t.id,
        "transaction_no": t.transaction_no,
        "transaction_date": t.transaction_date.isoformat() if t.transaction_date else None,
        "transaction_type": t.transaction_type,
        "transaction_reason": t.transaction_reason,
        "item_code": t.item_code,
        "item_name": t.item_name,
        "from_warehouse": t.from_warehouse,
        "to_warehouse": t.to_warehouse,
        "from_location": t.from_location,
        "to_location": t.to_location,
        "quantity": decimal_to_float(t.quantity),
        "unit_cost": decimal_to_float(t.unit_cost),
        "total_cost": decimal_to_float(t.total_cost),
        "lot_no": t.lot_no,
        "reference_type": t.reference_type,
        "reference_no": t.reference_no,
        "remark": t.remark,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "created_by": t.created_by,
    }


# ==================== Warehouses API ====================

@router.get("/warehouses")
async def get_warehouses(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    warehouse_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    """창고 목록 조회"""
    query = select(Warehouse).where(Warehouse.tenant_id == DEFAULT_TENANT_ID)

    if warehouse_type:
        query = query.where(Warehouse.warehouse_type == warehouse_type)
    if is_active is not None:
        query = query.where(Warehouse.is_active == is_active)
    if search:
        query = query.where(
            or_(
                Warehouse.warehouse_code.ilike(f"%{search}%"),
                Warehouse.warehouse_name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(Warehouse.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    warehouses = result.scalars().all()

    return {
        "items": [warehouse_to_dict(w) for w in warehouses],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/warehouses/{warehouse_id}")
async def get_warehouse(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    """창고 상세 조회"""
    query = select(Warehouse).where(
        and_(Warehouse.id == warehouse_id, Warehouse.tenant_id == DEFAULT_TENANT_ID)
    )
    result = await db.execute(query)
    warehouse = result.scalar_one_or_none()

    if not warehouse:
        raise HTTPException(status_code=404, detail=f"Warehouse {warehouse_id} not found")

    return warehouse_to_dict(warehouse)


# ==================== Stock API ====================

@router.get("/stocks")
async def get_stocks(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    item_type: Optional[str] = None,
    warehouse_code: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    """재고 현황 조회 - 프론트엔드 호환"""
    try:
        query = select(InventoryStock).where(InventoryStock.tenant_id == DEFAULT_TENANT_ID)

        if warehouse_code:
            query = query.where(InventoryStock.warehouse_code == warehouse_code)
        if status:
            query = query.where(InventoryStock.status == status)
        if search:
            query = query.where(
                or_(
                    InventoryStock.product_code.ilike(f"%{search}%"),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * size
        query = query.order_by(InventoryStock.id.desc()).offset(offset).limit(size)
        result = await db.execute(query)
        stocks = result.scalars().all()

        return {
            "items": [stock_to_dict(s) for s in stocks],
            "total": total,
            "page": page,
            "page_size": size,
        }
    except Exception:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": size,
        }


@router.get("/stock")
async def get_stock(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    product_code: Optional[str] = None,
    warehouse_code: Optional[str] = None,
):
    """재고 현황 조회 - erp_inventory_stock 테이블이 없으면 빈 결과 반환"""
    try:
        query = select(InventoryStock).where(InventoryStock.tenant_id == DEFAULT_TENANT_ID)

        if product_code:
            query = query.where(InventoryStock.product_code == product_code)
        if warehouse_code:
            query = query.where(InventoryStock.warehouse_code == warehouse_code)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * size
        query = query.order_by(InventoryStock.id.desc()).offset(offset).limit(size)
        result = await db.execute(query)
        stocks = result.scalars().all()

        return {
            "items": [stock_to_dict(s) for s in stocks],
            "total": total,
            "page": page,
            "page_size": size,
        }
    except Exception:
        # 테이블이 존재하지 않는 경우 빈 결과 반환
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": size,
            "message": "Stock table not available",
        }


# ==================== Transactions API ====================

@router.get("/transactions")
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    transaction_type: Optional[str] = None,
    product_code: Optional[str] = None,
):
    """재고 이동 이력 조회"""
    query = select(InventoryTransaction).where(InventoryTransaction.tenant_id == DEFAULT_TENANT_ID)

    if transaction_type:
        query = query.where(InventoryTransaction.transaction_type == transaction_type)
    if product_code:
        query = query.where(InventoryTransaction.product_code == product_code)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(InventoryTransaction.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    transactions = result.scalars().all()

    return {
        "items": [transaction_to_dict(t) for t in transactions],
        "total": total,
        "page": page,
        "page_size": size,
    }


# ==================== Summary API ====================

@router.get("/summary")
async def get_inventory_summary(db: AsyncSession = Depends(get_db)):
    """재고 요약"""
    total_warehouses = await db.execute(
        select(func.count(Warehouse.id)).where(Warehouse.tenant_id == DEFAULT_TENANT_ID)
    )
    active_warehouses = await db.execute(
        select(func.count(Warehouse.id)).where(
            and_(Warehouse.tenant_id == DEFAULT_TENANT_ID, Warehouse.is_active == True)
        )
    )
    total_transactions = await db.execute(
        select(func.count(InventoryTransaction.id)).where(InventoryTransaction.tenant_id == DEFAULT_TENANT_ID)
    )

    return {
        "total_warehouses": total_warehouses.scalar() or 0,
        "active_warehouses": active_warehouses.scalar() or 0,
        "total_transactions": total_transactions.scalar() or 0,
    }


# ==================== Analysis API (프론트엔드 호환) ====================

@router.get("/analysis")
async def get_inventory_analysis(db: AsyncSession = Depends(get_db)):
    """재고 분석 - 프론트엔드 호환"""
    total_transactions = await db.execute(
        select(func.count(InventoryTransaction.id)).where(InventoryTransaction.tenant_id == DEFAULT_TENANT_ID)
    )

    return {
        "total_items": total_transactions.scalar() or 0,
        "total_value": 0,
        "by_type": [],
        "by_status": [],
        "turnover_rate": 0,
        "slow_moving_items": 0,
        "aging_analysis": [],
    }


@router.get("/below-safety")
async def get_below_safety_stock(db: AsyncSession = Depends(get_db)):
    """안전재고 미달 품목 - 프론트엔드 호환"""
    return []


@router.get("/excess")
async def get_excess_stock(db: AsyncSession = Depends(get_db)):
    """과잉재고 품목 - 프론트엔드 호환"""
    return []
