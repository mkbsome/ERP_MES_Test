-- ============================================================
-- ERP BOM & Routing Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. BOM Header (BOM 헤더)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_bom_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    bom_no VARCHAR(30) NOT NULL,
    bom_version INT NOT NULL DEFAULT 1,
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    bom_type VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (bom_type IN ('production', 'engineering', 'costing', 'planning')),
    base_qty NUMERIC(12,3) NOT NULL DEFAULT 1,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'obsolete')),
    -- Engineering change
    eco_no VARCHAR(30),
    eco_date DATE,
    -- Approval
    created_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    -- Metadata
    total_components INT DEFAULT 0,
    total_levels INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, bom_no, bom_version)
);

CREATE INDEX idx_erp_bom_header_product ON erp_bom_header(tenant_id, product_code, status);
CREATE INDEX idx_erp_bom_header_valid ON erp_bom_header(valid_from, valid_to);

-- ============================================================
-- 2. BOM Component (BOM 구성품)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_bom_component (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    bom_id UUID NOT NULL REFERENCES erp_bom_header(id) ON DELETE CASCADE,
    item_no INT NOT NULL,
    component_code VARCHAR(30) NOT NULL,
    component_name VARCHAR(200),
    component_type VARCHAR(20) NOT NULL DEFAULT 'material' CHECK (component_type IN ('material', 'assembly', 'phantom', 'reference', 'option')),
    -- Quantity
    qty_per NUMERIC(12,6) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    scrap_rate NUMERIC(5,2) DEFAULT 0,  -- percentage
    -- Operation assignment (for backflush)
    operation_no INT,
    -- SMT specific
    position_designator TEXT,  -- R1,R2,R3... for resistors
    feeder_type VARCHAR(20),   -- tape_8mm, tape_12mm, etc.
    -- Alternative handling
    alternative_group VARCHAR(20),
    priority INT DEFAULT 1,
    -- Flags
    is_critical BOOLEAN DEFAULT FALSE,
    is_backflush BOOLEAN DEFAULT TRUE,
    -- Effectivity
    valid_from DATE,
    valid_to DATE,
    -- Engineering change
    eco_no VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_bom_component_bom ON erp_bom_component(bom_id);
CREATE INDEX idx_erp_bom_component_material ON erp_bom_component(component_code);
CREATE INDEX idx_erp_bom_component_operation ON erp_bom_component(bom_id, operation_no);

-- ============================================================
-- 3. Routing Header (라우팅 헤더)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_routing_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    routing_no VARCHAR(30) NOT NULL,
    routing_version INT NOT NULL DEFAULT 1,
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    routing_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (routing_type IN ('standard', 'rework', 'alternative', 'prototype')),
    -- Linked BOM
    bom_no VARCHAR(30),
    bom_version INT,
    -- Validity
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'obsolete')),
    -- Summary
    total_operations INT DEFAULT 0,
    total_setup_time NUMERIC(10,2) DEFAULT 0,
    total_run_time NUMERIC(10,2) DEFAULT 0,
    total_lead_time_hours NUMERIC(10,2) DEFAULT 0,
    -- Approval
    created_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, routing_no, routing_version)
);

CREATE INDEX idx_erp_routing_header_product ON erp_routing_header(tenant_id, product_code, status);

-- ============================================================
-- 4. Routing Operation (라우팅 공정)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_routing_operation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    routing_id UUID NOT NULL REFERENCES erp_routing_header(id) ON DELETE CASCADE,
    operation_no INT NOT NULL,
    operation_name VARCHAR(100) NOT NULL,
    operation_description TEXT,
    -- Work center
    work_center_code VARCHAR(20) NOT NULL,
    work_center_name VARCHAR(100),
    -- Operation type
    operation_type VARCHAR(20) CHECK (operation_type IN ('setup', 'machine', 'manual', 'inspection', 'move', 'queue', 'subcontract')),
    control_key VARCHAR(10),  -- PP01, PP02, etc.
    -- Times (in minutes)
    setup_time NUMERIC(10,2) DEFAULT 0,
    run_time NUMERIC(10,4) NOT NULL,  -- per base quantity
    time_unit VARCHAR(10) DEFAULT 'min' CHECK (time_unit IN ('sec', 'min', 'hr')),
    -- Capacity
    qty_per_hour NUMERIC(10,2),
    base_quantity NUMERIC(10,3) DEFAULT 1,
    -- Resources
    crew_size NUMERIC(5,2) DEFAULT 1,
    machine_count INT DEFAULT 1,
    -- Lead time elements
    overlap_pct NUMERIC(5,2) DEFAULT 0,
    move_time NUMERIC(10,2) DEFAULT 0,
    queue_time NUMERIC(10,2) DEFAULT 0,
    wait_time NUMERIC(10,2) DEFAULT 0,
    -- Costing rates
    labor_rate NUMERIC(10,2),
    machine_rate NUMERIC(10,2),
    overhead_rate NUMERIC(10,2),
    -- Quality
    is_milestone BOOLEAN DEFAULT FALSE,
    is_inspection_required BOOLEAN DEFAULT FALSE,
    inspection_type VARCHAR(30),  -- SPI, AOI, ICT, FCT, Visual, etc.
    -- Subcontracting
    is_subcontract BOOLEAN DEFAULT FALSE,
    subcontract_vendor VARCHAR(20),
    subcontract_cost NUMERIC(12,2),
    -- Predecessor (for scheduling)
    predecessor_ops INT[],
    -- Notes
    work_instructions TEXT,
    setup_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_routing_operation_routing ON erp_routing_operation(routing_id, operation_no);
CREATE INDEX idx_erp_routing_operation_wc ON erp_routing_operation(work_center_code);

-- ============================================================
-- 5. Product-BOM-Routing Link (제품-BOM-라우팅 연결)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_product_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_code VARCHAR(30) NOT NULL,
    bom_no VARCHAR(30) NOT NULL,
    bom_version INT NOT NULL,
    routing_no VARCHAR(30),
    routing_version INT,
    is_default BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, product_code, bom_no, bom_version)
);

CREATE INDEX idx_erp_product_structure_product ON erp_product_structure(tenant_id, product_code);

-- ============================================================
-- 6. BOM Explosion View (BOM 전개 뷰)
-- ============================================================
CREATE OR REPLACE VIEW v_bom_explosion AS
WITH RECURSIVE bom_tree AS (
    -- Base case: top level products
    SELECT
        bh.tenant_id,
        bh.product_code AS top_product,
        bh.product_code AS parent_code,
        bc.component_code,
        bc.component_name,
        bc.component_type,
        bc.qty_per,
        bc.unit,
        bc.scrap_rate,
        bc.operation_no,
        bc.position_designator,
        1 AS level,
        ARRAY[bh.product_code] AS path,
        bh.bom_no,
        bh.bom_version
    FROM erp_bom_header bh
    JOIN erp_bom_component bc ON bc.bom_id = bh.id
    WHERE bh.status = 'active'
      AND (bh.valid_to IS NULL OR bh.valid_to >= CURRENT_DATE)
      AND bh.valid_from <= CURRENT_DATE

    UNION ALL

    -- Recursive case: sub-assemblies
    SELECT
        bt.tenant_id,
        bt.top_product,
        bt.component_code AS parent_code,
        bc.component_code,
        bc.component_name,
        bc.component_type,
        bt.qty_per * bc.qty_per AS qty_per,
        bc.unit,
        bc.scrap_rate,
        bc.operation_no,
        bc.position_designator,
        bt.level + 1 AS level,
        bt.path || bt.component_code,
        bh.bom_no,
        bh.bom_version
    FROM bom_tree bt
    JOIN erp_bom_header bh ON bh.tenant_id = bt.tenant_id
                          AND bh.product_code = bt.component_code
                          AND bh.status = 'active'
    JOIN erp_bom_component bc ON bc.bom_id = bh.id
    WHERE bt.level < 10  -- Prevent infinite recursion
      AND NOT (bc.component_code = ANY(bt.path))  -- Prevent cycles
)
SELECT * FROM bom_tree;

-- ============================================================
-- 7. BOM Cost Rollup Function
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_bom_cost(
    p_tenant_id UUID,
    p_product_code VARCHAR(30)
) RETURNS TABLE (
    material_cost NUMERIC(15,4),
    labor_cost NUMERIC(15,4),
    overhead_cost NUMERIC(15,4),
    total_cost NUMERIC(15,4)
) AS $$
DECLARE
    v_material_cost NUMERIC(15,4) := 0;
    v_labor_cost NUMERIC(15,4) := 0;
    v_overhead_cost NUMERIC(15,4) := 0;
BEGIN
    -- Calculate material cost from BOM
    SELECT COALESCE(SUM(
        be.qty_per * (1 + be.scrap_rate/100) * COALESCE(mm.standard_cost, mm.moving_avg_price, 0)
    ), 0)
    INTO v_material_cost
    FROM v_bom_explosion be
    JOIN erp_material_master mm ON mm.tenant_id = be.tenant_id AND mm.material_code = be.component_code
    WHERE be.tenant_id = p_tenant_id
      AND be.top_product = p_product_code
      AND be.component_type IN ('material', 'component');

    -- Calculate labor and overhead from routing
    SELECT
        COALESCE(SUM(ro.run_time / 60.0 * ro.crew_size * COALESCE(ro.labor_rate, wc.labor_hourly_rate, 0)), 0),
        COALESCE(SUM(ro.run_time / 60.0 * COALESCE(ro.overhead_rate, wc.overhead_rate, 0)), 0)
    INTO v_labor_cost, v_overhead_cost
    FROM erp_routing_header rh
    JOIN erp_routing_operation ro ON ro.routing_id = rh.id
    LEFT JOIN erp_work_center wc ON wc.tenant_id = rh.tenant_id AND wc.work_center_code = ro.work_center_code
    WHERE rh.tenant_id = p_tenant_id
      AND rh.product_code = p_product_code
      AND rh.status = 'active';

    RETURN QUERY SELECT
        v_material_cost,
        v_labor_cost,
        v_overhead_cost,
        v_material_cost + v_labor_cost + v_overhead_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. Sample SMT Routing Template
-- ============================================================
COMMENT ON TABLE erp_bom_header IS 'BOM 헤더 - 제품별 자재 구성 정의';
COMMENT ON TABLE erp_bom_component IS 'BOM 구성품 - 제품당 필요 자재 목록 및 수량';
COMMENT ON TABLE erp_routing_header IS '라우팅 헤더 - 제품별 공정 흐름 정의';
COMMENT ON TABLE erp_routing_operation IS '라우팅 공정 - 개별 공정 작업 상세';

-- Standard SMT operations reference
/*
Typical SMT Line Operations:
10 - PCB Loading (Loader)
20 - Solder Paste Printing (Printer)
25 - SPI Inspection (Optional)
30 - Component Placement - Chip (Mounter 1)
40 - Component Placement - IC (Mounter 2)
50 - Reflow Soldering (Reflow Oven)
60 - AOI Inspection (AOI)
70 - X-Ray Inspection (Optional, for BGA/QFN)
80 - ICT Test (In-Circuit Test)
90 - FCT Test (Functional Test)
100 - Visual Inspection
110 - Conformal Coating (Optional)
120 - Final Assembly
130 - Packing
*/
