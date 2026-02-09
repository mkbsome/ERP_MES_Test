-- ============================================================
-- ERP Sales & Distribution Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. Sales Order Header (판매 주문 헤더)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_sales_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_no VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (order_type IN ('standard', 'scheduled', 'blanket', 'return', 'sample', 'consignment')),
    order_date DATE NOT NULL,
    -- Customer info
    customer_code VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    customer_po_no VARCHAR(50),
    ship_to_code VARCHAR(20),
    ship_to_name VARCHAR(200),
    ship_to_address TEXT,
    bill_to_code VARCHAR(20),
    bill_to_address TEXT,
    -- Sales organization
    sales_org VARCHAR(20) NOT NULL DEFAULT 'SO01',
    sales_channel VARCHAR(20) DEFAULT 'direct',
    sales_rep_code VARCHAR(20),
    sales_rep_name VARCHAR(100),
    -- Pricing
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    exchange_rate NUMERIC(10,4) DEFAULT 1.0,
    payment_terms VARCHAR(20) DEFAULT 'NET30',
    price_list VARCHAR(20),
    discount_pct NUMERIC(5,2) DEFAULT 0,
    -- Amounts
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    -- Dates
    requested_delivery_date DATE,
    promised_delivery_date DATE,
    earliest_ship_date DATE,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'partial_shipped', 'shipped', 'invoiced', 'closed', 'cancelled')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')),
    -- Shipping
    shipping_method VARCHAR(30),
    carrier_code VARCHAR(20),
    incoterms VARCHAR(10),
    freight_terms VARCHAR(20),
    -- Reference
    quote_no VARCHAR(20),
    contract_no VARCHAR(20),
    project_code VARCHAR(20),
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    shipping_instructions TEXT,
    -- Audit
    created_by VARCHAR(20),
    approved_by VARCHAR(20),
    approved_at TIMESTAMPTZ,
    cancelled_by VARCHAR(20),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, order_no)
);

CREATE INDEX idx_erp_so_tenant_date ON erp_sales_order(tenant_id, order_date DESC);
CREATE INDEX idx_erp_so_customer ON erp_sales_order(customer_code, order_date DESC);
CREATE INDEX idx_erp_so_status ON erp_sales_order(status) WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_erp_so_delivery ON erp_sales_order(requested_delivery_date) WHERE status NOT IN ('shipped', 'closed', 'cancelled');

-- ============================================================
-- 2. Sales Order Line (판매 주문 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_sales_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES erp_sales_order(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Product info
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    product_description TEXT,
    product_spec VARCHAR(500),
    customer_part_no VARCHAR(50),
    -- Quantity
    order_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    open_qty NUMERIC(12,3) NOT NULL,
    shipped_qty NUMERIC(12,3) DEFAULT 0,
    invoiced_qty NUMERIC(12,3) DEFAULT 0,
    returned_qty NUMERIC(12,3) DEFAULT 0,
    -- Pricing
    list_price NUMERIC(12,4),
    unit_price NUMERIC(12,4) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    line_amount NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 10,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    -- Dates
    requested_date DATE,
    promised_date DATE,
    actual_ship_date DATE,
    -- Source
    warehouse_code VARCHAR(10),
    work_order_no VARCHAR(20),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partial', 'shipped', 'invoiced', 'closed', 'cancelled')),
    hold_code VARCHAR(20),
    hold_reason TEXT,
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_so_line_order ON erp_sales_order_line(order_id);
CREATE INDEX idx_erp_so_line_product ON erp_sales_order_line(product_code, requested_date);
CREATE INDEX idx_erp_so_line_status ON erp_sales_order_line(status) WHERE status IN ('open', 'partial');

-- ============================================================
-- 3. Shipment Header (출하)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_shipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    shipment_no VARCHAR(20) NOT NULL,
    shipment_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (shipment_type IN ('standard', 'partial', 'backorder', 'return', 'sample', 'drop_ship')),
    shipment_date DATE NOT NULL,
    -- Source order
    order_id UUID NOT NULL REFERENCES erp_sales_order(id),
    order_no VARCHAR(20),
    -- Customer info
    customer_code VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    ship_to_code VARCHAR(20),
    ship_to_name VARCHAR(200),
    ship_to_address TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(30),
    -- Warehouse
    warehouse_code VARCHAR(10) NOT NULL,
    -- Carrier
    carrier_code VARCHAR(20),
    carrier_name VARCHAR(100),
    service_type VARCHAR(30),
    tracking_no VARCHAR(100),
    vehicle_no VARCHAR(20),
    driver_name VARCHAR(50),
    -- Packing
    total_qty NUMERIC(12,3) NOT NULL,
    total_weight NUMERIC(10,2),
    weight_unit VARCHAR(5) DEFAULT 'KG',
    total_volume NUMERIC(10,2),
    volume_unit VARCHAR(5) DEFAULT 'CBM',
    total_boxes INT,
    pallet_count INT,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'picking', 'picked', 'packing', 'packed', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled')),
    -- Timestamps
    pick_start_at TIMESTAMPTZ,
    pick_end_at TIMESTAMPTZ,
    pack_start_at TIMESTAMPTZ,
    pack_end_at TIMESTAMPTZ,
    ship_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    -- Delivery confirmation
    delivery_proof TEXT,
    receiver_name VARCHAR(100),
    receiver_signature TEXT,
    -- Notes
    shipping_instructions TEXT,
    notes TEXT,
    -- Audit
    picked_by VARCHAR(20),
    packed_by VARCHAR(20),
    shipped_by VARCHAR(20),
    created_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, shipment_no)
);

CREATE INDEX idx_erp_shipment_tenant_date ON erp_shipment(tenant_id, shipment_date DESC);
CREATE INDEX idx_erp_shipment_order ON erp_shipment(order_id);
CREATE INDEX idx_erp_shipment_status ON erp_shipment(status) WHERE status NOT IN ('delivered', 'cancelled');

-- ============================================================
-- 4. Shipment Line (출하 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_shipment_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    shipment_id UUID NOT NULL REFERENCES erp_shipment(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Source
    order_line_id UUID REFERENCES erp_sales_order_line(id),
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    -- Quantity
    shipped_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Lot tracking
    lot_no VARCHAR(50),
    serial_nos TEXT[],
    -- Inventory source
    warehouse_code VARCHAR(10),
    storage_location VARCHAR(20),
    -- Packing
    box_no INT,
    pallet_no INT,
    -- Weight/Volume
    weight NUMERIC(10,3),
    volume NUMERIC(10,3),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_shipment_line_shipment ON erp_shipment_line(shipment_id);
CREATE INDEX idx_erp_shipment_line_product ON erp_shipment_line(product_code);

-- ============================================================
-- 5. Sales Invoice Header (판매 매출)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_sales_invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_no VARCHAR(20) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'debit_note', 'credit_note', 'proforma')),
    invoice_date DATE NOT NULL,
    -- Source
    order_id UUID REFERENCES erp_sales_order(id),
    order_no VARCHAR(20),
    shipment_id UUID REFERENCES erp_shipment(id),
    shipment_no VARCHAR(20),
    -- Customer
    customer_code VARCHAR(20) NOT NULL,
    customer_name VARCHAR(200),
    bill_to_address TEXT,
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
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'written_off')),
    paid_amount NUMERIC(15,2) DEFAULT 0,
    paid_date DATE,
    -- Accounting
    ar_account_code VARCHAR(20),
    revenue_account_code VARCHAR(20),
    tax_account_code VARCHAR(20),
    cost_center_code VARCHAR(20),
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void', 'cancelled')),
    posted_date DATE,
    -- Tax invoice specific (Korea)
    tax_invoice_no VARCHAR(50),
    tax_invoice_date DATE,
    -- Notes
    notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    posted_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, invoice_no)
);

CREATE INDEX idx_erp_sales_inv_tenant_date ON erp_sales_invoice(tenant_id, invoice_date DESC);
CREATE INDEX idx_erp_sales_inv_customer ON erp_sales_invoice(customer_code, invoice_date DESC);
CREATE INDEX idx_erp_sales_inv_payment ON erp_sales_invoice(payment_status, payment_due_date) WHERE payment_status NOT IN ('paid', 'written_off');

-- ============================================================
-- 6. Sales Invoice Line (판매 매출 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS erp_sales_invoice_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES erp_sales_invoice(id) ON DELETE CASCADE,
    line_no INT NOT NULL,
    -- Source
    order_line_id UUID REFERENCES erp_sales_order_line(id),
    shipment_line_id UUID REFERENCES erp_shipment_line(id),
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    product_description TEXT,
    -- Quantity
    qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    -- Pricing
    unit_price NUMERIC(12,4) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    line_amount NUMERIC(15,2) NOT NULL,
    tax_rate NUMERIC(5,2) DEFAULT 10,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    -- Cost (for margin analysis)
    unit_cost NUMERIC(12,4),
    total_cost NUMERIC(15,2),
    -- Accounting
    revenue_account_code VARCHAR(20),
    cost_account_code VARCHAR(20),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_erp_sales_inv_line_invoice ON erp_sales_invoice_line(invoice_id);
CREATE INDEX idx_erp_sales_inv_line_product ON erp_sales_invoice_line(product_code);

-- ============================================================
-- 7. AR Aging View (매출채권 에이징)
-- ============================================================
CREATE OR REPLACE VIEW v_ar_aging AS
SELECT
    si.tenant_id,
    si.customer_code,
    cm.customer_name,
    si.invoice_no,
    si.invoice_date,
    si.payment_due_date,
    si.total_amount,
    si.paid_amount,
    si.total_amount - si.paid_amount AS outstanding_amount,
    CURRENT_DATE - si.payment_due_date AS days_overdue,
    CASE
        WHEN CURRENT_DATE <= si.payment_due_date THEN 'current'
        WHEN CURRENT_DATE - si.payment_due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - si.payment_due_date <= 60 THEN '31-60'
        WHEN CURRENT_DATE - si.payment_due_date <= 90 THEN '61-90'
        ELSE '90+'
    END AS aging_bucket,
    si.currency,
    si.payment_status
FROM erp_sales_invoice si
LEFT JOIN erp_customer_master cm ON cm.tenant_id = si.tenant_id AND cm.customer_code = si.customer_code
WHERE si.payment_status NOT IN ('paid', 'written_off', 'cancelled')
  AND si.status = 'posted';

-- ============================================================
-- 8. Sales Summary View (판매 요약)
-- ============================================================
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT
    so.tenant_id,
    DATE_TRUNC('month', so.order_date) AS order_month,
    so.customer_code,
    cm.customer_name,
    cm.customer_type,
    sol.product_code,
    mm.material_group AS product_group,
    COUNT(DISTINCT so.order_no) AS order_count,
    SUM(sol.order_qty) AS total_qty,
    SUM(sol.line_amount) AS total_amount,
    SUM(sol.shipped_qty) AS shipped_qty,
    AVG(sol.unit_price) AS avg_unit_price
FROM erp_sales_order so
JOIN erp_sales_order_line sol ON sol.order_id = so.id
LEFT JOIN erp_customer_master cm ON cm.tenant_id = so.tenant_id AND cm.customer_code = so.customer_code
LEFT JOIN erp_material_master mm ON mm.tenant_id = so.tenant_id AND mm.material_code = sol.product_code
WHERE so.status NOT IN ('draft', 'cancelled')
GROUP BY
    so.tenant_id,
    DATE_TRUNC('month', so.order_date),
    so.customer_code,
    cm.customer_name,
    cm.customer_type,
    sol.product_code,
    mm.material_group;

-- ============================================================
-- Triggers
-- ============================================================

-- Update sales order totals when lines change
CREATE OR REPLACE FUNCTION update_sales_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE erp_sales_order
    SET subtotal = (
            SELECT COALESCE(SUM(line_amount), 0)
            FROM erp_sales_order_line
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        tax_amount = (
            SELECT COALESCE(SUM(tax_amount), 0)
            FROM erp_sales_order_line
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(line_amount + tax_amount), 0)
            FROM erp_sales_order_line
            WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_so_totals
AFTER INSERT OR UPDATE OR DELETE ON erp_sales_order_line
FOR EACH ROW
EXECUTE FUNCTION update_sales_order_totals();

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE erp_sales_order IS '판매 주문 헤더 - 고객 수주 관리';
COMMENT ON TABLE erp_sales_order_line IS '판매 주문 상세 - 주문 품목별 상세';
COMMENT ON TABLE erp_shipment IS '출하 - 배송 관리';
COMMENT ON TABLE erp_sales_invoice IS '판매 매출 - 세금계산서/인보이스';
