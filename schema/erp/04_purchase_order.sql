-- ============================================================
-- ERP Procurement Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. Purchase Requisition (구매 요청)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_requisition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    pr_no VARCHAR(20) NOT NULL,
    pr_date DATE NOT NULL,
    requester_code VARCHAR(20),
    requester_name VARCHAR(100),
    department_code VARCHAR(20),
    pr_type VARCHAR(20) DEFAULT 'standard' CHECK (pr_type IN ('standard', 'urgent', 'project', 'capital')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'converted', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    required_date DATE,
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, pr_no)
);

CREATE INDEX idx_erp_pr_tenant ON erp_purchase_requisition(tenant_id, pr_date DESC);

-- ============================================================
-- 2. Purchase Requisition Line
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_requisition_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    pr_id UUID NOT NULL REFERENCES erp_purchase_requisition(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    requested_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    required_date DATE,
    estimated_price NUMERIC(12,4),
    preferred_vendor_code VARCHAR(20),
    warehouse_code VARCHAR(10),
    po_no VARCHAR(20),
    po_line_no INT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'converted', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_pr_line_pr ON erp_purchase_requisition_line(pr_id);

-- ============================================================
-- 3. Purchase Order Header (구매 발주)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    po_no VARCHAR(20) NOT NULL,
    po_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (po_type IN ('standard', 'blanket', 'scheduled', 'consignment', 'subcontract', 'service')),
    po_date DATE NOT NULL,
    -- Vendor info
    vendor_code VARCHAR(20) NOT NULL,
    vendor_name VARCHAR(200),
    vendor_contact VARCHAR(100),
    vendor_phone VARCHAR(30),
    vendor_email VARCHAR(200),
    -- Buyer
    buyer_code VARCHAR(20),
    buyer_name VARCHAR(100),
    -- Currency & Payment
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    exchange_rate NUMERIC(10,4) DEFAULT 1.0,
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    -- Delivery
    incoterms VARCHAR(10),
    ship_via VARCHAR(30),
    ship_to_warehouse VARCHAR(10),
    ship_to_address TEXT,
    expected_delivery_date DATE,
    -- Amounts
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partial_received', 'received', 'invoiced', 'closed', 'cancelled')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
    -- Source
    pr_no VARCHAR(20),
    mrp_run_date DATE,
    contract_no VARCHAR(20),
    -- Notes
    internal_notes TEXT,
    vendor_notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    cancelled_by VARCHAR(20),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, po_no)
);

CREATE INDEX idx_erp_po_tenant_date ON erp_purchase_order(tenant_id, po_date DESC);
CREATE INDEX idx_erp_po_vendor ON erp_purchase_order(vendor_code, po_date DESC);
CREATE INDEX idx_erp_po_status ON erp_purchase_order(status) WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_erp_po_delivery ON erp_purchase_order(expected_delivery_date) WHERE status IN ('approved', 'sent', 'acknowledged', 'partial_received');

-- ============================================================
-- 4. Purchase Order Line (구매 발주 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    po_id UUID NOT NULL REFERENCES erp_purchase_order(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Material info
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    material_spec VARCHAR(500),
    vendor_part_no VARCHAR(50),
    -- Quantity
    order_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    price_unit NUMERIC(10,3) DEFAULT 1,
    received_qty NUMERIC(12,3) DEFAULT 0,
    open_qty NUMERIC(12,3) GENERATED ALWAYS AS (order_qty - received_qty) STORED,
    invoiced_qty NUMERIC(12,3) DEFAULT 0,
    returned_qty NUMERIC(12,3) DEFAULT 0,
    -- Pricing
    unit_price NUMERIC(12,4) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    line_amount NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 10,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    -- Dates
    required_date DATE,
    promised_date DATE,
    -- Delivery
    warehouse_code VARCHAR(10),
    storage_location VARCHAR(20),
    -- Source
    pr_id UUID,
    pr_line_id UUID,
    mrp_element_id VARCHAR(30),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'received', 'closed', 'cancelled')),
    -- Inspection
    inspection_required BOOLEAN DEFAULT FALSE,
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_po_line_po ON erp_purchase_order_line(po_id);
CREATE INDEX idx_erp_po_line_material ON erp_purchase_order_line(material_code, required_date);
CREATE INDEX idx_erp_po_line_status ON erp_purchase_order_line(status) WHERE status IN ('open', 'partial');

-- ============================================================
-- 5. Goods Receipt Header (입고)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_goods_receipt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    gr_no VARCHAR(20) NOT NULL,
    gr_type VARCHAR(20) NOT NULL DEFAULT 'po' CHECK (gr_type IN ('po', 'production', 'return', 'transfer', 'adjustment', 'initial')),
    gr_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    -- Source
    po_id UUID REFERENCES erp_purchase_order(id),
    po_no VARCHAR(20),
    work_order_no VARCHAR(20),
    transfer_order_no VARCHAR(20),
    -- Vendor (for PO receipts)
    vendor_code VARCHAR(20),
    vendor_name VARCHAR(200),
    -- Delivery info
    delivery_note_no VARCHAR(50),
    bill_of_lading VARCHAR(50),
    carrier VARCHAR(100),
    -- Destination
    warehouse_code VARCHAR(10) NOT NULL,
    -- Totals
    total_qty NUMERIC(12,3) NOT NULL,
    total_amount NUMERIC(15,2),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    -- Quality
    inspection_required BOOLEAN DEFAULT FALSE,
    inspection_status VARCHAR(20) CHECK (inspection_status IN ('pending', 'passed', 'failed', 'conditional', 'not_required')),
    -- Notes
    notes TEXT,
    -- Audit
    received_by VARCHAR(20),
    posted_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, gr_no)
);

CREATE INDEX idx_erp_gr_tenant_date ON erp_goods_receipt(tenant_id, gr_date DESC);
CREATE INDEX idx_erp_gr_po ON erp_goods_receipt(po_id);
CREATE INDEX idx_erp_gr_type ON erp_goods_receipt(gr_type, gr_date DESC);

-- ============================================================
-- 6. Goods Receipt Line (입고 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_goods_receipt_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    gr_id UUID NOT NULL REFERENCES erp_goods_receipt(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Source
    po_line_id UUID REFERENCES erp_purchase_order_line(id),
    -- Material
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    -- Quantity
    received_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    accepted_qty NUMERIC(12,3),
    rejected_qty NUMERIC(12,3) DEFAULT 0,
    -- Lot/Batch
    lot_no VARCHAR(50),
    batch_no VARCHAR(50),
    serial_nos TEXT[],
    production_date DATE,
    expiry_date DATE,
    vendor_lot_no VARCHAR(50),
    -- Location
    warehouse_code VARCHAR(10),
    storage_location VARCHAR(20),
    -- Valuation
    unit_cost NUMERIC(12,4),
    total_cost NUMERIC(15,2),
    -- Inspection
    inspection_lot_no VARCHAR(20),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_gr_line_gr ON erp_goods_receipt_line(gr_id);
CREATE INDEX idx_erp_gr_line_material ON erp_goods_receipt_line(material_code);
CREATE INDEX idx_erp_gr_line_lot ON erp_goods_receipt_line(lot_no) WHERE lot_no IS NOT NULL;

-- ============================================================
-- 7. Purchase Invoice Header (구매 매입)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_no VARCHAR(20) NOT NULL,
    vendor_invoice_no VARCHAR(50),
    invoice_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'debit_note', 'credit_note', 'advance')),
    invoice_date DATE NOT NULL,
    -- Source
    po_id UUID REFERENCES erp_purchase_order(id),
    po_no VARCHAR(20),
    gr_id UUID REFERENCES erp_goods_receipt(id),
    gr_no VARCHAR(20),
    -- Vendor
    vendor_code VARCHAR(20) NOT NULL,
    vendor_name VARCHAR(200),
    tax_id VARCHAR(30),
    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    exchange_rate NUMERIC(10,4) DEFAULT 1.0,
    -- Amounts
    subtotal NUMERIC(15,2) NOT NULL,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    -- Payment
    payment_terms VARCHAR(20),
    payment_due_date DATE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'scheduled', 'partial', 'paid')),
    paid_amount NUMERIC(15,2) DEFAULT 0,
    paid_date DATE,
    -- 3-way matching
    three_way_match BOOLEAN DEFAULT FALSE,
    match_status VARCHAR(20) CHECK (match_status IN ('pending', 'matched', 'variance', 'exception')),
    po_variance NUMERIC(15,2),
    gr_variance NUMERIC(15,2),
    -- Accounting
    ap_account_code VARCHAR(20),
    expense_account_code VARCHAR(20),
    tax_account_code VARCHAR(20),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'paid', 'cancelled')),
    posted_date DATE,
    -- Notes
    notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    posted_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, invoice_no)
);

CREATE INDEX idx_erp_pi_tenant_date ON erp_purchase_invoice(tenant_id, invoice_date DESC);
CREATE INDEX idx_erp_pi_vendor ON erp_purchase_invoice(vendor_code, payment_due_date);
CREATE INDEX idx_erp_pi_payment ON erp_purchase_invoice(payment_status, payment_due_date) WHERE payment_status NOT IN ('paid');

-- ============================================================
-- 8. Purchase Invoice Line
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_purchase_invoice_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES erp_purchase_invoice(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Source
    po_line_id UUID REFERENCES erp_purchase_order_line(id),
    gr_line_id UUID REFERENCES erp_goods_receipt_line(id),
    -- Material
    material_code VARCHAR(30) NOT NULL,
    material_name VARCHAR(200),
    -- Quantity
    qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Pricing
    unit_price NUMERIC(12,4) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    line_amount NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 10,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    -- Variance
    po_unit_price NUMERIC(12,4),
    price_variance NUMERIC(15,2),
    qty_variance NUMERIC(12,3),
    -- Accounting
    expense_account_code VARCHAR(20),
    cost_center_code VARCHAR(20),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_pi_line_invoice ON erp_purchase_invoice_line(invoice_id);

-- ============================================================
-- 9. Vendor Performance View
-- ============================================================
CREATE OR REPLACE VIEW v_vendor_performance AS
SELECT
    po.tenant_id,
    po.vendor_code,
    vm.vendor_name,
    DATE_TRUNC('month', po.po_date) AS period,
    COUNT(DISTINCT po.po_no) AS total_orders,
    COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.po_no END) AS completed_orders,
    SUM(pol.order_qty) AS total_ordered_qty,
    SUM(pol.received_qty) AS total_received_qty,
    SUM(pol.line_amount) AS total_amount,
    AVG(CASE WHEN grl.gr_id IS NOT NULL
        THEN EXTRACT(DAY FROM (gr.gr_date - po.po_date))
        END) AS avg_lead_time_days,
    SUM(CASE WHEN grl.received_qty < pol.order_qty THEN 1 ELSE 0 END)::NUMERIC /
        NULLIF(COUNT(pol.id), 0) AS short_ship_rate,
    SUM(grl.rejected_qty)::NUMERIC /
        NULLIF(SUM(grl.received_qty), 0) AS defect_rate
FROM erp_purchase_order po
JOIN erp_purchase_order_line pol ON pol.po_id = po.id
LEFT JOIN erp_vendor_master vm ON vm.tenant_id = po.tenant_id AND vm.vendor_code = po.vendor_code
LEFT JOIN erp_goods_receipt_line grl ON grl.po_line_id = pol.id
LEFT JOIN erp_goods_receipt gr ON gr.id = grl.gr_id
WHERE po.status NOT IN ('draft', 'cancelled')
GROUP BY
    po.tenant_id,
    po.vendor_code,
    vm.vendor_name,
    DATE_TRUNC('month', po.po_date);

-- ============================================================
-- 10. AP Aging View
-- ============================================================
CREATE OR REPLACE VIEW v_ap_aging AS
SELECT
    pi.tenant_id,
    pi.vendor_code,
    vm.vendor_name,
    pi.invoice_no,
    pi.invoice_date,
    pi.payment_due_date,
    pi.total_amount,
    pi.paid_amount,
    pi.total_amount - pi.paid_amount AS outstanding_amount,
    CURRENT_DATE - pi.payment_due_date AS days_overdue,
    CASE
        WHEN CURRENT_DATE <= pi.payment_due_date THEN 'current'
        WHEN CURRENT_DATE - pi.payment_due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - pi.payment_due_date <= 60 THEN '31-60'
        WHEN CURRENT_DATE - pi.payment_due_date <= 90 THEN '61-90'
        ELSE '90+'
    END AS aging_bucket,
    pi.currency,
    pi.payment_status
FROM erp_purchase_invoice pi
LEFT JOIN erp_vendor_master vm ON vm.tenant_id = pi.tenant_id AND vm.vendor_code = pi.vendor_code
WHERE pi.payment_status NOT IN ('paid')
  AND pi.status = 'posted';

-- ============================================================
-- Triggers
-- ============================================================

-- Update PO totals when lines change
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE erp_purchase_order
    SET subtotal = (
            SELECT COALESCE(SUM(line_amount), 0)
            FROM erp_purchase_order_line
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        tax_amount = (
            SELECT COALESCE(SUM(tax_amount), 0)
            FROM erp_purchase_order_line
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(line_amount + tax_amount), 0)
            FROM erp_purchase_order_line
            WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.po_id, OLD.po_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_totals
AFTER INSERT OR UPDATE OR DELETE ON erp_purchase_order_line
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_totals();

-- Update PO line received qty when GR posted
CREATE OR REPLACE FUNCTION update_po_line_received_qty()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_line_id IS NOT NULL THEN
        UPDATE erp_purchase_order_line
        SET received_qty = (
            SELECT COALESCE(SUM(grl.received_qty), 0)
            FROM erp_goods_receipt_line grl
            JOIN erp_goods_receipt gr ON gr.id = grl.gr_id
            WHERE grl.po_line_id = NEW.po_line_id
              AND gr.status = 'posted'
        ),
        updated_at = NOW()
        WHERE id = NEW.po_line_id;

        -- Update line status
        UPDATE erp_purchase_order_line
        SET status = CASE
            WHEN received_qty >= order_qty THEN 'received'
            WHEN received_qty > 0 THEN 'partial'
            ELSE 'open'
        END
        WHERE id = NEW.po_line_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_received
AFTER INSERT OR UPDATE ON erp_goods_receipt_line
FOR EACH ROW
EXECUTE FUNCTION update_po_line_received_qty();

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE erp_purchase_order IS '구매 발주 - 공급업체 발주 관리';
COMMENT ON TABLE erp_goods_receipt IS '입고 - 자재 입고 및 검수';
COMMENT ON TABLE erp_purchase_invoice IS '구매 매입 - 공급업체 세금계산서';
