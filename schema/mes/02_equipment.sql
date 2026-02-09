-- MES Equipment Management Schema
-- 설비 관리 테이블 (상세)

-- 1. 생산 라인 마스터
CREATE TABLE IF NOT EXISTS mes_production_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    line_code VARCHAR(20) NOT NULL,
    line_name VARCHAR(100) NOT NULL,
    line_type VARCHAR(20) NOT NULL,  -- smt_high_speed, smt_mid_speed, smt_flex, tht, assembly
    factory_code VARCHAR(20) DEFAULT 'PLANT1',
    department_code VARCHAR(20),
    capacity_per_shift INTEGER,
    operators_required INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'active',  -- active, maintenance, inactive
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, line_code)
);

-- 2. 설비 보전 이력
CREATE TABLE IF NOT EXISTS mes_maintenance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_id UUID NOT NULL REFERENCES mes_equipment_master(id),
    maintenance_no VARCHAR(30) NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL,  -- PM (예방), CM (사후), BM (개량)
    maintenance_date DATE NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    downtime_minutes INTEGER,
    description TEXT,
    work_performed TEXT,
    parts_replaced JSONB,  -- [{"part_code": "xxx", "qty": 1, "cost": 10000}]
    labor_hours DECIMAL(10, 2),
    labor_cost DECIMAL(15, 2),
    parts_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    technician_code VARCHAR(20),
    result VARCHAR(20),  -- completed, partial, rescheduled
    next_pm_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (maintenance_date);

-- 파티션 생성 (월별)
CREATE TABLE mes_maintenance_history_2024_07 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_maintenance_history_2024_08 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_maintenance_history_2024_09 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_maintenance_history_2024_10 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_maintenance_history_2024_11 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_maintenance_history_2024_12 PARTITION OF mes_maintenance_history
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 3. 설비 알람/이벤트 로그
CREATE TABLE IF NOT EXISTS mes_equipment_alarm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_id UUID NOT NULL REFERENCES mes_equipment_master(id),
    alarm_code VARCHAR(20) NOT NULL,
    alarm_name VARCHAR(100),
    alarm_level VARCHAR(10) NOT NULL,  -- info, warning, error, critical
    alarm_type VARCHAR(20),  -- process, mechanical, electrical, software
    occurred_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(20),
    cleared_at TIMESTAMPTZ,
    cleared_by VARCHAR(20),
    duration_seconds INTEGER,
    cause VARCHAR(200),
    action_taken VARCHAR(200),
    lot_no VARCHAR(30),  -- 발생 시점 작업 중인 LOT
    shift VARCHAR(5)
) PARTITION BY RANGE (occurred_at);

-- 파티션 생성 (월별)
CREATE TABLE mes_equipment_alarm_2024_07 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE mes_equipment_alarm_2024_08 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE mes_equipment_alarm_2024_09 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE mes_equipment_alarm_2024_10 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE mes_equipment_alarm_2024_11 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE mes_equipment_alarm_2024_12 PARTITION OF mes_equipment_alarm
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- 4. 설비 파라미터/레시피 관리
CREATE TABLE IF NOT EXISTS mes_equipment_recipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_id UUID NOT NULL REFERENCES mes_equipment_master(id),
    recipe_code VARCHAR(30) NOT NULL,
    recipe_name VARCHAR(100),
    recipe_version INTEGER DEFAULT 1,
    product_code VARCHAR(30),  -- 제품별 레시피
    parameters JSONB NOT NULL,  -- 설비 유형별 파라미터
    -- 예: {"temperature": [180, 200, 220], "speed": 25, "pressure": 0.5}
    valid_from DATE,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_by VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, equipment_id, recipe_code, recipe_version)
);

-- 예시: Reflow 레시피 파라미터
COMMENT ON COLUMN mes_equipment_recipe.parameters IS '
Reflow: {
  "zones": [
    {"name": "preheat1", "temp": 180, "time": 60},
    {"name": "preheat2", "temp": 200, "time": 60},
    {"name": "peak", "temp": 245, "time": 45}
  ],
  "conveyor_speed": 0.8,
  "nitrogen": true
}
Printer: {
  "print_speed": 25,
  "print_pressure": 5.0,
  "separation_speed": 3.0,
  "stencil_clean_interval": 10
}
Mounter: {
  "placement_speed": 30000,
  "nozzle_config": ["CN040", "CN065", "CN100"],
  "vision_offset_x": 0.01,
  "vision_offset_y": 0.02
}';

-- 5. 설비 실시간 파라미터 수집
CREATE TABLE IF NOT EXISTS mes_equipment_parameter_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_id UUID NOT NULL REFERENCES mes_equipment_master(id),
    collected_at TIMESTAMPTZ NOT NULL,
    parameter_name VARCHAR(50) NOT NULL,
    parameter_value DECIMAL(15, 4),
    unit VARCHAR(10),
    lot_no VARCHAR(30),
    board_id VARCHAR(50)
) PARTITION BY RANGE (collected_at);

-- 파티션 생성 (일별 - 고빈도 데이터)
CREATE TABLE mes_equipment_parameter_log_default PARTITION OF mes_equipment_parameter_log DEFAULT;

-- 인덱스
CREATE INDEX idx_mes_production_line_tenant ON mes_production_line(tenant_id);
CREATE INDEX idx_mes_maintenance_equipment ON mes_maintenance_history(equipment_id);
CREATE INDEX idx_mes_alarm_equipment ON mes_equipment_alarm(equipment_id, occurred_at);
CREATE INDEX idx_mes_alarm_level ON mes_equipment_alarm(alarm_level, occurred_at);
CREATE INDEX idx_mes_recipe_equipment ON mes_equipment_recipe(equipment_id, product_code);
CREATE INDEX idx_mes_param_log_equipment ON mes_equipment_parameter_log(equipment_id, collected_at);

-- 설비 가동률 집계 뷰
CREATE OR REPLACE VIEW v_equipment_utilization AS
SELECT
    em.tenant_id,
    em.equipment_code,
    em.equipment_name,
    em.line_code,
    DATE(es.status_time) as status_date,
    COUNT(*) FILTER (WHERE es.status = 'running') * 100.0 / NULLIF(COUNT(*), 0) as running_pct,
    COUNT(*) FILTER (WHERE es.status = 'idle') * 100.0 / NULLIF(COUNT(*), 0) as idle_pct,
    COUNT(*) FILTER (WHERE es.status = 'down') * 100.0 / NULLIF(COUNT(*), 0) as down_pct,
    COUNT(*) FILTER (WHERE es.status = 'maintenance') * 100.0 / NULLIF(COUNT(*), 0) as maintenance_pct
FROM mes_equipment_master em
LEFT JOIN mes_equipment_status es ON em.id = es.equipment_id
GROUP BY em.tenant_id, em.equipment_code, em.equipment_name, em.line_code, DATE(es.status_time);

-- 다운타임 분석 뷰
CREATE OR REPLACE VIEW v_downtime_analysis AS
SELECT
    de.tenant_id,
    em.equipment_code,
    em.line_code,
    de.downtime_type,
    de.cause_code,
    DATE(de.start_time) as downtime_date,
    COUNT(*) as occurrence_count,
    SUM(de.duration_minutes) as total_downtime_minutes,
    AVG(de.duration_minutes) as avg_downtime_minutes
FROM mes_downtime_event de
JOIN mes_equipment_master em ON de.equipment_id = em.id
GROUP BY de.tenant_id, em.equipment_code, em.line_code,
         de.downtime_type, de.cause_code, DATE(de.start_time);
