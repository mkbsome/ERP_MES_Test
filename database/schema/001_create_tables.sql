-- ============================================================
-- ERP-MES 통합 시스템 PostgreSQL 스키마
-- Version: 1.0.0
-- Created: 2024-01
-- ============================================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PART 1: 공통 타입 및 함수
-- ============================================================

-- 다중테넌트 ID 생성 함수
CREATE OR REPLACE FUNCTION generate_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 자동 updated_at 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 2: ERP 기준정보 (Master Data)
-- ============================================================

-- 2.1 품목 마스터
CREATE TABLE erp_product_master (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('FG', 'WIP', 'RM', 'PKG', 'MRO')),
    product_group VARCHAR(50),
    uom VARCHAR(20) NOT NULL DEFAULT 'EA',
    standard_cost NUMERIC(15,2) DEFAULT 0,
    selling_price NUMERIC(15,2) DEFAULT 0,
    safety_stock NUMERIC(12,3) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    UNIQUE(tenant_id, product_code)
);

-- 2.2 고객 마스터
CREATE TABLE erp_customer_master (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_type VARCHAR(20) CHECK (customer_type IN ('domestic', 'overseas', 'group')),
    customer_grade VARCHAR(10) CHECK (customer_grade IN ('A', 'B', 'C', 'D')),
    business_no VARCHAR(20),
    ceo_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    credit_limit NUMERIC(15,2) DEFAULT 0,
    payment_terms VARCHAR(20) DEFAULT 'net_30',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, customer_code)
);

-- 2.3 거래처(공급업체) 마스터
CREATE TABLE erp_vendor_master (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(20) CHECK (vendor_type IN ('manufacturer', 'distributor', 'service')),
    vendor_grade VARCHAR(10) CHECK (vendor_grade IN ('A', 'B', 'C', 'D')),
    business_no VARCHAR(20),
    ceo_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    payment_terms VARCHAR(20) DEFAULT 'net_30',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, vendor_code)
);

-- 2.4 BOM 헤더
CREATE TABLE erp_bom_header (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    bom_no VARCHAR(50) NOT NULL,
    product_id INTEGER REFERENCES erp_product_master(id),
    product_code VARCHAR(50) NOT NULL,
    bom_version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, bom_no)
);

-- 2.5 BOM 상세
CREATE TABLE erp_bom_detail (
    id SERIAL PRIMARY KEY,
    header_id INTEGER REFERENCES erp_bom_header(id) ON DELETE CASCADE,
    seq_no INTEGER NOT NULL,
    component_code VARCHAR(50) NOT NULL,
    component_name VARCHAR(200),
    qty_per_unit NUMERIC(12,6) NOT NULL,
    uom VARCHAR(20) DEFAULT 'EA',
    loss_rate NUMERIC(5,2) DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 라우팅(공정) 헤더
CREATE TABLE erp_routing_header (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    routing_no VARCHAR(50) NOT NULL,
    product_id INTEGER REFERENCES erp_product_master(id),
    product_code VARCHAR(50) NOT NULL,
    routing_version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, routing_no)
);

-- 2.7 라우팅 공정 상세
CREATE TABLE erp_routing_operation (
    id SERIAL PRIMARY KEY,
    header_id INTEGER REFERENCES erp_routing_header(id) ON DELETE CASCADE,
    operation_seq INTEGER NOT NULL,
    operation_code VARCHAR(50) NOT NULL,
    operation_name VARCHAR(200),
    work_center_code VARCHAR(50),
    setup_time_min NUMERIC(8,2) DEFAULT 0,
    run_time_min NUMERIC(8,2) DEFAULT 0,
    labor_cost_per_hour NUMERIC(10,2) DEFAULT 0,
    machine_cost_per_hour NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.8 창고 마스터
CREATE TABLE erp_warehouse (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    warehouse_code VARCHAR(50) NOT NULL,
    warehouse_name VARCHAR(200) NOT NULL,
    warehouse_type VARCHAR(20) CHECK (warehouse_type IN ('raw', 'wip', 'finished', 'mro')),
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, warehouse_code)
);

-- ============================================================
-- PART 3: ERP 영업관리 (Sales)
-- ============================================================

-- 3.1 수주 헤더
CREATE TABLE erp_sales_order (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    order_no VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    customer_id INTEGER REFERENCES erp_customer_master(id),
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200),
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_production', 'ready', 'shipped', 'invoiced', 'closed', 'cancelled')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'KRW',
    payment_terms VARCHAR(20),
    shipping_address TEXT,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    UNIQUE(tenant_id, order_no)
);

-- 3.2 수주 상세
CREATE TABLE erp_sales_order_item (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES erp_sales_order(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    product_id INTEGER REFERENCES erp_product_master(id),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    order_qty NUMERIC(12,3) NOT NULL,
    shipped_qty NUMERIC(12,3) DEFAULT 0,
    remaining_qty NUMERIC(12,3) GENERATED ALWAYS AS (order_qty - shipped_qty) STORED,
    unit_price NUMERIC(15,2) NOT NULL,
    amount NUMERIC(15,2) GENERATED ALWAYS AS (order_qty * unit_price) STORED,
    promised_date DATE,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 출하
CREATE TABLE erp_shipment (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    shipment_no VARCHAR(50) NOT NULL,
    shipment_date DATE NOT NULL,
    order_id INTEGER REFERENCES erp_sales_order(id),
    order_no VARCHAR(50),
    customer_code VARCHAR(50),
    customer_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'picking', 'packed', 'shipped', 'delivered', 'cancelled')),
    carrier VARCHAR(100),
    tracking_no VARCHAR(100),
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, shipment_no)
);

-- 3.4 출하 상세
CREATE TABLE erp_shipment_item (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES erp_shipment(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    order_item_id INTEGER REFERENCES erp_sales_order_item(id),
    ship_qty NUMERIC(12,3) NOT NULL,
    lot_no VARCHAR(50),
    warehouse_code VARCHAR(50),
    location_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 매출(청구서)
CREATE TABLE erp_sales_revenue (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    order_id INTEGER REFERENCES erp_sales_order(id),
    shipment_id INTEGER REFERENCES erp_shipment(id),
    customer_code VARCHAR(50),
    customer_name VARCHAR(200),
    subtotal NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    payment_terms VARCHAR(20),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'partial', 'paid', 'overdue', 'cancelled')),
    paid_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, invoice_no)
);

-- ============================================================
-- PART 4: ERP 구매관리 (Purchase)
-- ============================================================

-- 4.1 발주 헤더
CREATE TABLE erp_purchase_order (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    po_no VARCHAR(50) NOT NULL,
    po_date DATE NOT NULL,
    vendor_id INTEGER REFERENCES erp_vendor_master(id),
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(200),
    expected_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'approved', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'KRW',
    payment_terms VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, po_no)
);

-- 4.2 발주 상세
CREATE TABLE erp_purchase_order_item (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES erp_purchase_order(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    product_id INTEGER REFERENCES erp_product_master(id),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200),
    order_qty NUMERIC(12,3) NOT NULL,
    received_qty NUMERIC(12,3) DEFAULT 0,
    remaining_qty NUMERIC(12,3) GENERATED ALWAYS AS (order_qty - received_qty) STORED,
    unit_price NUMERIC(15,2) NOT NULL,
    amount NUMERIC(15,2) GENERATED ALWAYS AS (order_qty * unit_price) STORED,
    expected_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.3 입고
CREATE TABLE erp_goods_receipt (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    receipt_no VARCHAR(50) NOT NULL,
    receipt_date DATE NOT NULL,
    po_id INTEGER REFERENCES erp_purchase_order(id),
    po_no VARCHAR(50),
    vendor_code VARCHAR(50),
    vendor_name VARCHAR(200),
    warehouse_code VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'inspecting', 'passed', 'rejected', 'partial', 'stored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, receipt_no)
);

-- 4.4 입고 상세
CREATE TABLE erp_goods_receipt_item (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES erp_goods_receipt(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    po_item_id INTEGER REFERENCES erp_purchase_order_item(id),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200),
    receipt_qty NUMERIC(12,3) NOT NULL,
    accepted_qty NUMERIC(12,3) DEFAULT 0,
    rejected_qty NUMERIC(12,3) DEFAULT 0,
    unit_cost NUMERIC(15,2),
    lot_no VARCHAR(50),
    inspection_result VARCHAR(20) CHECK (inspection_result IN ('PASS', 'FAIL', 'PARTIAL', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.5 매입(구매청구서)
CREATE TABLE erp_purchase_invoice (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    po_id INTEGER REFERENCES erp_purchase_order(id),
    receipt_id INTEGER REFERENCES erp_goods_receipt(id),
    vendor_code VARCHAR(50),
    vendor_name VARCHAR(200),
    subtotal NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    payment_terms VARCHAR(20),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partial', 'paid', 'overdue', 'cancelled')),
    paid_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, invoice_no)
);

-- ============================================================
-- PART 5: ERP 재고관리 (Inventory)
-- ============================================================

-- 5.1 재고 현황
CREATE TABLE erp_inventory_stock (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200),
    warehouse_code VARCHAR(50) NOT NULL,
    location_code VARCHAR(50),
    lot_no VARCHAR(50),
    quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
    reserved_qty NUMERIC(12,3) DEFAULT 0,
    available_qty NUMERIC(12,3) GENERATED ALWAYS AS (quantity - reserved_qty) STORED,
    unit_cost NUMERIC(15,2) DEFAULT 0,
    total_value NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'quarantine', 'damaged')),
    last_movement_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 함수 표현식을 포함한 UNIQUE INDEX (UNIQUE 제약조건 대신)
CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_inventory_stock_unique
ON erp_inventory_stock(tenant_id, item_code, warehouse_code, COALESCE(lot_no, ''));

-- 5.2 재고 이동 이력
CREATE TABLE erp_inventory_transaction (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'production_in', 'production_out', 'return')),
    transaction_reason VARCHAR(50),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200),
    from_warehouse VARCHAR(50),
    to_warehouse VARCHAR(50),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    quantity NUMERIC(12,3) NOT NULL,
    unit_cost NUMERIC(15,2),
    total_cost NUMERIC(15,2),
    lot_no VARCHAR(50),
    reference_type VARCHAR(50),
    reference_no VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    UNIQUE(tenant_id, transaction_no)
);

-- 5.3 재고 조정
CREATE TABLE erp_inventory_adjustment (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    adjustment_no VARCHAR(50) NOT NULL,
    adjustment_date DATE NOT NULL,
    adjustment_type VARCHAR(20) CHECK (adjustment_type IN ('count', 'damage', 'expiry', 'other')),
    warehouse_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'cancelled')),
    remark TEXT,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, adjustment_no)
);

-- 5.4 재고 조정 상세
CREATE TABLE erp_inventory_adjustment_item (
    id SERIAL PRIMARY KEY,
    adjustment_id INTEGER REFERENCES erp_inventory_adjustment(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    lot_no VARCHAR(50),
    book_qty NUMERIC(12,3) NOT NULL,
    actual_qty NUMERIC(12,3) NOT NULL,
    variance_qty NUMERIC(12,3) GENERATED ALWAYS AS (actual_qty - book_qty) STORED,
    unit_cost NUMERIC(15,2),
    variance_value NUMERIC(15,2),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PART 6: ERP 생산관리 (Production Planning)
-- ============================================================

-- 6.1 MPS (주생산계획)
CREATE TABLE erp_mps (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mps_no VARCHAR(50) NOT NULL,
    plan_year INTEGER NOT NULL,
    plan_month INTEGER NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    planned_qty NUMERIC(12,3) NOT NULL,
    confirmed_qty NUMERIC(12,3) DEFAULT 0,
    produced_qty NUMERIC(12,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mps_no)
);

-- 6.2 MRP (자재소요계획)
CREATE TABLE erp_mrp (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mrp_no VARCHAR(50) NOT NULL,
    run_date DATE NOT NULL,
    mps_id INTEGER REFERENCES erp_mps(id),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200),
    item_type VARCHAR(20) CHECK (item_type IN ('FG', 'WIP', 'RM')),
    gross_requirement NUMERIC(12,3) NOT NULL,
    on_hand_qty NUMERIC(12,3) DEFAULT 0,
    on_order_qty NUMERIC(12,3) DEFAULT 0,
    net_requirement NUMERIC(12,3) NOT NULL,
    planned_order_qty NUMERIC(12,3),
    planned_order_date DATE,
    action_type VARCHAR(20) CHECK (action_type IN ('purchase', 'production', 'none')),
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mrp_no)
);

-- 6.3 제조오더 (ERP)
CREATE TABLE erp_work_order (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    work_order_no VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    product_id INTEGER REFERENCES erp_product_master(id),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    order_qty NUMERIC(12,3) NOT NULL,
    completed_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    bom_id INTEGER REFERENCES erp_bom_header(id),
    routing_id INTEGER REFERENCES erp_routing_header(id),
    sales_order_id INTEGER REFERENCES erp_sales_order(id),
    planned_start DATE,
    planned_end DATE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'closed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, work_order_no)
);

-- 6.4 생산실적 (ERP)
CREATE TABLE erp_production_result (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    result_no VARCHAR(50) NOT NULL,
    result_date DATE NOT NULL,
    work_order_id INTEGER REFERENCES erp_work_order(id),
    work_order_no VARCHAR(50),
    product_code VARCHAR(50) NOT NULL,
    operation_seq INTEGER,
    produced_qty NUMERIC(12,3) NOT NULL,
    good_qty NUMERIC(12,3) NOT NULL,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    work_hours NUMERIC(8,2),
    labor_cost NUMERIC(15,2),
    material_cost NUMERIC(15,2),
    overhead_cost NUMERIC(15,2),
    lot_no VARCHAR(50),
    worker_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, result_no)
);

-- ============================================================
-- PART 7: ERP 원가관리 (Cost Management)
-- ============================================================

-- 7.1 계정과목
CREATE TABLE erp_account_code (
    account_code VARCHAR(20) PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(50),
    parent_code VARCHAR(20) REFERENCES erp_account_code(account_code),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.2 원가센터
CREATE TABLE erp_cost_center (
    cost_center_code VARCHAR(50) PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    cost_center_name VARCHAR(200) NOT NULL,
    cost_center_type VARCHAR(20) CHECK (cost_center_type IN ('production', 'admin', 'sales', 'rd')),
    parent_code VARCHAR(50) REFERENCES erp_cost_center(cost_center_code),
    manager_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.3 표준원가
CREATE TABLE erp_standard_cost (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER,
    material_cost NUMERIC(15,2) DEFAULT 0,
    labor_cost NUMERIC(15,2) DEFAULT 0,
    overhead_cost NUMERIC(15,2) DEFAULT 0,
    total_cost NUMERIC(15,2) GENERATED ALWAYS AS (material_cost + labor_cost + overhead_cost) STORED,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 함수 표현식을 포함한 UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_standard_cost_unique
ON erp_standard_cost(tenant_id, product_code, fiscal_year, COALESCE(fiscal_period, 0));

-- 7.4 실제원가
CREATE TABLE erp_actual_cost (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    cost_no VARCHAR(50) NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    work_order_no VARCHAR(50),
    production_qty NUMERIC(12,3) NOT NULL,
    material_cost NUMERIC(15,2) DEFAULT 0,
    labor_cost NUMERIC(15,2) DEFAULT 0,
    overhead_cost NUMERIC(15,2) DEFAULT 0,
    total_cost NUMERIC(15,2) GENERATED ALWAYS AS (material_cost + labor_cost + overhead_cost) STORED,
    unit_cost NUMERIC(15,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, cost_no)
);

-- 7.5 원가차이 분석
CREATE TABLE erp_cost_variance (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    variance_no VARCHAR(50) NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    variance_type VARCHAR(20) CHECK (variance_type IN ('material', 'labor', 'overhead', 'total')),
    standard_cost NUMERIC(15,2) NOT NULL,
    actual_cost NUMERIC(15,2) NOT NULL,
    variance_amount NUMERIC(15,2) GENERATED ALWAYS AS (actual_cost - standard_cost) STORED,
    variance_rate NUMERIC(8,4),
    variance_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, variance_no)
);

-- ============================================================
-- PART 8: ERP 자산관리 (Asset Management) - 신규
-- ============================================================

-- 8.1 고정자산 마스터
CREATE TABLE erp_fixed_asset (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    asset_code VARCHAR(50) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    asset_category VARCHAR(50) NOT NULL CHECK (asset_category IN ('building', 'machinery', 'vehicle', 'equipment', 'furniture', 'intangible', 'land')),
    asset_type VARCHAR(50),
    location VARCHAR(200),
    department_code VARCHAR(50),
    acquisition_date DATE NOT NULL,
    acquisition_cost NUMERIC(15,2) NOT NULL,
    useful_life_years INTEGER NOT NULL,
    residual_value NUMERIC(15,2) DEFAULT 0,
    depreciation_method VARCHAR(20) DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')),
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,
    book_value NUMERIC(15,2) GENERATED ALWAYS AS (acquisition_cost - accumulated_depreciation) STORED,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'idle', 'maintenance')),
    disposed_date DATE,
    disposed_value NUMERIC(15,2),
    vendor_code VARCHAR(50),
    serial_no VARCHAR(100),
    warranty_expiry DATE,
    insurance_policy VARCHAR(100),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, asset_code)
);

-- 8.2 감가상각 스케줄
CREATE TABLE erp_depreciation_schedule (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    asset_id INTEGER REFERENCES erp_fixed_asset(id) ON DELETE CASCADE,
    asset_code VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    beginning_value NUMERIC(15,2) NOT NULL,
    depreciation_amount NUMERIC(15,2) NOT NULL,
    accumulated_depreciation NUMERIC(15,2) NOT NULL,
    ending_value NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'adjusted')),
    posted_date DATE,
    voucher_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, asset_code, fiscal_year, fiscal_period)
);

-- 8.3 자산 취득/처분 이력
CREATE TABLE erp_asset_transaction (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    asset_id INTEGER REFERENCES erp_fixed_asset(id),
    asset_code VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('acquisition', 'disposal', 'transfer', 'revaluation', 'impairment', 'improvement')),
    amount NUMERIC(15,2) NOT NULL,
    from_department VARCHAR(50),
    to_department VARCHAR(50),
    from_location VARCHAR(200),
    to_location VARCHAR(200),
    reason TEXT,
    voucher_no VARCHAR(50),
    approved_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, transaction_no)
);

-- 8.4 자산 유지보수 이력
CREATE TABLE erp_asset_maintenance (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    maintenance_no VARCHAR(50) NOT NULL,
    asset_id INTEGER REFERENCES erp_fixed_asset(id),
    asset_code VARCHAR(50) NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(20) CHECK (maintenance_type IN ('preventive', 'corrective', 'improvement', 'inspection')),
    description TEXT,
    cost NUMERIC(15,2) DEFAULT 0,
    vendor_code VARCHAR(50),
    next_maintenance_date DATE,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, maintenance_no)
);

-- ============================================================
-- PART 9: ERP 재무회계 (Financial Accounting) - 신규
-- ============================================================

-- 9.1 회계기간
CREATE TABLE erp_fiscal_period (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    period_name VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, fiscal_year, fiscal_period)
);

-- 9.2 전표 (분개장)
CREATE TABLE erp_voucher (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    voucher_no VARCHAR(50) NOT NULL,
    voucher_date DATE NOT NULL,
    voucher_type VARCHAR(20) NOT NULL CHECK (voucher_type IN ('SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'TRANSFER', 'ADJUSTMENT', 'DEPRECIATION', 'CLOSING')),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_no VARCHAR(50),
    description TEXT,
    total_debit NUMERIC(15,2) NOT NULL,
    total_credit NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'cancelled')),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    UNIQUE(tenant_id, voucher_no)
);

-- 9.3 전표 상세
CREATE TABLE erp_voucher_detail (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER REFERENCES erp_voucher(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    account_code VARCHAR(20) REFERENCES erp_account_code(account_code),
    account_name VARCHAR(200),
    cost_center_code VARCHAR(50),
    debit_amount NUMERIC(15,2) DEFAULT 0,
    credit_amount NUMERIC(15,2) DEFAULT 0,
    description TEXT,
    sub_code VARCHAR(50),
    sub_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9.4 총계정원장
CREATE TABLE erp_general_ledger (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) REFERENCES erp_account_code(account_code),
    account_name VARCHAR(200),
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    opening_balance_debit NUMERIC(15,2) DEFAULT 0,
    opening_balance_credit NUMERIC(15,2) DEFAULT 0,
    period_debit NUMERIC(15,2) DEFAULT 0,
    period_credit NUMERIC(15,2) DEFAULT 0,
    closing_balance_debit NUMERIC(15,2) DEFAULT 0,
    closing_balance_credit NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, account_code, fiscal_year, fiscal_period)
);

-- 9.5 미지급금 (AP)
CREATE TABLE erp_accounts_payable (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    ap_no VARCHAR(50) NOT NULL,
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(200),
    invoice_no VARCHAR(50),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    original_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) GENERATED ALWAYS AS (original_amount - paid_amount) STORED,
    currency VARCHAR(10) DEFAULT 'KRW',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'paid', 'overdue', 'cancelled')),
    aging_days INTEGER,
    aging_bucket VARCHAR(20),
    reference_type VARCHAR(50),
    reference_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, ap_no)
);

-- 9.6 미수금 (AR)
CREATE TABLE erp_accounts_receivable (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    ar_no VARCHAR(50) NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200),
    invoice_no VARCHAR(50),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    original_amount NUMERIC(15,2) NOT NULL,
    received_amount NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) GENERATED ALWAYS AS (original_amount - received_amount) STORED,
    currency VARCHAR(10) DEFAULT 'KRW',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'collected', 'overdue', 'bad_debt', 'cancelled')),
    aging_days INTEGER,
    aging_bucket VARCHAR(20),
    reference_type VARCHAR(50),
    reference_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, ar_no)
);

-- 9.7 자금수지 (Cash Flow)
CREATE TABLE erp_cash_flow (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    flow_type VARCHAR(20) NOT NULL CHECK (flow_type IN ('inflow', 'outflow')),
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2),
    bank_account VARCHAR(50),
    reference_type VARCHAR(50),
    reference_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, transaction_no)
);

-- 9.8 결산 마감
CREATE TABLE erp_closing_entry (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    closing_no VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    closing_type VARCHAR(20) CHECK (closing_type IN ('monthly', 'quarterly', 'annual')),
    closing_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    total_revenue NUMERIC(15,2),
    total_expense NUMERIC(15,2),
    net_income NUMERIC(15,2),
    retained_earnings NUMERIC(15,2),
    voucher_no VARCHAR(50),
    closed_by VARCHAR(50),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, closing_no)
);

-- ============================================================
-- PART 10: ERP 관리회계 (Management Accounting) - 신규
-- ============================================================

-- 10.1 손익계산서 (P&L)
CREATE TABLE erp_profit_loss (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    report_no VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    report_type VARCHAR(20) CHECK (report_type IN ('monthly', 'quarterly', 'annual')),
    -- 매출
    sales_revenue NUMERIC(15,2) DEFAULT 0,
    sales_returns NUMERIC(15,2) DEFAULT 0,
    net_sales NUMERIC(15,2) DEFAULT 0,
    -- 매출원가
    cost_of_goods_sold NUMERIC(15,2) DEFAULT 0,
    gross_profit NUMERIC(15,2) DEFAULT 0,
    gross_profit_rate NUMERIC(8,4),
    -- 판관비
    selling_expense NUMERIC(15,2) DEFAULT 0,
    admin_expense NUMERIC(15,2) DEFAULT 0,
    operating_income NUMERIC(15,2) DEFAULT 0,
    operating_income_rate NUMERIC(8,4),
    -- 영업외
    non_operating_income NUMERIC(15,2) DEFAULT 0,
    non_operating_expense NUMERIC(15,2) DEFAULT 0,
    income_before_tax NUMERIC(15,2) DEFAULT 0,
    -- 세금 및 순이익
    income_tax NUMERIC(15,2) DEFAULT 0,
    net_income NUMERIC(15,2) DEFAULT 0,
    net_income_rate NUMERIC(8,4),
    -- 예산 대비
    budget_net_sales NUMERIC(15,2),
    budget_variance NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, report_no)
);

-- 10.2 수익성 분석 (제품별)
CREATE TABLE erp_profitability_product (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    analysis_no VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    product_group VARCHAR(50),
    sales_qty NUMERIC(12,3) DEFAULT 0,
    sales_amount NUMERIC(15,2) DEFAULT 0,
    cost_amount NUMERIC(15,2) DEFAULT 0,
    gross_profit NUMERIC(15,2) DEFAULT 0,
    gross_profit_rate NUMERIC(8,4),
    contribution_margin NUMERIC(15,2) DEFAULT 0,
    contribution_rate NUMERIC(8,4),
    rank_by_profit INTEGER,
    rank_by_sales INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, analysis_no)
);

-- 10.3 수익성 분석 (고객별)
CREATE TABLE erp_profitability_customer (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    analysis_no VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200),
    customer_grade VARCHAR(10),
    sales_amount NUMERIC(15,2) DEFAULT 0,
    cost_amount NUMERIC(15,2) DEFAULT 0,
    gross_profit NUMERIC(15,2) DEFAULT 0,
    gross_profit_rate NUMERIC(8,4),
    sales_expense NUMERIC(15,2) DEFAULT 0,
    net_profit NUMERIC(15,2) DEFAULT 0,
    net_profit_rate NUMERIC(8,4),
    order_count INTEGER DEFAULT 0,
    avg_order_value NUMERIC(15,2),
    rank_by_profit INTEGER,
    rank_by_sales INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, analysis_no)
);

-- 10.4 예산 관리
CREATE TABLE erp_budget (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    budget_no VARCHAR(50) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER,
    budget_type VARCHAR(20) CHECK (budget_type IN ('revenue', 'expense', 'capex', 'project')),
    department_code VARCHAR(50),
    cost_center_code VARCHAR(50),
    account_code VARCHAR(20),
    budget_amount NUMERIC(15,2) NOT NULL,
    actual_amount NUMERIC(15,2) DEFAULT 0,
    variance_amount NUMERIC(15,2) GENERATED ALWAYS AS (actual_amount - budget_amount) STORED,
    variance_rate NUMERIC(8,4),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, budget_no)
);

-- ============================================================
-- PART 11: ERP 인사관리 (HR)
-- ============================================================

-- 11.1 부서
CREATE TABLE erp_department (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    department_code VARCHAR(50) NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    parent_code VARCHAR(50),
    manager_id VARCHAR(50),
    cost_center_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, department_code)
);

-- 11.2 직급
CREATE TABLE erp_position (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    position_code VARCHAR(50) NOT NULL,
    position_name VARCHAR(100) NOT NULL,
    position_level INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, position_code)
);

-- 11.3 사원
CREATE TABLE erp_employee (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50),
    position_code VARCHAR(50),
    hire_date DATE NOT NULL,
    resign_date DATE,
    email VARCHAR(100),
    phone VARCHAR(30),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    bank_name VARCHAR(50),
    bank_account VARCHAR(50),
    base_salary NUMERIC(15,2),
    employment_type VARCHAR(20) CHECK (employment_type IN ('regular', 'contract', 'part_time', 'intern')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'leave', 'resigned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, employee_id)
);

-- 11.4 근태 기록
CREATE TABLE erp_attendance (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    work_date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    work_hours NUMERIC(5,2),
    overtime_hours NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day', 'holiday', 'leave')),
    leave_type VARCHAR(20),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, employee_id, work_date)
);

-- 11.5 급여
CREATE TABLE erp_payroll (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    payroll_no VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    pay_year INTEGER NOT NULL,
    pay_month INTEGER NOT NULL,
    base_salary NUMERIC(15,2) DEFAULT 0,
    overtime_pay NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    allowances NUMERIC(15,2) DEFAULT 0,
    gross_pay NUMERIC(15,2) DEFAULT 0,
    income_tax NUMERIC(15,2) DEFAULT 0,
    social_insurance NUMERIC(15,2) DEFAULT 0,
    other_deductions NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    net_pay NUMERIC(15,2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, payroll_no)
);

-- ============================================================
-- PART 12: MES 생산관리 (Production)
-- ============================================================

-- 12.1 생산라인
CREATE TABLE mes_production_line (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    line_code VARCHAR(50) NOT NULL,
    line_name VARCHAR(200) NOT NULL,
    line_type VARCHAR(20) CHECK (line_type IN ('SMT', 'DIP', 'ASSY', 'TEST', 'PACK')),
    factory_code VARCHAR(50),
    capacity_per_hour NUMERIC(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, line_code)
);

-- 12.2 설비 마스터
CREATE TABLE mes_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    equipment_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    equipment_type VARCHAR(50),
    line_id UUID REFERENCES mes_production_line(id),
    line_code VARCHAR(50),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_no VARCHAR(100),
    install_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, equipment_code)
);

-- 12.3 작업지시 (MES)
CREATE TABLE mes_production_order (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    production_order_no VARCHAR(50) NOT NULL,
    erp_work_order_no VARCHAR(50),
    order_date DATE NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    line_code VARCHAR(50),
    target_qty NUMERIC(12,3) NOT NULL,
    produced_qty NUMERIC(12,3) DEFAULT 0,
    good_qty NUMERIC(12,3) DEFAULT 0,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    bom_id INTEGER,
    routing_id INTEGER,
    planned_start TIMESTAMP WITH TIME ZONE,
    planned_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'started', 'paused', 'completed', 'closed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    completion_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, production_order_no)
);

-- 12.4 생산실적 (MES)
CREATE TABLE mes_production_result (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    production_order_id UUID REFERENCES mes_production_order(id),
    production_order_no VARCHAR(50),
    result_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operation_seq INTEGER,
    line_code VARCHAR(50),
    equipment_code VARCHAR(50),
    product_code VARCHAR(50) NOT NULL,
    input_qty NUMERIC(12,3) NOT NULL,
    output_qty NUMERIC(12,3) NOT NULL,
    good_qty NUMERIC(12,3) NOT NULL,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    cycle_time_sec NUMERIC(10,3),
    yield_rate NUMERIC(5,2),
    defect_rate NUMERIC(5,2),
    lot_no VARCHAR(50),
    worker_id VARCHAR(50),
    shift VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12.5 실시간 생산 모니터링
CREATE TABLE mes_realtime_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    line_code VARCHAR(50) NOT NULL,
    equipment_code VARCHAR(50),
    production_order_no VARCHAR(50),
    product_code VARCHAR(50),
    takt_count INTEGER DEFAULT 0,
    good_count INTEGER DEFAULT 0,
    defect_count INTEGER DEFAULT 0,
    cycle_time_ms INTEGER,
    target_cycle_time_ms INTEGER,
    equipment_status VARCHAR(20),
    speed_rpm NUMERIC(10,2),
    temperature_celsius NUMERIC(6,2),
    pressure_bar NUMERIC(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PART 13: MES 품질관리 (Quality)
-- ============================================================

-- 13.1 불량유형
CREATE TABLE mes_defect_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    defect_code VARCHAR(50) NOT NULL,
    defect_name VARCHAR(200) NOT NULL,
    defect_category VARCHAR(50),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, defect_code)
);

-- 13.2 불량 상세
CREATE TABLE mes_defect_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    production_order_id UUID REFERENCES mes_production_order(id),
    production_order_no VARCHAR(50),
    product_code VARCHAR(50) NOT NULL,
    defect_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detection_point VARCHAR(50),
    line_code VARCHAR(50),
    equipment_code VARCHAR(50),
    defect_code VARCHAR(50),
    defect_category VARCHAR(50),
    severity VARCHAR(20),
    defect_qty INTEGER DEFAULT 1,
    defect_location VARCHAR(100),
    lot_no VARCHAR(50),
    repair_result VARCHAR(20) CHECK (repair_result IN ('repaired', 'scrapped', 'pending', 'returned')),
    root_cause_category VARCHAR(50),
    root_cause_detail TEXT,
    corrective_action TEXT,
    worker_id VARCHAR(50),
    inspector_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13.3 검사 결과
CREATE TABLE mes_inspection_result (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    inspection_no VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(20) CHECK (inspection_type IN ('incoming', 'process', 'final', 'AOI', 'SPI', 'ICT', 'FCT')),
    production_order_id UUID REFERENCES mes_production_order(id),
    lot_no VARCHAR(50),
    product_code VARCHAR(50),
    inspection_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    inspector_id VARCHAR(50),
    sample_size INTEGER,
    pass_qty INTEGER DEFAULT 0,
    fail_qty INTEGER DEFAULT 0,
    result VARCHAR(20) CHECK (result IN ('PASS', 'FAIL', 'CONDITIONAL')),
    defect_points JSONB,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, inspection_no)
);

-- 13.4 SPC 데이터
CREATE TABLE mes_spc_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    measurement_time TIMESTAMP WITH TIME ZONE NOT NULL,
    line_code VARCHAR(50),
    equipment_code VARCHAR(50),
    product_code VARCHAR(50),
    parameter_name VARCHAR(100) NOT NULL,
    measured_value NUMERIC(15,6) NOT NULL,
    usl NUMERIC(15,6),
    lsl NUMERIC(15,6),
    ucl NUMERIC(15,6),
    lcl NUMERIC(15,6),
    target_value NUMERIC(15,6),
    is_out_of_spec BOOLEAN DEFAULT FALSE,
    lot_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13.5 LOT 추적성
CREATE TABLE mes_traceability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    trace_type VARCHAR(20) CHECK (trace_type IN ('lot', 'serial', 'batch')),
    traced_id VARCHAR(100) NOT NULL,
    production_order_no VARCHAR(50),
    product_code VARCHAR(50),
    parent_lot_no VARCHAR(50),
    child_lot_nos TEXT[],
    material_lots JSONB,
    process_history JSONB,
    quality_results JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, trace_type, traced_id)
);

-- ============================================================
-- PART 14: MES 설비관리 (Equipment)
-- ============================================================

-- 14.1 설비 상태
CREATE TABLE mes_equipment_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    equipment_id UUID REFERENCES mes_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    status_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('running', 'idle', 'setup', 'breakdown', 'maintenance', 'off')),
    previous_status VARCHAR(20),
    production_order_no VARCHAR(50),
    product_code VARCHAR(50),
    speed_rpm NUMERIC(10,2),
    temperature NUMERIC(6,2),
    pressure NUMERIC(6,2),
    alarm_code VARCHAR(50),
    alarm_message TEXT,
    operator_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14.2 설비 OEE
CREATE TABLE mes_equipment_oee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    equipment_id UUID REFERENCES mes_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    oee_date DATE NOT NULL,
    shift VARCHAR(10),
    planned_time_min NUMERIC(10,2) NOT NULL,
    operating_time_min NUMERIC(10,2) DEFAULT 0,
    net_operating_time_min NUMERIC(10,2) DEFAULT 0,
    downtime_min NUMERIC(10,2) DEFAULT 0,
    setup_time_min NUMERIC(10,2) DEFAULT 0,
    ideal_cycle_time_sec NUMERIC(10,3),
    actual_cycle_time_sec NUMERIC(10,3),
    total_count INTEGER DEFAULT 0,
    good_count INTEGER DEFAULT 0,
    defect_count INTEGER DEFAULT 0,
    availability NUMERIC(5,2),
    performance NUMERIC(5,2),
    quality NUMERIC(5,2),
    oee NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 함수 표현식을 포함한 UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS idx_mes_equipment_oee_unique
ON mes_equipment_oee(tenant_id, equipment_code, oee_date, COALESCE(shift, ''));

-- 14.3 비가동 이벤트
CREATE TABLE mes_downtime_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    equipment_id UUID REFERENCES mes_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    line_code VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_min NUMERIC(10,2),
    downtime_type VARCHAR(20) CHECK (downtime_type IN ('breakdown', 'setup', 'material', 'quality', 'planned', 'other')),
    downtime_code VARCHAR(50),
    downtime_reason TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    reported_by VARCHAR(50),
    resolved_by VARCHAR(50),
    production_order_no VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14.4 설비 유지보수
CREATE TABLE mes_equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    maintenance_no VARCHAR(50) NOT NULL,
    equipment_id UUID REFERENCES mes_equipment(id),
    equipment_code VARCHAR(50) NOT NULL,
    maintenance_type VARCHAR(20) CHECK (maintenance_type IN ('PM', 'CM', 'inspection', 'calibration')),
    scheduled_date DATE,
    actual_date DATE,
    description TEXT,
    parts_replaced TEXT,
    cost NUMERIC(15,2),
    technician_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, maintenance_no)
);

-- ============================================================
-- PART 15: MES 자재관리 (Material)
-- ============================================================

-- 15.1 피더 셋업
CREATE TABLE mes_feeder_setup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    equipment_id UUID REFERENCES mes_equipment(id),
    equipment_code VARCHAR(50),
    feeder_slot VARCHAR(50) NOT NULL,
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200),
    lot_no VARCHAR(50),
    initial_qty NUMERIC(12,3),
    remaining_qty NUMERIC(12,3),
    setup_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'empty', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15.2 자재 소비
CREATE TABLE mes_material_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    production_order_id UUID REFERENCES mes_production_order(id),
    production_order_no VARCHAR(50),
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200),
    lot_no VARCHAR(50),
    consumption_qty NUMERIC(12,3) NOT NULL,
    consumption_type VARCHAR(20) CHECK (consumption_type IN ('normal', 'scrap', 'sample', 'rework')),
    result_lot_no VARCHAR(50),
    consumption_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    line_code VARCHAR(50),
    equipment_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15.3 자재 요청
CREATE TABLE mes_material_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    request_no VARCHAR(50) NOT NULL,
    request_type VARCHAR(20) CHECK (request_type IN ('replenish', 'return', 'transfer')),
    line_code VARCHAR(50) NOT NULL,
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200),
    requested_qty NUMERIC(12,3) NOT NULL,
    delivered_qty NUMERIC(12,3) DEFAULT 0,
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'in_transit', 'delivered', 'cancelled')),
    requested_by VARCHAR(50),
    request_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, request_no)
);

-- 15.4 라인 재고
CREATE TABLE mes_material_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    line_code VARCHAR(50),
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200),
    lot_no VARCHAR(50),
    qty_on_hand NUMERIC(12,3) DEFAULT 0,
    qty_allocated NUMERIC(12,3) DEFAULT 0,
    qty_available NUMERIC(12,3) GENERATED ALWAYS AS (qty_on_hand - qty_allocated) STORED,
    min_qty NUMERIC(12,3) DEFAULT 0,
    max_qty NUMERIC(12,3),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 함수 표현식을 포함한 UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS idx_mes_material_inventory_unique
ON mes_material_inventory(tenant_id, location_code, material_code, COALESCE(lot_no, ''));

-- ============================================================
-- PART 16: 시스템 관리 (System)
-- ============================================================

-- 16.1 사용자 역할
CREATE TABLE sys_role (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_code)
);

-- 16.2 사용자
CREATE TABLE sys_user (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255),
    role_id INTEGER REFERENCES sys_role(id),
    department_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

-- 16.3 메뉴
CREATE TABLE sys_menu (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    menu_id VARCHAR(50) NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    parent_id VARCHAR(50),
    menu_path VARCHAR(200),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, menu_id)
);

-- 16.4 권한
CREATE TABLE sys_permission (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES sys_role(id) ON DELETE CASCADE,
    menu_id VARCHAR(50),
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16.5 감사 로그
CREATE TABLE sys_audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    log_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- 16.6 시스템 설정
CREATE TABLE sys_config (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, config_key)
);

-- ============================================================
-- PART 17: ERP-MES 인터페이스 (Interface)
-- ============================================================

-- 17.1 인터페이스 로그
CREATE TABLE if_interface_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    interface_id VARCHAR(50) NOT NULL,
    interface_type VARCHAR(20) CHECK (interface_type IN ('ERP_TO_MES', 'MES_TO_ERP')),
    interface_name VARCHAR(100),
    request_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed', 'retry')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17.2 인터페이스 매핑
CREATE TABLE if_data_mapping (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    mapping_code VARCHAR(50) NOT NULL,
    source_system VARCHAR(20) CHECK (source_system IN ('ERP', 'MES')),
    target_system VARCHAR(20) CHECK (target_system IN ('ERP', 'MES')),
    source_table VARCHAR(100),
    target_table VARCHAR(100),
    field_mappings JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, mapping_code)
);

-- ============================================================
-- PART 18: 인덱스 생성
-- ============================================================

-- ERP 마스터
CREATE INDEX idx_product_master_tenant_code ON erp_product_master(tenant_id, product_code);
CREATE INDEX idx_product_master_type ON erp_product_master(product_type);
CREATE INDEX idx_customer_master_tenant_code ON erp_customer_master(tenant_id, customer_code);
CREATE INDEX idx_vendor_master_tenant_code ON erp_vendor_master(tenant_id, vendor_code);

-- ERP 영업
CREATE INDEX idx_sales_order_tenant_status ON erp_sales_order(tenant_id, status);
CREATE INDEX idx_sales_order_customer ON erp_sales_order(customer_code);
CREATE INDEX idx_sales_order_date ON erp_sales_order(order_date);
CREATE INDEX idx_shipment_tenant_status ON erp_shipment(tenant_id, status);
CREATE INDEX idx_sales_revenue_tenant_status ON erp_sales_revenue(tenant_id, status);

-- ERP 구매
CREATE INDEX idx_purchase_order_tenant_status ON erp_purchase_order(tenant_id, status);
CREATE INDEX idx_purchase_order_vendor ON erp_purchase_order(vendor_code);
CREATE INDEX idx_goods_receipt_tenant_status ON erp_goods_receipt(tenant_id, status);

-- ERP 재고
CREATE INDEX idx_inventory_stock_item ON erp_inventory_stock(tenant_id, item_code);
CREATE INDEX idx_inventory_stock_warehouse ON erp_inventory_stock(warehouse_code);
CREATE INDEX idx_inventory_transaction_date ON erp_inventory_transaction(transaction_date);
CREATE INDEX idx_inventory_transaction_type ON erp_inventory_transaction(transaction_type);
CREATE INDEX idx_inventory_transaction_item ON erp_inventory_transaction(item_code);

-- ERP 생산
CREATE INDEX idx_work_order_tenant_status ON erp_work_order(tenant_id, status);
CREATE INDEX idx_work_order_product ON erp_work_order(product_code);
CREATE INDEX idx_production_result_work_order ON erp_production_result(work_order_id);

-- ERP 원가
CREATE INDEX idx_standard_cost_product ON erp_standard_cost(tenant_id, product_code);
CREATE INDEX idx_actual_cost_product ON erp_actual_cost(tenant_id, product_code);
CREATE INDEX idx_cost_variance_product ON erp_cost_variance(tenant_id, product_code);

-- ERP 자산
CREATE INDEX idx_fixed_asset_tenant_status ON erp_fixed_asset(tenant_id, status);
CREATE INDEX idx_fixed_asset_category ON erp_fixed_asset(asset_category);
CREATE INDEX idx_depreciation_schedule_asset ON erp_depreciation_schedule(asset_id);
CREATE INDEX idx_depreciation_schedule_period ON erp_depreciation_schedule(fiscal_year, fiscal_period);

-- ERP 재무회계
CREATE INDEX idx_voucher_tenant_status ON erp_voucher(tenant_id, status);
CREATE INDEX idx_voucher_date ON erp_voucher(voucher_date);
CREATE INDEX idx_voucher_type ON erp_voucher(voucher_type);
CREATE INDEX idx_general_ledger_account ON erp_general_ledger(account_code);
CREATE INDEX idx_general_ledger_period ON erp_general_ledger(fiscal_year, fiscal_period);
CREATE INDEX idx_accounts_payable_vendor ON erp_accounts_payable(vendor_code);
CREATE INDEX idx_accounts_payable_status ON erp_accounts_payable(tenant_id, status);
CREATE INDEX idx_accounts_receivable_customer ON erp_accounts_receivable(customer_code);
CREATE INDEX idx_accounts_receivable_status ON erp_accounts_receivable(tenant_id, status);
CREATE INDEX idx_cash_flow_date ON erp_cash_flow(transaction_date);

-- ERP 관리회계
CREATE INDEX idx_profit_loss_period ON erp_profit_loss(fiscal_year, fiscal_period);
CREATE INDEX idx_profitability_product_period ON erp_profitability_product(fiscal_year, fiscal_period);
CREATE INDEX idx_profitability_customer_period ON erp_profitability_customer(fiscal_year, fiscal_period);
CREATE INDEX idx_budget_period ON erp_budget(fiscal_year, COALESCE(fiscal_period, 0));

-- ERP 인사
CREATE INDEX idx_employee_department ON erp_employee(department_code);
CREATE INDEX idx_attendance_employee_date ON erp_attendance(employee_id, work_date);
CREATE INDEX idx_payroll_employee ON erp_payroll(employee_id);

-- MES 생산
CREATE INDEX idx_production_order_tenant_status ON mes_production_order(tenant_id, status);
CREATE INDEX idx_production_order_line ON mes_production_order(line_code);
CREATE INDEX idx_production_order_product ON mes_production_order(product_code);
CREATE INDEX idx_production_result_order ON mes_production_result(production_order_id);
CREATE INDEX idx_production_result_timestamp ON mes_production_result(result_timestamp);
CREATE INDEX idx_realtime_production_timestamp ON mes_realtime_production(timestamp);
CREATE INDEX idx_realtime_production_line ON mes_realtime_production(line_code);

-- MES 품질
CREATE INDEX idx_defect_detail_order ON mes_defect_detail(production_order_id);
CREATE INDEX idx_defect_detail_timestamp ON mes_defect_detail(defect_timestamp);
CREATE INDEX idx_defect_detail_line ON mes_defect_detail(line_code);
CREATE INDEX idx_inspection_result_order ON mes_inspection_result(production_order_id);
CREATE INDEX idx_spc_data_timestamp ON mes_spc_data(measurement_time);
CREATE INDEX idx_traceability_lot ON mes_traceability(traced_id);

-- MES 설비
CREATE INDEX idx_equipment_status_equipment ON mes_equipment_status(equipment_id);
CREATE INDEX idx_equipment_status_timestamp ON mes_equipment_status(status_timestamp);
CREATE INDEX idx_equipment_oee_date ON mes_equipment_oee(oee_date);
CREATE INDEX idx_downtime_event_equipment ON mes_downtime_event(equipment_id);
CREATE INDEX idx_downtime_event_time ON mes_downtime_event(start_time);

-- MES 자재
CREATE INDEX idx_feeder_setup_equipment ON mes_feeder_setup(equipment_id);
CREATE INDEX idx_material_consumption_order ON mes_material_consumption(production_order_id);
CREATE INDEX idx_material_inventory_location ON mes_material_inventory(location_code);

-- 시스템
CREATE INDEX idx_audit_log_timestamp ON sys_audit_log(log_timestamp);
CREATE INDEX idx_audit_log_user ON sys_audit_log(user_id);
CREATE INDEX idx_audit_log_table ON sys_audit_log(table_name);

-- 인터페이스
CREATE INDEX idx_interface_log_timestamp ON if_interface_log(request_time);
CREATE INDEX idx_interface_log_status ON if_interface_log(status);

-- ============================================================
-- PART 19: 트리거 생성 (updated_at 자동 갱신)
-- ============================================================

-- ERP 테이블 트리거
CREATE TRIGGER update_erp_product_master_timestamp BEFORE UPDATE ON erp_product_master FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_customer_master_timestamp BEFORE UPDATE ON erp_customer_master FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_vendor_master_timestamp BEFORE UPDATE ON erp_vendor_master FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_bom_header_timestamp BEFORE UPDATE ON erp_bom_header FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_routing_header_timestamp BEFORE UPDATE ON erp_routing_header FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_warehouse_timestamp BEFORE UPDATE ON erp_warehouse FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_sales_order_timestamp BEFORE UPDATE ON erp_sales_order FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_shipment_timestamp BEFORE UPDATE ON erp_shipment FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_sales_revenue_timestamp BEFORE UPDATE ON erp_sales_revenue FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_purchase_order_timestamp BEFORE UPDATE ON erp_purchase_order FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_goods_receipt_timestamp BEFORE UPDATE ON erp_goods_receipt FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_purchase_invoice_timestamp BEFORE UPDATE ON erp_purchase_invoice FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_inventory_stock_timestamp BEFORE UPDATE ON erp_inventory_stock FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_mps_timestamp BEFORE UPDATE ON erp_mps FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_work_order_timestamp BEFORE UPDATE ON erp_work_order FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_standard_cost_timestamp BEFORE UPDATE ON erp_standard_cost FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_fixed_asset_timestamp BEFORE UPDATE ON erp_fixed_asset FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_voucher_timestamp BEFORE UPDATE ON erp_voucher FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_general_ledger_timestamp BEFORE UPDATE ON erp_general_ledger FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_accounts_payable_timestamp BEFORE UPDATE ON erp_accounts_payable FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_accounts_receivable_timestamp BEFORE UPDATE ON erp_accounts_receivable FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_budget_timestamp BEFORE UPDATE ON erp_budget FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_erp_employee_timestamp BEFORE UPDATE ON erp_employee FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- MES 테이블 트리거
CREATE TRIGGER update_mes_production_line_timestamp BEFORE UPDATE ON mes_production_line FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_mes_equipment_timestamp BEFORE UPDATE ON mes_equipment FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_mes_production_order_timestamp BEFORE UPDATE ON mes_production_order FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_mes_traceability_timestamp BEFORE UPDATE ON mes_traceability FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_mes_downtime_event_timestamp BEFORE UPDATE ON mes_downtime_event FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_mes_feeder_setup_timestamp BEFORE UPDATE ON mes_feeder_setup FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 시스템 테이블 트리거
CREATE TRIGGER update_sys_user_timestamp BEFORE UPDATE ON sys_user FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_sys_config_timestamp BEFORE UPDATE ON sys_config FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 스키마 생성 완료
-- ============================================================

COMMENT ON SCHEMA public IS 'ERP-MES 통합 시스템 스키마 v1.0.0';
