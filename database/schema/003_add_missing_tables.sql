-- ============================================================
-- 누락 테이블 추가 스크립트
-- Version: 1.0.1
-- 검증 결과 기반 보완
-- ============================================================

-- ============================================================
-- 1. MES 기준정보 테이블 추가
-- ============================================================

-- 1.1 코드그룹
CREATE TABLE IF NOT EXISTS mes_code_group (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    group_code VARCHAR(50) NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, group_code)
);

-- 1.2 공통코드
CREATE TABLE IF NOT EXISTS mes_common_code (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    group_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    code_name VARCHAR(200) NOT NULL,
    code_name_en VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    extra_value1 VARCHAR(200),
    extra_value2 VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, group_code, code)
);

-- 1.3 작업자
CREATE TABLE IF NOT EXISTS mes_worker (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    worker_id VARCHAR(50) NOT NULL,
    worker_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50),
    line_code VARCHAR(50),
    position VARCHAR(50),
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    hire_date DATE,
    certification TEXT[],
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, worker_id)
);

-- 1.4 검사항목
CREATE TABLE IF NOT EXISTS mes_inspection_item (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    inspection_type VARCHAR(20) CHECK (inspection_type IN ('incoming', 'process', 'final', 'shipment')),
    check_method VARCHAR(100),
    spec_type VARCHAR(20) CHECK (spec_type IN ('numeric', 'visual', 'functional', 'dimensional')),
    usl NUMERIC(15,6),
    lsl NUMERIC(15,6),
    target_value NUMERIC(15,6),
    uom VARCHAR(20),
    sampling_method VARCHAR(50),
    sample_size INTEGER,
    is_critical BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, item_code)
);

-- ============================================================
-- 2. 품질 클레임 테이블 추가
-- ============================================================

CREATE TABLE IF NOT EXISTS mes_claim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    claim_no VARCHAR(50) NOT NULL,
    claim_date DATE NOT NULL,
    claim_type VARCHAR(20) CHECK (claim_type IN ('customer', 'internal', 'supplier')),
    customer_code VARCHAR(50),
    customer_name VARCHAR(200),
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    lot_no VARCHAR(50),
    defect_qty INTEGER,
    claim_description TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    responsible_dept VARCHAR(50),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'rejected')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    closed_date DATE,
    claim_cost NUMERIC(15,2),
    attachments JSONB,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, claim_no)
);

-- ============================================================
-- 3. 작업자 이력 테이블 추가
-- ============================================================

CREATE TABLE IF NOT EXISTS mes_worker_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    worker_id VARCHAR(50) NOT NULL,
    worker_name VARCHAR(100),
    work_date DATE NOT NULL,
    shift VARCHAR(10),
    line_code VARCHAR(50),
    equipment_code VARCHAR(50),
    production_order_no VARCHAR(50),
    product_code VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    work_hours NUMERIC(5,2),
    produced_qty NUMERIC(12,3) DEFAULT 0,
    good_qty NUMERIC(12,3) DEFAULT 0,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    productivity NUMERIC(5,2),
    quality_rate NUMERIC(5,2),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. 공정 마스터 테이블 추가
-- ============================================================

CREATE TABLE IF NOT EXISTS mes_process (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    process_code VARCHAR(50) NOT NULL,
    process_name VARCHAR(200) NOT NULL,
    process_type VARCHAR(50),
    line_code VARCHAR(50),
    sequence INTEGER,
    standard_time_min NUMERIC(8,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, process_code)
);

-- ============================================================
-- 5. 공장 마스터 테이블 추가
-- ============================================================

CREATE TABLE IF NOT EXISTS mes_factory (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    factory_code VARCHAR(50) NOT NULL,
    factory_name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, factory_code)
);

-- ============================================================
-- 6. 인덱스 추가
-- ============================================================

-- MES 기준정보
CREATE INDEX IF NOT EXISTS idx_mes_code_group_tenant ON mes_code_group(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mes_common_code_tenant_group ON mes_common_code(tenant_id, group_code);
CREATE INDEX IF NOT EXISTS idx_mes_worker_tenant ON mes_worker(tenant_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_mes_worker_line ON mes_worker(line_code);
CREATE INDEX IF NOT EXISTS idx_mes_inspection_item_tenant ON mes_inspection_item(tenant_id, item_code);
CREATE INDEX IF NOT EXISTS idx_mes_inspection_item_type ON mes_inspection_item(inspection_type);

-- 클레임
CREATE INDEX IF NOT EXISTS idx_mes_claim_tenant_status ON mes_claim(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_mes_claim_customer ON mes_claim(customer_code);
CREATE INDEX IF NOT EXISTS idx_mes_claim_date ON mes_claim(claim_date);
CREATE INDEX IF NOT EXISTS idx_mes_claim_product ON mes_claim(product_code);

-- 작업자 이력
CREATE INDEX IF NOT EXISTS idx_mes_worker_history_worker ON mes_worker_history(worker_id);
CREATE INDEX IF NOT EXISTS idx_mes_worker_history_date ON mes_worker_history(work_date);
CREATE INDEX IF NOT EXISTS idx_mes_worker_history_line ON mes_worker_history(line_code);

-- 공정/공장
CREATE INDEX IF NOT EXISTS idx_mes_process_tenant ON mes_process(tenant_id, process_code);
CREATE INDEX IF NOT EXISTS idx_mes_factory_tenant ON mes_factory(tenant_id, factory_code);

-- ============================================================
-- 7. 트리거 추가
-- ============================================================

CREATE TRIGGER update_mes_code_group_timestamp
    BEFORE UPDATE ON mes_code_group
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mes_common_code_timestamp
    BEFORE UPDATE ON mes_common_code
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mes_worker_timestamp
    BEFORE UPDATE ON mes_worker
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mes_inspection_item_timestamp
    BEFORE UPDATE ON mes_inspection_item
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mes_claim_timestamp
    BEFORE UPDATE ON mes_claim
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_mes_process_timestamp
    BEFORE UPDATE ON mes_process
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 8. 초기 데이터
-- ============================================================

DO $$
DECLARE
    v_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN

-- 코드그룹
INSERT INTO mes_code_group (tenant_id, group_code, group_name, is_system) VALUES
(v_tenant_id, 'DEFECT_TYPE', '불량유형', TRUE),
(v_tenant_id, 'DOWNTIME_TYPE', '비가동유형', TRUE),
(v_tenant_id, 'EQUIPMENT_STATUS', '설비상태', TRUE),
(v_tenant_id, 'INSPECTION_RESULT', '검사결과', TRUE),
(v_tenant_id, 'SHIFT', '근무조', TRUE),
(v_tenant_id, 'SKILL_LEVEL', '숙련도', TRUE),
(v_tenant_id, 'CLAIM_TYPE', '클레임유형', TRUE),
(v_tenant_id, 'CLAIM_STATUS', '클레임상태', TRUE)
ON CONFLICT DO NOTHING;

-- 공통코드 - 근무조
INSERT INTO mes_common_code (tenant_id, group_code, code, code_name, sort_order) VALUES
(v_tenant_id, 'SHIFT', 'DAY', '주간', 1),
(v_tenant_id, 'SHIFT', 'NIGHT', '야간', 2),
(v_tenant_id, 'SHIFT', 'MID', '중간', 3)
ON CONFLICT DO NOTHING;

-- 공통코드 - 설비상태
INSERT INTO mes_common_code (tenant_id, group_code, code, code_name, sort_order) VALUES
(v_tenant_id, 'EQUIPMENT_STATUS', 'RUNNING', '가동중', 1),
(v_tenant_id, 'EQUIPMENT_STATUS', 'IDLE', '대기', 2),
(v_tenant_id, 'EQUIPMENT_STATUS', 'SETUP', '셋업', 3),
(v_tenant_id, 'EQUIPMENT_STATUS', 'BREAKDOWN', '고장', 4),
(v_tenant_id, 'EQUIPMENT_STATUS', 'MAINTENANCE', '보전', 5),
(v_tenant_id, 'EQUIPMENT_STATUS', 'OFF', '정지', 6)
ON CONFLICT DO NOTHING;

-- 공통코드 - 검사결과
INSERT INTO mes_common_code (tenant_id, group_code, code, code_name, sort_order) VALUES
(v_tenant_id, 'INSPECTION_RESULT', 'PASS', '합격', 1),
(v_tenant_id, 'INSPECTION_RESULT', 'FAIL', '불합격', 2),
(v_tenant_id, 'INSPECTION_RESULT', 'CONDITIONAL', '조건부합격', 3),
(v_tenant_id, 'INSPECTION_RESULT', 'PENDING', '검사중', 4)
ON CONFLICT DO NOTHING;

-- 공장
INSERT INTO mes_factory (tenant_id, factory_code, factory_name, address) VALUES
(v_tenant_id, 'F01', '본사 공장', '경기도 화성시 삼성전자로 1')
ON CONFLICT DO NOTHING;

-- 공정
INSERT INTO mes_process (tenant_id, process_code, process_name, process_type, sequence, standard_time_min) VALUES
(v_tenant_id, 'PROC-SMT', 'SMT 실장', 'SMT', 1, 5.0),
(v_tenant_id, 'PROC-SPI', 'SPI 검사', 'INSPECTION', 2, 1.0),
(v_tenant_id, 'PROC-REFLOW', '리플로우', 'SMT', 3, 3.0),
(v_tenant_id, 'PROC-AOI', 'AOI 검사', 'INSPECTION', 4, 1.5),
(v_tenant_id, 'PROC-DIP', 'DIP 삽입', 'DIP', 5, 8.0),
(v_tenant_id, 'PROC-WAVE', '웨이브 솔더링', 'DIP', 6, 4.0),
(v_tenant_id, 'PROC-ICT', 'ICT 검사', 'TEST', 7, 2.0),
(v_tenant_id, 'PROC-FCT', 'FCT 검사', 'TEST', 8, 5.0),
(v_tenant_id, 'PROC-ASSY', '조립', 'ASSY', 9, 10.0),
(v_tenant_id, 'PROC-PACK', '포장', 'PACK', 10, 3.0)
ON CONFLICT DO NOTHING;

-- 검사항목
INSERT INTO mes_inspection_item (tenant_id, item_code, item_name, inspection_type, spec_type, usl, lsl, target_value, uom) VALUES
(v_tenant_id, 'INS-SOL-HEIGHT', '솔더 높이', 'process', 'numeric', 0.5, 0.1, 0.3, 'mm'),
(v_tenant_id, 'INS-SOL-VOLUME', '솔더 볼륨', 'process', 'numeric', 120, 80, 100, '%'),
(v_tenant_id, 'INS-SOL-AREA', '솔더 면적', 'process', 'numeric', 110, 90, 100, '%'),
(v_tenant_id, 'INS-COMP-OFFSET', '부품 오프셋', 'process', 'numeric', 0.15, -0.15, 0, 'mm'),
(v_tenant_id, 'INS-VISUAL', '외관 검사', 'final', 'visual', NULL, NULL, NULL, NULL),
(v_tenant_id, 'INS-FUNC-POWER', '전원 테스트', 'final', 'functional', NULL, NULL, NULL, NULL),
(v_tenant_id, 'INS-FUNC-COMM', '통신 테스트', 'final', 'functional', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 샘플 작업자
INSERT INTO mes_worker (tenant_id, worker_id, worker_name, department_code, line_code, position, skill_level) VALUES
(v_tenant_id, 'WK-001', '김생산', 'DEPT-PROD-SMT', 'SMT-L01', 'operator', 'advanced'),
(v_tenant_id, 'WK-002', '이품질', 'DEPT-QC', 'SMT-L01', 'inspector', 'expert'),
(v_tenant_id, 'WK-003', '박조립', 'DEPT-PROD-ASSY', 'ASSY-L01', 'operator', 'intermediate'),
(v_tenant_id, 'WK-004', '최설비', 'DEPT-PROD', NULL, 'technician', 'expert'),
(v_tenant_id, 'WK-005', '정라인', 'DEPT-PROD-SMT', 'SMT-L02', 'leader', 'expert')
ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- 완료
-- ============================================================

COMMENT ON TABLE mes_code_group IS 'MES 코드그룹 - 공통코드 분류';
COMMENT ON TABLE mes_common_code IS 'MES 공통코드 - 시스템 공통코드';
COMMENT ON TABLE mes_worker IS 'MES 작업자 마스터';
COMMENT ON TABLE mes_inspection_item IS 'MES 검사항목 마스터';
COMMENT ON TABLE mes_claim IS 'MES 품질 클레임';
COMMENT ON TABLE mes_worker_history IS 'MES 작업자 이력';
COMMENT ON TABLE mes_process IS 'MES 공정 마스터';
COMMENT ON TABLE mes_factory IS 'MES 공장 마스터';
