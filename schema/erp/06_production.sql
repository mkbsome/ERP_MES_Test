-- ============================================================
-- ERP Production Planning Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. Master Production Schedule (기준생산계획)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_mps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    mps_no VARCHAR(20) NOT NULL,
    planning_version VARCHAR(10) NOT NULL DEFAULT 'MAIN',
    planning_period VARCHAR(10) NOT NULL,  -- 202407, 202408, etc.
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    -- Planning bucket (weekly)
    week_start_date DATE NOT NULL,
    week_end_date DATE,
    -- Quantities
    forecast_qty NUMERIC(12,3) DEFAULT 0,
    order_qty NUMERIC(12,3) DEFAULT 0,
    planned_qty NUMERIC(12,3) NOT NULL,
    confirmed_qty NUMERIC(12,3) DEFAULT 0,
    released_qty NUMERIC(12,3) DEFAULT 0,
    produced_qty NUMERIC(12,3) DEFAULT 0,
    -- Demand source
    demand_source VARCHAR(20) CHECK (demand_source IN ('forecast', 'order', 'safety_stock', 'make_to_stock', 'replenishment')),
    -- Priority & Assignment
    priority INT DEFAULT 5,
    line_code VARCHAR(20),
    planner_code VARCHAR(20),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'confirmed', 'released', 'completed', 'cancelled')),
    -- Notes
    notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    confirmed_by VARCHAR(20),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, mps_no, product_code, week_start_date)
);

CREATE INDEX idx_erp_mps_product ON erp_mps(tenant_id, product_code, week_start_date);
CREATE INDEX idx_erp_mps_status ON erp_mps(status, week_start_date);
CREATE INDEX idx_erp_mps_line ON erp_mps(line_code, week_start_date) WHERE line_code IS NOT NULL;

-- ============================================================
-- 2. MRP Run Header (자재소요계획 실행)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_mrp_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    run_no VARCHAR(20) NOT NULL,
    run_date DATE NOT NULL,
    run_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Scope
    planning_horizon_days INT DEFAULT 90,
    planning_fence_days INT DEFAULT 7,
    scope_type VARCHAR(20) DEFAULT 'full' CHECK (scope_type IN ('full', 'incremental', 'selective')),
    product_codes TEXT[],
    material_groups TEXT[],
    -- Parameters
    consider_safety_stock BOOLEAN DEFAULT TRUE,
    consider_lead_time BOOLEAN DEFAULT TRUE,
    consider_lot_size BOOLEAN DEFAULT TRUE,
    -- Results
    total_products INT DEFAULT 0,
    total_materials INT DEFAULT 0,
    planned_orders_created INT DEFAULT 0,
    exceptions_count INT DEFAULT 0,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INT,
    -- Audit
    run_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, run_no)
);

CREATE INDEX idx_erp_mrp_run_date ON erp_mrp_run(tenant_id, run_date DESC);

-- ============================================================
-- 3. MRP Planned Order (계획오더)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_mrp_planned_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    planned_order_no VARCHAR(20) NOT NULL,
    mrp_run_id UUID REFERENCES erp_mrp_run(id),
    mrp_run_date DATE NOT NULL,
    -- Material
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    material_type VARCHAR(20),
    -- Order type
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('purchase', 'production', 'transfer', 'subcontract')),
    -- Quantities
    planned_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    converted_qty NUMERIC(12,3) DEFAULT 0,
    -- Dates
    required_date DATE NOT NULL,
    planned_start_date DATE,
    planned_finish_date DATE,
    -- Source (for production orders)
    bom_no VARCHAR(30),
    routing_no VARCHAR(30),
    line_code VARCHAR(20),
    -- Source (for purchase orders)
    vendor_code VARCHAR(20),
    vendor_name VARCHAR(200),
    lead_time_days INT,
    -- Pegging (demand source)
    pegging_info JSONB,  -- [{type: 'SO', doc_no: 'SO001', qty: 100}, ...]
    parent_order_no VARCHAR(20),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'firmed', 'converted', 'cancelled')),
    firmed_date DATE,
    firmed_by VARCHAR(20),
    -- Conversion result
    converted_to_doc_type VARCHAR(10),  -- PO, WO
    converted_to_doc_no VARCHAR(20),
    converted_at TIMESTAMPTZ,
    -- Exception
    exception_code VARCHAR(20),
    exception_message TEXT,
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, planned_order_no)
);

CREATE INDEX idx_erp_mrp_po_material ON erp_mrp_planned_order(tenant_id, material_code, required_date);
CREATE INDEX idx_erp_mrp_po_status ON erp_mrp_planned_order(status, mrp_run_date);
CREATE INDEX idx_erp_mrp_po_type ON erp_mrp_planned_order(order_type, required_date);

-- ============================================================
-- 4. Work Order Header (작업지시)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_work_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_no VARCHAR(20) NOT NULL,
    wo_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (wo_type IN ('standard', 'rework', 'prototype', 'repair', 'disassembly')),
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    product_rev VARCHAR(10),
    -- BOM & Routing
    bom_id UUID REFERENCES erp_bom_header(id),
    bom_no VARCHAR(30),
    bom_version INT,
    routing_id UUID REFERENCES erp_routing_header(id),
    routing_no VARCHAR(30),
    routing_version INT,
    -- Quantities
    planned_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    started_qty NUMERIC(12,3) DEFAULT 0,
    completed_qty NUMERIC(12,3) DEFAULT 0,
    scrapped_qty NUMERIC(12,3) DEFAULT 0,
    rejected_qty NUMERIC(12,3) DEFAULT 0,
    -- Open quantity (to be produced)
    open_qty NUMERIC(12,3) GENERATED ALWAYS AS (planned_qty - completed_qty - scrapped_qty) STORED,
    -- Dates
    planned_start_date DATE NOT NULL,
    planned_finish_date DATE NOT NULL,
    actual_start_date DATE,
    actual_finish_date DATE,
    -- Assignment
    line_code VARCHAR(20),
    work_center_code VARCHAR(20),
    shift_code VARCHAR(10),
    -- Priority
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    scheduling_status VARCHAR(20) DEFAULT 'unscheduled' CHECK (scheduling_status IN ('unscheduled', 'scheduled', 'frozen')),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'released', 'printed', 'started', 'completed', 'closed', 'cancelled', 'on_hold')),
    -- Material status
    material_status VARCHAR(20) DEFAULT 'not_issued' CHECK (material_status IN ('not_issued', 'partial', 'issued', 'returned')),
    -- Source documents
    source_doc_type VARCHAR(20),  -- MPS, SO, PO (for subcontract)
    source_doc_no VARCHAR(20),
    sales_order_no VARCHAR(20),
    sales_order_line INT,
    customer_code VARCHAR(20),
    mrp_planned_order_no VARCHAR(20),
    -- Lot tracking
    lot_no VARCHAR(50),
    -- Notes
    production_notes TEXT,
    quality_notes TEXT,
    internal_notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    released_by VARCHAR(20),
    released_at TIMESTAMPTZ,
    started_by VARCHAR(20),
    completed_by VARCHAR(20),
    closed_by VARCHAR(20),
    closed_at TIMESTAMPTZ,
    cancelled_by VARCHAR(20),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, work_order_no)
);

CREATE INDEX idx_erp_wo_tenant_date ON erp_work_order(tenant_id, planned_start_date);
CREATE INDEX idx_erp_wo_product ON erp_work_order(product_code, status);
CREATE INDEX idx_erp_wo_line ON erp_work_order(line_code, planned_start_date) WHERE line_code IS NOT NULL;
CREATE INDEX idx_erp_wo_status ON erp_work_order(status) WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_erp_wo_so ON erp_work_order(sales_order_no) WHERE sales_order_no IS NOT NULL;

-- ============================================================
-- 5. Work Order Operation (작업지시 공정)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_work_order_operation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_id UUID NOT NULL REFERENCES erp_work_order(id) ON DELETE CASCADE,
    operation_no INT NOT NULL,
    -- From routing
    operation_name VARCHAR(100) NOT NULL,
    work_center_code VARCHAR(20) NOT NULL,
    work_center_name VARCHAR(100),
    operation_type VARCHAR(20),
    -- Planned times
    planned_setup_time NUMERIC(10,2) DEFAULT 0,
    planned_run_time NUMERIC(10,2) NOT NULL,
    planned_queue_time NUMERIC(10,2) DEFAULT 0,
    time_unit VARCHAR(10) DEFAULT 'min',
    -- Actual times
    actual_setup_time NUMERIC(10,2),
    actual_run_time NUMERIC(10,2),
    actual_queue_time NUMERIC(10,2),
    -- Quantities
    planned_qty NUMERIC(12,3) NOT NULL,
    input_qty NUMERIC(12,3) DEFAULT 0,
    completed_qty NUMERIC(12,3) DEFAULT 0,
    scrapped_qty NUMERIC(12,3) DEFAULT 0,
    yield_qty NUMERIC(12,3) GENERATED ALWAYS AS (completed_qty - scrapped_qty) STORED,
    -- Dates
    planned_start TIMESTAMPTZ,
    planned_finish TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_finish TIMESTAMPTZ,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'started', 'completed', 'skipped')),
    -- Quality
    is_inspection_required BOOLEAN DEFAULT FALSE,
    inspection_status VARCHAR(20) CHECK (inspection_status IN ('pending', 'passed', 'failed', 'conditional')),
    -- Labor
    operator_codes TEXT[],
    actual_labor_hours NUMERIC(10,2),
    -- Equipment
    equipment_code VARCHAR(20),
    actual_machine_hours NUMERIC(10,2),
    -- Confirmation
    confirmed_at TIMESTAMPTZ,
    confirmed_by VARCHAR(20),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_wo_op_wo ON erp_work_order_operation(work_order_id, operation_no);
CREATE INDEX idx_erp_wo_op_wc ON erp_work_order_operation(work_center_code, planned_start);
CREATE INDEX idx_erp_wo_op_status ON erp_work_order_operation(status) WHERE status IN ('ready', 'started');

-- ============================================================
-- 6. Work Order Material (작업지시 자재)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_work_order_material (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_id UUID NOT NULL REFERENCES erp_work_order(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Material
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    -- BOM reference
    bom_item_no INT,
    operation_no INT,
    -- Quantities
    required_qty NUMERIC(12,3) NOT NULL,
    issued_qty NUMERIC(12,3) DEFAULT 0,
    returned_qty NUMERIC(12,3) DEFAULT 0,
    consumed_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    variance_qty NUMERIC(12,3) GENERATED ALWAYS AS (consumed_qty + scrap_qty - issued_qty + returned_qty) STORED,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Source
    warehouse_code VARCHAR(10),
    storage_location VARCHAR(20),
    reservation_no VARCHAR(20),
    -- Backflush
    is_backflush BOOLEAN DEFAULT TRUE,
    backflush_operation INT,
    -- Lot assignment
    assigned_lots JSONB,  -- [{lot_no: 'LOT001', qty: 100}, ...]
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'issued', 'consumed', 'closed')),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_wo_mat_wo ON erp_work_order_material(work_order_id);
CREATE INDEX idx_erp_wo_mat_material ON erp_work_order_material(material_code);

-- ============================================================
-- 7. Production Confirmation (생산실적 확정)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_production_confirmation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    confirmation_no VARCHAR(20) NOT NULL,
    confirmation_date DATE NOT NULL,
    confirmation_time TIME NOT NULL,
    -- Work order
    work_order_id UUID NOT NULL REFERENCES erp_work_order(id),
    work_order_no VARCHAR(20) NOT NULL,
    operation_no INT NOT NULL,
    -- Product
    product_code VARCHAR(30) NOT NULL,
    -- Quantities
    confirmed_qty NUMERIC(12,3) NOT NULL,
    yield_qty NUMERIC(12,3) NOT NULL,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    rework_qty NUMERIC(12,3) DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Times
    setup_time NUMERIC(10,2),
    run_time NUMERIC(10,2),
    idle_time NUMERIC(10,2),
    time_unit VARCHAR(10) DEFAULT 'min',
    -- Resources
    operator_code VARCHAR(20),
    operator_name VARCHAR(100),
    machine_code VARCHAR(20),
    labor_hours NUMERIC(10,2),
    machine_hours NUMERIC(10,2),
    -- Lot
    lot_no VARCHAR(50),
    -- Location
    line_code VARCHAR(20),
    shift_code VARCHAR(10),
    -- Type
    confirmation_type VARCHAR(20) DEFAULT 'normal' CHECK (confirmation_type IN ('normal', 'rework', 'scrap', 'adjustment')),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'reversed')),
    reversal_no VARCHAR(20),
    -- Notes
    notes TEXT,
    -- Audit
    confirmed_by VARCHAR(20),
    reversed_by VARCHAR(20),
    reversed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, confirmation_no)
);

CREATE INDEX idx_erp_prod_conf_wo ON erp_production_confirmation(work_order_id);
CREATE INDEX idx_erp_prod_conf_date ON erp_production_confirmation(tenant_id, confirmation_date DESC);
CREATE INDEX idx_erp_prod_conf_line ON erp_production_confirmation(line_code, confirmation_date);

-- ============================================================
-- 8. Production Schedule View
-- ============================================================
CREATE OR REPLACE VIEW v_production_schedule AS
SELECT
    wo.tenant_id,
    wo.work_order_no,
    wo.product_code,
    wo.product_name,
    wo.planned_qty,
    wo.completed_qty,
    wo.open_qty,
    wo.planned_start_date,
    wo.planned_finish_date,
    wo.actual_start_date,
    wo.line_code,
    wo.priority,
    wo.status,
    wo.material_status,
    woo.operation_no AS current_operation,
    woo.operation_name AS current_operation_name,
    woo.work_center_code,
    woo.status AS operation_status,
    wo.sales_order_no,
    wo.customer_code,
    cm.customer_name
FROM erp_work_order wo
LEFT JOIN erp_work_order_operation woo ON woo.work_order_id = wo.id
    AND woo.status IN ('ready', 'started')
LEFT JOIN erp_customer_master cm ON cm.tenant_id = wo.tenant_id AND cm.customer_code = wo.customer_code
WHERE wo.status NOT IN ('closed', 'cancelled');

-- ============================================================
-- 9. WO Status Update Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_work_order_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_qty NUMERIC(12,3);
    v_completed_qty NUMERIC(12,3);
    v_new_status VARCHAR(20);
BEGIN
    -- Get current totals
    SELECT planned_qty, completed_qty + NEW.yield_qty
    INTO v_total_qty, v_completed_qty
    FROM erp_work_order
    WHERE id = NEW.work_order_id;

    -- Determine new status
    IF v_completed_qty >= v_total_qty THEN
        v_new_status := 'completed';
    ELSIF v_completed_qty > 0 THEN
        v_new_status := 'started';
    ELSE
        v_new_status := NULL;  -- Don't change
    END IF;

    -- Update work order
    IF v_new_status IS NOT NULL THEN
        UPDATE erp_work_order
        SET completed_qty = v_completed_qty,
            status = CASE
                WHEN status = 'created' OR status = 'released' OR status = 'printed' THEN 'started'
                WHEN v_new_status = 'completed' THEN 'completed'
                ELSE status
            END,
            actual_start_date = COALESCE(actual_start_date, NEW.confirmation_date),
            actual_finish_date = CASE WHEN v_new_status = 'completed' THEN NEW.confirmation_date ELSE actual_finish_date END,
            updated_at = NOW()
        WHERE id = NEW.work_order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wo_status
AFTER INSERT ON erp_production_confirmation
FOR EACH ROW
EXECUTE FUNCTION update_work_order_status();

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE erp_mps IS '기준생산계획 - 주간 단위 생산 계획';
COMMENT ON TABLE erp_mrp_planned_order IS 'MRP 계획오더 - 자재/생산 소요 계획';
COMMENT ON TABLE erp_work_order IS '작업지시 - 생산 실행 단위';
COMMENT ON TABLE erp_production_confirmation IS '생산실적 확정 - 생산 완료 보고';
