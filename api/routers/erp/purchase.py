"""
ERP Purchase API Router
- 발주 (Purchase Orders)
- 입고 (Goods Receipts)

실제 DB 데이터 반환 (2024-01 수정)
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.erp.purchase import (
    PurchaseOrder, PurchaseOrderItem,
    GoodsReceipt, GoodsReceiptItem,
)

router = APIRouter(prefix="/purchase", tags=["ERP Purchase"])

DEFAULT_TENANT_ID = UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")


def decimal_to_float(val):
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    return val


def po_item_to_dict(item: PurchaseOrderItem) -> dict:
    return {
        "id": item.id,
        "po_id": item.po_id,
        "line_no": item.line_no,
        "product_id": item.product_id,
        "item_code": item.item_code,
        "item_name": item.item_name,
        "order_qty": decimal_to_float(item.order_qty),
        "received_qty": decimal_to_float(item.received_qty),
        "remaining_qty": decimal_to_float(item.remaining_qty),
        "unit_price": decimal_to_float(item.unit_price),
        "amount": decimal_to_float(item.amount),
        "expected_date": item.expected_date.isoformat() if item.expected_date else None,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def po_to_dict(po: PurchaseOrder) -> dict:
    return {
        "id": po.id,
        "po_no": po.po_no,
        "po_date": po.po_date.isoformat() if po.po_date else None,
        "vendor_id": po.vendor_id,
        "vendor_code": po.vendor_code,
        "vendor_name": po.vendor_name,
        "expected_date": po.expected_date.isoformat() if po.expected_date else None,
        "total_amount": decimal_to_float(po.total_amount),
        "tax_amount": decimal_to_float(po.tax_amount),
        "currency": po.currency,
        "payment_terms": po.payment_terms,
        "status": po.status,
        "remark": po.remark,
        "items": [po_item_to_dict(item) for item in po.items] if po.items else [],
        "created_at": po.created_at.isoformat() if po.created_at else None,
        "updated_at": po.updated_at.isoformat() if po.updated_at else None,
    }


def receipt_item_to_dict(item: GoodsReceiptItem) -> dict:
    return {
        "id": item.id,
        "receipt_id": item.receipt_id,
        "line_no": item.line_no,
        "po_item_id": item.po_item_id,
        "item_code": item.item_code,
        "item_name": item.item_name,
        "receipt_qty": decimal_to_float(item.receipt_qty),
        "accepted_qty": decimal_to_float(item.accepted_qty),
        "rejected_qty": decimal_to_float(item.rejected_qty),
        "unit_cost": decimal_to_float(item.unit_cost),
        "lot_no": item.lot_no,
        "inspection_result": item.inspection_result,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def receipt_to_dict(r: GoodsReceipt) -> dict:
    return {
        "id": r.id,
        "receipt_no": r.receipt_no,
        "receipt_date": r.receipt_date.isoformat() if r.receipt_date else None,
        "po_id": r.po_id,
        "po_no": r.po_no,
        "vendor_code": r.vendor_code,
        "vendor_name": r.vendor_name,
        "warehouse_code": r.warehouse_code,
        "status": r.status,
        "items": [receipt_item_to_dict(item) for item in r.items] if r.items else [],
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


# ==================== Purchase Orders API ====================

@router.get("/orders")
async def get_purchase_orders(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    status: Optional[str] = None,
    vendor_code: Optional[str] = None,
    search: Optional[str] = None,
):
    """발주 목록 조회"""
    query = select(PurchaseOrder).where(PurchaseOrder.tenant_id == DEFAULT_TENANT_ID)
    query = query.options(selectinload(PurchaseOrder.items))

    if status:
        query = query.where(PurchaseOrder.status == status)
    if vendor_code:
        query = query.where(PurchaseOrder.vendor_code == vendor_code)
    if search:
        query = query.where(
            or_(
                PurchaseOrder.po_no.ilike(f"%{search}%"),
                PurchaseOrder.vendor_name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count(PurchaseOrder.id)).where(PurchaseOrder.tenant_id == DEFAULT_TENANT_ID)
    if status:
        count_query = count_query.where(PurchaseOrder.status == status)
    if vendor_code:
        count_query = count_query.where(PurchaseOrder.vendor_code == vendor_code)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(PurchaseOrder.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    orders = result.scalars().unique().all()

    return {
        "items": [po_to_dict(o) for o in orders],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/orders/{order_id}")
async def get_purchase_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """발주 상세 조회"""
    query = select(PurchaseOrder).where(
        and_(PurchaseOrder.id == order_id, PurchaseOrder.tenant_id == DEFAULT_TENANT_ID)
    ).options(selectinload(PurchaseOrder.items))
    result = await db.execute(query)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail=f"Purchase Order {order_id} not found")

    return po_to_dict(order)


# ==================== Goods Receipts API ====================

@router.get("/receipts")
async def get_goods_receipts(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    status: Optional[str] = None,
    vendor_code: Optional[str] = None,
    search: Optional[str] = None,
):
    """입고 목록 조회"""
    query = select(GoodsReceipt).where(GoodsReceipt.tenant_id == DEFAULT_TENANT_ID)
    query = query.options(selectinload(GoodsReceipt.items))

    if status:
        query = query.where(GoodsReceipt.status == status)
    if vendor_code:
        query = query.where(GoodsReceipt.vendor_code == vendor_code)
    if search:
        query = query.where(
            or_(
                GoodsReceipt.receipt_no.ilike(f"%{search}%"),
                GoodsReceipt.vendor_name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count(GoodsReceipt.id)).where(GoodsReceipt.tenant_id == DEFAULT_TENANT_ID)
    if status:
        count_query = count_query.where(GoodsReceipt.status == status)
    if vendor_code:
        count_query = count_query.where(GoodsReceipt.vendor_code == vendor_code)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(GoodsReceipt.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    receipts = result.scalars().unique().all()

    return {
        "items": [receipt_to_dict(r) for r in receipts],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/receipts/{receipt_id}")
async def get_goods_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    """입고 상세 조회"""
    query = select(GoodsReceipt).where(
        and_(GoodsReceipt.id == receipt_id, GoodsReceipt.tenant_id == DEFAULT_TENANT_ID)
    ).options(selectinload(GoodsReceipt.items))
    result = await db.execute(query)
    receipt = result.scalar_one_or_none()

    if not receipt:
        raise HTTPException(status_code=404, detail=f"Goods Receipt {receipt_id} not found")

    return receipt_to_dict(receipt)


# ==================== Summary API ====================

@router.get("/summary")
async def get_purchase_summary(db: AsyncSession = Depends(get_db)):
    """구매 요약"""
    total_po = await db.execute(
        select(func.count(PurchaseOrder.id)).where(PurchaseOrder.tenant_id == DEFAULT_TENANT_ID)
    )
    total_receipts = await db.execute(
        select(func.count(GoodsReceipt.id)).where(GoodsReceipt.tenant_id == DEFAULT_TENANT_ID)
    )
    total_amount = await db.execute(
        select(func.sum(PurchaseOrder.total_amount)).where(PurchaseOrder.tenant_id == DEFAULT_TENANT_ID)
    )

    return {
        "total_purchase_orders": total_po.scalar() or 0,
        "total_goods_receipts": total_receipts.scalar() or 0,
        "total_purchase_amount": decimal_to_float(total_amount.scalar()) or 0,
    }
