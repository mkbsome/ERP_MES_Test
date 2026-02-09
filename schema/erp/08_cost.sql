-- ERP Cost Management Schema
-- 원가 관리 테이블

-- 1. 표준 원가 (제품별)
CREATE TABLE IF NOT EXISTS erp_standard_cost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    material_code VARCHAR(30) NOT NULL,
    cost_version VARCHAR(20) NOT NULL,  -- 2024-H1, 2024-H2
    valid_from DATE NOT NULL,
    valid_to DATE,
    cost_type VARCHAR(20) NOT NULL,  -- material, labor, overhead, total
    cost_element VARCHAR(30),  -- 세부 비용 요소
    amount DECIMAL(15, 4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    unit VARCHAR(10) DEFAULT 'EA',
    qty_base DECIMAL(15, 4) DEFAULT 1,  -- 기준 수량
    created_by VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, material_code, cost_version, cost_type, cost_element)
);

-- 2. 원가 요소 마스터
CREATE TABLE IF NOT EXISTS erp_cost_element (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    element_code VARCHAR(20) NOT NULL,
    element_name VARCHAR(50) NOT NULL,
    element_type VARCHAR(20) NOT NULL,  -- material, labor, overhead, subcontract
    element_category VARCHAR(30),  -- direct, indirect, fixed, variable
    gl_account VARCHAR(20),  -- 계정과목 연결
    allocation_method VARCHAR(20),  -- direct, by_hour, by_qty, by_cost
    rate_per_hour DECIMAL(15, 4),  -- 시간당 배부율
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, element_code)
);

-- 3. 실제 원가 집계 (작업지시별)
CREATE TABLE IF NOT EXISTS erp_actual_cost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_no VARCHAR(30) NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    cost_date DATE NOT NULL,
    production_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) DEFAULT 'EA',
    -- 재료비
    material_cost_standard DECIMAL(15, 2),
    material_cost_actual DECIMAL(15, 2),
    material_variance DECIMAL(15, 2),
    -- 노무비
    labor_cost_standard DECIMAL(15, 2),
    labor_cost_actual DECIMAL(15, 2),
    labor_variance DECIMAL(15, 2),
    labor_hours_standard DECIMAL(10, 2),
    labor_hours_actual DECIMAL(10, 2),
    -- 경비 (제조간접비)
    overhead_cost_standard DECIMAL(15, 2),
    overhead_cost_actual DECIMAL(15, 2),
    overhead_variance DECIMAL(15, 2),
    -- 외주가공비
    subcontract_cost DECIMAL(15, 2),
    -- 합계
    total_cost_standard DECIMAL(15, 2),
    total_cost_actual DECIMAL(15, 2),
    total_variance DECIMAL(15, 2),
    unit_cost_actual DECIMAL(15, 4),  -- 단위당 실제원가
    status VARCHAR(20) DEFAULT 'calculated',  -- calculated, posted, closed
    calculated_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, work_order_no, cost_date)
);

-- 4. 원가 차이 분석
CREATE TABLE IF NOT EXISTS erp_cost_variance_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    cost_center_code VARCHAR(20),
    material_code VARCHAR(30),
    variance_type VARCHAR(30) NOT NULL,
    -- material_price: 재료비 가격차이
    -- material_usage: 재료비 수량차이
    -- labor_rate: 노무비 임률차이
    -- labor_efficiency: 노무비 능률차이
    -- overhead_spending: 경비 예산차이
    -- overhead_volume: 경비 조업도차이
    standard_amount DECIMAL(15, 2),
    actual_amount DECIMAL(15, 2),
    variance_amount DECIMAL(15, 2),
    variance_pct DECIMAL(8, 4),
    favorable BOOLEAN,  -- true=유리, false=불리
    analysis_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 월별 원가 마감
CREATE TABLE IF NOT EXISTS erp_cost_closing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    closing_type VARCHAR(20) NOT NULL,  -- material, labor, overhead, all
    status VARCHAR(20) DEFAULT 'open',  -- open, processing, closed
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by VARCHAR(20),
    total_production_qty DECIMAL(15, 4),
    total_material_cost DECIMAL(15, 2),
    total_labor_cost DECIMAL(15, 2),
    total_overhead_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, period_year, period_month, closing_type)
);

-- 6. 제조간접비 배부 기준
CREATE TABLE IF NOT EXISTS erp_overhead_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    allocation_code VARCHAR(20) NOT NULL,
    allocation_name VARCHAR(50) NOT NULL,
    cost_center_code VARCHAR(20) NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    allocation_base VARCHAR(20) NOT NULL,  -- machine_hour, labor_hour, production_qty, material_cost
    budget_amount DECIMAL(15, 2),
    actual_amount DECIMAL(15, 2),
    allocation_rate DECIMAL(15, 6),  -- 배부율
    total_base_qty DECIMAL(15, 4),  -- 총 배부 기준량
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, allocation_code, period_year, period_month)
);

-- 7. 재공품 원가
CREATE TABLE IF NOT EXISTS erp_wip_cost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    work_order_no VARCHAR(30) NOT NULL,
    valuation_date DATE NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    wip_qty DECIMAL(15, 4) NOT NULL,
    completion_pct DECIMAL(5, 2),  -- 완성도 (%)
    unit VARCHAR(10) DEFAULT 'EA',
    material_cost DECIMAL(15, 2),
    labor_cost DECIMAL(15, 2),
    overhead_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    unit_cost DECIMAL(15, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, work_order_no, valuation_date)
);

-- 8. 제품별 원가 이력
CREATE TABLE IF NOT EXISTS erp_product_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    material_code VARCHAR(30) NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    production_qty DECIMAL(15, 4),
    -- 표준원가
    std_material_cost DECIMAL(15, 4),
    std_labor_cost DECIMAL(15, 4),
    std_overhead_cost DECIMAL(15, 4),
    std_total_cost DECIMAL(15, 4),
    -- 실제원가
    act_material_cost DECIMAL(15, 4),
    act_labor_cost DECIMAL(15, 4),
    act_overhead_cost DECIMAL(15, 4),
    act_total_cost DECIMAL(15, 4),
    -- 차이
    variance_material DECIMAL(15, 4),
    variance_labor DECIMAL(15, 4),
    variance_overhead DECIMAL(15, 4),
    variance_total DECIMAL(15, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, material_code, period_year, period_month)
);

-- 인덱스
CREATE INDEX idx_erp_std_cost_material ON erp_standard_cost(material_code, valid_from);
CREATE INDEX idx_erp_act_cost_wo ON erp_actual_cost(work_order_no, cost_date);
CREATE INDEX idx_erp_act_cost_material ON erp_actual_cost(material_code, cost_date);
CREATE INDEX idx_erp_variance_period ON erp_cost_variance_analysis(period_year, period_month);
CREATE INDEX idx_erp_closing_period ON erp_cost_closing(period_year, period_month);
CREATE INDEX idx_erp_wip_cost_wo ON erp_wip_cost(work_order_no);
CREATE INDEX idx_erp_product_cost_period ON erp_product_cost_history(period_year, period_month);

-- 제품별 원가 구성 뷰
CREATE OR REPLACE VIEW v_product_cost_breakdown AS
SELECT
    sc.tenant_id,
    sc.material_code,
    mm.name as material_name,
    sc.cost_version,
    SUM(CASE WHEN sc.cost_type = 'material' THEN sc.amount ELSE 0 END) as material_cost,
    SUM(CASE WHEN sc.cost_type = 'labor' THEN sc.amount ELSE 0 END) as labor_cost,
    SUM(CASE WHEN sc.cost_type = 'overhead' THEN sc.amount ELSE 0 END) as overhead_cost,
    SUM(sc.amount) as total_cost,
    SUM(CASE WHEN sc.cost_type = 'material' THEN sc.amount ELSE 0 END) /
        NULLIF(SUM(sc.amount), 0) * 100 as material_pct,
    SUM(CASE WHEN sc.cost_type = 'labor' THEN sc.amount ELSE 0 END) /
        NULLIF(SUM(sc.amount), 0) * 100 as labor_pct,
    SUM(CASE WHEN sc.cost_type = 'overhead' THEN sc.amount ELSE 0 END) /
        NULLIF(SUM(sc.amount), 0) * 100 as overhead_pct
FROM erp_standard_cost sc
LEFT JOIN erp_material_master mm ON sc.tenant_id = mm.tenant_id AND sc.material_code = mm.material_code
WHERE sc.valid_to IS NULL OR sc.valid_to >= CURRENT_DATE
GROUP BY sc.tenant_id, sc.material_code, mm.name, sc.cost_version;

-- 원가 차이 요약 뷰
CREATE OR REPLACE VIEW v_cost_variance_summary AS
SELECT
    ac.tenant_id,
    DATE_TRUNC('month', ac.cost_date) as period_month,
    ac.material_code,
    SUM(ac.production_qty) as total_qty,
    SUM(ac.total_cost_standard) as total_std_cost,
    SUM(ac.total_cost_actual) as total_act_cost,
    SUM(ac.total_variance) as total_variance,
    SUM(ac.material_variance) as material_variance,
    SUM(ac.labor_variance) as labor_variance,
    SUM(ac.overhead_variance) as overhead_variance,
    CASE WHEN SUM(ac.total_cost_standard) > 0
         THEN (SUM(ac.total_variance) / SUM(ac.total_cost_standard) * 100)
         ELSE 0 END as variance_pct
FROM erp_actual_cost ac
GROUP BY ac.tenant_id, DATE_TRUNC('month', ac.cost_date), ac.material_code;

-- 월별 제조원가 현황 뷰
CREATE OR REPLACE VIEW v_monthly_manufacturing_cost AS
SELECT
    cc.tenant_id,
    cc.period_year,
    cc.period_month,
    cc.total_production_qty,
    cc.total_material_cost,
    cc.total_labor_cost,
    cc.total_overhead_cost,
    cc.total_cost,
    CASE WHEN cc.total_production_qty > 0
         THEN cc.total_cost / cc.total_production_qty
         ELSE 0 END as avg_unit_cost,
    cc.total_material_cost / NULLIF(cc.total_cost, 0) * 100 as material_pct,
    cc.total_labor_cost / NULLIF(cc.total_cost, 0) * 100 as labor_pct,
    cc.total_overhead_cost / NULLIF(cc.total_cost, 0) * 100 as overhead_pct
FROM erp_cost_closing cc
WHERE cc.closing_type = 'all' AND cc.status = 'closed';
