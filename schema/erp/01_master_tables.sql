-- ============================================================
-- ERP Master Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Tenant (멀티테넌시 기준)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    business_no VARCHAR(20),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_code ON tenants(code);

-- ============================================================
-- 2. Users (사용자)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_code VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    department_code VARCHAR(20),
    position VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_code)
);

CREATE INDEX idx_erp_users_tenant ON erp_users(tenant_id);
CREATE INDEX idx_erp_users_dept ON erp_users(department_code);

-- ============================================================
-- 3. Customer Master (고객 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_customer_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_code VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_name_en VARCHAR(200),
    customer_type VARCHAR(20) DEFAULT 'domestic' CHECK (customer_type IN ('domestic', 'export', 'both')),
    business_no VARCHAR(30),
    ceo_name VARCHAR(50),
    industry VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'KR',
    postal_code VARCHAR(20),
    phone VARCHAR(30),
    fax VARCHAR(30),
    email VARCHAR(200),
    website VARCHAR(200),
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    credit_limit NUMERIC(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'KRW',
    sales_rep_code VARCHAR(20),
    customer_group VARCHAR(20),
    tax_id VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, customer_code)
);

CREATE INDEX idx_erp_customer_tenant ON erp_customer_master(tenant_id);
CREATE INDEX idx_erp_customer_type ON erp_customer_master(customer_type);
CREATE INDEX idx_erp_customer_active ON erp_customer_master(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- 4. Vendor Master (공급업체 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_vendor_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vendor_code VARCHAR(20) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_name_en VARCHAR(200),
    vendor_type VARCHAR(20) DEFAULT 'material' CHECK (vendor_type IN ('material', 'service', 'subcontract', 'equipment', 'other')),
    business_no VARCHAR(30),
    ceo_name VARCHAR(50),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50) DEFAULT 'KR',
    postal_code VARCHAR(20),
    phone VARCHAR(30),
    fax VARCHAR(30),
    email VARCHAR(200),
    website VARCHAR(200),
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    currency VARCHAR(3) DEFAULT 'KRW',
    lead_time_days INT DEFAULT 7,
    buyer_code VARCHAR(20),
    vendor_group VARCHAR(20),
    quality_rating VARCHAR(1) CHECK (quality_rating IN ('A', 'B', 'C', 'D')),
    delivery_rating VARCHAR(1) CHECK (delivery_rating IN ('A', 'B', 'C', 'D')),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    tax_id VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, vendor_code)
);

CREATE INDEX idx_erp_vendor_tenant ON erp_vendor_master(tenant_id);
CREATE INDEX idx_erp_vendor_type ON erp_vendor_master(vendor_type);
CREATE INDEX idx_erp_vendor_active ON erp_vendor_master(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- 5. Material Master (자재 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_material_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    material_code VARCHAR(30) NOT NULL,
    material_type VARCHAR(20) NOT NULL CHECK (material_type IN ('raw', 'component', 'wip', 'finished', 'spare', 'consumable')),
    material_group VARCHAR(30),
    material_subgroup VARCHAR(30),
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    spec VARCHAR(500),
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    weight NUMERIC(10,4),
    weight_unit VARCHAR(5) DEFAULT 'g',
    dimensions JSONB,
    -- Package info for SMD components
    package_type VARCHAR(30),  -- 0402, 0603, 0805, SOIC-8, QFP-48, etc.
    moisture_level VARCHAR(10),  -- MSL 1-6
    floor_life_hours INT,
    shelf_life_days INT,
    storage_condition VARCHAR(100),
    -- Sourcing info
    procurement_type VARCHAR(20) DEFAULT 'purchase' CHECK (procurement_type IN ('purchase', 'manufacture', 'both')),
    primary_vendor_code VARCHAR(20),
    manufacturer VARCHAR(100),
    manufacturer_part_no VARCHAR(50),
    -- Planning parameters
    lead_time_days INT DEFAULT 0,
    safety_stock NUMERIC(12,3) DEFAULT 0,
    reorder_point NUMERIC(12,3) DEFAULT 0,
    min_order_qty NUMERIC(12,3) DEFAULT 1,
    order_multiple NUMERIC(12,3) DEFAULT 1,
    max_stock_qty NUMERIC(12,3),
    -- Costing
    standard_cost NUMERIC(12,4),
    moving_avg_price NUMERIC(12,4),
    last_purchase_price NUMERIC(12,4),
    price_unit NUMERIC(10,3) DEFAULT 1,
    -- Classification
    abc_class VARCHAR(1) CHECK (abc_class IN ('A', 'B', 'C')),
    xyz_class VARCHAR(1) CHECK (xyz_class IN ('X', 'Y', 'Z')),
    hs_code VARCHAR(20),
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_phantom BOOLEAN DEFAULT FALSE,  -- For phantom BOM items
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, material_code)
);

CREATE INDEX idx_erp_material_tenant ON erp_material_master(tenant_id);
CREATE INDEX idx_erp_material_type ON erp_material_master(material_type, material_group);
CREATE INDEX idx_erp_material_active ON erp_material_master(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_erp_material_vendor ON erp_material_master(primary_vendor_code);

-- ============================================================
-- 6. Warehouse Master (창고 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_warehouse_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    warehouse_code VARCHAR(10) NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(20) DEFAULT 'storage' CHECK (warehouse_type IN ('storage', 'production', 'shipping', 'receiving', 'quality', 'scrap')),
    location VARCHAR(200),
    manager_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, warehouse_code)
);

CREATE INDEX idx_erp_warehouse_tenant ON erp_warehouse_master(tenant_id);

-- ============================================================
-- 7. Storage Location (저장 위치)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_storage_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    warehouse_code VARCHAR(10) NOT NULL,
    location_code VARCHAR(20) NOT NULL,
    location_name VARCHAR(100),
    location_type VARCHAR(20) DEFAULT 'bin' CHECK (location_type IN ('bin', 'rack', 'zone', 'floor')),
    aisle VARCHAR(10),
    rack VARCHAR(10),
    shelf VARCHAR(10),
    bin VARCHAR(10),
    max_capacity NUMERIC(12,3),
    capacity_unit VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, warehouse_code, location_code)
);

CREATE INDEX idx_erp_storage_warehouse ON erp_storage_location(warehouse_code);

-- ============================================================
-- 8. Department Master (부서 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_department_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    department_code VARCHAR(20) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_type VARCHAR(20) CHECK (department_type IN ('production', 'quality', 'engineering', 'maintenance', 'supply_chain', 'sales', 'finance', 'admin')),
    parent_dept_code VARCHAR(20),
    manager_code VARCHAR(20),
    cost_center_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, department_code)
);

CREATE INDEX idx_erp_department_tenant ON erp_department_master(tenant_id);

-- ============================================================
-- 9. Cost Center Master (코스트센터 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cost_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    cost_center_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    cost_center_type VARCHAR(20) NOT NULL CHECK (cost_center_type IN ('production', 'indirect', 'overhead', 'project')),
    department_code VARCHAR(20),
    manager_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'KRW',
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, cost_center_code)
);

CREATE INDEX idx_erp_cost_center_tenant ON erp_cost_center(tenant_id);

-- ============================================================
-- 10. Work Center Master (작업장 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_work_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_center_code VARCHAR(20) NOT NULL,
    work_center_name VARCHAR(100) NOT NULL,
    work_center_type VARCHAR(20) CHECK (work_center_type IN ('machine', 'labor', 'subcontract', 'line')),
    department_code VARCHAR(20),
    cost_center_code VARCHAR(20),
    capacity_per_day NUMERIC(10,2),
    capacity_unit VARCHAR(20) DEFAULT 'hours',
    efficiency_rate NUMERIC(5,2) DEFAULT 100,  -- percentage
    utilization_rate NUMERIC(5,2) DEFAULT 85,  -- percentage
    queue_time_hours NUMERIC(6,2) DEFAULT 0,
    move_time_hours NUMERIC(6,2) DEFAULT 0,
    setup_time_hours NUMERIC(6,2) DEFAULT 0,
    hourly_rate NUMERIC(10,2),
    machine_hourly_rate NUMERIC(10,2),
    labor_hourly_rate NUMERIC(10,2),
    overhead_rate NUMERIC(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, work_center_code)
);

CREATE INDEX idx_erp_work_center_tenant ON erp_work_center(tenant_id);

-- ============================================================
-- 11. Calendar (공장 달력)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_factory_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    calendar_date DATE NOT NULL,
    day_type VARCHAR(20) NOT NULL CHECK (day_type IN ('working', 'holiday', 'weekend', 'shutdown')),
    shift_1 BOOLEAN DEFAULT TRUE,
    shift_2 BOOLEAN DEFAULT TRUE,
    shift_3 BOOLEAN DEFAULT TRUE,
    available_hours NUMERIC(4,1) DEFAULT 24,
    holiday_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, calendar_date)
);

CREATE INDEX idx_erp_calendar_tenant_date ON erp_factory_calendar(tenant_id, calendar_date);

-- ============================================================
-- 12. Unit of Measure (단위)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_uom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    uom_code VARCHAR(10) NOT NULL,
    uom_name VARCHAR(50) NOT NULL,
    uom_type VARCHAR(20) CHECK (uom_type IN ('quantity', 'weight', 'length', 'volume', 'time', 'area')),
    base_uom VARCHAR(10),
    conversion_factor NUMERIC(12,6) DEFAULT 1,
    decimal_places INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, uom_code)
);

-- Insert default UOMs
INSERT INTO erp_uom (tenant_id, uom_code, uom_name, uom_type, base_uom, conversion_factor, decimal_places)
SELECT t.id, u.uom_code, u.uom_name, u.uom_type, u.base_uom, u.conversion_factor, u.decimal_places
FROM tenants t
CROSS JOIN (VALUES
    ('EA', '개', 'quantity', 'EA', 1, 0),
    ('PCS', '피스', 'quantity', 'EA', 1, 0),
    ('PNL', '패널', 'quantity', 'EA', 1, 0),
    ('SET', '세트', 'quantity', 'EA', 1, 0),
    ('BOX', '박스', 'quantity', 'EA', 1, 0),
    ('REEL', '릴', 'quantity', 'EA', 1, 0),
    ('ROLL', '롤', 'quantity', 'EA', 1, 0),
    ('KG', '킬로그램', 'weight', 'KG', 1, 3),
    ('G', '그램', 'weight', 'KG', 0.001, 0),
    ('L', '리터', 'volume', 'L', 1, 3),
    ('ML', '밀리리터', 'volume', 'L', 0.001, 0),
    ('M', '미터', 'length', 'M', 1, 2),
    ('MM', '밀리미터', 'length', 'M', 0.001, 0),
    ('HR', '시간', 'time', 'HR', 1, 2),
    ('MIN', '분', 'time', 'HR', 0.0167, 0)
) AS u(uom_code, uom_name, uom_type, base_uom, conversion_factor, decimal_places)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. Exchange Rate (환율)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_exchange_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate_date DATE NOT NULL,
    exchange_rate NUMERIC(12,6) NOT NULL,
    rate_type VARCHAR(10) DEFAULT 'daily' CHECK (rate_type IN ('daily', 'monthly', 'budget')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, from_currency, to_currency, rate_date, rate_type)
);

CREATE INDEX idx_erp_exchange_rate ON erp_exchange_rate(tenant_id, rate_date DESC);

-- ============================================================
-- 14. Sequence Number (채번 관리)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_sequence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sequence_type VARCHAR(30) NOT NULL,  -- SO, PO, WO, GR, SH, INV, etc.
    prefix VARCHAR(10),
    current_number BIGINT DEFAULT 0,
    number_length INT DEFAULT 6,
    reset_period VARCHAR(10) DEFAULT 'yearly' CHECK (reset_period IN ('never', 'yearly', 'monthly', 'daily')),
    last_reset_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, sequence_type)
);

-- Function to get next sequence number
CREATE OR REPLACE FUNCTION get_next_sequence(
    p_tenant_id UUID,
    p_sequence_type VARCHAR(30)
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_number BIGINT;
    v_length INT;
    v_result VARCHAR(50);
BEGIN
    UPDATE erp_sequence
    SET current_number = current_number + 1,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id AND sequence_type = p_sequence_type
    RETURNING prefix, current_number, number_length
    INTO v_prefix, v_number, v_length;

    IF v_prefix IS NULL THEN
        -- Create new sequence if not exists
        INSERT INTO erp_sequence (tenant_id, sequence_type, prefix, current_number, number_length)
        VALUES (p_tenant_id, p_sequence_type, p_sequence_type || '-', 1, 6)
        RETURNING prefix, current_number, number_length
        INTO v_prefix, v_number, v_length;
    END IF;

    v_result := v_prefix || LPAD(v_number::TEXT, v_length, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Trigger for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all master tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name LIKE 'erp_%'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%I ON %I;
            CREATE TRIGGER trigger_update_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE tenants IS '멀티테넌시 기준 테이블';
COMMENT ON TABLE erp_customer_master IS '고객 마스터 - 판매처 관리';
COMMENT ON TABLE erp_vendor_master IS '공급업체 마스터 - 구매처 관리';
COMMENT ON TABLE erp_material_master IS '자재 마스터 - 원자재, 부품, 반제품, 완제품 통합 관리';
COMMENT ON TABLE erp_warehouse_master IS '창고 마스터';
COMMENT ON TABLE erp_cost_center IS '코스트센터 - 원가 집계 단위';
COMMENT ON TABLE erp_work_center IS '작업장 마스터 - 생산 능력 및 원가 계산 기준';
