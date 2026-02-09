-- ERP Quality Management Schema
-- 품질 관리 테이블

-- 1. 검사 LOT 마스터
CREATE TABLE IF NOT EXISTS erp_inspection_lot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    inspection_lot_no VARCHAR(30) NOT NULL,
    inspection_type VARCHAR(20) NOT NULL,  -- IQC (수입), PQC (공정), OQC (출하), FQC (최종)
    source_type VARCHAR(20) NOT NULL,  -- PO (입고), WO (작업지시), SO (출하)
    source_no VARCHAR(30),
    source_line_no INTEGER,
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    vendor_code VARCHAR(20),  -- IQC인 경우
    customer_code VARCHAR(20),  -- OQC인 경우
    inspection_date DATE NOT NULL,
    lot_qty DECIMAL(15, 4) NOT NULL,
    sample_size INTEGER NOT NULL,
    unit VARCHAR(10) NOT NULL,
    aql_code VARCHAR(10),  -- AQL 코드
    inspection_level VARCHAR(10),  -- I, II, III
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed
    result VARCHAR(10),  -- ACCEPT, REJECT, CONDITIONAL
    accept_qty DECIMAL(15, 4),
    reject_qty DECIMAL(15, 4),
    decision_code VARCHAR(20),  -- USE_AS_IS, RETURN, REWORK, SCRAP
    decision_datetime TIMESTAMPTZ,
    decision_by VARCHAR(20),
    decision_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, inspection_lot_no)
);

-- 2. 검사 결과
CREATE TABLE IF NOT EXISTS erp_inspection_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    inspection_lot_id UUID NOT NULL REFERENCES erp_inspection_lot(id),
    inspection_item VARCHAR(50) NOT NULL,  -- 검사 항목
    inspection_method VARCHAR(30),  -- 검사 방법
    spec_type VARCHAR(20),  -- measured (계량), attribute (계수)
    target_value DECIMAL(15, 6),
    spec_lower DECIMAL(15, 6),
    spec_upper DECIMAL(15, 6),
    unit VARCHAR(10),
    measured_value DECIMAL(15, 6),
    attribute_ok INTEGER,  -- 계수형 양품 수
    attribute_ng INTEGER,  -- 계수형 불량 수
    result VARCHAR(10) NOT NULL,  -- PASS, FAIL
    defect_code VARCHAR(20),
    inspector_code VARCHAR(20),
    inspection_datetime TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 불량 기록 (ERP 레벨)
CREATE TABLE IF NOT EXISTS erp_defect_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    defect_no VARCHAR(30) NOT NULL,
    defect_source VARCHAR(20) NOT NULL,  -- IQC, PQC, OQC, CUSTOMER
    inspection_lot_id UUID REFERENCES erp_inspection_lot(id),
    work_order_no VARCHAR(30),
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    defect_date DATE NOT NULL,
    defect_code VARCHAR(20) NOT NULL,
    defect_category VARCHAR(20),  -- 4M
    defect_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    severity VARCHAR(10),  -- critical, major, minor
    vendor_code VARCHAR(20),  -- 공급업체 귀책
    customer_code VARCHAR(20),  -- 고객 클레임
    cost_center_code VARCHAR(20),
    defect_cost DECIMAL(15, 2),  -- 불량 비용
    corrective_action_required BOOLEAN DEFAULT FALSE,
    corrective_action_no VARCHAR(30),
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, defect_no)
);

-- 4. 시정조치 요청 (CAR - Corrective Action Request)
CREATE TABLE IF NOT EXISTS erp_corrective_action (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    car_no VARCHAR(30) NOT NULL,
    car_type VARCHAR(20) NOT NULL,  -- INTERNAL, SUPPLIER, CUSTOMER
    defect_record_id UUID REFERENCES erp_defect_record(id),
    target_vendor_code VARCHAR(20),  -- 공급업체 대상
    target_department_code VARCHAR(20),  -- 내부 부서 대상
    issue_date DATE NOT NULL,
    issue_by VARCHAR(20),
    issue_description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    response_due_date DATE,
    response_date DATE,
    response_by VARCHAR(20),
    verification_date DATE,
    verification_by VARCHAR(20),
    verification_result VARCHAR(20),  -- EFFECTIVE, NOT_EFFECTIVE, PARTIAL
    status VARCHAR(20) DEFAULT 'issued',  -- issued, responded, verified, closed
    closed_date DATE,
    closed_by VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, car_no)
);

-- 5. 품질 비용 집계
CREATE TABLE IF NOT EXISTS erp_quality_cost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    cost_center_code VARCHAR(20),
    product_code VARCHAR(30),
    cost_category VARCHAR(20) NOT NULL,  -- prevention, appraisal, internal_failure, external_failure
    cost_type VARCHAR(30) NOT NULL,
    -- prevention: training, quality_planning, supplier_evaluation
    -- appraisal: inspection, testing, calibration
    -- internal_failure: scrap, rework, reinspection
    -- external_failure: returns, warranty, claim
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, period_year, period_month, cost_center_code, product_code, cost_category, cost_type)
);

-- 6. 공급업체 품질 평가
CREATE TABLE IF NOT EXISTS erp_vendor_quality_rating (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vendor_code VARCHAR(20) NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    total_receipt_lots INTEGER DEFAULT 0,
    accepted_lots INTEGER DEFAULT 0,
    rejected_lots INTEGER DEFAULT 0,
    total_receipt_qty DECIMAL(15, 4) DEFAULT 0,
    accepted_qty DECIMAL(15, 4) DEFAULT 0,
    rejected_qty DECIMAL(15, 4) DEFAULT 0,
    quality_score DECIMAL(5, 2),  -- 품질 점수 (0-100)
    delivery_score DECIMAL(5, 2),  -- 납기 점수 (0-100)
    service_score DECIMAL(5, 2),  -- 서비스 점수 (0-100)
    overall_rating VARCHAR(5),  -- A, B, C, D, F
    evaluated_at TIMESTAMPTZ,
    evaluated_by VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, vendor_code, period_year, period_month)
);

-- 인덱스
CREATE INDEX idx_erp_insp_lot_type ON erp_inspection_lot(inspection_type, inspection_date);
CREATE INDEX idx_erp_insp_lot_source ON erp_inspection_lot(source_type, source_no);
CREATE INDEX idx_erp_insp_lot_material ON erp_inspection_lot(material_code, lot_no);
CREATE INDEX idx_erp_insp_result_lot ON erp_inspection_result(inspection_lot_id);
CREATE INDEX idx_erp_defect_date ON erp_defect_record(defect_date, defect_code);
CREATE INDEX idx_erp_defect_vendor ON erp_defect_record(vendor_code, defect_date);
CREATE INDEX idx_erp_car_status ON erp_corrective_action(status, issue_date);
CREATE INDEX idx_erp_qcost_period ON erp_quality_cost(period_year, period_month, cost_category);
CREATE INDEX idx_erp_vendor_rating ON erp_vendor_quality_rating(vendor_code, period_year, period_month);

-- 수입검사 합격률 뷰
CREATE OR REPLACE VIEW v_iqc_acceptance_rate AS
SELECT
    il.tenant_id,
    DATE_TRUNC('month', il.inspection_date) as period_month,
    il.vendor_code,
    vm.vendor_name,
    COUNT(*) as total_lots,
    COUNT(*) FILTER (WHERE il.result = 'ACCEPT') as accepted_lots,
    COUNT(*) FILTER (WHERE il.result = 'REJECT') as rejected_lots,
    CASE WHEN COUNT(*) > 0
         THEN (COUNT(*) FILTER (WHERE il.result = 'ACCEPT')::DECIMAL / COUNT(*) * 100)
         ELSE 0 END as acceptance_rate
FROM erp_inspection_lot il
LEFT JOIN erp_vendor_master vm ON il.tenant_id = vm.tenant_id AND il.vendor_code = vm.vendor_code
WHERE il.inspection_type = 'IQC'
GROUP BY il.tenant_id, DATE_TRUNC('month', il.inspection_date), il.vendor_code, vm.vendor_name;

-- 불량 파레토 분석 뷰
CREATE OR REPLACE VIEW v_defect_pareto AS
SELECT
    dr.tenant_id,
    DATE_TRUNC('month', dr.defect_date) as period_month,
    dr.material_code,
    dr.defect_code,
    SUM(dr.defect_qty) as total_defect_qty,
    SUM(dr.defect_cost) as total_defect_cost,
    SUM(SUM(dr.defect_qty)) OVER (
        PARTITION BY dr.tenant_id, DATE_TRUNC('month', dr.defect_date), dr.material_code
        ORDER BY SUM(dr.defect_qty) DESC
    ) as cumulative_qty
FROM erp_defect_record dr
GROUP BY dr.tenant_id, DATE_TRUNC('month', dr.defect_date), dr.material_code, dr.defect_code;

-- 품질 비용 요약 뷰
CREATE OR REPLACE VIEW v_quality_cost_summary AS
SELECT
    tenant_id,
    period_year,
    period_month,
    cost_category,
    SUM(amount) as total_amount,
    SUM(SUM(amount)) OVER (PARTITION BY tenant_id, period_year, period_month) as period_total,
    CASE WHEN SUM(SUM(amount)) OVER (PARTITION BY tenant_id, period_year, period_month) > 0
         THEN (SUM(amount) / SUM(SUM(amount)) OVER (PARTITION BY tenant_id, period_year, period_month) * 100)
         ELSE 0 END as category_pct
FROM erp_quality_cost
GROUP BY tenant_id, period_year, period_month, cost_category;
