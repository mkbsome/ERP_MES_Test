-- ============================================================
-- MES Production Execution Tables DDL
-- GreenBoard Electronics ERP/MES Simulator
-- ============================================================

-- ============================================================
-- 1. MES Production Order (생산지시 - MES용)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_production_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    production_order_no VARCHAR(20) NOT NULL,
    -- ERP Link
    erp_work_order_no VARCHAR(20),
    -- Product
    product_code VARCHAR(30) NOT NULL,
    product_name VARCHAR(200),
    product_rev VARCHAR(10),
    -- Line assignment
    line_code VARCHAR(20) NOT NULL,
    -- Quantity
    target_qty NUMERIC(12,3) NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'PNL',
    started_qty NUMERIC(12,3) DEFAULT 0,
    produced_qty NUMERIC(12,3) DEFAULT 0,
    good_qty NUMERIC(12,3) DEFAULT 0,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    -- Timing
    planned_start TIMESTAMPTZ NOT NULL,
    planned_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'started', 'paused', 'completed', 'closed', 'cancelled')),
    current_operation INT,
    -- Priority
    priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    -- BOM/Routing
    bom_id UUID,
    routing_id UUID,
    -- Lot
    lot_no VARCHAR(50),
    -- Customer
    customer_code VARCHAR(20),
    sales_order_no VARCHAR(20),
    -- Notes
    notes TEXT,
    -- Audit
    created_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, production_order_no)
);

CREATE INDEX idx_mes_prod_order_tenant ON mes_production_order(tenant_id, planned_start DESC);
CREATE INDEX idx_mes_prod_order_line ON mes_production_order(line_code, status);
CREATE INDEX idx_mes_prod_order_erp ON mes_production_order(erp_work_order_no) WHERE erp_work_order_no IS NOT NULL;
CREATE INDEX idx_mes_prod_order_status ON mes_production_order(status) WHERE status NOT IN ('closed', 'cancelled');

-- ============================================================
-- 2. MES Production Result (생산실적)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_production_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Production order
    production_order_no VARCHAR(20) NOT NULL,
    -- Timing
    result_timestamp TIMESTAMPTZ NOT NULL,
    shift_code VARCHAR(10) NOT NULL,  -- 1, 2, 3
    -- Location
    line_code VARCHAR(20) NOT NULL,
    equipment_code VARCHAR(30),
    -- Operation
    operation_no INT NOT NULL,
    operation_name VARCHAR(100),
    -- Product
    product_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(50),
    -- Quantities
    input_qty NUMERIC(12,3) NOT NULL,
    output_qty NUMERIC(12,3) NOT NULL,
    good_qty NUMERIC(12,3) NOT NULL,
    defect_qty NUMERIC(12,3) DEFAULT 0,
    rework_qty NUMERIC(12,3) DEFAULT 0,
    scrap_qty NUMERIC(12,3) DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT 'PNL',
    -- Calculated fields
    yield_rate NUMERIC(6,4) GENERATED ALWAYS AS (
        CASE WHEN input_qty > 0 THEN good_qty / input_qty ELSE 0 END
    ) STORED,
    defect_rate NUMERIC(6,4) GENERATED ALWAYS AS (
        CASE WHEN output_qty > 0 THEN defect_qty / output_qty ELSE 0 END
    ) STORED,
    -- Times
    cycle_time_sec NUMERIC(10,2),
    takt_time_sec NUMERIC(10,2),
    setup_time_min NUMERIC(10,2),
    run_time_min NUMERIC(10,2),
    idle_time_min NUMERIC(10,2),
    -- Resources
    operator_code VARCHAR(20),
    operator_name VARCHAR(100),
    -- Type
    result_type VARCHAR(20) DEFAULT 'normal' CHECK (result_type IN ('normal', 'rework', 'test', 'trial', 'sample')),
    -- Notes
    notes TEXT,
    -- Audit
    reported_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (result_timestamp);

-- Create partitions
CREATE TABLE IF NOT EXISTS mes_production_result_2024_h2
    PARTITION OF mes_production_result
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS mes_production_result_2025_h1
    PARTITION OF mes_production_result
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_mes_prod_result_order ON mes_production_result(production_order_no, operation_no);
CREATE INDEX idx_mes_prod_result_line ON mes_production_result(tenant_id, line_code, result_timestamp DESC);
CREATE INDEX idx_mes_prod_result_product ON mes_production_result(product_code, result_timestamp DESC);
CREATE INDEX idx_mes_prod_result_shift ON mes_production_result(shift_code, result_timestamp DESC);

-- ============================================================
-- 3. MES Realtime Production (실시간 생산 현황)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_realtime_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Timing
    timestamp TIMESTAMPTZ NOT NULL,
    -- Location
    line_code VARCHAR(20) NOT NULL,
    equipment_code VARCHAR(30) NOT NULL,
    -- Production
    production_order_no VARCHAR(20),
    product_code VARCHAR(30),
    current_operation VARCHAR(50),
    -- Counts (cumulative for shift)
    takt_count INT DEFAULT 0,
    good_count INT DEFAULT 0,
    defect_count INT DEFAULT 0,
    -- Performance
    cycle_time_ms INT,
    target_cycle_time_ms INT,
    -- Equipment state
    equipment_status VARCHAR(20) CHECK (equipment_status IN ('running', 'idle', 'setup', 'alarm', 'maintenance', 'offline', 'waiting')),
    -- Parameters
    speed_rpm NUMERIC(8,2),
    temperature_celsius NUMERIC(6,2),
    pressure_bar NUMERIC(6,2),
    -- Operator
    operator_code VARCHAR(20),
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create partitions
CREATE TABLE IF NOT EXISTS mes_realtime_production_2024_h2
    PARTITION OF mes_realtime_production
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS mes_realtime_production_2025_h1
    PARTITION OF mes_realtime_production
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_mes_rt_prod_line ON mes_realtime_production(tenant_id, line_code, timestamp DESC);
CREATE INDEX idx_mes_rt_prod_equipment ON mes_realtime_production(equipment_code, timestamp DESC);

-- ============================================================
-- 4. MES Equipment Master (설비 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_equipment_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_code VARCHAR(30) NOT NULL,
    equipment_name VARCHAR(100) NOT NULL,
    -- Type
    equipment_type VARCHAR(30) NOT NULL CHECK (equipment_type IN (
        'loader', 'unloader', 'printer', 'spi', 'mounter', 'reflow', 'aoi', 'xray',
        'wave', 'selective', 'dispenser', 'insertion', 'inspection', 'test',
        'conveyor', 'robot', 'laser', 'coating', 'other'
    )),
    equipment_category VARCHAR(30),  -- SMT, THT, Assembly, Test, etc.
    -- Line position
    line_code VARCHAR(20) NOT NULL,
    position_in_line INT,
    -- Specs
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_no VARCHAR(50),
    firmware_version VARCHAR(30),
    -- Installation
    install_date DATE,
    warranty_end_date DATE,
    -- Capacity
    standard_cycle_time_sec NUMERIC(10,2),
    max_capacity_per_hour INT,
    -- Communication
    ip_address VARCHAR(50),
    port INT,
    communication_protocol VARCHAR(30),  -- OPC-UA, SECS/GEM, Modbus, REST, etc.
    plc_address VARCHAR(100),
    -- Maintenance
    last_pm_date DATE,
    next_pm_date DATE,
    pm_interval_days INT DEFAULT 30,
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    -- Attributes
    attributes JSONB,
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, equipment_code)
);

CREATE INDEX idx_mes_equipment_line ON mes_equipment_master(tenant_id, line_code, position_in_line);
CREATE INDEX idx_mes_equipment_type ON mes_equipment_master(equipment_type);

-- ============================================================
-- 5. MES Equipment Status (설비 상태)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_equipment_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    equipment_code VARCHAR(30) NOT NULL,
    -- Timing
    status_timestamp TIMESTAMPTZ NOT NULL,
    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'idle', 'setup', 'alarm', 'breakdown', 'maintenance', 'offline', 'waiting')),
    previous_status VARCHAR(20),
    status_reason VARCHAR(100),
    -- Alarm info
    alarm_code VARCHAR(30),
    alarm_message TEXT,
    alarm_severity VARCHAR(20) CHECK (alarm_severity IN ('info', 'warning', 'error', 'critical', 'fatal')),
    -- Production context
    production_order_no VARCHAR(20),
    product_code VARCHAR(30),
    operator_code VARCHAR(20),
    -- Performance metrics
    speed_actual NUMERIC(8,2),
    speed_target NUMERIC(8,2),
    temperature_actual NUMERIC(6,2),
    temperature_target NUMERIC(6,2),
    -- Counters
    counters JSONB,  -- {total_count: 1000, good_count: 990, ng_count: 10}
    -- Parameters
    parameters JSONB,  -- Equipment-specific parameters
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (status_timestamp);

-- Create partitions
CREATE TABLE IF NOT EXISTS mes_equipment_status_2024_h2
    PARTITION OF mes_equipment_status
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS mes_equipment_status_2025_h1
    PARTITION OF mes_equipment_status
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_mes_equip_status_equip ON mes_equipment_status(tenant_id, equipment_code, status_timestamp DESC);
CREATE INDEX idx_mes_equip_status_alarm ON mes_equipment_status(alarm_code, status_timestamp DESC) WHERE alarm_code IS NOT NULL;
CREATE INDEX idx_mes_equip_status_status ON mes_equipment_status(status, status_timestamp DESC);

-- ============================================================
-- 6. MES Equipment OEE (설비 OEE)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_equipment_oee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Time bucket
    calculation_date DATE NOT NULL,
    shift_code VARCHAR(10),
    -- Equipment
    equipment_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    -- Time metrics (minutes)
    planned_time_min NUMERIC(10,2) NOT NULL,
    actual_run_time_min NUMERIC(10,2) NOT NULL,
    downtime_min NUMERIC(10,2) DEFAULT 0,
    setup_time_min NUMERIC(10,2) DEFAULT 0,
    idle_time_min NUMERIC(10,2) DEFAULT 0,
    -- Availability
    availability NUMERIC(6,4) GENERATED ALWAYS AS (
        CASE WHEN planned_time_min > 0 THEN actual_run_time_min / planned_time_min ELSE 0 END
    ) STORED,
    -- Cycle time
    ideal_cycle_time_sec NUMERIC(10,2),
    actual_cycle_time_sec NUMERIC(10,2),
    -- Counts
    total_count INT NOT NULL DEFAULT 0,
    good_count INT NOT NULL DEFAULT 0,
    defect_count INT NOT NULL DEFAULT 0,
    -- Performance
    performance NUMERIC(6,4) GENERATED ALWAYS AS (
        CASE WHEN actual_run_time_min > 0 AND ideal_cycle_time_sec > 0
            THEN (total_count * ideal_cycle_time_sec / 60.0) / actual_run_time_min
            ELSE 0 END
    ) STORED,
    -- Quality
    quality NUMERIC(6,4) GENERATED ALWAYS AS (
        CASE WHEN total_count > 0 THEN good_count::NUMERIC / total_count ELSE 0 END
    ) STORED,
    -- OEE (calculated separately to allow manual override)
    oee NUMERIC(6,4),
    -- Breakdown details
    downtime_breakdown JSONB,  -- [{reason: 'breakdown', minutes: 30}, ...]
    defect_breakdown JSONB,    -- [{defect_code: 'BRIDGE', count: 5}, ...]
    -- Audit
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, calculation_date, COALESCE(shift_code, ''), equipment_code)
);

CREATE INDEX idx_mes_oee_date ON mes_equipment_oee(tenant_id, calculation_date DESC);
CREATE INDEX idx_mes_oee_equipment ON mes_equipment_oee(equipment_code, calculation_date DESC);
CREATE INDEX idx_mes_oee_line ON mes_equipment_oee(line_code, calculation_date DESC);

-- ============================================================
-- 7. MES Downtime Event (비가동 이벤트)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_downtime_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    event_no VARCHAR(20) NOT NULL,
    -- Equipment
    equipment_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_min NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE WHEN end_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60.0
            ELSE NULL END
    ) STORED,
    -- Classification
    downtime_category VARCHAR(30) NOT NULL CHECK (downtime_category IN (
        'breakdown', 'planned_maintenance', 'unplanned_maintenance',
        'setup', 'changeover', 'material_shortage', 'quality_issue',
        'operator_absence', 'waiting', 'other'
    )),
    downtime_code VARCHAR(20) NOT NULL,
    downtime_reason TEXT,
    -- Alarm
    alarm_code VARCHAR(30),
    alarm_message TEXT,
    -- Production context
    production_order_no VARCHAR(20),
    product_code VARCHAR(30),
    operator_code VARCHAR(20),
    -- Resolution
    root_cause TEXT,
    corrective_action TEXT,
    -- Maintenance link
    maintenance_ticket_no VARCHAR(20),
    -- Impact
    impact_qty NUMERIC(12,3),
    impact_cost NUMERIC(15,2),
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolved_by VARCHAR(20),
    resolved_at TIMESTAMPTZ,
    -- Notes
    notes TEXT,
    -- Audit
    reported_by VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, event_no)
);

CREATE INDEX idx_mes_downtime_equipment ON mes_downtime_event(tenant_id, equipment_code, start_time DESC);
CREATE INDEX idx_mes_downtime_category ON mes_downtime_event(downtime_category, downtime_code);
CREATE INDEX idx_mes_downtime_open ON mes_downtime_event(status) WHERE status IN ('open', 'in_progress');

-- ============================================================
-- 8. MES Defect Detail (불량 상세)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_defect_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Timing
    defect_timestamp TIMESTAMPTZ NOT NULL,
    -- Detection
    detection_point VARCHAR(20) NOT NULL CHECK (detection_point IN ('spi', 'aoi', 'xray', 'ict', 'fct', 'visual', 'customer')),
    -- Location
    equipment_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    -- Production
    production_order_no VARCHAR(20),
    product_code VARCHAR(30) NOT NULL,
    lot_no VARCHAR(50),
    panel_id VARCHAR(50),
    pcb_serial VARCHAR(50),
    -- Defect classification
    defect_category VARCHAR(30) NOT NULL CHECK (defect_category IN (
        'solder', 'component', 'placement', 'short', 'open', 'bridge',
        'insufficient', 'void', 'crack', 'contamination', 'mechanical', 'other'
    )),
    defect_code VARCHAR(20) NOT NULL,
    defect_description TEXT,
    -- Location on board
    defect_location VARCHAR(100),  -- Reference designator (R1, C2, U3)
    component_ref VARCHAR(50),
    component_code VARCHAR(30),
    x_position NUMERIC(10,3),
    y_position NUMERIC(10,3),
    -- Quantity
    defect_qty INT NOT NULL DEFAULT 1,
    -- Severity
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    -- Image
    image_url TEXT,
    image_data BYTEA,
    -- Detection
    detected_by VARCHAR(20),
    detection_method VARCHAR(30),
    -- Repair
    repair_action VARCHAR(100),
    repair_result VARCHAR(20) CHECK (repair_result IN ('repaired', 'scrapped', 'pending', 'no_action')),
    repaired_by VARCHAR(20),
    repaired_at TIMESTAMPTZ,
    -- Root cause
    root_cause_category VARCHAR(30),
    root_cause_detail TEXT,
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (defect_timestamp);

-- Create partitions
CREATE TABLE IF NOT EXISTS mes_defect_detail_2024_h2
    PARTITION OF mes_defect_detail
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS mes_defect_detail_2025_h1
    PARTITION OF mes_defect_detail
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_mes_defect_line ON mes_defect_detail(tenant_id, line_code, defect_timestamp DESC);
CREATE INDEX idx_mes_defect_category ON mes_defect_detail(defect_category, defect_code, defect_timestamp DESC);
CREATE INDEX idx_mes_defect_product ON mes_defect_detail(product_code, defect_timestamp DESC);
CREATE INDEX idx_mes_defect_order ON mes_defect_detail(production_order_no) WHERE production_order_no IS NOT NULL;

-- ============================================================
-- 9. MES Traceability (추적성)
-- ============================================================
CREATE TABLE IF NOT EXISTS mes_traceability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    -- Timing
    trace_timestamp TIMESTAMPTZ NOT NULL,
    -- Trace type
    trace_type VARCHAR(20) NOT NULL CHECK (trace_type IN ('lot', 'serial', 'panel', 'component')),
    traced_id VARCHAR(100) NOT NULL,  -- Lot number, serial number, panel ID
    -- Production
    production_order_no VARCHAR(20) NOT NULL,
    product_code VARCHAR(30) NOT NULL,
    -- Operation
    operation_no INT NOT NULL,
    operation_name VARCHAR(100),
    -- Location
    equipment_code VARCHAR(30) NOT NULL,
    line_code VARCHAR(20) NOT NULL,
    shift_code VARCHAR(10),
    -- Resources
    operator_code VARCHAR(20),
    -- Parent-child relationship
    parent_lot_no VARCHAR(50),
    child_lot_nos TEXT[],
    -- Material traceability
    material_lots JSONB,  -- [{material_code: 'R0402-10K', lot_no: 'LOT001', qty: 100, reel_id: 'REEL001'}, ...]
    -- Process parameters
    process_parameters JSONB,  -- Temperature, pressure, speed, etc.
    -- Quality results
    quality_results JSONB,  -- Inspection results at this step
    test_results JSONB,     -- Test data
    -- Linked traces
    previous_trace_id UUID,
    next_trace_id UUID,
    -- Status
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'blocked', 'scrapped', 'shipped')),
    -- Shipment info
    customer_serial VARCHAR(100),
    ship_date DATE,
    customer_code VARCHAR(20),
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (trace_timestamp);

-- Create partitions
CREATE TABLE IF NOT EXISTS mes_traceability_2024_h2
    PARTITION OF mes_traceability
    FOR VALUES FROM ('2024-07-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS mes_traceability_2025_h1
    PARTITION OF mes_traceability
    FOR VALUES FROM ('2025-01-01') TO ('2025-07-01');

CREATE INDEX idx_mes_trace_id ON mes_traceability(traced_id, trace_type);
CREATE INDEX idx_mes_trace_order ON mes_traceability(production_order_no, operation_no);
CREATE INDEX idx_mes_trace_product ON mes_traceability(product_code, trace_timestamp DESC);
CREATE INDEX idx_mes_trace_material ON mes_traceability USING GIN (material_lots);

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE mes_production_order IS 'MES 생산지시 - ERP 작업지시의 MES 실행 단위';
COMMENT ON TABLE mes_production_result IS 'MES 생산실적 - 공정별 생산 결과';
COMMENT ON TABLE mes_equipment_master IS 'MES 설비 마스터 - SMT/THT/조립 설비 정의';
COMMENT ON TABLE mes_equipment_oee IS 'MES 설비 OEE - 일별/교대별 OEE 지표';
COMMENT ON TABLE mes_downtime_event IS 'MES 비가동 이벤트 - 다운타임 상세 기록';
COMMENT ON TABLE mes_defect_detail IS 'MES 불량 상세 - 개별 불량 건 기록';
COMMENT ON TABLE mes_traceability IS 'MES 추적성 - 로트/시리얼 기반 이력 추적';
