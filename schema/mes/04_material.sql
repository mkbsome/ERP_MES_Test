-- MES Material Management Schema
-- 자재 관리 테이블 (SMT 라인 특화)

-- 1. 작업자 마스터
CREATE TABLE IF NOT EXISTS mes_operator (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    operator_code VARCHAR(20) NOT NULL,
    operator_name VARCHAR(50) NOT NULL,
    department_code VARCHAR(20),
    default_shift VARCHAR(5),  -- 1, 2, 3
    role VARCHAR(20),  -- operator, leader, technician, engineer, inspector
    skill_level VARCHAR(20),  -- trainee, basic, intermediate, advanced, expert
    hire_date DATE,
    certified_lines JSONB,  -- 자격 보유 라인 목록
    certified_equipment JSONB,  -- 자격 보유 설비 목록
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, operator_code)
);

-- 2. 피더 셋업 관리 (SMT 마운터용)
CREATE TABLE IF NOT EXISTS mes_feeder_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    setup_no VARCHAR(30) NOT NULL,
    equipment_id UUID NOT NULL REFERENCES mes_equipment_master(id),
    line_code VARCHAR(20) NOT NULL,
    product_code VARCHAR(30) NOT NULL,
    production_order_id UUID REFERENCES mes_production_order(id),
    setup_datetime TIMESTAMPTZ NOT NULL,
    slot_no INTEGER NOT NULL,  -- 피더 슬롯 번호
    feeder_id VARCHAR(30),  -- 피더 ID
    feeder_type VARCHAR(20),  -- tape_8mm, tape_12mm, tape_16mm, tray, tube
    material_code VARCHAR(30) NOT NULL,
    reel_id VARCHAR(30),  -- 릴 바코드
    lot_no VARCHAR(30),
    initial_qty INTEGER,
    current_qty INTEGER,
    pickup_count INTEGER DEFAULT 0,
    reject_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',  -- active, empty, paused, error
    verified_by VARCHAR(20),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 자재 투입 기록
CREATE TABLE IF NOT EXISTS mes_material_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    consumption_no VARCHAR(30) NOT NULL,
    production_order_id UUID NOT NULL REFERENCES mes_production_order(id),
    lot_no VARCHAR(30) NOT NULL,
    product_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    reel_id VARCHAR(30),
    material_lot_no VARCHAR(30),  -- 자재 LOT
    consumption_datetime TIMESTAMPTZ NOT NULL,
    consumption_type VARCHAR(20) NOT NULL,  -- backflush, manual, adjustment
    planned_qty DECIMAL(15, 4),
    actual_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    variance_qty DECIMAL(15, 4),  -- 계획 대비 차이
    variance_reason VARCHAR(50),  -- scrap, loss, return
    operation_no INTEGER,
    operator_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (consumption_datetime);

-- 파티션 생성 (월별)
CREATE TABLE mes_material_consumption_2024_07 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_material_consumption_2024_08 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_material_consumption_2024_09 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_material_consumption_2024_10 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_material_consumption_2024_11 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_material_consumption_2024_12 PARTITION OF mes_material_consumption
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 4. 자재 요청 (라인 → 창고)
CREATE TABLE IF NOT EXISTS mes_material_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    request_no VARCHAR(30) NOT NULL,
    production_order_id UUID REFERENCES mes_production_order(id),
    line_code VARCHAR(20) NOT NULL,
    request_type VARCHAR(20) NOT NULL,  -- normal, urgent, replenishment
    request_datetime TIMESTAMPTZ NOT NULL,
    requested_by VARCHAR(20),
    status VARCHAR(20) DEFAULT 'requested',  -- requested, processing, delivered, completed
    priority INTEGER DEFAULT 5,  -- 1=highest
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 자재 요청 상세
CREATE TABLE IF NOT EXISTS mes_material_request_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    request_id UUID NOT NULL REFERENCES mes_material_request(id),
    line_no INTEGER NOT NULL,
    material_code VARCHAR(30) NOT NULL,
    requested_qty DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    delivered_qty DECIMAL(15, 4) DEFAULT 0,
    reel_id VARCHAR(30),  -- 배송된 릴 ID
    lot_no VARCHAR(30),
    delivered_datetime TIMESTAMPTZ,
    delivered_by VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending'  -- pending, partial, complete
);

-- 6. 릴(Reel) 관리 (SMT 자재 추적)
CREATE TABLE IF NOT EXISTS mes_reel_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reel_id VARCHAR(30) NOT NULL,  -- 릴 바코드
    material_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(30),
    vendor_code VARCHAR(20),
    date_code VARCHAR(20),  -- 제조일자 코드
    initial_qty INTEGER NOT NULL,
    current_qty INTEGER NOT NULL,
    unit VARCHAR(10) DEFAULT 'EA',
    status VARCHAR(20) DEFAULT 'available',  -- available, in_use, empty, expired, blocked
    location_code VARCHAR(20),  -- 보관 위치
    current_line VARCHAR(20),  -- 현재 사용 중인 라인
    current_equipment_id UUID,  -- 현재 장착된 설비
    current_slot INTEGER,  -- 현재 슬롯 번호
    expiry_date DATE,  -- 습기 관리 만료
    moisture_level INTEGER,  -- MSL (Moisture Sensitivity Level)
    floor_life_hours INTEGER,  -- 대기 수명 (시간)
    opened_at TIMESTAMPTZ,  -- 개봉 시점
    floor_life_remaining_hours INTEGER,  -- 잔여 대기 수명
    received_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, reel_id)
);

-- 7. 솔더 페이스트 관리
CREATE TABLE IF NOT EXISTS mes_solder_paste_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    paste_id VARCHAR(30) NOT NULL,  -- 솔더 페이스트 바코드
    material_code VARCHAR(30),
    lot_no VARCHAR(30),
    vendor_code VARCHAR(20),
    event_type VARCHAR(20) NOT NULL,  -- received, stored_fridge, out_fridge, opened, loaded, unloaded, expired, disposed
    event_datetime TIMESTAMPTZ NOT NULL,
    line_code VARCHAR(20),
    equipment_id UUID,
    operator_code VARCHAR(20),
    temperature DECIMAL(5, 2),  -- 온도 기록
    notes TEXT,
    -- 상태 추적
    fridge_time_hours DECIMAL(8, 2),  -- 냉장 보관 시간
    room_temp_time_hours DECIMAL(8, 2),  -- 상온 노출 시간
    stencil_time_hours DECIMAL(8, 2),  -- 스텐실 위 시간
    is_valid BOOLEAN DEFAULT TRUE,  -- 사용 가능 여부
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 스텐실 관리
CREATE TABLE IF NOT EXISTS mes_stencil_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stencil_id VARCHAR(30) NOT NULL,
    stencil_name VARCHAR(100),
    product_code VARCHAR(30),  -- 대상 제품
    stencil_type VARCHAR(20),  -- laser_cut, electroformed
    thickness_mm DECIMAL(5, 3),  -- 두께
    aperture_count INTEGER,  -- 개구부 수
    max_print_count INTEGER,  -- 최대 인쇄 횟수
    current_print_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',  -- active, maintenance, retired
    location VARCHAR(30),
    last_used_datetime TIMESTAMPTZ,
    last_cleaned_datetime TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, stencil_id)
);

-- 9. 스텐실 사용 이력
CREATE TABLE IF NOT EXISTS mes_stencil_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    stencil_id VARCHAR(30) NOT NULL,
    production_order_id UUID,
    line_code VARCHAR(20),
    equipment_id UUID,
    event_type VARCHAR(20) NOT NULL,  -- mounted, unmounted, cleaned, inspected
    event_datetime TIMESTAMPTZ NOT NULL,
    print_count INTEGER,  -- 이번 사용 인쇄 횟수
    operator_code VARCHAR(20),
    inspection_result VARCHAR(20),  -- pass, fail, needs_cleaning
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (event_datetime);

-- 파티션 생성 (월별)
CREATE TABLE mes_stencil_usage_log_2024_07 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_stencil_usage_log_2024_08 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_stencil_usage_log_2024_09 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_stencil_usage_log_2024_10 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_stencil_usage_log_2024_11 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_stencil_usage_log_2024_12 PARTITION OF mes_stencil_usage_log
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 인덱스
CREATE INDEX idx_mes_operator_tenant ON mes_operator(tenant_id);
CREATE INDEX idx_mes_operator_dept ON mes_operator(department_code);
CREATE INDEX idx_mes_feeder_equipment ON mes_feeder_setup(equipment_id, setup_datetime);
CREATE INDEX idx_mes_feeder_material ON mes_feeder_setup(material_code, status);
CREATE INDEX idx_mes_consumption_order ON mes_material_consumption(production_order_id);
CREATE INDEX idx_mes_consumption_material ON mes_material_consumption(material_code, consumption_datetime);
CREATE INDEX idx_mes_request_line ON mes_material_request(line_code, status);
CREATE INDEX idx_mes_reel_material ON mes_reel_inventory(material_code, status);
CREATE INDEX idx_mes_reel_location ON mes_reel_inventory(location_code, status);
CREATE INDEX idx_mes_stencil_product ON mes_stencil_master(product_code);
CREATE INDEX idx_mes_paste_event ON mes_solder_paste_log(paste_id, event_datetime);

-- 자재 소비 집계 뷰
CREATE OR REPLACE VIEW v_material_consumption_summary AS
SELECT
    mc.tenant_id,
    DATE(mc.consumption_datetime) as consumption_date,
    mc.product_code,
    mc.line_code,
    mc.material_code,
    SUM(mc.planned_qty) as total_planned_qty,
    SUM(mc.actual_qty) as total_actual_qty,
    SUM(mc.variance_qty) as total_variance_qty,
    CASE WHEN SUM(mc.planned_qty) > 0
         THEN (SUM(mc.actual_qty) / SUM(mc.planned_qty) * 100)
         ELSE 0 END as consumption_rate
FROM mes_material_consumption mc
GROUP BY mc.tenant_id, DATE(mc.consumption_datetime), mc.product_code, mc.line_code, mc.material_code;

-- 릴 재고 현황 뷰
CREATE OR REPLACE VIEW v_reel_inventory_status AS
SELECT
    ri.tenant_id,
    ri.material_code,
    mm.name as material_name,
    ri.status,
    COUNT(*) as reel_count,
    SUM(ri.current_qty) as total_qty,
    COUNT(*) FILTER (WHERE ri.status = 'available') as available_count,
    COUNT(*) FILTER (WHERE ri.status = 'in_use') as in_use_count,
    COUNT(*) FILTER (WHERE ri.floor_life_remaining_hours IS NOT NULL
                      AND ri.floor_life_remaining_hours < 24) as low_floor_life_count
FROM mes_reel_inventory ri
LEFT JOIN erp_material_master mm ON ri.tenant_id = mm.tenant_id AND ri.material_code = mm.material_code
GROUP BY ri.tenant_id, ri.material_code, mm.name, ri.status;

-- 피더 셋업 현황 뷰
CREATE OR REPLACE VIEW v_feeder_setup_status AS
SELECT
    fs.tenant_id,
    fs.line_code,
    em.equipment_code,
    em.equipment_name,
    fs.product_code,
    COUNT(*) as total_slots,
    COUNT(*) FILTER (WHERE fs.status = 'active') as active_slots,
    COUNT(*) FILTER (WHERE fs.status = 'empty') as empty_slots,
    COUNT(*) FILTER (WHERE fs.status = 'error') as error_slots,
    SUM(fs.pickup_count) as total_pickups,
    SUM(fs.reject_count) as total_rejects,
    CASE WHEN SUM(fs.pickup_count) > 0
         THEN (SUM(fs.reject_count)::DECIMAL / SUM(fs.pickup_count) * 100)
         ELSE 0 END as reject_rate
FROM mes_feeder_setup fs
JOIN mes_equipment_master em ON fs.equipment_id = em.id
WHERE fs.setup_datetime = (
    SELECT MAX(fs2.setup_datetime)
    FROM mes_feeder_setup fs2
    WHERE fs2.equipment_id = fs.equipment_id
)
GROUP BY fs.tenant_id, fs.line_code, em.equipment_code, em.equipment_name, fs.product_code;
