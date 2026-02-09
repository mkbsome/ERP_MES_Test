"""
ERP Master Data API Router
- 품목 마스터 (Products)
- 고객 마스터 (Customers)
- 공급업체 마스터 (Vendors)
- BOM (Bill of Materials)
- Routing (공정 경로)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime

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


# ==================== Products API ====================

@router.get("/products", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_type: Optional[ProductType] = None,
    status: Optional[ProductStatus] = None,
    product_group: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """품목 마스터 목록 조회"""
    # Mock data
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
        {
            "id": 4,
            "product_code": "FG-ECU-001",
            "product_name": "자동차 ECU 보드",
            "product_name_en": "Automotive ECU Board",
            "product_type": "finished",
            "product_group": "자동차",
            "product_category": "ECU",
            "specification": "Size: 150x100mm, Layer: 6L",
            "model_no": "ECU-2024-A01",
            "drawing_no": "DWG-ECU-001",
            "unit": "EA",
            "lot_size": 50,
            "min_order_qty": 50,
            "standard_cost": 45000,
            "material_cost": 25000,
            "labor_cost": 10000,
            "overhead_cost": 10000,
            "selling_price": 70000,
            "lead_time_days": 7,
            "safety_stock": 100,
            "reorder_point": 200,
            "status": "active",
            "is_active": True,
            "description": "자동차용 고신뢰성 ECU 보드",
            "remarks": "AEC-Q100 인증 필요",
            "created_at": "2024-01-04T00:00:00",
            "updated_at": "2024-01-18T14:00:00",
        },
        {
            "id": 5,
            "product_code": "FG-IOT-001",
            "product_name": "IoT 통신 모듈",
            "product_name_en": "IoT Communication Module",
            "product_type": "finished",
            "product_group": "IoT",
            "product_category": "통신모듈",
            "specification": "Size: 30x20mm, Layer: 4L",
            "model_no": "IOT-2024-C01",
            "drawing_no": "DWG-IOT-001",
            "unit": "EA",
            "lot_size": 1000,
            "min_order_qty": 1000,
            "standard_cost": 5000,
            "material_cost": 2500,
            "labor_cost": 1200,
            "overhead_cost": 1300,
            "selling_price": 8000,
            "lead_time_days": 4,
            "safety_stock": 2000,
            "reorder_point": 4000,
            "status": "active",
            "is_active": True,
            "description": "WiFi/BLE 지원 IoT 통신 모듈",
            "remarks": None,
            "created_at": "2024-01-05T00:00:00",
            "updated_at": "2024-01-19T16:00:00",
        },
    ]

    return {
        "items": products,
        "total": len(products),
        "page": page,
        "page_size": page_size,
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int):
    """품목 상세 조회"""
    return {
        "id": product_id,
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
    }


@router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    """품목 등록"""
    return {
        "id": 100,
        **product.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductUpdate):
    """품목 수정"""
    return {
        "id": product_id,
        "product_code": "FG-MB-001",
        "product_name": product.product_name or "스마트폰 메인보드 A타입",
        "product_name_en": product.product_name_en or "Smartphone Mainboard Type A",
        "product_type": product.product_type or "finished",
        "product_group": product.product_group or "스마트폰",
        "product_category": "메인보드",
        "specification": "Size: 120x60mm, Layer: 8L HDI",
        "model_no": product.model_no or "MB-2024-A01",
        "drawing_no": "DWG-MB-001",
        "unit": product.unit or "EA",
        "lot_size": product.lot_size or 100,
        "min_order_qty": 100,
        "standard_cost": product.standard_cost or 15000,
        "material_cost": 8000,
        "labor_cost": 3000,
        "overhead_cost": 4000,
        "selling_price": product.selling_price or 25000,
        "lead_time_days": product.lead_time_days or 5,
        "safety_stock": product.safety_stock or 500,
        "reorder_point": 1000,
        "status": product.status or "active",
        "is_active": product.is_active if product.is_active is not None else True,
        "description": product.description or "고성능 스마트폰용 8레이어 HDI 메인보드",
        "remarks": product.remarks,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.delete("/products/{product_id}")
async def delete_product(product_id: int):
    """품목 삭제 (비활성화)"""
    return {"message": f"Product {product_id} has been deactivated"}


# ==================== Customers API ====================

@router.get("/customers", response_model=CustomerListResponse)
async def get_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    customer_type: Optional[CustomerType] = None,
    customer_grade: Optional[CustomerGrade] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """고객 마스터 목록 조회"""
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
        {
            "id": 4,
            "customer_code": "C-004",
            "customer_name": "Apple Inc.",
            "customer_name_en": "Apple Inc.",
            "customer_type": "export",
            "customer_grade": "VIP",
            "industry": "IT/전자",
            "ceo_name": "Tim Cook",
            "contact_person": "John Smith",
            "contact_phone": "+1-408-996-1010",
            "contact_email": "supplier@apple.com",
            "address": "One Apple Park Way, Cupertino, CA",
            "city": "Cupertino",
            "country": "USA",
            "postal_code": "95014",
            "business_no": None,
            "tax_id": "94-2404110",
            "payment_terms": "60일",
            "credit_limit": 10000000000,
            "currency": "USD",
            "is_active": True,
            "remarks": "수출 주요 거래처",
            "created_at": "2024-01-04T00:00:00",
            "updated_at": "2024-01-18T14:00:00",
        },
        {
            "id": 5,
            "customer_code": "C-005",
            "customer_name": "SK하이닉스",
            "customer_name_en": "SK Hynix",
            "customer_type": "domestic",
            "customer_grade": "A",
            "industry": "반도체",
            "ceo_name": "곽노정",
            "contact_person": "최담당",
            "contact_phone": "031-5185-4114",
            "contact_email": "contact@skhynix.com",
            "address": "경기도 이천시 부발읍 경충대로 2091",
            "city": "이천시",
            "country": "Korea",
            "postal_code": "17336",
            "business_no": "215-87-00313",
            "tax_id": None,
            "payment_terms": "30일",
            "credit_limit": 1500000000,
            "currency": "KRW",
            "is_active": True,
            "remarks": None,
            "created_at": "2024-01-05T00:00:00",
            "updated_at": "2024-01-19T16:00:00",
        },
    ]

    return {
        "items": customers,
        "total": len(customers),
        "page": page,
        "page_size": page_size,
    }


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int):
    """고객 상세 조회"""
    return {
        "id": customer_id,
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
    }


@router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate):
    """고객 등록"""
    return {
        "id": 100,
        **customer.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, customer: CustomerUpdate):
    """고객 수정"""
    return {
        "id": customer_id,
        "customer_code": "C-001",
        "customer_name": customer.customer_name or "삼성전자",
        "customer_name_en": customer.customer_name_en or "Samsung Electronics",
        "customer_type": customer.customer_type or "domestic",
        "customer_grade": customer.customer_grade or "VIP",
        "industry": customer.industry or "반도체/전자",
        "ceo_name": customer.ceo_name or "이재용",
        "contact_person": customer.contact_person or "김담당",
        "contact_phone": customer.contact_phone or "02-1234-5678",
        "contact_email": customer.contact_email or "contact@samsung.com",
        "address": customer.address or "경기도 화성시 삼성전자로 1",
        "city": customer.city or "화성시",
        "country": customer.country or "Korea",
        "postal_code": "18448",
        "business_no": "124-81-00998",
        "tax_id": None,
        "payment_terms": customer.payment_terms or "30일",
        "credit_limit": customer.credit_limit or 5000000000,
        "currency": "KRW",
        "is_active": customer.is_active if customer.is_active is not None else True,
        "remarks": customer.remarks or "주요 거래처",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: int):
    """고객 삭제 (비활성화)"""
    return {"message": f"Customer {customer_id} has been deactivated"}


# ==================== Vendors API ====================

@router.get("/vendors", response_model=VendorListResponse)
async def get_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vendor_type: Optional[VendorType] = None,
    vendor_grade: Optional[VendorGrade] = None,
    main_category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """공급업체 마스터 목록 조회"""
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
        {
            "id": 3,
            "vendor_code": "V-003",
            "vendor_name": "Murata Manufacturing",
            "vendor_name_en": "Murata Manufacturing",
            "vendor_type": "manufacturer",
            "vendor_grade": "strategic",
            "main_category": "수동부품",
            "ceo_name": "Norio Nakajima",
            "contact_person": "Tanaka",
            "contact_phone": "+81-75-955-6500",
            "contact_email": "sales@murata.com",
            "address": "10-1 Higashikotari 1-chome, Nagaokakyo-shi, Kyoto",
            "city": "Kyoto",
            "country": "Japan",
            "postal_code": "617-8555",
            "business_no": None,
            "tax_id": "1200010008273",
            "payment_terms": "45일",
            "lead_time_days": 28,
            "min_order_amount": 5000000,
            "currency": "JPY",
            "quality_rating": 98.0,
            "delivery_rating": 95.0,
            "price_rating": 75.0,
            "overall_rating": 89.0,
            "is_active": True,
            "remarks": "고품질 수동부품 공급",
            "created_at": "2024-01-03T00:00:00",
            "updated_at": "2024-01-17T09:00:00",
        },
        {
            "id": 4,
            "vendor_code": "V-004",
            "vendor_name": "Texas Instruments",
            "vendor_name_en": "Texas Instruments",
            "vendor_type": "manufacturer",
            "vendor_grade": "preferred",
            "main_category": "IC/반도체",
            "ceo_name": "Haviv Ilan",
            "contact_person": "Michael Lee",
            "contact_phone": "+1-972-995-2011",
            "contact_email": "vendors@ti.com",
            "address": "12500 TI Boulevard, Dallas, TX",
            "city": "Dallas",
            "country": "USA",
            "postal_code": "75243",
            "business_no": None,
            "tax_id": "75-0289970",
            "payment_terms": "60일",
            "lead_time_days": 35,
            "min_order_amount": 10000000,
            "currency": "USD",
            "quality_rating": 96.0,
            "delivery_rating": 90.0,
            "price_rating": 80.0,
            "overall_rating": 88.5,
            "is_active": True,
            "remarks": "주요 IC 공급사",
            "created_at": "2024-01-04T00:00:00",
            "updated_at": "2024-01-18T14:00:00",
        },
        {
            "id": 5,
            "vendor_code": "V-005",
            "vendor_name": "한솔테크닉스",
            "vendor_name_en": "Hansol Technics",
            "vendor_type": "manufacturer",
            "vendor_grade": "approved",
            "main_category": "커넥터",
            "ceo_name": "강담당",
            "contact_person": "윤담당",
            "contact_phone": "031-789-0114",
            "contact_email": "sales@hansoltechnics.com",
            "address": "경기도 성남시 분당구 판교로 322",
            "city": "성남시",
            "country": "Korea",
            "postal_code": "13493",
            "business_no": "124-81-56789",
            "tax_id": None,
            "payment_terms": "30일",
            "lead_time_days": 10,
            "min_order_amount": 200000,
            "currency": "KRW",
            "quality_rating": 85.0,
            "delivery_rating": 90.0,
            "price_rating": 88.0,
            "overall_rating": 87.5,
            "is_active": True,
            "remarks": None,
            "created_at": "2024-01-05T00:00:00",
            "updated_at": "2024-01-19T16:00:00",
        },
    ]

    return {
        "items": vendors,
        "total": len(vendors),
        "page": page,
        "page_size": page_size,
    }


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: int):
    """공급업체 상세 조회"""
    return {
        "id": vendor_id,
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
    }


@router.post("/vendors", response_model=VendorResponse)
async def create_vendor(vendor: VendorCreate):
    """공급업체 등록"""
    return {
        "id": 100,
        **vendor.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: int, vendor: VendorUpdate):
    """공급업체 수정"""
    return {
        "id": vendor_id,
        "vendor_code": "V-001",
        "vendor_name": vendor.vendor_name or "삼성전기",
        "vendor_name_en": vendor.vendor_name_en or "Samsung Electro-Mechanics",
        "vendor_type": vendor.vendor_type or "manufacturer",
        "vendor_grade": vendor.vendor_grade or "strategic",
        "main_category": vendor.main_category or "MLCC/칩부품",
        "ceo_name": vendor.ceo_name or "장덕현",
        "contact_person": vendor.contact_person or "정담당",
        "contact_phone": vendor.contact_phone or "031-300-7114",
        "contact_email": vendor.contact_email or "vendor@sem.samsung.com",
        "address": vendor.address or "경기도 수원시 영통구 매영로 150",
        "city": vendor.city or "수원시",
        "country": vendor.country or "Korea",
        "postal_code": "16674",
        "business_no": "135-81-00248",
        "tax_id": None,
        "payment_terms": vendor.payment_terms or "30일",
        "lead_time_days": vendor.lead_time_days or 14,
        "min_order_amount": vendor.min_order_amount or 1000000,
        "currency": "KRW",
        "quality_rating": vendor.quality_rating or 95.5,
        "delivery_rating": vendor.delivery_rating or 92.0,
        "price_rating": vendor.price_rating or 85.0,
        "overall_rating": vendor.overall_rating or 91.0,
        "is_active": vendor.is_active if vendor.is_active is not None else True,
        "remarks": vendor.remarks or "전략적 파트너",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: int):
    """공급업체 삭제 (비활성화)"""
    return {"message": f"Vendor {vendor_id} has been deactivated"}


# ==================== BOM API ====================

@router.get("/bom", response_model=BOMListResponse)
async def get_bom_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """BOM 목록 조회"""
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
                {
                    "id": 3, "header_id": 1, "item_seq": 30,
                    "component_code": "CAP-MLCC-100N", "component_name": "MLCC 100nF",
                    "quantity": 50, "unit": "EA", "position": "C1-C50",
                    "alternative_item": None, "scrap_rate": 0.02,
                    "is_critical": False, "is_phantom": False, "remarks": None,
                    "created_at": "2024-01-01T00:00:00", "updated_at": "2024-01-01T00:00:00",
                },
                {
                    "id": 4, "header_id": 1, "item_seq": 40,
                    "component_code": "RES-0402-10K", "component_name": "Resistor 10K",
                    "quantity": 30, "unit": "EA", "position": "R1-R30",
                    "alternative_item": None, "scrap_rate": 0.02,
                    "is_critical": False, "is_phantom": False, "remarks": None,
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


@router.get("/bom/{product_id}", response_model=BOMHeaderResponse)
async def get_product_bom(product_id: int):
    """제품별 BOM 조회"""
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
    }


@router.post("/bom", response_model=BOMHeaderResponse)
async def create_bom(bom: BOMHeaderCreate):
    """BOM 등록"""
    return {
        "id": 100,
        **bom.model_dump(exclude={"details"}),
        "details": [
            {"id": i + 1, "header_id": 100, **detail.model_dump(),
             "created_at": datetime.utcnow().isoformat(),
             "updated_at": datetime.utcnow().isoformat()}
            for i, detail in enumerate(bom.details)
        ],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Routing API ====================

@router.get("/routing", response_model=RoutingListResponse)
async def get_routing_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """Routing 목록 조회"""
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
                {
                    "id": 3, "header_id": 1, "operation_seq": 30,
                    "operation_code": "SMT-REFLOW", "operation_name": "리플로우",
                    "work_center_code": "WC-SMT-01", "work_center_name": "SMT 작업장",
                    "line_code": "SMT-L01",
                    "setup_time": 15, "run_time": 5.0, "wait_time": 10, "move_time": 2,
                    "standard_qty": 1, "capacity_per_hour": 12,
                    "labor_rate": 20000, "machine_rate": 80000,
                    "inspection_required": True, "inspection_type": "AOI",
                    "description": "리플로우 오븐 솔더링",
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


@router.get("/routing/{product_id}", response_model=RoutingHeaderResponse)
async def get_product_routing(product_id: int):
    """제품별 Routing 조회"""
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
    }


@router.post("/routing", response_model=RoutingHeaderResponse)
async def create_routing(routing: RoutingHeaderCreate):
    """Routing 등록"""
    return {
        "id": 100,
        **routing.model_dump(exclude={"operations"}),
        "operations": [
            {"id": i + 1, "header_id": 100, **op.model_dump(),
             "created_at": datetime.utcnow().isoformat(),
             "updated_at": datetime.utcnow().isoformat()}
            for i, op in enumerate(routing.operations)
        ],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


# ==================== Summary API ====================

@router.get("/summary", response_model=MasterDataSummary)
async def get_master_data_summary():
    """기준정보 요약"""
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
