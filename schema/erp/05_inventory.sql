-- ============================================================
-- ERP Inventory Management Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. Inventory Stock (재고 현황)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Material & Location
    material_code VARCHAR(30) NOT NULL,
    warehouse_code VARCHAR(10) NOT NULL,
    storage_location VARCHAR(20),
    -- Lot/Batch tracking
    lot_no VARCHAR(50),
    batch_no VARCHAR(50),
    -- Stock type
    stock_type VARCHAR(20) NOT NULL DEFAULT 'unrestricted' CHECK (stock_type IN ('unrestricted', 'blocked', 'quality', 'reserved', 'in_transit', 'consignment')),
    -- Quantities
    qty_on_hand NUMERIC(12,3) NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    qty_reserved NUMERIC(12,3) DEFAULT 0,
    qty_allocated NUMERIC(12,3) DEFAULT 0,
    qty_available NUMERIC(12,3) GENERATED ALWAYS AS (qty_on_hand - qty_reserved - qty_allocated) STORED,
    qty_in_transit NUMERIC(12,3) DEFAULT 0,
    -- Dates
    receipt_date DATE,
    last_movement_date DATE,
    last_count_date DATE,
    expiry_date DATE,
    -- Valuation
    valuation_type VARCHAR(20) DEFAULT 'moving_avg' CHECK (valuation_type IN ('standard', 'moving_avg', 'fifo', 'lifo')),
    unit_cost NUMERIC(12,4),
    stock_value NUMERIC(15,2) GENERATED ALWAYS AS (qty_on_hand * COALESCE(unit_cost, 0)) STORED,
    -- Vendor (for consignment)
    vendor_code VARCHAR(20),
    -- Quality
    quality_status VARCHAR(20) DEFAULT 'released' CHECK (quality_status IN ('released', 'hold', 'rejected', 'expired')),
    hold_reason TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique constraint (combination of location and lot)
    UNIQUE (tenant_id, material_code, warehouse_code, COALESCE(storage_location, ''), COALESCE(lot_no, ''), stock_type)
);

CREATE INDEX idx_erp_stock_material ON erp_inventory_stock(tenant_id, material_code);
CREATE INDEX idx_erp_stock_warehouse ON erp_inventory_stock(tenant_id, warehouse_code);
CREATE INDEX idx_erp_stock_lot ON erp_inventory_stock(lot_no) WHERE lot_no IS NOT NULL;
CREATE INDEX idx_erp_stock_expiry ON erp_inventory_stock(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_erp_stock_quality ON erp_inventory_stock(quality_status) WHERE quality_status != 'released';

-- ============================================================
-- 2. Inventory Transaction (재고 이동 이력)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_inventory_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    transaction_no VARCHAR(30) NOT NULL,
    transaction_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    -- Transaction type
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'GR_PO',      -- Goods Receipt from PO
        'GR_PROD',    -- Goods Receipt from Production
        'GR_RETURN',  -- Goods Receipt from Customer Return
        'GI_SO',      -- Goods Issue for Sales Order
        'GI_PROD',    -- Goods Issue for Production
        'GI_SCRAP',   -- Goods Issue for Scrap
        'GI_RETURN',  -- Goods Issue for Vendor Return
        'TRANSFER',   -- Stock Transfer
        'ADJUSTMENT', -- Inventory Adjustment
        'COUNT',      -- Cycle Count Adjustment
        'RECLASS',    -- Stock Reclassification
        'RESERVE',    -- Stock Reservation
        'UNRESERVE'   -- Release Reservation
    )),
    movement_type VARCHAR(10),  -- SAP-style movement type (101, 201, 301, etc.)
    -- Material
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    -- Quantity
    qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    direction VARCHAR(3) NOT NULL CHECK (direction IN ('IN', 'OUT')),
    -- Location
    warehouse_code VARCHAR(10) NOT NULL,
    storage_location VARCHAR(20),
    -- For transfers
    from_warehouse VARCHAR(10),
    from_location VARCHAR(20),
    to_warehouse VARCHAR(10),
    to_location VARCHAR(20),
    -- Lot/Batch
    lot_no VARCHAR(50),
    batch_no VARCHAR(50),
    serial_no VARCHAR(100),
    -- Stock type change
    from_stock_type VARCHAR(20),
    to_stock_type VARCHAR(20),
    -- Valuation
    unit_cost NUMERIC(12,4),
    total_cost NUMERIC(15,2),
    -- Reference documents
    reference_doc_type VARCHAR(20),  -- PO, SO, WO, GR, SH, etc.
    reference_doc_no VARCHAR(30),
    reference_line_no INT,
    -- Reason
    reason_code VARCHAR(20),
    reason_text TEXT,
    -- Audit
    created_by VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (transaction_date);

-- Create partitions for 2024
CREATE TABLE IF NOT EXISTS erp_inventory_transaction_2024_h1
    PARTITION OF erp_inventory_transaction
    FOR VALUES FROM ('2024-01-01') TO ('2024-07-01');

CREATE TABLE IF NOT EXISTS erp_inventory_transaction_2024_h2
    PARTITION OF erp_inventory_transaction
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS erp_inventory_transaction_2025_h1
    PARTITION OF erp_inventory_transaction
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_erp_inv_txn_material ON erp_inventory_transaction(tenant_id, material_code, transaction_date DESC);
CREATE INDEX idx_erp_inv_txn_warehouse ON erp_inventory_transaction(tenant_id, warehouse_code, transaction_date DESC);
CREATE INDEX idx_erp_inv_txn_type ON erp_inventory_transaction(transaction_type, transaction_date DESC);
CREATE INDEX idx_erp_inv_txn_ref ON erp_inventory_transaction(reference_doc_type, reference_doc_no);

-- ============================================================
-- 3. WIP Inventory (재공재고)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_wip_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_no VARCHAR(20) NOT NULL,
    operation_no INT NOT NULL,
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    -- Location
    line_code VARCHAR(20) NOT NULL,
    work_center_code VARCHAR(20),
    -- Quantities
    qty_in_process NUMERIC(12,3) NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    qty_completed NUMERIC(12,3) DEFAULT 0,
    qty_scrapped NUMERIC(12,3) DEFAULT 0,
    -- Costs
    material_cost NUMERIC(15,2) DEFAULT 0,
    labor_cost NUMERIC(15,2) DEFAULT 0,
    overhead_cost NUMERIC(15,2) DEFAULT 0,
    total_wip_value NUMERIC(15,2) GENERATED ALWAYS AS (material_cost + labor_cost + overhead_cost) STORED,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'closed')),
    -- Timestamps
    started_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, work_order_no, operation_no)
);

CREATE INDEX idx_erp_wip_wo ON erp_wip_inventory(tenant_id, work_order_no);
CREATE INDEX idx_erp_wip_line ON erp_wip_inventory(tenant_id, line_code);
CREATE INDEX idx_erp_wip_status ON erp_wip_inventory(status) WHERE status = 'active';

-- ============================================================
-- 4. Stock Reservation (재고 예약)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_stock_reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reservation_no VARCHAR(20) NOT NULL,
    reservation_date DATE NOT NULL,
    -- Material
    material_code VARCHAR(30) NOT NULL,
    -- Reserved quantity
    reserved_qty NUMERIC(12,3) NOT NULL,
    consumed_qty NUMERIC(12,3) DEFAULT 0,
    remaining_qty NUMERIC(12,3) GENERATED ALWAYS AS (reserved_qty - consumed_qty) STORED,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Location
    warehouse_code VARCHAR(10) NOT NULL,
    storage_location VARCHAR(20),
    lot_no VARCHAR(50),
    -- Source document
    source_doc_type VARCHAR(20) NOT NULL,  -- SO, WO, etc.
    source_doc_no VARCHAR(30) NOT NULL,
    source_line_no INT,
    -- Dates
    required_date DATE,
    expiry_date DATE,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partial', 'consumed', 'cancelled', 'expired')),
    -- Audit
    created_by VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, reservation_no)
);

CREATE INDEX idx_erp_reservation_material ON erp_stock_reservation(tenant_id, material_code, status);
CREATE INDEX idx_erp_reservation_source ON erp_stock_reservation(source_doc_type, source_doc_no);

-- ============================================================
-- 5. Cycle Count (실사)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cycle_count (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    count_no VARCHAR(20) NOT NULL,
    count_date DATE NOT NULL,
    count_type VARCHAR(20) NOT NULL DEFAULT 'cycle' CHECK (count_type IN ('cycle', 'annual', 'random', 'perpetual')),
    -- Scope
    warehouse_code VARCHAR(10),
    storage_location VARCHAR(20),
    material_code VARCHAR(30),
    abc_class VARCHAR(1),
    -- Summary
    total_items INT DEFAULT 0,
    counted_items INT DEFAULT 0,
    variance_items INT DEFAULT 0,
    total_variance_value NUMERIC(15,2) DEFAULT 0,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'counting', 'review', 'approved', 'posted', 'cancelled')),
    -- Audit
    created_by VARCHAR(20),
    counted_by VARCHAR(20),
    reviewed_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, count_no)
);

-- ============================================================
-- 6. Cycle Count Line (실사 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_cycle_count_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    count_id UUID NOT NULL REFERENCES erp_cycle_count(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Material & Location
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    warehouse_code VARCHAR(10) NOT NULL,
    storage_location VARCHAR(20),
    lot_no VARCHAR(50),
    -- Quantities
    book_qty NUMERIC(12,3) NOT NULL,
    counted_qty NUMERIC(12,3),
    variance_qty NUMERIC(12,3) GENERATED ALWAYS AS (COALESCE(counted_qty, 0) - book_qty) STORED,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Values
    unit_cost NUMERIC(12,4),
    book_value NUMERIC(15,2),
    counted_value NUMERIC(15,2),
    variance_value NUMERIC(15,2) GENERATED ALWAYS AS (COALESCE(counted_qty, 0) * COALESCE(unit_cost, 0) - book_qty * COALESCE(unit_cost, 0)) STORED,
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'counted', 'recounted', 'approved', 'posted')),
    -- Adjustment
    adjustment_reason VARCHAR(100),
    adjustment_account VARCHAR(20),
    -- Audit
    counted_by VARCHAR(20),
    counted_at TIMESTAMPTZ,
    recount_by VARCHAR(20),
    recount_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_cc_line_count ON erp_cycle_count_line(count_id);
CREATE INDEX idx_erp_cc_line_material ON erp_cycle_count_line(material_code);

-- ============================================================
-- 7. Stock Summary View
-- ============================================================
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
    s.tenant_id,
    s.material_code,
    mm.name AS material_name,
    mm.material_type,
    mm.material_group,
    mm.unit,
    mm.abc_class,
    SUM(CASE WHEN s.stock_type = 'unrestricted' THEN s.qty_on_hand ELSE 0 END) AS unrestricted_qty,
    SUM(CASE WHEN s.stock_type = 'blocked' THEN s.qty_on_hand ELSE 0 END) AS blocked_qty,
    SUM(CASE WHEN s.stock_type = 'quality' THEN s.qty_on_hand ELSE 0 END) AS quality_qty,
    SUM(CASE WHEN s.stock_type = 'reserved' THEN s.qty_on_hand ELSE 0 END) AS reserved_qty,
    SUM(s.qty_on_hand) AS total_qty,
    SUM(s.qty_available) AS available_qty,
    SUM(s.stock_value) AS total_value,
    mm.safety_stock,
    mm.reorder_point,
    CASE
        WHEN SUM(s.qty_available) <= 0 THEN 'stockout'
        WHEN SUM(s.qty_available) <= mm.safety_stock THEN 'critical'
        WHEN SUM(s.qty_available) <= mm.reorder_point THEN 'reorder'
        ELSE 'normal'
    END AS stock_status
FROM erp_inventory_stock s
JOIN erp_material_master mm ON mm.tenant_id = s.tenant_id AND mm.material_code = s.material_code
WHERE s.qty_on_hand != 0
GROUP BY
    s.tenant_id,
    s.material_code,
    mm.name,
    mm.material_type,
    mm.material_group,
    mm.unit,
    mm.abc_class,
    mm.safety_stock,
    mm.reorder_point;

-- ============================================================
-- 8. Stock by Location View
-- ============================================================
CREATE OR REPLACE VIEW v_stock_by_location AS
SELECT
    s.tenant_id,
    s.warehouse_code,
    wh.warehouse_name,
    s.storage_location,
    s.material_code,
    mm.name AS material_name,
    mm.material_type,
    s.lot_no,
    s.stock_type,
    s.quality_status,
    s.qty_on_hand,
    s.qty_available,
    s.unit_cost,
    s.stock_value,
    s.expiry_date,
    CASE
        WHEN s.expiry_date IS NOT NULL AND s.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN s.expiry_date IS NOT NULL AND s.expiry_date <= CURRENT_DATE + 30 THEN 'expiring_soon'
        ELSE 'ok'
    END AS expiry_status
FROM erp_inventory_stock s
JOIN erp_material_master mm ON mm.tenant_id = s.tenant_id AND mm.material_code = s.material_code
LEFT JOIN erp_warehouse_master wh ON wh.tenant_id = s.tenant_id AND wh.warehouse_code = s.warehouse_code
WHERE s.qty_on_hand != 0;

-- ============================================================
-- 9. Inventory Movement Function
-- ============================================================
CREATE OR REPLACE FUNCTION process_inventory_movement(
    p_tenant_id UUID,
    p_transaction_type VARCHAR(20),
    p_material_code VARCHAR(30),
    p_qty NUMERIC(12,3),
    p_warehouse_code VARCHAR(10),
    p_storage_location VARCHAR(20) DEFAULT NULL,
    p_lot_no VARCHAR(50) DEFAULT NULL,
    p_unit_cost NUMERIC(12,4) DEFAULT NULL,
    p_reference_doc_type VARCHAR(20) DEFAULT NULL,
    p_reference_doc_no VARCHAR(30) DEFAULT NULL,
    p_created_by VARCHAR(20) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_direction VARCHAR(3);
    v_stock_type VARCHAR(20) := 'unrestricted';
BEGIN
    -- Determine direction
    v_direction := CASE
        WHEN p_transaction_type LIKE 'GR_%' THEN 'IN'
        WHEN p_transaction_type LIKE 'GI_%' THEN 'OUT'
        ELSE 'IN'
    END;

    -- Create transaction record
    INSERT INTO erp_inventory_transaction (
        tenant_id, transaction_no, transaction_date, posting_date,
        transaction_type, material_code, qty, unit, direction,
        warehouse_code, storage_location, lot_no,
        unit_cost, total_cost,
        reference_doc_type, reference_doc_no,
        created_by
    ) VALUES (
        p_tenant_id,
        get_next_sequence(p_tenant_id, 'INV'),
        CURRENT_DATE, CURRENT_DATE,
        p_transaction_type, p_material_code, p_qty, 'EA', v_direction,
        p_warehouse_code, p_storage_location, p_lot_no,
        p_unit_cost, p_qty * COALESCE(p_unit_cost, 0),
        p_reference_doc_type, p_reference_doc_no,
        p_created_by
    ) RETURNING id INTO v_transaction_id;

    -- Update stock
    IF v_direction = 'IN' THEN
        INSERT INTO erp_inventory_stock (
            tenant_id, material_code, warehouse_code, storage_location,
            lot_no, stock_type, qty_on_hand, unit_cost, receipt_date, last_movement_date
        ) VALUES (
            p_tenant_id, p_material_code, p_warehouse_code, COALESCE(p_storage_location, ''),
            COALESCE(p_lot_no, ''), v_stock_type, p_qty, p_unit_cost, CURRENT_DATE, CURRENT_DATE
        )
        ON CONFLICT (tenant_id, material_code, warehouse_code, COALESCE(storage_location, ''), COALESCE(lot_no, ''), stock_type)
        DO UPDATE SET
            qty_on_hand = erp_inventory_stock.qty_on_hand + p_qty,
            unit_cost = CASE
                WHEN erp_inventory_stock.qty_on_hand + p_qty > 0 THEN
                    (erp_inventory_stock.qty_on_hand * COALESCE(erp_inventory_stock.unit_cost, 0) + p_qty * COALESCE(p_unit_cost, 0)) /
                    (erp_inventory_stock.qty_on_hand + p_qty)
                ELSE p_unit_cost
            END,
            last_movement_date = CURRENT_DATE,
            updated_at = NOW();
    ELSE
        UPDATE erp_inventory_stock
        SET qty_on_hand = qty_on_hand - p_qty,
            last_movement_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE tenant_id = p_tenant_id
          AND material_code = p_material_code
          AND warehouse_code = p_warehouse_code
          AND COALESCE(storage_location, '') = COALESCE(p_storage_location, '')
          AND COALESCE(lot_no, '') = COALESCE(p_lot_no, '')
          AND stock_type = v_stock_type;
    END IF;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE erp_inventory_stock IS '재고 현황 - 자재별/창고별/로트별 현재고';
COMMENT ON TABLE erp_inventory_transaction IS '재고 이동 - 모든 재고 변동 이력';
COMMENT ON TABLE erp_wip_inventory IS '재공재고 - 생산 중인 제품의 재고 및 원가';
COMMENT ON TABLE erp_stock_reservation IS '재고 예약 - 판매주문/작업지시에 의한 재고 예약';
COMMENT ON TABLE erp_cycle_count IS '실사 - 재고 실사 및 조정';
