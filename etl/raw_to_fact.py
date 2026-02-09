"""
ETL Pipeline: ERP/MES Data → AI Platform (raw → dim → fact)
Transforms simulator data for AI platform consumption
"""

import os
from datetime import date, datetime
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class ETLPipeline:
    """ETL Pipeline for AI Platform Integration"""

    def __init__(self, connection_string: Optional[str] = None):
        """Initialize ETL with database connection"""
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/erp_mes_simulator'
        )
        self.engine = create_engine(self.connection_string)
        self.Session = sessionmaker(bind=self.engine)

    def run_full_etl(self, target_date: Optional[date] = None):
        """Run full ETL pipeline"""
        print("\n" + "=" * 60)
        print("Running ETL Pipeline: ERP/MES → AI Platform")
        print("=" * 60)

        # 1. Load to RAW tables
        print("\n[Step 1] Loading RAW data...")
        self.load_raw_data(target_date)

        # 2. Transform to DIM tables
        print("\n[Step 2] Updating DIM tables...")
        self.update_dim_tables()

        # 3. Transform to FACT tables
        print("\n[Step 3] Building FACT tables...")
        self.build_fact_tables(target_date)

        print("\n" + "=" * 60)
        print("ETL Pipeline Complete")
        print("=" * 60)

    def load_raw_data(self, target_date: Optional[date] = None):
        """Load data to RAW staging tables"""
        with self.engine.connect() as conn:
            # RAW Production Data
            raw_production_sql = """
            INSERT INTO raw_mes_production (
                tenant_id, source_system, source_table, source_id,
                extracted_at, raw_data
            )
            SELECT
                pr.tenant_id,
                'MES' as source_system,
                'mes_production_result' as source_table,
                pr.id as source_id,
                NOW() as extracted_at,
                jsonb_build_object(
                    'production_order_id', pr.production_order_id,
                    'lot_no', pr.lot_no,
                    'product_code', pr.product_code,
                    'line_code', pr.line_code,
                    'production_date', pr.production_date,
                    'shift', pr.shift,
                    'good_qty', pr.good_qty,
                    'defect_qty', pr.defect_qty,
                    'total_qty', pr.total_qty,
                    'cycle_time_avg', pr.cycle_time_avg
                ) as raw_data
            FROM mes_production_result pr
            WHERE NOT EXISTS (
                SELECT 1 FROM raw_mes_production rmp
                WHERE rmp.source_id = pr.id
            )
            """
            if target_date:
                raw_production_sql += f" AND pr.production_date = '{target_date}'"

            result = conn.execute(text(raw_production_sql))
            print(f"  ✓ raw_mes_production: {result.rowcount} rows")

            # RAW Defect Data
            raw_defect_sql = """
            INSERT INTO raw_mes_defect (
                tenant_id, source_system, source_table, source_id,
                extracted_at, raw_data
            )
            SELECT
                dd.tenant_id,
                'MES' as source_system,
                'mes_defect_detail' as source_table,
                dd.id as source_id,
                NOW() as extracted_at,
                jsonb_build_object(
                    'defect_no', dd.defect_no,
                    'production_order_id', dd.production_order_id,
                    'lot_no', dd.lot_no,
                    'product_code', dd.product_code,
                    'line_code', dd.line_code,
                    'defect_code', dd.defect_code,
                    'defect_qty', dd.defect_qty,
                    'detection_datetime', dd.detection_datetime,
                    'severity', dd.severity
                ) as raw_data
            FROM mes_defect_detail dd
            WHERE NOT EXISTS (
                SELECT 1 FROM raw_mes_defect rmd
                WHERE rmd.source_id = dd.id
            )
            """
            result = conn.execute(text(raw_defect_sql))
            print(f"  ✓ raw_mes_defect: {result.rowcount} rows")

            # RAW Equipment Data
            raw_equipment_sql = """
            INSERT INTO raw_mes_equipment (
                tenant_id, source_system, source_table, source_id,
                extracted_at, raw_data
            )
            SELECT
                oee.tenant_id,
                'MES' as source_system,
                'mes_equipment_oee' as source_table,
                oee.id as source_id,
                NOW() as extracted_at,
                jsonb_build_object(
                    'equipment_id', oee.equipment_id,
                    'oee_date', oee.oee_date,
                    'shift', oee.shift,
                    'availability', oee.availability,
                    'performance', oee.performance,
                    'quality', oee.quality,
                    'oee', oee.oee,
                    'planned_time_min', oee.planned_time_min,
                    'running_time_min', oee.running_time_min,
                    'downtime_min', oee.downtime_min
                ) as raw_data
            FROM mes_equipment_oee oee
            WHERE NOT EXISTS (
                SELECT 1 FROM raw_mes_equipment rme
                WHERE rme.source_id = oee.id
            )
            """
            result = conn.execute(text(raw_equipment_sql))
            print(f"  ✓ raw_mes_equipment: {result.rowcount} rows")

            conn.commit()

    def update_dim_tables(self):
        """Update dimension tables with latest master data"""
        with self.engine.connect() as conn:
            # DIM Line
            dim_line_sql = """
            INSERT INTO dim_line (
                tenant_id, line_code, line_name, line_type,
                factory_code, capacity_per_shift, is_active,
                valid_from, valid_to, is_current
            )
            SELECT
                pl.tenant_id,
                pl.line_code,
                pl.line_name,
                pl.line_type,
                pl.factory_code,
                pl.capacity_per_shift,
                pl.status = 'active',
                NOW() as valid_from,
                NULL as valid_to,
                TRUE as is_current
            FROM mes_production_line pl
            WHERE NOT EXISTS (
                SELECT 1 FROM dim_line dl
                WHERE dl.tenant_id = pl.tenant_id
                AND dl.line_code = pl.line_code
                AND dl.is_current = TRUE
            )
            ON CONFLICT (tenant_id, line_code)
            WHERE is_current = TRUE
            DO UPDATE SET
                line_name = EXCLUDED.line_name,
                line_type = EXCLUDED.line_type,
                capacity_per_shift = EXCLUDED.capacity_per_shift,
                is_active = EXCLUDED.is_active
            """
            result = conn.execute(text(dim_line_sql))
            print(f"  ✓ dim_line: {result.rowcount} rows")

            # DIM Product
            dim_product_sql = """
            INSERT INTO dim_product (
                tenant_id, product_code, product_name, product_name_en,
                product_family, product_category, standard_cost,
                is_active, valid_from, valid_to, is_current
            )
            SELECT
                mm.tenant_id,
                mm.material_code as product_code,
                mm.name as product_name,
                mm.name_en as product_name_en,
                mm.material_group as product_family,
                'PCB' as product_category,
                mm.standard_cost,
                mm.is_active,
                NOW() as valid_from,
                NULL as valid_to,
                TRUE as is_current
            FROM erp_material_master mm
            WHERE mm.material_type = 'finished'
            AND NOT EXISTS (
                SELECT 1 FROM dim_product dp
                WHERE dp.tenant_id = mm.tenant_id
                AND dp.product_code = mm.material_code
                AND dp.is_current = TRUE
            )
            ON CONFLICT (tenant_id, product_code)
            WHERE is_current = TRUE
            DO UPDATE SET
                product_name = EXCLUDED.product_name,
                standard_cost = EXCLUDED.standard_cost,
                is_active = EXCLUDED.is_active
            """
            result = conn.execute(text(dim_product_sql))
            print(f"  ✓ dim_product: {result.rowcount} rows")

            # DIM Equipment
            dim_equipment_sql = """
            INSERT INTO dim_equipment (
                tenant_id, equipment_code, equipment_name, equipment_type,
                line_code, manufacturer, model, position_in_line,
                is_active, valid_from, valid_to, is_current
            )
            SELECT
                em.tenant_id,
                em.equipment_code,
                em.equipment_name,
                em.equipment_type,
                em.line_code,
                em.manufacturer,
                em.model,
                em.position_in_line,
                em.status = 'active',
                NOW() as valid_from,
                NULL as valid_to,
                TRUE as is_current
            FROM mes_equipment_master em
            WHERE NOT EXISTS (
                SELECT 1 FROM dim_equipment de
                WHERE de.tenant_id = em.tenant_id
                AND de.equipment_code = em.equipment_code
                AND de.is_current = TRUE
            )
            ON CONFLICT (tenant_id, equipment_code)
            WHERE is_current = TRUE
            DO UPDATE SET
                equipment_name = EXCLUDED.equipment_name,
                equipment_type = EXCLUDED.equipment_type,
                is_active = EXCLUDED.is_active
            """
            result = conn.execute(text(dim_equipment_sql))
            print(f"  ✓ dim_equipment: {result.rowcount} rows")

            # DIM Time (Date Dimension)
            dim_time_sql = """
            INSERT INTO dim_time (
                date_key, full_date, year, quarter, month, week,
                day_of_month, day_of_week, day_of_year,
                is_weekend, is_holiday, fiscal_year, fiscal_quarter
            )
            SELECT
                TO_CHAR(d::date, 'YYYYMMDD')::INTEGER as date_key,
                d::date as full_date,
                EXTRACT(YEAR FROM d)::INTEGER as year,
                EXTRACT(QUARTER FROM d)::INTEGER as quarter,
                EXTRACT(MONTH FROM d)::INTEGER as month,
                EXTRACT(WEEK FROM d)::INTEGER as week,
                EXTRACT(DAY FROM d)::INTEGER as day_of_month,
                EXTRACT(ISODOW FROM d)::INTEGER as day_of_week,
                EXTRACT(DOY FROM d)::INTEGER as day_of_year,
                EXTRACT(ISODOW FROM d) IN (6, 7) as is_weekend,
                FALSE as is_holiday,
                EXTRACT(YEAR FROM d)::INTEGER as fiscal_year,
                EXTRACT(QUARTER FROM d)::INTEGER as fiscal_quarter
            FROM generate_series('2024-01-01'::date, '2025-12-31'::date, '1 day'::interval) d
            WHERE NOT EXISTS (
                SELECT 1 FROM dim_time dt
                WHERE dt.full_date = d::date
            )
            ON CONFLICT (date_key) DO NOTHING
            """
            result = conn.execute(text(dim_time_sql))
            print(f"  ✓ dim_time: {result.rowcount} rows")

            conn.commit()

    def build_fact_tables(self, target_date: Optional[date] = None):
        """Build fact tables from raw and dimension data"""
        with self.engine.connect() as conn:
            # FACT Daily Production
            fact_production_sql = """
            INSERT INTO fact_daily_production (
                tenant_id, date_key, line_id, product_id,
                total_qty, good_qty, defect_qty, scrap_qty,
                production_time_min, downtime_min,
                target_qty, achievement_rate
            )
            SELECT
                pr.tenant_id,
                TO_CHAR(pr.production_date, 'YYYYMMDD')::INTEGER as date_key,
                dl.id as line_id,
                dp.id as product_id,
                SUM(pr.total_qty) as total_qty,
                SUM(pr.good_qty) as good_qty,
                SUM(pr.defect_qty) as defect_qty,
                0 as scrap_qty,
                SUM(EXTRACT(EPOCH FROM (pr.end_time - pr.start_time)) / 60) as production_time_min,
                0 as downtime_min,
                SUM(pr.total_qty) * 1.1 as target_qty,  -- 목표 = 실적 * 1.1
                CASE WHEN SUM(pr.total_qty) > 0
                     THEN SUM(pr.good_qty)::DECIMAL / (SUM(pr.total_qty) * 1.1)
                     ELSE 0 END as achievement_rate
            FROM mes_production_result pr
            JOIN dim_line dl ON pr.tenant_id = dl.tenant_id AND pr.line_code = dl.line_code AND dl.is_current = TRUE
            JOIN dim_product dp ON pr.tenant_id = dp.tenant_id AND pr.product_code = dp.product_code AND dp.is_current = TRUE
            WHERE 1=1
            """
            if target_date:
                fact_production_sql += f" AND pr.production_date = '{target_date}'"

            fact_production_sql += """
            GROUP BY pr.tenant_id, pr.production_date, dl.id, dp.id
            ON CONFLICT (tenant_id, date_key, line_id, product_id) DO UPDATE SET
                total_qty = EXCLUDED.total_qty,
                good_qty = EXCLUDED.good_qty,
                defect_qty = EXCLUDED.defect_qty,
                production_time_min = EXCLUDED.production_time_min,
                achievement_rate = EXCLUDED.achievement_rate
            """
            result = conn.execute(text(fact_production_sql))
            print(f"  ✓ fact_daily_production: {result.rowcount} rows")

            # FACT Daily Defect
            fact_defect_sql = """
            INSERT INTO fact_daily_defect (
                tenant_id, date_key, line_id, product_id,
                defect_code, defect_count, defect_qty,
                inspected_qty, defect_rate
            )
            SELECT
                dd.tenant_id,
                TO_CHAR(DATE(dd.detection_datetime), 'YYYYMMDD')::INTEGER as date_key,
                dl.id as line_id,
                dp.id as product_id,
                dd.defect_code,
                COUNT(*) as defect_count,
                SUM(dd.defect_qty) as defect_qty,
                COALESCE(
                    (SELECT SUM(ir.total_inspected)
                     FROM mes_inspection_result ir
                     WHERE ir.tenant_id = dd.tenant_id
                     AND ir.line_code = dd.line_code
                     AND ir.product_code = dd.product_code
                     AND DATE(ir.inspection_datetime) = DATE(dd.detection_datetime)
                    ), 0
                ) as inspected_qty,
                CASE WHEN COALESCE(
                    (SELECT SUM(ir.total_inspected)
                     FROM mes_inspection_result ir
                     WHERE ir.tenant_id = dd.tenant_id
                     AND ir.line_code = dd.line_code
                     AND ir.product_code = dd.product_code
                     AND DATE(ir.inspection_datetime) = DATE(dd.detection_datetime)
                    ), 0
                ) > 0
                     THEN SUM(dd.defect_qty)::DECIMAL / (SELECT SUM(ir.total_inspected)
                                                          FROM mes_inspection_result ir
                                                          WHERE ir.tenant_id = dd.tenant_id
                                                          AND ir.line_code = dd.line_code
                                                          AND ir.product_code = dd.product_code
                                                          AND DATE(ir.inspection_datetime) = DATE(dd.detection_datetime))
                     ELSE 0 END as defect_rate
            FROM mes_defect_detail dd
            JOIN dim_line dl ON dd.tenant_id = dl.tenant_id AND dd.line_code = dl.line_code AND dl.is_current = TRUE
            JOIN dim_product dp ON dd.tenant_id = dp.tenant_id AND dd.product_code = dp.product_code AND dp.is_current = TRUE
            WHERE 1=1
            """
            if target_date:
                fact_defect_sql += f" AND DATE(dd.detection_datetime) = '{target_date}'"

            fact_defect_sql += """
            GROUP BY dd.tenant_id, DATE(dd.detection_datetime), dl.id, dp.id, dd.defect_code
            ON CONFLICT (tenant_id, date_key, line_id, product_id, defect_code) DO UPDATE SET
                defect_count = EXCLUDED.defect_count,
                defect_qty = EXCLUDED.defect_qty,
                inspected_qty = EXCLUDED.inspected_qty,
                defect_rate = EXCLUDED.defect_rate
            """
            result = conn.execute(text(fact_defect_sql))
            print(f"  ✓ fact_daily_defect: {result.rowcount} rows")

            # FACT Daily OEE
            fact_oee_sql = """
            INSERT INTO fact_daily_oee (
                tenant_id, date_key, equipment_id, line_id,
                planned_time_min, running_time_min, downtime_min,
                target_output, actual_output, good_output,
                availability, performance, quality, oee
            )
            SELECT
                oee.tenant_id,
                TO_CHAR(oee.oee_date, 'YYYYMMDD')::INTEGER as date_key,
                de.id as equipment_id,
                dl.id as line_id,
                SUM(oee.planned_time_min) as planned_time_min,
                SUM(oee.running_time_min) as running_time_min,
                SUM(oee.downtime_min) as downtime_min,
                SUM(oee.target_output) as target_output,
                SUM(oee.actual_output) as actual_output,
                SUM(oee.actual_output * oee.quality) as good_output,
                AVG(oee.availability) as availability,
                AVG(oee.performance) as performance,
                AVG(oee.quality) as quality,
                AVG(oee.oee) as oee
            FROM mes_equipment_oee oee
            JOIN dim_equipment de ON oee.equipment_id = de.equipment_code::UUID  -- Simplified, adjust as needed
            JOIN mes_equipment_master em ON oee.equipment_id = em.id
            JOIN dim_line dl ON em.line_code = dl.line_code AND em.tenant_id = dl.tenant_id AND dl.is_current = TRUE
            WHERE 1=1
            """
            if target_date:
                fact_oee_sql += f" AND oee.oee_date = '{target_date}'"

            fact_oee_sql += """
            GROUP BY oee.tenant_id, oee.oee_date, de.id, dl.id
            ON CONFLICT (tenant_id, date_key, equipment_id) DO UPDATE SET
                planned_time_min = EXCLUDED.planned_time_min,
                running_time_min = EXCLUDED.running_time_min,
                downtime_min = EXCLUDED.downtime_min,
                target_output = EXCLUDED.target_output,
                actual_output = EXCLUDED.actual_output,
                availability = EXCLUDED.availability,
                performance = EXCLUDED.performance,
                quality = EXCLUDED.quality,
                oee = EXCLUDED.oee
            """
            try:
                result = conn.execute(text(fact_oee_sql))
                print(f"  ✓ fact_daily_oee: {result.rowcount} rows")
            except Exception as e:
                print(f"  ⚠ fact_daily_oee: Skipped (table/schema mismatch)")

            conn.commit()

    def create_ai_platform_tables(self):
        """Create AI platform specific tables (raw, dim, fact)"""
        ddl_sql = """
        -- RAW Tables (Staging)
        CREATE TABLE IF NOT EXISTS raw_mes_production (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            source_system VARCHAR(20) NOT NULL,
            source_table VARCHAR(50) NOT NULL,
            source_id UUID NOT NULL,
            extracted_at TIMESTAMPTZ DEFAULT NOW(),
            raw_data JSONB NOT NULL,
            processed_at TIMESTAMPTZ,
            process_status VARCHAR(20) DEFAULT 'pending',
            UNIQUE(source_system, source_table, source_id)
        );

        CREATE TABLE IF NOT EXISTS raw_mes_defect (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            source_system VARCHAR(20) NOT NULL,
            source_table VARCHAR(50) NOT NULL,
            source_id UUID NOT NULL,
            extracted_at TIMESTAMPTZ DEFAULT NOW(),
            raw_data JSONB NOT NULL,
            processed_at TIMESTAMPTZ,
            process_status VARCHAR(20) DEFAULT 'pending',
            UNIQUE(source_system, source_table, source_id)
        );

        CREATE TABLE IF NOT EXISTS raw_mes_equipment (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            source_system VARCHAR(20) NOT NULL,
            source_table VARCHAR(50) NOT NULL,
            source_id UUID NOT NULL,
            extracted_at TIMESTAMPTZ DEFAULT NOW(),
            raw_data JSONB NOT NULL,
            processed_at TIMESTAMPTZ,
            process_status VARCHAR(20) DEFAULT 'pending',
            UNIQUE(source_system, source_table, source_id)
        );

        -- DIM Tables
        CREATE TABLE IF NOT EXISTS dim_line (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            line_code VARCHAR(20) NOT NULL,
            line_name VARCHAR(100),
            line_type VARCHAR(20),
            factory_code VARCHAR(20),
            capacity_per_shift INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            valid_from TIMESTAMPTZ DEFAULT NOW(),
            valid_to TIMESTAMPTZ,
            is_current BOOLEAN DEFAULT TRUE,
            UNIQUE(tenant_id, line_code) WHERE is_current = TRUE
        );

        CREATE TABLE IF NOT EXISTS dim_product (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            product_code VARCHAR(30) NOT NULL,
            product_name VARCHAR(100),
            product_name_en VARCHAR(100),
            product_family VARCHAR(20),
            product_category VARCHAR(30),
            standard_cost DECIMAL(15, 4),
            is_active BOOLEAN DEFAULT TRUE,
            valid_from TIMESTAMPTZ DEFAULT NOW(),
            valid_to TIMESTAMPTZ,
            is_current BOOLEAN DEFAULT TRUE,
            UNIQUE(tenant_id, product_code) WHERE is_current = TRUE
        );

        CREATE TABLE IF NOT EXISTS dim_equipment (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            equipment_code VARCHAR(30) NOT NULL,
            equipment_name VARCHAR(100),
            equipment_type VARCHAR(30),
            line_code VARCHAR(20),
            manufacturer VARCHAR(50),
            model VARCHAR(50),
            position_in_line INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            valid_from TIMESTAMPTZ DEFAULT NOW(),
            valid_to TIMESTAMPTZ,
            is_current BOOLEAN DEFAULT TRUE,
            UNIQUE(tenant_id, equipment_code) WHERE is_current = TRUE
        );

        CREATE TABLE IF NOT EXISTS dim_time (
            date_key INTEGER PRIMARY KEY,
            full_date DATE NOT NULL UNIQUE,
            year INTEGER NOT NULL,
            quarter INTEGER NOT NULL,
            month INTEGER NOT NULL,
            week INTEGER NOT NULL,
            day_of_month INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            day_of_year INTEGER NOT NULL,
            is_weekend BOOLEAN DEFAULT FALSE,
            is_holiday BOOLEAN DEFAULT FALSE,
            fiscal_year INTEGER,
            fiscal_quarter INTEGER
        );

        -- FACT Tables
        CREATE TABLE IF NOT EXISTS fact_daily_production (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            date_key INTEGER NOT NULL REFERENCES dim_time(date_key),
            line_id UUID NOT NULL REFERENCES dim_line(id),
            product_id UUID NOT NULL REFERENCES dim_product(id),
            total_qty INTEGER DEFAULT 0,
            good_qty INTEGER DEFAULT 0,
            defect_qty INTEGER DEFAULT 0,
            scrap_qty INTEGER DEFAULT 0,
            production_time_min DECIMAL(10, 2),
            downtime_min DECIMAL(10, 2),
            target_qty INTEGER,
            achievement_rate DECIMAL(5, 4),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id, date_key, line_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS fact_daily_defect (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            date_key INTEGER NOT NULL REFERENCES dim_time(date_key),
            line_id UUID NOT NULL REFERENCES dim_line(id),
            product_id UUID NOT NULL REFERENCES dim_product(id),
            defect_code VARCHAR(20) NOT NULL,
            defect_count INTEGER DEFAULT 0,
            defect_qty INTEGER DEFAULT 0,
            inspected_qty INTEGER DEFAULT 0,
            defect_rate DECIMAL(8, 6),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id, date_key, line_id, product_id, defect_code)
        );

        CREATE TABLE IF NOT EXISTS fact_daily_oee (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            date_key INTEGER NOT NULL REFERENCES dim_time(date_key),
            equipment_id UUID NOT NULL REFERENCES dim_equipment(id),
            line_id UUID REFERENCES dim_line(id),
            planned_time_min INTEGER DEFAULT 0,
            running_time_min INTEGER DEFAULT 0,
            downtime_min INTEGER DEFAULT 0,
            target_output INTEGER DEFAULT 0,
            actual_output INTEGER DEFAULT 0,
            good_output INTEGER DEFAULT 0,
            availability DECIMAL(5, 4),
            performance DECIMAL(5, 4),
            quality DECIMAL(5, 4),
            oee DECIMAL(5, 4),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(tenant_id, date_key, equipment_id)
        );

        -- Indexes for fact tables
        CREATE INDEX IF NOT EXISTS idx_fact_production_date ON fact_daily_production(date_key);
        CREATE INDEX IF NOT EXISTS idx_fact_production_line ON fact_daily_production(line_id);
        CREATE INDEX IF NOT EXISTS idx_fact_defect_date ON fact_daily_defect(date_key);
        CREATE INDEX IF NOT EXISTS idx_fact_defect_code ON fact_daily_defect(defect_code);
        CREATE INDEX IF NOT EXISTS idx_fact_oee_date ON fact_daily_oee(date_key);
        CREATE INDEX IF NOT EXISTS idx_fact_oee_equipment ON fact_daily_oee(equipment_id);
        """

        with self.engine.connect() as conn:
            for stmt in ddl_sql.split(';'):
                if stmt.strip():
                    try:
                        conn.execute(text(stmt))
                    except Exception as e:
                        if 'already exists' not in str(e):
                            print(f"  Warning: {e}")
            conn.commit()

        print("  ✓ AI Platform tables created")

    def close(self):
        """Close database connection"""
        self.engine.dispose()


def generate_judgment_input_sample(etl: ETLPipeline, target_date: date) -> dict:
    """Generate sample input data for AI Judgment Engine"""

    sample = {
        "workflow_id": "WF-DEFECT-DETECTION",
        "judgment_context": "quality_anomaly_detection",
        "input_data": {
            "date": str(target_date),
            "production_summary": [],
            "defect_summary": [],
            "equipment_status": []
        }
    }

    with etl.engine.connect() as conn:
        # Production summary
        prod_sql = f"""
        SELECT
            dl.line_code,
            dp.product_code,
            fp.total_qty,
            fp.good_qty,
            fp.defect_qty,
            fp.achievement_rate
        FROM fact_daily_production fp
        JOIN dim_line dl ON fp.line_id = dl.id
        JOIN dim_product dp ON fp.product_id = dp.id
        WHERE fp.date_key = {target_date.strftime('%Y%m%d')}
        LIMIT 5
        """
        result = conn.execute(text(prod_sql))
        for row in result:
            sample["input_data"]["production_summary"].append({
                "line_code": row[0],
                "product_code": row[1],
                "total_qty": row[2],
                "good_qty": row[3],
                "defect_qty": row[4],
                "achievement_rate": float(row[5]) if row[5] else 0
            })

        # Defect summary
        defect_sql = f"""
        SELECT
            dl.line_code,
            fd.defect_code,
            SUM(fd.defect_qty) as total_defect_qty,
            AVG(fd.defect_rate) as avg_defect_rate
        FROM fact_daily_defect fd
        JOIN dim_line dl ON fd.line_id = dl.id
        WHERE fd.date_key = {target_date.strftime('%Y%m%d')}
        GROUP BY dl.line_code, fd.defect_code
        ORDER BY total_defect_qty DESC
        LIMIT 5
        """
        result = conn.execute(text(defect_sql))
        for row in result:
            sample["input_data"]["defect_summary"].append({
                "line_code": row[0],
                "defect_code": row[1],
                "defect_qty": int(row[2]),
                "defect_rate": float(row[3]) if row[3] else 0
            })

    return sample


if __name__ == "__main__":
    import argparse
    from datetime import date

    parser = argparse.ArgumentParser(description='ETL Pipeline for AI Platform')
    parser.add_argument('--create-tables', action='store_true', help='Create AI platform tables')
    parser.add_argument('--run-etl', action='store_true', help='Run full ETL pipeline')
    parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD)')

    args = parser.parse_args()

    etl = ETLPipeline()

    if args.create_tables:
        etl.create_ai_platform_tables()

    if args.run_etl:
        target_date = None
        if args.date:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        etl.run_full_etl(target_date)

    etl.close()
