-- ERP-MES Interface Schema
-- ERP와 MES 간 데이터 연동 테이블

-- =============================================================================
-- ERP → MES 인터페이스 (작업지시, BOM, 자재 정보 전달)
-- =============================================================================

-- 1. 작업지시 인터페이스 (ERP → MES)
CREATE TABLE IF NOT EXISTS erp_mes_work_order_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_type VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, CANCEL
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, error
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- ERP 작업지시 정보
    erp_work_order_no VARCHAR(30) NOT NULL,
    erp_order_line_no INTEGER,
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(100),
    order_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    plan_start_date DATE NOT NULL,
    plan_end_date DATE,
    priority INTEGER DEFAULT 5,
    customer_code VARCHAR(20),
    sales_order_no VARCHAR(30),
    routing_no VARCHAR(30),
    bom_no VARCHAR(30),
    target_line_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BOM 인터페이스 (ERP → MES)
CREATE TABLE IF NOT EXISTS erp_mes_bom_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_type VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- BOM 정보
    bom_no VARCHAR(30) NOT NULL,
    bom_version INTEGER,
    product_code VARCHAR(30) NOT NULL,
    component_code VARCHAR(30) NOT NULL,
    component_name VARCHAR(100),
    item_no INTEGER,
    qty_per DECIMAL(15, 6) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    scrap_rate DECIMAL(5, 2),
    operation_no INTEGER,
    position_designator VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 자재 마스터 인터페이스 (ERP → MES)
CREATE TABLE IF NOT EXISTS erp_mes_material_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_type VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- 자재 정보
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    material_type VARCHAR(20),
    material_group VARCHAR(20),
    unit VARCHAR(10) NOT NULL,
    package_type VARCHAR(30),
    procurement_type VARCHAR(20),
    standard_cost DECIMAL(15, 4),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MES → ERP 인터페이스 (생산실적, 자재소비, 불량 보고)
-- =============================================================================

-- 4. 생산실적 인터페이스 (MES → ERP)
CREATE TABLE IF NOT EXISTS mes_erp_production_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, posted, error
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    -- 생산실적 정보
    mes_production_order_id UUID,
    erp_work_order_no VARCHAR(30) NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    production_date DATE NOT NULL,
    shift VARCHAR(5),
    line_code VARCHAR(20) NOT NULL,
    good_qty DECIMAL(15, 4) NOT NULL,
    defect_qty DECIMAL(15, 4) DEFAULT 0,
    scrap_qty DECIMAL(15, 4) DEFAULT 0,
    unit VARCHAR(10) NOT NULL,
    lot_no VARCHAR(30),
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    labor_hours DECIMAL(10, 2),
    machine_hours DECIMAL(10, 2),
    operator_codes JSONB,  -- 작업자 목록
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 자재 입출고 인터페이스 (MES → ERP)
CREATE TABLE IF NOT EXISTS mes_erp_goods_movement_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    -- 자재이동 정보
    movement_type VARCHAR(20) NOT NULL,
    -- 261: 작업지시 출고 (WIP 투입)
    -- 262: 작업지시 출고 취소
    -- 531: 작업지시 스크랩
    -- 101: 완제품 입고 (생산완료)
    mes_production_order_id UUID,
    erp_work_order_no VARCHAR(30),
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    movement_date DATE NOT NULL,
    movement_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    from_warehouse VARCHAR(20),
    from_location VARCHAR(20),
    to_warehouse VARCHAR(20),
    to_location VARCHAR(20),
    reason_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 불량 보고 인터페이스 (MES → ERP)
CREATE TABLE IF NOT EXISTS mes_erp_defect_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- 불량 정보
    mes_defect_detail_id UUID,
    erp_work_order_no VARCHAR(30),
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    defect_date DATE NOT NULL,
    line_code VARCHAR(20),
    operation_no INTEGER,
    defect_code VARCHAR(20) NOT NULL,
    defect_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    severity VARCHAR(10),
    disposition VARCHAR(20),  -- scrap, rework, use_as_is
    cost_impact DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 설비 상태 인터페이스 (MES → ERP)
CREATE TABLE IF NOT EXISTS mes_erp_equipment_status_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- 설비 상태 정보
    equipment_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20),
    status_date DATE NOT NULL,
    shift VARCHAR(5),
    -- 가동 시간 정보
    planned_time_minutes INTEGER,
    running_time_minutes INTEGER,
    idle_time_minutes INTEGER,
    down_time_minutes INTEGER,
    -- 생산 정보
    total_output INTEGER,
    good_output INTEGER,
    defect_output INTEGER,
    -- OEE 계산 결과
    availability DECIMAL(5, 4),
    performance DECIMAL(5, 4),
    quality DECIMAL(5, 4),
    oee DECIMAL(5, 4),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 품질 검사 인터페이스 (MES → ERP)
CREATE TABLE IF NOT EXISTS mes_erp_inspection_if (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interface_no VARCHAR(30) NOT NULL,
    interface_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    -- 검사 정보
    mes_inspection_result_id UUID,
    inspection_type VARCHAR(20) NOT NULL,  -- SPI, AOI, AXI, MANUAL
    erp_work_order_no VARCHAR(30),
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    inspection_date DATE NOT NULL,
    line_code VARCHAR(20),
    total_inspected INTEGER NOT NULL,
    pass_qty INTEGER NOT NULL,
    fail_qty INTEGER NOT NULL,
    result VARCHAR(10) NOT NULL,  -- PASS, FAIL
    inspector_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_erp_mes_wo_if_status ON erp_mes_work_order_if(status, interface_datetime);
CREATE INDEX idx_erp_mes_wo_if_erp_wo ON erp_mes_work_order_if(erp_work_order_no);
CREATE INDEX idx_erp_mes_bom_if_product ON erp_mes_bom_if(product_code);
CREATE INDEX idx_erp_mes_material_if_code ON erp_mes_material_if(material_code);
CREATE INDEX idx_mes_erp_prod_if_status ON mes_erp_production_if(status, interface_datetime);
CREATE INDEX idx_mes_erp_prod_if_wo ON mes_erp_production_if(erp_work_order_no);
CREATE INDEX idx_mes_erp_gm_if_status ON mes_erp_goods_movement_if(status, movement_type);
CREATE INDEX idx_mes_erp_defect_if_date ON mes_erp_defect_if(defect_date);
CREATE INDEX idx_mes_erp_equip_if_date ON mes_erp_equipment_status_if(status_date);
CREATE INDEX idx_mes_erp_insp_if_date ON mes_erp_inspection_if(inspection_date);

-- 인터페이스 처리 상태 뷰
CREATE OR REPLACE VIEW v_interface_status_summary AS
SELECT
    tenant_id,
    'erp_mes_work_order_if' as interface_table,
    status,
    COUNT(*) as record_count,
    MIN(interface_datetime) as oldest_record,
    MAX(interface_datetime) as latest_record
FROM erp_mes_work_order_if
GROUP BY tenant_id, status
UNION ALL
SELECT
    tenant_id,
    'mes_erp_production_if' as interface_table,
    status,
    COUNT(*) as record_count,
    MIN(interface_datetime) as oldest_record,
    MAX(interface_datetime) as latest_record
FROM mes_erp_production_if
GROUP BY tenant_id, status
UNION ALL
SELECT
    tenant_id,
    'mes_erp_goods_movement_if' as interface_table,
    status,
    COUNT(*) as record_count,
    MIN(interface_datetime) as oldest_record,
    MAX(interface_datetime) as latest_record
FROM mes_erp_goods_movement_if
GROUP BY tenant_id, status
UNION ALL
SELECT
    tenant_id,
    'mes_erp_defect_if' as interface_table,
    status,
    COUNT(*) as record_count,
    MIN(interface_datetime) as oldest_record,
    MAX(interface_datetime) as latest_record
FROM mes_erp_defect_if
GROUP BY tenant_id, status;

-- 인터페이스 오류 현황 뷰
CREATE OR REPLACE VIEW v_interface_errors AS
SELECT
    tenant_id,
    'erp_mes_work_order_if' as interface_table,
    interface_no,
    interface_datetime,
    error_message
FROM erp_mes_work_order_if
WHERE status = 'error'
UNION ALL
SELECT
    tenant_id,
    'mes_erp_production_if' as interface_table,
    interface_no,
    interface_datetime,
    error_message
FROM mes_erp_production_if
WHERE status = 'error'
UNION ALL
SELECT
    tenant_id,
    'mes_erp_goods_movement_if' as interface_table,
    interface_no,
    interface_datetime,
    error_message
FROM mes_erp_goods_movement_if
WHERE status = 'error'
ORDER BY interface_datetime DESC;
