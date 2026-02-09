-- MES Quality Management Schema
-- 품질 관리 테이블

-- 1. 품질 검사 결과 (공정검사)
CREATE TABLE IF NOT EXISTS mes_inspection_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    inspection_no VARCHAR(30) NOT NULL,
    inspection_type VARCHAR(20) NOT NULL,  -- SPI, AOI, AXI, MANUAL, ICT, FCT
    production_order_id UUID REFERENCES mes_production_order(id),
    lot_no VARCHAR(30) NOT NULL,
    board_id VARCHAR(50),  -- 개별 보드 ID (바코드)
    product_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20),
    equipment_id UUID REFERENCES mes_equipment_master(id),
    operation_no INTEGER,
    inspection_datetime TIMESTAMPTZ NOT NULL,
    shift VARCHAR(5),
    inspector_code VARCHAR(20),
    result VARCHAR(10) NOT NULL,  -- PASS, FAIL, REWORK
    total_inspected INTEGER DEFAULT 1,
    pass_qty INTEGER DEFAULT 0,
    fail_qty INTEGER DEFAULT 0,
    defect_points JSONB,  -- [{"location": "R101", "defect_code": "BRIDGE", "x": 10.5, "y": 20.3}]
    inspection_time_sec DECIMAL(10, 2),
    rework_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (inspection_datetime);

-- 파티션 생성 (월별)
CREATE TABLE mes_inspection_result_2024_07 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_inspection_result_2024_08 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_inspection_result_2024_09 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_inspection_result_2024_10 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_inspection_result_2024_11 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_inspection_result_2024_12 PARTITION OF mes_inspection_result
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 2. SPC 데이터 (통계적 공정 관리)
CREATE TABLE IF NOT EXISTS mes_spc_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    spc_no VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    equipment_id UUID REFERENCES mes_equipment_master(id),
    product_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    measurement_type VARCHAR(30) NOT NULL,  -- SOLDER_VOLUME, SOLDER_HEIGHT, COMPONENT_OFFSET
    measurement_datetime TIMESTAMPTZ NOT NULL,
    sample_size INTEGER DEFAULT 1,
    measured_value DECIMAL(15, 6) NOT NULL,
    unit VARCHAR(10),
    spec_lower DECIMAL(15, 6),  -- LSL
    spec_upper DECIMAL(15, 6),  -- USL
    target_value DECIMAL(15, 6),
    control_lower DECIMAL(15, 6),  -- LCL
    control_upper DECIMAL(15, 6),  -- UCL
    cpk_value DECIMAL(8, 4),
    out_of_spec BOOLEAN DEFAULT FALSE,
    out_of_control BOOLEAN DEFAULT FALSE,
    shift VARCHAR(5),
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (measurement_datetime);

-- 파티션 생성 (월별)
CREATE TABLE mes_spc_data_2024_07 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_spc_data_2024_08 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_spc_data_2024_09 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_spc_data_2024_10 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_spc_data_2024_11 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_spc_data_2024_12 PARTITION OF mes_spc_data
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 3. 불량 유형 마스터
CREATE TABLE IF NOT EXISTS mes_defect_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    defect_code VARCHAR(20) NOT NULL,
    defect_name VARCHAR(50) NOT NULL,
    defect_name_en VARCHAR(50),
    defect_category VARCHAR(20) NOT NULL,  -- solder, component, mechanical
    severity VARCHAR(10) NOT NULL,  -- critical, major, minor
    detection_methods JSONB,  -- ["aoi", "visual", "ict"]
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, defect_code)
);

-- 4. 불량 분석 기록
CREATE TABLE IF NOT EXISTS mes_defect_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    analysis_no VARCHAR(30) NOT NULL,
    defect_detail_id UUID REFERENCES mes_defect_detail(id),
    lot_no VARCHAR(30),
    product_code VARCHAR(30),
    line_code VARCHAR(20),
    equipment_code VARCHAR(30),
    defect_code VARCHAR(20),
    analysis_datetime TIMESTAMPTZ NOT NULL,
    analyst_code VARCHAR(20),
    -- 5 Why 분석
    why_1 TEXT,
    why_2 TEXT,
    why_3 TEXT,
    why_4 TEXT,
    why_5 TEXT,
    root_cause TEXT,
    root_cause_category VARCHAR(30),  -- 4M: Man, Machine, Material, Method
    corrective_action TEXT,
    preventive_action TEXT,
    verification_result TEXT,
    status VARCHAR(20) DEFAULT 'open',  -- open, in_progress, closed
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 재작업(Rework) 기록
CREATE TABLE IF NOT EXISTS mes_rework_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    rework_no VARCHAR(30) NOT NULL,
    inspection_result_id UUID REFERENCES mes_inspection_result(id),
    defect_detail_id UUID REFERENCES mes_defect_detail(id),
    lot_no VARCHAR(30) NOT NULL,
    board_id VARCHAR(50),
    product_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20),
    rework_datetime TIMESTAMPTZ NOT NULL,
    rework_type VARCHAR(20) NOT NULL,  -- RESOLDERING, COMPONENT_REPLACE, BOARD_SCRAP
    defect_code VARCHAR(20),
    defect_location VARCHAR(50),
    operator_code VARCHAR(20),
    rework_time_minutes INTEGER,
    result VARCHAR(10),  -- PASS, FAIL
    verification_result VARCHAR(10),
    parts_used JSONB,  -- 교체 부품
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (rework_datetime);

-- 파티션 생성 (월별)
CREATE TABLE mes_rework_record_2024_07 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_rework_record_2024_08 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_rework_record_2024_09 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_rework_record_2024_10 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_rework_record_2024_11 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_rework_record_2024_12 PARTITION OF mes_rework_record
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 6. 품질 Hold 관리
CREATE TABLE IF NOT EXISTS mes_quality_hold (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    hold_no VARCHAR(30) NOT NULL,
    hold_type VARCHAR(20) NOT NULL,  -- QUALITY_ISSUE, CUSTOMER_COMPLAINT, PROCESS_DEVIATION
    lot_no VARCHAR(30),
    product_code VARCHAR(30),
    quantity INTEGER,
    unit VARCHAR(10),
    hold_reason TEXT NOT NULL,
    hold_datetime TIMESTAMPTZ NOT NULL,
    hold_by VARCHAR(20),
    location VARCHAR(30),  -- warehouse/location
    release_decision VARCHAR(20),  -- RELEASE, REWORK, SCRAP, RTV (Return to Vendor)
    release_datetime TIMESTAMPTZ,
    release_by VARCHAR(20),
    release_reason TEXT,
    status VARCHAR(20) DEFAULT 'on_hold',  -- on_hold, released, scrapped
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mes_inspection_lot ON mes_inspection_result(lot_no, inspection_datetime);
CREATE INDEX idx_mes_inspection_product ON mes_inspection_result(product_code, inspection_datetime);
CREATE INDEX idx_mes_inspection_type ON mes_inspection_result(inspection_type, result);
CREATE INDEX idx_mes_spc_product ON mes_spc_data(product_code, measurement_type, measurement_datetime);
CREATE INDEX idx_mes_spc_equipment ON mes_spc_data(equipment_id, measurement_datetime);
CREATE INDEX idx_mes_defect_analysis_lot ON mes_defect_analysis(lot_no, defect_code);
CREATE INDEX idx_mes_rework_lot ON mes_rework_record(lot_no, rework_datetime);
CREATE INDEX idx_mes_hold_status ON mes_quality_hold(status, hold_datetime);

-- 불량률 집계 뷰
CREATE OR REPLACE VIEW v_defect_rate_summary AS
SELECT
    dd.tenant_id,
    DATE(dd.detection_datetime) as defect_date,
    dd.product_code,
    dd.line_code,
    dd.defect_code,
    dt.defect_name,
    dt.defect_category,
    dt.severity,
    COUNT(*) as defect_count,
    SUM(dd.defect_qty) as total_defect_qty
FROM mes_defect_detail dd
JOIN mes_defect_type dt ON dd.tenant_id = dt.tenant_id AND dd.defect_code = dt.defect_code
GROUP BY dd.tenant_id, DATE(dd.detection_datetime), dd.product_code, dd.line_code,
         dd.defect_code, dt.defect_name, dt.defect_category, dt.severity;

-- SPC 분석 뷰
CREATE OR REPLACE VIEW v_spc_summary AS
SELECT
    tenant_id,
    DATE(measurement_datetime) as measurement_date,
    line_code,
    product_code,
    measurement_type,
    COUNT(*) as sample_count,
    AVG(measured_value) as avg_value,
    STDDEV(measured_value) as std_dev,
    MIN(measured_value) as min_value,
    MAX(measured_value) as max_value,
    AVG(spec_lower) as spec_lower,
    AVG(spec_upper) as spec_upper,
    COUNT(*) FILTER (WHERE out_of_spec = TRUE) as oos_count,
    COUNT(*) FILTER (WHERE out_of_control = TRUE) as ooc_count,
    AVG(cpk_value) as avg_cpk
FROM mes_spc_data
GROUP BY tenant_id, DATE(measurement_datetime), line_code, product_code, measurement_type;

-- 일별 품질 요약 뷰
CREATE OR REPLACE VIEW v_daily_quality_summary AS
SELECT
    ir.tenant_id,
    DATE(ir.inspection_datetime) as inspection_date,
    ir.line_code,
    ir.product_code,
    ir.inspection_type,
    SUM(ir.total_inspected) as total_inspected,
    SUM(ir.pass_qty) as total_pass,
    SUM(ir.fail_qty) as total_fail,
    CASE WHEN SUM(ir.total_inspected) > 0
         THEN (SUM(ir.pass_qty)::DECIMAL / SUM(ir.total_inspected) * 100)
         ELSE 0 END as pass_rate,
    CASE WHEN SUM(ir.total_inspected) > 0
         THEN (SUM(ir.fail_qty)::DECIMAL / SUM(ir.total_inspected) * 100)
         ELSE 0 END as defect_rate
FROM mes_inspection_result ir
GROUP BY ir.tenant_id, DATE(ir.inspection_datetime), ir.line_code, ir.product_code, ir.inspection_type;
