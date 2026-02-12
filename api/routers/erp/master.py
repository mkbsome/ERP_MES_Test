"""
ERP Master Data API Router
- 품목 마스터 (Products)
- 고객 마스터 (Customers)
- 공급업체 마스터 (Vendors)
- BOM (Bill of Materials)
- Routing (공정 경로)
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.database import get_db
from api.models.erp.master import (
    ProductMaster, CustomerMaster, VendorMaster,
    BOMHeader, BOMDetail, RoutingHeader, RoutingOperation,
    ProductType as DBProductType, ProductStatus as DBProductStatus,
    UnitOfMeasure as DBUnitOfMeasure,
    CustomerType as DBCustomerType, CustomerGrade as DBCustomerGrade,
    VendorType as DBVendorType, VendorGrade as DBVendorGrade,
)
from api.schemas.erp.master import (
    # Product
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductType, ProductStatus,
    # Customer
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
    CustomerType, CustomerGrade,
    # Vendor
    VendorCreate, VendorUpdate, VendorResponse, VendorListResponse,
    VendorType, VendorGrade,
    # BOM
    BOMHeaderCreate, BOMHeaderResponse, BOMListResponse,
    # Routing
    RoutingHeaderCreate, RoutingHeaderResponse, RoutingListResponse,
    # Summary
    MasterDataSummary,
)

router = APIRouter(prefix="/master", tags=["ERP Master Data"])


# ==================== Helper Functions ====================

def product_to_dict(product: ProductMaster) -> dict:
    """ProductMaster 모델을 딕셔너리로 변환"""
    return {
        "id": product.id,
        "product_code": product.product_code,
        "product_name": product.product_name,
        "product_name_en": product.product_name_en,
        "product_type": product.product_type.value if product.product_type else None,
        "product_group": product.product_group,
        "product_category": product.product_category,
        "specification": product.specification,
        "model_no": product.model_no,
        "drawing_no": product.drawing_no,
        "unit": product.unit.value if product.unit else "EA",
        "lot_size": product.lot_size,
        "min_order_qty": product.min_order_qty,
        "standard_cost": float(product.standard_cost) if product.standard_cost else 0,
        "material_cost": float(product.material_cost) if product.material_cost else 0,
        "labor_cost": float(product.labor_cost) if product.labor_cost else 0,
        "overhead_cost": float(product.overhead_cost) if product.overhead_cost else 0,
        "selling_price": float(product.selling_price) if product.selling_price else 0,
        "lead_time_days": product.lead_time_days,
        "safety_stock": product.safety_stock,
        "reorder_point": product.reorder_point,
        "status": product.status.value if product.status else "active",
        "is_active": product.is_active,
        "description": product.description,
        "remarks": product.remarks,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }


def customer_to_dict(customer: CustomerMaster) -> dict:
    """CustomerMaster 모델을 딕셔너리로 변환"""
    return {
        "id": customer.id,
        "customer_code": customer.customer_code,
        "customer_name": customer.customer_name,
        "customer_name_en": customer.customer_name_en,
        "customer_type": customer.customer_type.value if customer.customer_type else "domestic",
        "customer_grade": customer.customer_grade.value if customer.customer_grade else "B",
        "industry": customer.industry,
        "ceo_name": customer.ceo_name,
        "contact_person": customer.contact_person,
        "contact_phone": customer.contact_phone,
        "contact_email": customer.contact_email,
        "address": customer.address,
        "city": customer.city,
        "country": customer.country,
        "postal_code": customer.postal_code,
        "business_no": customer.business_no,
        "tax_id": customer.tax_id,
        "payment_terms": customer.payment_terms,
        "credit_limit": float(customer.credit_limit) if customer.credit_limit else 0,
        "currency": customer.currency,
        "is_active": customer.is_active,
        "remarks": customer.remarks,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "updated_at": customer.updated_at.isoformat() if customer.updated_at else None,
    }


def vendor_to_dict(vendor: VendorMaster) -> dict:
    """VendorMaster 모델을 딕셔너리로 변환"""
    return {
        "id": vendor.id,
        "vendor_code": vendor.vendor_code,
        "vendor_name": vendor.vendor_name,
        "vendor_name_en": vendor.vendor_name_en,
        "vendor_type": vendor.vendor_type.value if vendor.vendor_type else "manufacturer",
        "vendor_grade": vendor.vendor_grade.value if vendor.vendor_grade else "approved",
        "main_category": vendor.main_category,
        "ceo_name": vendor.ceo_name,
        "contact_person": vendor.contact_person,
        "contact_phone": vendor.contact_phone,
        "contact_email": vendor.contact_email,
        "address": vendor.address,
        "city": vendor.city,
        "country": vendor.country,
        "postal_code": vendor.postal_code,
        "business_no": vendor.business_no,
        "tax_id": vendor.tax_id,
        "payment_terms": vendor.payment_terms,
        "lead_time_days": vendor.lead_time_days,
        "min_order_amount": float(vendor.min_order_amount) if vendor.min_order_amount else 0,
        "currency": vendor.currency,
        "quality_rating": vendor.quality_rating,
        "delivery_rating": vendor.delivery_rating,
        "price_rating": vendor.price_rating,
        "overall_rating": vendor.overall_rating,
        "is_active": vendor.is_active,
        "remarks": vendor.remarks,
        "created_at": vendor.created_at.isoformat() if vendor.created_at else None,
        "updated_at": vendor.updated_at.isoformat() if vendor.updated_at else None,
    }


def bom_detail_to_dict(detail: BOMDetail) -> dict:
    """BOMDetail 모델을 딕셔너리로 변환"""
    return {
        "id": detail.id,
        "header_id": detail.header_id,
        "item_seq": detail.item_seq,
        "component_code": detail.component_code,
        "component_name": detail.component_name,
        "quantity": detail.quantity,
        "unit": detail.unit.value if detail.unit else "EA",
        "position": detail.position,
        "alternative_item": detail.alternative_item,
        "scrap_rate": detail.scrap_rate,
        "is_critical": detail.is_critical,
        "is_phantom": detail.is_phantom,
        "remarks": detail.remarks,
        "created_at": detail.created_at.isoformat() if detail.created_at else None,
        "updated_at": detail.updated_at.isoformat() if detail.updated_at else None,
    }


def bom_header_to_dict(header: BOMHeader) -> dict:
    """BOMHeader 모델을 딕셔너리로 변환"""
    return {
        "id": header.id,
        "bom_no": header.bom_no,
        "product_id": header.product_id,
        "bom_version": header.bom_version,
        "effective_date": header.effective_date.isoformat() if header.effective_date else None,
        "expiry_date": header.expiry_date.isoformat() if header.expiry_date else None,
        "is_active": header.is_active,
        "is_approved": header.is_approved,
        "approved_by": header.approved_by,
        "approved_at": header.approved_at.isoformat() if header.approved_at else None,
        "remarks": header.remarks,
        "details": [bom_detail_to_dict(d) for d in header.details] if header.details else [],
        "created_at": header.created_at.isoformat() if header.created_at else None,
        "updated_at": header.updated_at.isoformat() if header.updated_at else None,
    }


def routing_operation_to_dict(operation: RoutingOperation) -> dict:
    """RoutingOperation 모델을 딕셔너리로 변환"""
    return {
        "id": operation.id,
        "header_id": operation.header_id,
        "operation_seq": operation.operation_seq,
        "operation_code": operation.operation_code,
        "operation_name": operation.operation_name,
        "work_center_code": operation.work_center_code,
        "work_center_name": operation.work_center_name,
        "line_code": operation.line_code,
        "setup_time": operation.setup_time,
        "run_time": operation.run_time,
        "wait_time": operation.wait_time,
        "move_time": operation.move_time,
        "standard_qty": operation.standard_qty,
        "capacity_per_hour": operation.capacity_per_hour,
        "labor_rate": float(operation.labor_rate) if operation.labor_rate else 0,
        "machine_rate": float(operation.machine_rate) if operation.machine_rate else 0,
        "inspection_required": operation.inspection_required,
        "inspection_type": operation.inspection_type,
        "description": operation.description,
        "remarks": operation.remarks,
        "created_at": operation.created_at.isoformat() if operation.created_at else None,
        "updated_at": operation.updated_at.isoformat() if operation.updated_at else None,
    }


def routing_header_to_dict(header: RoutingHeader) -> dict:
    """RoutingHeader 모델을 딕셔너리로 변환"""
    return {
        "id": header.id,
        "routing_no": header.routing_no,
        "product_id": header.product_id,
        "routing_version": header.routing_version,
        "effective_date": header.effective_date.isoformat() if header.effective_date else None,
        "expiry_date": header.expiry_date.isoformat() if header.expiry_date else None,
        "is_active": header.is_active,
        "is_approved": header.is_approved,
        "approved_by": header.approved_by,
        "approved_at": header.approved_at.isoformat() if header.approved_at else None,
        "remarks": header.remarks,
        "operations": [routing_operation_to_dict(op) for op in header.operations] if header.operations else [],
        "created_at": header.created_at.isoformat() if header.created_at else None,
        "updated_at": header.updated_at.isoformat() if header.updated_at else None,
    }


# ==================== Mock Data Service ====================

class MockDataService:
    """DB에 데이터가 없을 경우 반환할 Mock 데이터"""

    @staticmethod
    def get_products(page: int = 1, page_size: int = 20):
        products = [
            {
                "id": 1,
                "product_code": "FG-MB-001",
                "product_name": "스마트폰 메인보드 A타입",
                "product_name_en": "Smartphone Mainboard Type A",
                "product_type": "finished",
                "product_group": "스마트폰",
                "product_category": "메인보드",
                "specification": "Size: 120x60mm, Layer: 8L HDI",
                "model_no": "MB-2024-A01",
                "drawing_no": "DWG-MB-001",
                "unit": "EA",
                "lot_size": 100,
                "min_order_qty": 100,
                "standard_cost": 15000,
                "material_cost": 8000,
                "labor_cost": 3000,
                "overhead_cost": 4000,
                "selling_price": 25000,
                "lead_time_days": 5,
                "safety_stock": 500,
                "reorder_point": 1000,
                "status": "active",
                "is_active": True,
                "description": "고성능 스마트폰용 8레이어 HDI 메인보드",
                "remarks": None,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-15T10:30:00",
            },
            {
                "id": 2,
                "product_code": "FG-PB-001",
                "product_name": "전원보드 Standard",
                "product_name_en": "Power Board Standard",
                "product_type": "finished",
                "product_group": "전원부품",
                "product_category": "전원보드",
                "specification": "Size: 80x40mm, Layer: 4L",
                "model_no": "PB-2024-S01",
                "drawing_no": "DWG-PB-001",
                "unit": "EA",
                "lot_size": 200,
                "min_order_qty": 200,
                "standard_cost": 8000,
                "material_cost": 4500,
                "labor_cost": 1500,
                "overhead_cost": 2000,
                "selling_price": 12000,
                "lead_time_days": 3,
                "safety_stock": 300,
                "reorder_point": 600,
                "status": "active",
                "is_active": True,
                "description": "범용 전원보드 4레이어",
                "remarks": None,
                "created_at": "2024-01-02T00:00:00",
                "updated_at": "2024-01-16T11:00:00",
            },
            {
                "id": 3,
                "product_code": "FG-LED-001",
                "product_name": "LED 드라이버 보드",
                "product_name_en": "LED Driver Board",
                "product_type": "finished",
                "product_group": "LED",
                "product_category": "드라이버",
                "specification": "Size: 50x30mm, Layer: 2L",
                "model_no": "LED-2024-D01",
                "drawing_no": "DWG-LED-001",
                "unit": "EA",
                "lot_size": 500,
                "min_order_qty": 500,
                "standard_cost": 3000,
                "material_cost": 1500,
                "labor_cost": 800,
                "overhead_cost": 700,
                "selling_price": 5000,
                "lead_time_days": 2,
                "safety_stock": 1000,
                "reorder_point": 2000,
                "status": "active",
                "is_active": True,
                "description": "LED 조명용 드라이버 보드",
                "remarks": None,
                "created_at": "2024-01-03T00:00:00",
                "updated_at": "2024-01-17T09:30:00",
            },
        ]
        return {
            "items": products,
            "total": len(products),
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    def get_customers(page: int = 1, page_size: int = 20):
        customers = [
            {
                "id": 1,
                "customer_code": "C-001",
                "customer_name": "삼성전자",
                "customer_name_en": "Samsung Electronics",
                "customer_type": "domestic",
                "customer_grade": "VIP",
                "industry": "반도체/전자",
                "ceo_name": "이재용",
                "contact_person": "김담당",
                "contact_phone": "02-1234-5678",
                "contact_email": "contact@samsung.com",
                "address": "경기도 화성시 삼성전자로 1",
                "city": "화성시",
                "country": "Korea",
                "postal_code": "18448",
                "business_no": "124-81-00998",
                "tax_id": None,
                "payment_terms": "30일",
                "credit_limit": 5000000000,
                "currency": "KRW",
                "is_active": True,
                "remarks": "주요 거래처",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-15T10:00:00",
            },
            {
                "id": 2,
                "customer_code": "C-002",
                "customer_name": "LG전자",
                "customer_name_en": "LG Electronics",
                "customer_type": "domestic",
                "customer_grade": "VIP",
                "industry": "가전/전자",
                "ceo_name": "조주완",
                "contact_person": "박담당",
                "contact_phone": "02-3777-1114",
                "contact_email": "contact@lge.com",
                "address": "서울시 영등포구 여의대로 128",
                "city": "서울시",
                "country": "Korea",
                "postal_code": "07336",
                "business_no": "107-86-14075",
                "tax_id": None,
                "payment_terms": "30일",
                "credit_limit": 3000000000,
                "currency": "KRW",
                "is_active": True,
                "remarks": None,
                "created_at": "2024-01-02T00:00:00",
                "updated_at": "2024-01-16T11:00:00",
            },
            {
                "id": 3,
                "customer_code": "C-003",
                "customer_name": "현대모비스",
                "customer_name_en": "Hyundai Mobis",
                "customer_type": "domestic",
                "customer_grade": "A",
                "industry": "자동차부품",
                "ceo_name": "정의선",
                "contact_person": "이담당",
                "contact_phone": "02-2018-5000",
                "contact_email": "contact@mobis.co.kr",
                "address": "서울시 강남구 테헤란로 203",
                "city": "서울시",
                "country": "Korea",
                "postal_code": "06141",
                "business_no": "208-81-00377",
                "tax_id": None,
                "payment_terms": "45일",
                "credit_limit": 2000000000,
                "currency": "KRW",
                "is_active": True,
                "remarks": "자동차 ECU 주력",
                "created_at": "2024-01-03T00:00:00",
                "updated_at": "2024-01-17T09:00:00",
            },
        ]
        return {
            "items": customers,
            "total": len(customers),
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    def get_vendors(page: int = 1, page_size: int = 20):
        vendors = [
            {
                "id": 1,
                "vendor_code": "V-001",
                "vendor_name": "삼성전기",
                "vendor_name_en": "Samsung Electro-Mechanics",
                "vendor_type": "manufacturer",
                "vendor_grade": "strategic",
                "main_category": "MLCC/칩부품",
                "ceo_name": "장덕현",
                "contact_person": "정담당",
                "contact_phone": "031-300-7114",
                "contact_email": "vendor@sem.samsung.com",
                "address": "경기도 수원시 영통구 매영로 150",
                "city": "수원시",
                "country": "Korea",
                "postal_code": "16674",
                "business_no": "135-81-00248",
                "tax_id": None,
                "payment_terms": "30일",
                "lead_time_days": 14,
                "min_order_amount": 1000000,
                "currency": "KRW",
                "quality_rating": 95.5,
                "delivery_rating": 92.0,
                "price_rating": 85.0,
                "overall_rating": 91.0,
                "is_active": True,
                "remarks": "전략적 파트너",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-15T10:00:00",
            },
            {
                "id": 2,
                "vendor_code": "V-002",
                "vendor_name": "대덕전자",
                "vendor_name_en": "Daeduck Electronics",
                "vendor_type": "manufacturer",
                "vendor_grade": "preferred",
                "main_category": "PCB",
                "ceo_name": "김담당",
                "contact_person": "이담당",
                "contact_phone": "042-930-8114",
                "contact_email": "sales@daeduck.com",
                "address": "대전시 유성구 테크노2로 160",
                "city": "대전시",
                "country": "Korea",
                "postal_code": "34013",
                "business_no": "314-81-00235",
                "tax_id": None,
                "payment_terms": "30일",
                "lead_time_days": 21,
                "min_order_amount": 500000,
                "currency": "KRW",
                "quality_rating": 90.0,
                "delivery_rating": 88.0,
                "price_rating": 82.0,
                "overall_rating": 87.0,
                "is_active": True,
                "remarks": None,
                "created_at": "2024-01-02T00:00:00",
                "updated_at": "2024-01-16T11:00:00",
            },
        ]
        return {
            "items": vendors,
            "total": len(vendors),
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    def get_bom_list(page: int = 1, page_size: int = 20):
        bom_list = [
            {
                "id": 1,
                "bom_no": "BOM-MB-001",
                "product_id": 1,
                "bom_version": "1.0",
                "effective_date": "2024-01-01T00:00:00",
                "expiry_date": None,
                "is_active": True,
                "is_approved": True,
                "approved_by": "김승인",
                "approved_at": "2024-01-05T10:00:00",
                "remarks": "스마트폰 메인보드 A타입 BOM",
                "details": [
                    {
                        "id": 1, "header_id": 1, "item_seq": 10,
                        "component_code": "IC-AP-001", "component_name": "AP Processor",
                        "quantity": 1, "unit": "EA", "position": "U1",
                        "alternative_item": None, "scrap_rate": 0.01,
                        "is_critical": True, "is_phantom": False, "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                    {
                        "id": 2, "header_id": 1, "item_seq": 20,
                        "component_code": "IC-MEM-001", "component_name": "Memory IC",
                        "quantity": 2, "unit": "EA", "position": "U2,U3",
                        "alternative_item": "IC-MEM-002", "scrap_rate": 0.01,
                        "is_critical": True, "is_phantom": False, "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                ],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-05T10:00:00",
            },
        ]
        return {
            "items": bom_list,
            "total": len(bom_list),
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    def get_routing_list(page: int = 1, page_size: int = 20):
        routing_list = [
            {
                "id": 1,
                "routing_no": "RTG-MB-001",
                "product_id": 1,
                "routing_version": "1.0",
                "effective_date": "2024-01-01T00:00:00",
                "expiry_date": None,
                "is_active": True,
                "is_approved": True,
                "approved_by": "김승인",
                "approved_at": "2024-01-05T10:00:00",
                "remarks": "스마트폰 메인보드 공정",
                "operations": [
                    {
                        "id": 1, "header_id": 1, "operation_seq": 10,
                        "operation_code": "SMT-PRINT", "operation_name": "솔더 프린팅",
                        "work_center_code": "WC-SMT-01", "work_center_name": "SMT 작업장",
                        "line_code": "SMT-L01",
                        "setup_time": 30, "run_time": 0.5, "wait_time": 5, "move_time": 2,
                        "standard_qty": 1, "capacity_per_hour": 120,
                        "labor_rate": 25000, "machine_rate": 50000,
                        "inspection_required": False, "inspection_type": None,
                        "description": "스텐실을 이용한 솔더페이스트 프린팅",
                        "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                    {
                        "id": 2, "header_id": 1, "operation_seq": 20,
                        "operation_code": "SMT-MOUNT", "operation_name": "칩마운트",
                        "work_center_code": "WC-SMT-01", "work_center_name": "SMT 작업장",
                        "line_code": "SMT-L01",
                        "setup_time": 60, "run_time": 1.0, "wait_time": 3, "move_time": 2,
                        "standard_qty": 1, "capacity_per_hour": 60,
                        "labor_rate": 25000, "machine_rate": 100000,
                        "inspection_required": True, "inspection_type": "AOI",
                        "description": "SMD 부품 자동 장착",
                        "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                ],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-05T10:00:00",
            },
        ]
        return {
            "items": routing_list,
            "total": len(routing_list),
            "page": page,
            "page_size": page_size,
        }


# ==================== Products API ====================

@router.get("/products", response_model=ProductListResponse)
async def get_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_type: Optional[ProductType] = None,
    status: Optional[ProductStatus] = None,
    product_group: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """품목 마스터 목록 조회"""
    try:
        query = select(ProductMaster)

        # 필터 적용
        filters = []
        if product_type:
            db_product_type = DBProductType(product_type.value)
            filters.append(ProductMaster.product_type == db_product_type)
        if status:
            db_status = DBProductStatus(status.value)
            filters.append(ProductMaster.status == db_status)
        if product_group:
            filters.append(ProductMaster.product_group == product_group)
        if is_active is not None:
            filters.append(ProductMaster.is_active == is_active)
        if search:
            search_filter = or_(
                ProductMaster.product_code.ilike(f"%{search}%"),
                ProductMaster.product_name.ilike(f"%{search}%"),
                ProductMaster.product_name_en.ilike(f"%{search}%"),
            )
            filters.append(search_filter)

        if filters:
            query = query.where(and_(*filters))

        # 전체 개수
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # 페이징
        offset = (page - 1) * page_size
        query = query.order_by(ProductMaster.id.desc()).offset(offset).limit(page_size)

        result = await db.execute(query)
        products = result.scalars().all()

        if not products:
            return MockDataService.get_products(page, page_size)

        return {
            "items": [product_to_dict(p) for p in products],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching products: {e}")
        return MockDataService.get_products(page, page_size)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """품목 상세 조회"""
    try:
        query = select(ProductMaster).where(ProductMaster.id == product_id)
        result = await db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        return product_to_dict(product)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """품목 등록"""
    try:
        # 코드 중복 체크
        existing = await db.execute(
            select(ProductMaster).where(ProductMaster.product_code == product.product_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Product code {product.product_code} already exists")

        db_product = ProductMaster(
            product_code=product.product_code,
            product_name=product.product_name,
            product_name_en=product.product_name_en,
            product_type=DBProductType(product.product_type) if product.product_type else DBProductType.FINISHED,
            product_group=product.product_group,
            product_category=product.product_category,
            specification=product.specification,
            model_no=product.model_no,
            drawing_no=product.drawing_no,
            unit=DBUnitOfMeasure(product.unit) if product.unit else DBUnitOfMeasure.EA,
            lot_size=product.lot_size,
            min_order_qty=product.min_order_qty,
            standard_cost=product.standard_cost,
            material_cost=product.material_cost,
            labor_cost=product.labor_cost,
            overhead_cost=product.overhead_cost,
            selling_price=product.selling_price,
            lead_time_days=product.lead_time_days,
            safety_stock=product.safety_stock,
            reorder_point=product.reorder_point,
            status=DBProductStatus(product.status) if product.status else DBProductStatus.ACTIVE,
            is_active=product.is_active if product.is_active is not None else True,
            description=product.description,
            remarks=product.remarks,
        )

        db.add(db_product)
        await db.commit()
        await db.refresh(db_product)

        return product_to_dict(db_product)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """품목 수정"""
    try:
        query = select(ProductMaster).where(ProductMaster.id == product_id)
        result = await db.execute(query)
        db_product = result.scalar_one_or_none()

        if not db_product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        update_data = product.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "product_type":
                    setattr(db_product, field, DBProductType(value))
                elif field == "status":
                    setattr(db_product, field, DBProductStatus(value))
                elif field == "unit":
                    setattr(db_product, field, DBUnitOfMeasure(value))
                else:
                    setattr(db_product, field, value)

        db_product.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_product)

        return product_to_dict(db_product)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """품목 삭제 (비활성화)"""
    try:
        query = select(ProductMaster).where(ProductMaster.id == product_id)
        result = await db.execute(query)
        db_product = result.scalar_one_or_none()

        if not db_product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        db_product.is_active = False
        db_product.updated_at = datetime.utcnow()
        await db.commit()

        return {"message": f"Product {product_id} has been deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Customers API ====================

@router.get("/customers", response_model=CustomerListResponse)
async def get_customers(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    customer_type: Optional[CustomerType] = None,
    customer_grade: Optional[CustomerGrade] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """고객 마스터 목록 조회"""
    try:
        query = select(CustomerMaster)

        filters = []
        if customer_type:
            db_customer_type = DBCustomerType(customer_type.value)
            filters.append(CustomerMaster.customer_type == db_customer_type)
        if customer_grade:
            db_customer_grade = DBCustomerGrade(customer_grade.value)
            filters.append(CustomerMaster.customer_grade == db_customer_grade)
        if is_active is not None:
            filters.append(CustomerMaster.is_active == is_active)
        if search:
            search_filter = or_(
                CustomerMaster.customer_code.ilike(f"%{search}%"),
                CustomerMaster.customer_name.ilike(f"%{search}%"),
                CustomerMaster.customer_name_en.ilike(f"%{search}%"),
            )
            filters.append(search_filter)

        if filters:
            query = query.where(and_(*filters))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(CustomerMaster.id.desc()).offset(offset).limit(page_size)

        result = await db.execute(query)
        customers = result.scalars().all()

        if not customers:
            return MockDataService.get_customers(page, page_size)

        return {
            "items": [customer_to_dict(c) for c in customers],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching customers: {e}")
        return MockDataService.get_customers(page, page_size)


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
):
    """고객 상세 조회"""
    try:
        query = select(CustomerMaster).where(CustomerMaster.id == customer_id)
        result = await db.execute(query)
        customer = result.scalar_one_or_none()

        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

        return customer_to_dict(customer)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer: CustomerCreate,
    db: AsyncSession = Depends(get_db),
):
    """고객 등록"""
    try:
        existing = await db.execute(
            select(CustomerMaster).where(CustomerMaster.customer_code == customer.customer_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Customer code {customer.customer_code} already exists")

        db_customer = CustomerMaster(
            customer_code=customer.customer_code,
            customer_name=customer.customer_name,
            customer_name_en=customer.customer_name_en,
            customer_type=DBCustomerType(customer.customer_type) if customer.customer_type else DBCustomerType.DOMESTIC,
            customer_grade=DBCustomerGrade(customer.customer_grade) if customer.customer_grade else DBCustomerGrade.B,
            industry=customer.industry,
            ceo_name=customer.ceo_name,
            contact_person=customer.contact_person,
            contact_phone=customer.contact_phone,
            contact_email=customer.contact_email,
            address=customer.address,
            city=customer.city,
            country=customer.country or "Korea",
            postal_code=customer.postal_code,
            business_no=customer.business_no,
            tax_id=customer.tax_id,
            payment_terms=customer.payment_terms,
            credit_limit=customer.credit_limit,
            currency=customer.currency or "KRW",
            is_active=customer.is_active if customer.is_active is not None else True,
            remarks=customer.remarks,
        )

        db.add(db_customer)
        await db.commit()
        await db.refresh(db_customer)

        return customer_to_dict(db_customer)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
):
    """고객 수정"""
    try:
        query = select(CustomerMaster).where(CustomerMaster.id == customer_id)
        result = await db.execute(query)
        db_customer = result.scalar_one_or_none()

        if not db_customer:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

        update_data = customer.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "customer_type":
                    setattr(db_customer, field, DBCustomerType(value))
                elif field == "customer_grade":
                    setattr(db_customer, field, DBCustomerGrade(value))
                else:
                    setattr(db_customer, field, value)

        db_customer.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_customer)

        return customer_to_dict(db_customer)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error updating customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
):
    """고객 삭제 (비활성화)"""
    try:
        query = select(CustomerMaster).where(CustomerMaster.id == customer_id)
        result = await db.execute(query)
        db_customer = result.scalar_one_or_none()

        if not db_customer:
            raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

        db_customer.is_active = False
        db_customer.updated_at = datetime.utcnow()
        await db.commit()

        return {"message": f"Customer {customer_id} has been deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Vendors API ====================

@router.get("/vendors", response_model=VendorListResponse)
async def get_vendors(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor_type: Optional[VendorType] = None,
    vendor_grade: Optional[VendorGrade] = None,
    main_category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """공급업체 마스터 목록 조회"""
    try:
        query = select(VendorMaster)

        filters = []
        if vendor_type:
            db_vendor_type = DBVendorType(vendor_type.value)
            filters.append(VendorMaster.vendor_type == db_vendor_type)
        if vendor_grade:
            db_vendor_grade = DBVendorGrade(vendor_grade.value)
            filters.append(VendorMaster.vendor_grade == db_vendor_grade)
        if main_category:
            filters.append(VendorMaster.main_category == main_category)
        if is_active is not None:
            filters.append(VendorMaster.is_active == is_active)
        if search:
            search_filter = or_(
                VendorMaster.vendor_code.ilike(f"%{search}%"),
                VendorMaster.vendor_name.ilike(f"%{search}%"),
                VendorMaster.vendor_name_en.ilike(f"%{search}%"),
            )
            filters.append(search_filter)

        if filters:
            query = query.where(and_(*filters))

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(VendorMaster.id.desc()).offset(offset).limit(page_size)

        result = await db.execute(query)
        vendors = result.scalars().all()

        if not vendors:
            return MockDataService.get_vendors(page, page_size)

        return {
            "items": [vendor_to_dict(v) for v in vendors],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching vendors: {e}")
        return MockDataService.get_vendors(page, page_size)


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_db),
):
    """공급업체 상세 조회"""
    try:
        query = select(VendorMaster).where(VendorMaster.id == vendor_id)
        result = await db.execute(query)
        vendor = result.scalar_one_or_none()

        if not vendor:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

        return vendor_to_dict(vendor)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendors", response_model=VendorResponse)
async def create_vendor(
    vendor: VendorCreate,
    db: AsyncSession = Depends(get_db),
):
    """공급업체 등록"""
    try:
        existing = await db.execute(
            select(VendorMaster).where(VendorMaster.vendor_code == vendor.vendor_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Vendor code {vendor.vendor_code} already exists")

        db_vendor = VendorMaster(
            vendor_code=vendor.vendor_code,
            vendor_name=vendor.vendor_name,
            vendor_name_en=vendor.vendor_name_en,
            vendor_type=DBVendorType(vendor.vendor_type) if vendor.vendor_type else DBVendorType.MANUFACTURER,
            vendor_grade=DBVendorGrade(vendor.vendor_grade) if vendor.vendor_grade else DBVendorGrade.APPROVED,
            main_category=vendor.main_category,
            ceo_name=vendor.ceo_name,
            contact_person=vendor.contact_person,
            contact_phone=vendor.contact_phone,
            contact_email=vendor.contact_email,
            address=vendor.address,
            city=vendor.city,
            country=vendor.country or "Korea",
            postal_code=vendor.postal_code,
            business_no=vendor.business_no,
            tax_id=vendor.tax_id,
            payment_terms=vendor.payment_terms,
            lead_time_days=vendor.lead_time_days or 7,
            min_order_amount=vendor.min_order_amount,
            currency=vendor.currency or "KRW",
            quality_rating=vendor.quality_rating,
            delivery_rating=vendor.delivery_rating,
            price_rating=vendor.price_rating,
            overall_rating=vendor.overall_rating,
            is_active=vendor.is_active if vendor.is_active is not None else True,
            remarks=vendor.remarks,
        )

        db.add(db_vendor)
        await db.commit()
        await db.refresh(db_vendor)

        return vendor_to_dict(db_vendor)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: int,
    vendor: VendorUpdate,
    db: AsyncSession = Depends(get_db),
):
    """공급업체 수정"""
    try:
        query = select(VendorMaster).where(VendorMaster.id == vendor_id)
        result = await db.execute(query)
        db_vendor = result.scalar_one_or_none()

        if not db_vendor:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

        update_data = vendor.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "vendor_type":
                    setattr(db_vendor, field, DBVendorType(value))
                elif field == "vendor_grade":
                    setattr(db_vendor, field, DBVendorGrade(value))
                else:
                    setattr(db_vendor, field, value)

        db_vendor.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_vendor)

        return vendor_to_dict(db_vendor)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error updating vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vendors/{vendor_id}")
async def delete_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_db),
):
    """공급업체 삭제 (비활성화)"""
    try:
        query = select(VendorMaster).where(VendorMaster.id == vendor_id)
        result = await db.execute(query)
        db_vendor = result.scalar_one_or_none()

        if not db_vendor:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

        db_vendor.is_active = False
        db_vendor.updated_at = datetime.utcnow()
        await db.commit()

        return {"message": f"Vendor {vendor_id} has been deactivated"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting vendor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BOM API ====================

@router.get("/bom", response_model=BOMListResponse)
async def get_bom_list(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """BOM 목록 조회"""
    try:
        query = select(BOMHeader).options(selectinload(BOMHeader.details))

        filters = []
        if product_id:
            filters.append(BOMHeader.product_id == product_id)
        if is_active is not None:
            filters.append(BOMHeader.is_active == is_active)

        if filters:
            query = query.where(and_(*filters))

        count_query = select(func.count()).select_from(
            select(BOMHeader.id).where(and_(*filters) if filters else True).subquery()
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(BOMHeader.id.desc()).offset(offset).limit(page_size)

        result = await db.execute(query)
        bom_list = result.scalars().unique().all()

        if not bom_list:
            return MockDataService.get_bom_list(page, page_size)

        return {
            "items": [bom_header_to_dict(b) for b in bom_list],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching BOM list: {e}")
        return MockDataService.get_bom_list(page, page_size)


@router.get("/bom/{product_id}", response_model=BOMHeaderResponse)
async def get_product_bom(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """제품별 BOM 조회"""
    try:
        query = select(BOMHeader).options(
            selectinload(BOMHeader.details)
        ).where(
            and_(BOMHeader.product_id == product_id, BOMHeader.is_active == True)
        )
        result = await db.execute(query)
        bom = result.scalar_one_or_none()

        if not bom:
            # Mock 데이터 반환
            return {
                "id": 1,
                "bom_no": f"BOM-{product_id:03d}",
                "product_id": product_id,
                "bom_version": "1.0",
                "effective_date": "2024-01-01T00:00:00",
                "expiry_date": None,
                "is_active": True,
                "is_approved": True,
                "approved_by": "김승인",
                "approved_at": "2024-01-05T10:00:00",
                "remarks": "BOM 정보",
                "details": [
                    {
                        "id": 1, "header_id": 1, "item_seq": 10,
                        "component_code": "IC-AP-001", "component_name": "AP Processor",
                        "quantity": 1, "unit": "EA", "position": "U1",
                        "alternative_item": None, "scrap_rate": 0.01,
                        "is_critical": True, "is_phantom": False, "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                ],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-05T10:00:00",
            }

        return bom_header_to_dict(bom)
    except Exception as e:
        print(f"Error fetching product BOM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bom", response_model=BOMHeaderResponse)
async def create_bom(
    bom: BOMHeaderCreate,
    db: AsyncSession = Depends(get_db),
):
    """BOM 등록"""
    try:
        # BOM 번호 중복 체크
        existing = await db.execute(
            select(BOMHeader).where(BOMHeader.bom_no == bom.bom_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"BOM number {bom.bom_no} already exists")

        db_bom = BOMHeader(
            bom_no=bom.bom_no,
            product_id=bom.product_id,
            bom_version=bom.bom_version or "1.0",
            effective_date=bom.effective_date or datetime.utcnow(),
            expiry_date=bom.expiry_date,
            is_active=bom.is_active if bom.is_active is not None else True,
            is_approved=bom.is_approved or False,
            approved_by=bom.approved_by,
            approved_at=bom.approved_at,
            remarks=bom.remarks,
        )

        db.add(db_bom)
        await db.flush()

        # BOM 상세 추가
        for detail in bom.details:
            db_detail = BOMDetail(
                header_id=db_bom.id,
                item_seq=detail.item_seq,
                component_code=detail.component_code,
                component_name=detail.component_name,
                quantity=detail.quantity,
                unit=DBUnitOfMeasure(detail.unit) if detail.unit else DBUnitOfMeasure.EA,
                position=detail.position,
                alternative_item=detail.alternative_item,
                scrap_rate=detail.scrap_rate or 0,
                is_critical=detail.is_critical or False,
                is_phantom=detail.is_phantom or False,
                remarks=detail.remarks,
            )
            db.add(db_detail)

        await db.commit()

        # 관계 로딩하여 반환
        query = select(BOMHeader).options(selectinload(BOMHeader.details)).where(BOMHeader.id == db_bom.id)
        result = await db.execute(query)
        created_bom = result.scalar_one()

        return bom_header_to_dict(created_bom)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating BOM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Routing API ====================

@router.get("/routing", response_model=RoutingListResponse)
async def get_routing_list(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """Routing 목록 조회"""
    try:
        query = select(RoutingHeader).options(selectinload(RoutingHeader.operations))

        filters = []
        if product_id:
            filters.append(RoutingHeader.product_id == product_id)
        if is_active is not None:
            filters.append(RoutingHeader.is_active == is_active)

        if filters:
            query = query.where(and_(*filters))

        count_query = select(func.count()).select_from(
            select(RoutingHeader.id).where(and_(*filters) if filters else True).subquery()
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(RoutingHeader.id.desc()).offset(offset).limit(page_size)

        result = await db.execute(query)
        routing_list = result.scalars().unique().all()

        if not routing_list:
            return MockDataService.get_routing_list(page, page_size)

        return {
            "items": [routing_header_to_dict(r) for r in routing_list],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except Exception as e:
        print(f"Error fetching routing list: {e}")
        return MockDataService.get_routing_list(page, page_size)


@router.get("/routing/{product_id}", response_model=RoutingHeaderResponse)
async def get_product_routing(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """제품별 Routing 조회"""
    try:
        query = select(RoutingHeader).options(
            selectinload(RoutingHeader.operations)
        ).where(
            and_(RoutingHeader.product_id == product_id, RoutingHeader.is_active == True)
        )
        result = await db.execute(query)
        routing = result.scalar_one_or_none()

        if not routing:
            # Mock 데이터 반환
            return {
                "id": 1,
                "routing_no": f"RTG-{product_id:03d}",
                "product_id": product_id,
                "routing_version": "1.0",
                "effective_date": "2024-01-01T00:00:00",
                "expiry_date": None,
                "is_active": True,
                "is_approved": True,
                "approved_by": "김승인",
                "approved_at": "2024-01-05T10:00:00",
                "remarks": "공정 정보",
                "operations": [
                    {
                        "id": 1, "header_id": 1, "operation_seq": 10,
                        "operation_code": "SMT-PRINT", "operation_name": "솔더 프린팅",
                        "work_center_code": "WC-SMT-01", "work_center_name": "SMT 작업장",
                        "line_code": "SMT-L01",
                        "setup_time": 30, "run_time": 0.5, "wait_time": 5, "move_time": 2,
                        "standard_qty": 1, "capacity_per_hour": 120,
                        "labor_rate": 25000, "machine_rate": 50000,
                        "inspection_required": False, "inspection_type": None,
                        "description": "스텐실을 이용한 솔더페이스트 프린팅",
                        "remarks": None,
                        "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                    },
                ],
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-05T10:00:00",
            }

        return routing_header_to_dict(routing)
    except Exception as e:
        print(f"Error fetching product routing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/routing", response_model=RoutingHeaderResponse)
async def create_routing(
    routing: RoutingHeaderCreate,
    db: AsyncSession = Depends(get_db),
):
    """Routing 등록"""
    try:
        existing = await db.execute(
            select(RoutingHeader).where(RoutingHeader.routing_no == routing.routing_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Routing number {routing.routing_no} already exists")

        db_routing = RoutingHeader(
            routing_no=routing.routing_no,
            product_id=routing.product_id,
            routing_version=routing.routing_version or "1.0",
            effective_date=routing.effective_date or datetime.utcnow(),
            expiry_date=routing.expiry_date,
            is_active=routing.is_active if routing.is_active is not None else True,
            is_approved=routing.is_approved or False,
            approved_by=routing.approved_by,
            approved_at=routing.approved_at,
            remarks=routing.remarks,
        )

        db.add(db_routing)
        await db.flush()

        # Routing 공정 추가
        for operation in routing.operations:
            db_operation = RoutingOperation(
                header_id=db_routing.id,
                operation_seq=operation.operation_seq,
                operation_code=operation.operation_code,
                operation_name=operation.operation_name,
                work_center_code=operation.work_center_code,
                work_center_name=operation.work_center_name,
                line_code=operation.line_code,
                setup_time=operation.setup_time or 0,
                run_time=operation.run_time or 0,
                wait_time=operation.wait_time or 0,
                move_time=operation.move_time or 0,
                standard_qty=operation.standard_qty or 1,
                capacity_per_hour=operation.capacity_per_hour,
                labor_rate=operation.labor_rate,
                machine_rate=operation.machine_rate,
                inspection_required=operation.inspection_required or False,
                inspection_type=operation.inspection_type,
                description=operation.description,
                remarks=operation.remarks,
            )
            db.add(db_operation)

        await db.commit()

        # 관계 로딩하여 반환
        query = select(RoutingHeader).options(selectinload(RoutingHeader.operations)).where(RoutingHeader.id == db_routing.id)
        result = await db.execute(query)
        created_routing = result.scalar_one()

        return routing_header_to_dict(created_routing)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error creating routing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Summary API ====================

@router.get("/summary", response_model=MasterDataSummary)
async def get_master_data_summary(
    db: AsyncSession = Depends(get_db),
):
    """기준정보 요약"""
    try:
        # Products 통계
        total_products = await db.execute(select(func.count(ProductMaster.id)))
        total_products_count = total_products.scalar() or 0

        active_products = await db.execute(
            select(func.count(ProductMaster.id)).where(ProductMaster.is_active == True)
        )
        active_products_count = active_products.scalar() or 0

        # Products by type
        products_by_type = {}
        for ptype in DBProductType:
            count_result = await db.execute(
                select(func.count(ProductMaster.id)).where(ProductMaster.product_type == ptype)
            )
            products_by_type[ptype.value] = count_result.scalar() or 0

        # Customers 통계
        total_customers = await db.execute(select(func.count(CustomerMaster.id)))
        total_customers_count = total_customers.scalar() or 0

        active_customers = await db.execute(
            select(func.count(CustomerMaster.id)).where(CustomerMaster.is_active == True)
        )
        active_customers_count = active_customers.scalar() or 0

        # Customers by grade
        customers_by_grade = {}
        for grade in DBCustomerGrade:
            count_result = await db.execute(
                select(func.count(CustomerMaster.id)).where(CustomerMaster.customer_grade == grade)
            )
            customers_by_grade[grade.value] = count_result.scalar() or 0

        # Vendors 통계
        total_vendors = await db.execute(select(func.count(VendorMaster.id)))
        total_vendors_count = total_vendors.scalar() or 0

        active_vendors = await db.execute(
            select(func.count(VendorMaster.id)).where(VendorMaster.is_active == True)
        )
        active_vendors_count = active_vendors.scalar() or 0

        # Vendors by grade
        vendors_by_grade = {}
        for grade in DBVendorGrade:
            count_result = await db.execute(
                select(func.count(VendorMaster.id)).where(VendorMaster.vendor_grade == grade)
            )
            vendors_by_grade[grade.value] = count_result.scalar() or 0

        # BOM 통계
        total_boms = await db.execute(select(func.count(BOMHeader.id)))
        total_boms_count = total_boms.scalar() or 0

        # Routing 통계
        total_routings = await db.execute(select(func.count(RoutingHeader.id)))
        total_routings_count = total_routings.scalar() or 0

        # DB에 데이터가 없으면 Mock 데이터 반환
        if total_products_count == 0 and total_customers_count == 0 and total_vendors_count == 0:
            return {
                "total_products": 50,
                "active_products": 45,
                "products_by_type": {
                    "finished": 20,
                    "semi_finished": 10,
                    "raw_material": 5,
                    "component": 12,
                    "packaging": 3,
                },
                "total_customers": 150,
                "active_customers": 142,
                "customers_by_grade": {
                    "VIP": 15,
                    "A": 45,
                    "B": 60,
                    "C": 30,
                },
                "total_vendors": 200,
                "active_vendors": 185,
                "vendors_by_grade": {
                    "strategic": 10,
                    "preferred": 50,
                    "approved": 100,
                    "conditional": 40,
                },
                "total_boms": 50,
                "total_routings": 50,
            }

        return {
            "total_products": total_products_count,
            "active_products": active_products_count,
            "products_by_type": products_by_type,
            "total_customers": total_customers_count,
            "active_customers": active_customers_count,
            "customers_by_grade": customers_by_grade,
            "total_vendors": total_vendors_count,
            "active_vendors": active_vendors_count,
            "vendors_by_grade": vendors_by_grade,
            "total_boms": total_boms_count,
            "total_routings": total_routings_count,
        }
    except Exception as e:
        print(f"Error fetching master data summary: {e}")
        return {
            "total_products": 50,
            "active_products": 45,
            "products_by_type": {
                "finished": 20,
                "semi_finished": 10,
                "raw_material": 5,
                "component": 12,
                "packaging": 3,
            },
            "total_customers": 150,
            "active_customers": 142,
            "customers_by_grade": {
                "VIP": 15,
                "A": 45,
                "B": 60,
                "C": 30,
            },
            "total_vendors": 200,
            "active_vendors": 185,
            "vendors_by_grade": {
                "strategic": 10,
                "preferred": 50,
                "approved": 100,
                "conditional": 40,
            },
            "total_boms": 50,
            "total_routings": 50,
        }
