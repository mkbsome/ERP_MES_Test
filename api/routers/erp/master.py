"""
ERP Master Data API Router
- 품목 마스터 (Products)
- 고객 마스터 (Customers)
- 공급업체 마스터 (Vendors)
- BOM (Bill of Materials)
- Routing (공정 경로)

실제 DB 데이터 반환 (2024-01 수정)
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from uuid import UUID
from decimal import Decimal
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.erp.master import (
    ProductMaster, CustomerMaster, VendorMaster,
    BOMHeader, BOMDetail, RoutingHeader, RoutingOperation,
)

router = APIRouter(prefix="/master", tags=["ERP Master Data"])

DEFAULT_TENANT_ID = UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")


# ==================== Helper Functions ====================

def decimal_to_float(val):
    """Decimal을 float으로 변환"""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    return val


def product_to_dict(p: ProductMaster) -> dict:
    return {
        "id": p.id,
        "product_code": p.product_code,
        "product_name": p.product_name,
        "product_type": p.product_type,
        "product_group": p.product_group,
        "uom": p.uom,
        "standard_cost": decimal_to_float(p.standard_cost),
        "selling_price": decimal_to_float(p.selling_price),
        "safety_stock": decimal_to_float(p.safety_stock),
        "lead_time_days": p.lead_time_days,
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def customer_to_dict(c: CustomerMaster) -> dict:
    return {
        "id": c.id,
        "customer_code": c.customer_code,
        "customer_name": c.customer_name,
        "customer_type": c.customer_type,
        "customer_grade": c.customer_grade,
        "business_no": c.business_no,
        "ceo_name": c.ceo_name,
        "address": c.address,
        "phone": c.phone,
        "email": c.email,
        "credit_limit": decimal_to_float(c.credit_limit),
        "payment_terms": c.payment_terms,
        "is_active": c.is_active,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }


def vendor_to_dict(v: VendorMaster) -> dict:
    return {
        "id": v.id,
        "vendor_code": v.vendor_code,
        "vendor_name": v.vendor_name,
        "vendor_type": v.vendor_type,
        "vendor_grade": v.vendor_grade,
        "business_no": v.business_no,
        "ceo_name": v.ceo_name,
        "address": v.address,
        "phone": v.phone,
        "email": v.email,
        "payment_terms": v.payment_terms,
        "is_active": v.is_active,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "updated_at": v.updated_at.isoformat() if v.updated_at else None,
    }


def bom_detail_to_dict(d: BOMDetail) -> dict:
    return {
        "id": d.id,
        "header_id": d.header_id,
        "item_seq": d.item_seq,
        "component_code": d.component_code,
        "component_name": d.component_name,
        "quantity": decimal_to_float(d.quantity),
        "uom": d.uom,
        "position": d.position,
        "alternative_item": d.alternative_item,
        "scrap_rate": decimal_to_float(d.scrap_rate),
        "is_critical": d.is_critical,
        "is_phantom": d.is_phantom,
        "remarks": d.remarks,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


def bom_header_to_dict(h: BOMHeader) -> dict:
    return {
        "id": h.id,
        "bom_no": h.bom_no,
        "product_id": h.product_id,
        "product_code": h.product_code,
        "bom_version": h.bom_version,
        "effective_date": h.effective_date.isoformat() if h.effective_date else None,
        "expiry_date": h.expiry_date.isoformat() if h.expiry_date else None,
        "is_active": h.is_active,
        "is_approved": h.is_approved,
        "approved_by": h.approved_by,
        "approved_at": h.approved_at.isoformat() if h.approved_at else None,
        "remarks": h.remarks,
        "details": [bom_detail_to_dict(d) for d in h.details] if h.details else [],
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


def routing_operation_to_dict(op: RoutingOperation) -> dict:
    return {
        "id": op.id,
        "header_id": op.header_id,
        "operation_seq": op.operation_seq,
        "operation_code": op.operation_code,
        "operation_name": op.operation_name,
        "work_center_code": op.work_center_code,
        "work_center_name": op.work_center_name,
        "line_code": op.line_code,
        "setup_time": decimal_to_float(op.setup_time),
        "run_time": decimal_to_float(op.run_time),
        "wait_time": decimal_to_float(op.wait_time),
        "move_time": decimal_to_float(op.move_time),
        "standard_qty": op.standard_qty,
        "capacity_per_hour": decimal_to_float(op.capacity_per_hour),
        "labor_rate": decimal_to_float(op.labor_rate),
        "machine_rate": decimal_to_float(op.machine_rate),
        "inspection_required": op.inspection_required,
        "inspection_type": op.inspection_type,
        "description": op.description,
        "remarks": op.remarks,
        "created_at": op.created_at.isoformat() if op.created_at else None,
    }


def routing_header_to_dict(h: RoutingHeader) -> dict:
    return {
        "id": h.id,
        "routing_no": h.routing_no,
        "product_id": h.product_id,
        "product_code": h.product_code,
        "routing_version": h.routing_version,
        "effective_date": h.effective_date.isoformat() if h.effective_date else None,
        "expiry_date": h.expiry_date.isoformat() if h.expiry_date else None,
        "is_active": h.is_active,
        "is_approved": h.is_approved,
        "approved_by": h.approved_by,
        "approved_at": h.approved_at.isoformat() if h.approved_at else None,
        "remarks": h.remarks,
        "operations": [routing_operation_to_dict(op) for op in h.operations] if h.operations else [],
        "created_at": h.created_at.isoformat() if h.created_at else None,
    }


# ==================== Products API ====================

@router.get("/products")
async def get_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    product_type: Optional[str] = None,
    product_group: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """품목 마스터 목록 조회"""
    query = select(ProductMaster).where(ProductMaster.tenant_id == DEFAULT_TENANT_ID)

    if product_type:
        query = query.where(ProductMaster.product_type == product_type)
    if product_group:
        query = query.where(ProductMaster.product_group == product_group)
    if is_active is not None:
        query = query.where(ProductMaster.is_active == is_active)
    if search:
        query = query.where(
            or_(
                ProductMaster.product_code.ilike(f"%{search}%"),
                ProductMaster.product_name.ilike(f"%{search}%"),
            )
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * size
    query = query.order_by(ProductMaster.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    products = result.scalars().all()

    return {
        "items": [product_to_dict(p) for p in products],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/products/{product_id}")
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """품목 상세 조회"""
    query = select(ProductMaster).where(
        and_(ProductMaster.id == product_id, ProductMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    return product_to_dict(product)


# ==================== Customers API ====================

@router.get("/customers")
async def get_customers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    customer_type: Optional[str] = None,
    customer_grade: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """고객 마스터 목록 조회"""
    query = select(CustomerMaster).where(CustomerMaster.tenant_id == DEFAULT_TENANT_ID)

    if customer_type:
        query = query.where(CustomerMaster.customer_type == customer_type)
    if customer_grade:
        query = query.where(CustomerMaster.customer_grade == customer_grade)
    if is_active is not None:
        query = query.where(CustomerMaster.is_active == is_active)
    if search:
        query = query.where(
            or_(
                CustomerMaster.customer_code.ilike(f"%{search}%"),
                CustomerMaster.customer_name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(CustomerMaster.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    customers = result.scalars().all()

    return {
        "items": [customer_to_dict(c) for c in customers],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/customers/{customer_id}")
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """고객 상세 조회"""
    query = select(CustomerMaster).where(
        and_(CustomerMaster.id == customer_id, CustomerMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    result = await db.execute(query)
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    return customer_to_dict(customer)


# ==================== Vendors API ====================

@router.get("/vendors")
async def get_vendors(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    vendor_type: Optional[str] = None,
    vendor_grade: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """공급업체 마스터 목록 조회"""
    query = select(VendorMaster).where(VendorMaster.tenant_id == DEFAULT_TENANT_ID)

    if vendor_type:
        query = query.where(VendorMaster.vendor_type == vendor_type)
    if vendor_grade:
        query = query.where(VendorMaster.vendor_grade == vendor_grade)
    if is_active is not None:
        query = query.where(VendorMaster.is_active == is_active)
    if search:
        query = query.where(
            or_(
                VendorMaster.vendor_code.ilike(f"%{search}%"),
                VendorMaster.vendor_name.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(VendorMaster.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    vendors = result.scalars().all()

    return {
        "items": [vendor_to_dict(v) for v in vendors],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/vendors/{vendor_id}")
async def get_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    """공급업체 상세 조회"""
    query = select(VendorMaster).where(
        and_(VendorMaster.id == vendor_id, VendorMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    result = await db.execute(query)
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

    return vendor_to_dict(vendor)


# ==================== BOM API ====================

@router.get("/bom")
async def get_bom_list(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """BOM 목록 조회"""
    query = select(BOMHeader).where(BOMHeader.tenant_id == DEFAULT_TENANT_ID)
    query = query.options(selectinload(BOMHeader.details))

    if product_id:
        query = query.where(BOMHeader.product_id == product_id)
    if is_active is not None:
        query = query.where(BOMHeader.is_active == is_active)

    count_query = select(func.count(BOMHeader.id)).where(BOMHeader.tenant_id == DEFAULT_TENANT_ID)
    if product_id:
        count_query = count_query.where(BOMHeader.product_id == product_id)
    if is_active is not None:
        count_query = count_query.where(BOMHeader.is_active == is_active)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(BOMHeader.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    bom_list = result.scalars().unique().all()

    return {
        "items": [bom_header_to_dict(b) for b in bom_list],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/bom/{bom_id}")
async def get_bom(bom_id: int, db: AsyncSession = Depends(get_db)):
    """BOM 상세 조회"""
    query = select(BOMHeader).where(
        and_(BOMHeader.id == bom_id, BOMHeader.tenant_id == DEFAULT_TENANT_ID)
    ).options(selectinload(BOMHeader.details))
    result = await db.execute(query)
    bom = result.scalar_one_or_none()

    if not bom:
        raise HTTPException(status_code=404, detail=f"BOM {bom_id} not found")

    return bom_header_to_dict(bom)


# ==================== Routing API ====================

@router.get("/routing")
async def get_routing_list(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100, alias="page_size"),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """Routing 목록 조회"""
    query = select(RoutingHeader).where(RoutingHeader.tenant_id == DEFAULT_TENANT_ID)
    query = query.options(selectinload(RoutingHeader.operations))

    if product_id:
        query = query.where(RoutingHeader.product_id == product_id)
    if is_active is not None:
        query = query.where(RoutingHeader.is_active == is_active)

    count_query = select(func.count(RoutingHeader.id)).where(RoutingHeader.tenant_id == DEFAULT_TENANT_ID)
    if product_id:
        count_query = count_query.where(RoutingHeader.product_id == product_id)
    if is_active is not None:
        count_query = count_query.where(RoutingHeader.is_active == is_active)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * size
    query = query.order_by(RoutingHeader.id.desc()).offset(offset).limit(size)
    result = await db.execute(query)
    routing_list = result.scalars().unique().all()

    return {
        "items": [routing_header_to_dict(r) for r in routing_list],
        "total": total,
        "page": page,
        "page_size": size,
    }


@router.get("/routing/{routing_id}")
async def get_routing(routing_id: int, db: AsyncSession = Depends(get_db)):
    """Routing 상세 조회"""
    query = select(RoutingHeader).where(
        and_(RoutingHeader.id == routing_id, RoutingHeader.tenant_id == DEFAULT_TENANT_ID)
    ).options(selectinload(RoutingHeader.operations))
    result = await db.execute(query)
    routing = result.scalar_one_or_none()

    if not routing:
        raise HTTPException(status_code=404, detail=f"Routing {routing_id} not found")

    return routing_header_to_dict(routing)


# ==================== Summary API ====================

@router.get("/summary")
async def get_master_data_summary(db: AsyncSession = Depends(get_db)):
    """기준정보 요약"""
    # Products
    total_products = await db.execute(
        select(func.count(ProductMaster.id)).where(ProductMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    active_products = await db.execute(
        select(func.count(ProductMaster.id)).where(
            and_(ProductMaster.tenant_id == DEFAULT_TENANT_ID, ProductMaster.is_active == True)
        )
    )

    # Customers
    total_customers = await db.execute(
        select(func.count(CustomerMaster.id)).where(CustomerMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    active_customers = await db.execute(
        select(func.count(CustomerMaster.id)).where(
            and_(CustomerMaster.tenant_id == DEFAULT_TENANT_ID, CustomerMaster.is_active == True)
        )
    )

    # Vendors
    total_vendors = await db.execute(
        select(func.count(VendorMaster.id)).where(VendorMaster.tenant_id == DEFAULT_TENANT_ID)
    )
    active_vendors = await db.execute(
        select(func.count(VendorMaster.id)).where(
            and_(VendorMaster.tenant_id == DEFAULT_TENANT_ID, VendorMaster.is_active == True)
        )
    )

    # BOM
    total_boms = await db.execute(
        select(func.count(BOMHeader.id)).where(BOMHeader.tenant_id == DEFAULT_TENANT_ID)
    )

    # Routing
    total_routings = await db.execute(
        select(func.count(RoutingHeader.id)).where(RoutingHeader.tenant_id == DEFAULT_TENANT_ID)
    )

    return {
        "total_products": total_products.scalar() or 0,
        "active_products": active_products.scalar() or 0,
        "total_customers": total_customers.scalar() or 0,
        "active_customers": active_customers.scalar() or 0,
        "total_vendors": total_vendors.scalar() or 0,
        "active_vendors": active_vendors.scalar() or 0,
        "total_boms": total_boms.scalar() or 0,
        "total_routings": total_routings.scalar() or 0,
    }
