"""
ERP Master Data Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ==================== Enums ====================

class ProductType(str, Enum):
    FINISHED = "finished"
    SEMI_FINISHED = "semi_finished"
    RAW_MATERIAL = "raw_material"
    COMPONENT = "component"
    PACKAGING = "packaging"


class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"
    DEVELOPMENT = "development"


class UnitOfMeasure(str, Enum):
    EA = "EA"
    PCS = "PCS"
    KG = "KG"
    G = "G"
    L = "L"
    ML = "ML"
    M = "M"
    MM = "MM"
    ROLL = "ROLL"
    BOX = "BOX"
    SET = "SET"


class CustomerType(str, Enum):
    DOMESTIC = "domestic"
    EXPORT = "export"
    BOTH = "both"


class CustomerGrade(str, Enum):
    VIP = "VIP"
    A = "A"
    B = "B"
    C = "C"


class VendorType(str, Enum):
    MANUFACTURER = "manufacturer"
    DISTRIBUTOR = "distributor"
    AGENT = "agent"


class VendorGrade(str, Enum):
    STRATEGIC = "strategic"
    PREFERRED = "preferred"
    APPROVED = "approved"
    CONDITIONAL = "conditional"


# ==================== Product Schemas ====================

class ProductBase(BaseModel):
    product_code: str = Field(..., max_length=50)
    product_name: str = Field(..., max_length=200)
    product_name_en: Optional[str] = None
    product_type: ProductType = ProductType.FINISHED
    product_group: Optional[str] = None
    product_category: Optional[str] = None
    specification: Optional[str] = None
    model_no: Optional[str] = None
    drawing_no: Optional[str] = None
    unit: UnitOfMeasure = UnitOfMeasure.EA
    lot_size: int = 1
    min_order_qty: int = 1
    standard_cost: float = 0
    material_cost: float = 0
    labor_cost: float = 0
    overhead_cost: float = 0
    selling_price: float = 0
    lead_time_days: int = 1
    safety_stock: int = 0
    reorder_point: int = 0
    status: ProductStatus = ProductStatus.ACTIVE
    is_active: bool = True
    description: Optional[str] = None
    remarks: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_name_en: Optional[str] = None
    product_type: Optional[ProductType] = None
    product_group: Optional[str] = None
    product_category: Optional[str] = None
    specification: Optional[str] = None
    model_no: Optional[str] = None
    unit: Optional[UnitOfMeasure] = None
    lot_size: Optional[int] = None
    standard_cost: Optional[float] = None
    selling_price: Optional[float] = None
    lead_time_days: Optional[int] = None
    safety_stock: Optional[int] = None
    status: Optional[ProductStatus] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    remarks: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int


# ==================== Customer Schemas ====================

class CustomerBase(BaseModel):
    customer_code: str = Field(..., max_length=50)
    customer_name: str = Field(..., max_length=200)
    customer_name_en: Optional[str] = None
    customer_type: CustomerType = CustomerType.DOMESTIC
    customer_grade: CustomerGrade = CustomerGrade.B
    industry: Optional[str] = None
    ceo_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Korea"
    postal_code: Optional[str] = None
    business_no: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    currency: str = "KRW"
    is_active: bool = True
    remarks: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_name_en: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    customer_grade: Optional[CustomerGrade] = None
    industry: Optional[str] = None
    ceo_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None
    remarks: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int


# ==================== Vendor Schemas ====================

class VendorBase(BaseModel):
    vendor_code: str = Field(..., max_length=50)
    vendor_name: str = Field(..., max_length=200)
    vendor_name_en: Optional[str] = None
    vendor_type: VendorType = VendorType.MANUFACTURER
    vendor_grade: VendorGrade = VendorGrade.APPROVED
    main_category: Optional[str] = None
    ceo_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Korea"
    postal_code: Optional[str] = None
    business_no: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: int = 7
    min_order_amount: Optional[float] = None
    currency: str = "KRW"
    quality_rating: Optional[float] = None
    delivery_rating: Optional[float] = None
    price_rating: Optional[float] = None
    overall_rating: Optional[float] = None
    is_active: bool = True
    remarks: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_name_en: Optional[str] = None
    vendor_type: Optional[VendorType] = None
    vendor_grade: Optional[VendorGrade] = None
    main_category: Optional[str] = None
    ceo_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    min_order_amount: Optional[float] = None
    quality_rating: Optional[float] = None
    delivery_rating: Optional[float] = None
    price_rating: Optional[float] = None
    overall_rating: Optional[float] = None
    is_active: Optional[bool] = None
    remarks: Optional[str] = None


class VendorResponse(VendorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VendorListResponse(BaseModel):
    items: List[VendorResponse]
    total: int
    page: int
    page_size: int


# ==================== BOM Schemas ====================

class BOMDetailBase(BaseModel):
    item_seq: int
    component_code: str = Field(..., max_length=50)
    component_name: Optional[str] = None
    quantity: float = 1.0
    unit: UnitOfMeasure = UnitOfMeasure.EA
    position: Optional[str] = None
    alternative_item: Optional[str] = None
    scrap_rate: float = 0
    is_critical: bool = False
    is_phantom: bool = False
    remarks: Optional[str] = None


class BOMDetailCreate(BOMDetailBase):
    pass


class BOMDetailResponse(BOMDetailBase):
    id: int
    header_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BOMHeaderBase(BaseModel):
    bom_no: str = Field(..., max_length=50)
    product_id: int
    bom_version: str = "1.0"
    effective_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None
    is_active: bool = True
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    remarks: Optional[str] = None


class BOMHeaderCreate(BOMHeaderBase):
    details: List[BOMDetailCreate] = []


class BOMHeaderResponse(BOMHeaderBase):
    id: int
    details: List[BOMDetailResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BOMListResponse(BaseModel):
    items: List[BOMHeaderResponse]
    total: int
    page: int
    page_size: int


# ==================== Routing Schemas ====================

class RoutingOperationBase(BaseModel):
    operation_seq: int
    operation_code: str = Field(..., max_length=50)
    operation_name: str = Field(..., max_length=200)
    work_center_code: Optional[str] = None
    work_center_name: Optional[str] = None
    line_code: Optional[str] = None
    setup_time: float = 0
    run_time: float = 0
    wait_time: float = 0
    move_time: float = 0
    standard_qty: int = 1
    capacity_per_hour: Optional[float] = None
    labor_rate: Optional[float] = None
    machine_rate: Optional[float] = None
    inspection_required: bool = False
    inspection_type: Optional[str] = None
    description: Optional[str] = None
    remarks: Optional[str] = None


class RoutingOperationCreate(RoutingOperationBase):
    pass


class RoutingOperationResponse(RoutingOperationBase):
    id: int
    header_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoutingHeaderBase(BaseModel):
    routing_no: str = Field(..., max_length=50)
    product_id: int
    routing_version: str = "1.0"
    effective_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None
    is_active: bool = True
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    remarks: Optional[str] = None


class RoutingHeaderCreate(RoutingHeaderBase):
    operations: List[RoutingOperationCreate] = []


class RoutingHeaderResponse(RoutingHeaderBase):
    id: int
    operations: List[RoutingOperationResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoutingListResponse(BaseModel):
    items: List[RoutingHeaderResponse]
    total: int
    page: int
    page_size: int


# ==================== Summary Schemas ====================

class MasterDataSummary(BaseModel):
    """기준정보 요약"""
    total_products: int
    active_products: int
    products_by_type: dict
    total_customers: int
    active_customers: int
    customers_by_grade: dict
    total_vendors: int
    active_vendors: int
    vendors_by_grade: dict
    total_boms: int
    total_routings: int
