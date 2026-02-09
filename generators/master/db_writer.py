"""
Database Writer for ERP/MES Simulator
Handles database connections and data insertion
"""

import os
from datetime import date, datetime
from typing import Any, Optional
import json

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from tqdm import tqdm


class DatabaseWriter:
    """Database writer with connection pooling and batch insert support"""

    def __init__(self, connection_string: Optional[str] = None):
        """
        Initialize database connection

        Args:
            connection_string: PostgreSQL connection string.
                             If None, uses environment variable DATABASE_URL
        """
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/erp_mes_simulator'
        )
        self.engine = create_engine(
            self.connection_string,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True
        )
        self.Session = sessionmaker(bind=self.engine)

    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            print(f"Database connection failed: {e}")
            return False

    def execute_schema_file(self, schema_path: str) -> bool:
        """Execute SQL schema file"""
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()

            with self.engine.connect() as conn:
                # Split by ';' and execute each statement
                statements = [s.strip() for s in sql_content.split(';') if s.strip()]
                for stmt in statements:
                    if stmt and not stmt.startswith('--'):
                        conn.execute(text(stmt))
                conn.commit()
            return True
        except Exception as e:
            print(f"Schema execution failed: {e}")
            return False

    def _serialize_value(self, value: Any) -> Any:
        """Serialize value for database insertion"""
        if isinstance(value, dict):
            return json.dumps(value, ensure_ascii=False)
        elif isinstance(value, (date, datetime)):
            return value.isoformat() if isinstance(value, datetime) else str(value)
        return value

    def insert_batch(self, table_name: str, records: list[dict], batch_size: int = 1000) -> int:
        """
        Insert records in batches

        Args:
            table_name: Target table name
            records: List of dictionaries to insert
            batch_size: Number of records per batch

        Returns:
            Number of records inserted
        """
        if not records:
            return 0

        total_inserted = 0

        # Get column names from first record
        columns = list(records[0].keys())
        column_str = ', '.join(columns)
        placeholder_str = ', '.join([f':{col}' for col in columns])

        insert_sql = f"INSERT INTO {table_name} ({column_str}) VALUES ({placeholder_str})"

        with self.engine.connect() as conn:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]

                # Serialize values
                serialized_batch = []
                for record in batch:
                    serialized = {k: self._serialize_value(v) for k, v in record.items()}
                    serialized_batch.append(serialized)

                try:
                    conn.execute(text(insert_sql), serialized_batch)
                    total_inserted += len(batch)
                except Exception as e:
                    print(f"Error inserting batch into {table_name}: {e}")
                    # Try inserting one by one to find problematic record
                    for record in serialized_batch:
                        try:
                            conn.execute(text(insert_sql), record)
                            total_inserted += 1
                        except Exception as inner_e:
                            print(f"  Failed record: {record.get('id', 'unknown')}: {inner_e}")

            conn.commit()

        return total_inserted

    def write_master_data(self, data: dict) -> dict:
        """
        Write all master data to database

        Args:
            data: Dictionary containing all master data arrays

        Returns:
            Dictionary with counts of inserted records
        """
        results = {}

        # Table mapping with insertion order (respecting foreign keys)
        table_mapping = [
            ('tenants', 'tenants'),
            ('departments', 'erp_department_master'),
            ('warehouses', 'erp_warehouse_master'),
            ('cost_centers', 'erp_cost_center'),
            ('customers', 'erp_customer_master'),
            ('vendors', 'erp_vendor_master'),
            ('materials', 'erp_material_master'),
            ('products', 'erp_material_master'),  # Products are also materials
            ('bom_headers', 'erp_bom_header'),
            ('bom_components', 'erp_bom_component'),
            ('lines', 'mes_production_line'),
            ('equipment', 'mes_equipment_master'),
            ('routing_headers', 'erp_routing_header'),
            ('routing_operations', 'erp_routing_operation'),
            ('operators', 'mes_operator'),
        ]

        print("\n" + "=" * 60)
        print("Writing Master Data to Database")
        print("=" * 60)

        for data_key, table_name in tqdm(table_mapping, desc="Writing tables"):
            if data_key in data and data[data_key]:
                count = self.insert_batch(table_name, data[data_key])
                results[data_key] = count
                print(f"  ✓ {table_name}: {count} records")

        return results

    def truncate_tables(self, tables: list[str] = None):
        """Truncate specified tables or all master tables"""
        if tables is None:
            tables = [
                'erp_bom_component', 'erp_bom_header',
                'erp_routing_operation', 'erp_routing_header',
                'mes_operator', 'mes_equipment_master', 'mes_production_line',
                'erp_material_master', 'erp_vendor_master', 'erp_customer_master',
                'erp_cost_center', 'erp_warehouse_master', 'erp_department_master',
                'tenants'
            ]

        with self.engine.connect() as conn:
            for table in tables:
                try:
                    conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
                    print(f"  Truncated: {table}")
                except Exception as e:
                    print(f"  Failed to truncate {table}: {e}")
            conn.commit()

    def close(self):
        """Close database connection"""
        self.engine.dispose()


class DataExporter:
    """Export generated data to various formats"""

    @staticmethod
    def to_csv(data: dict, output_dir: str):
        """Export data to CSV files"""
        import csv
        import os

        os.makedirs(output_dir, exist_ok=True)

        for data_key, records in data.items():
            if records:
                filepath = os.path.join(output_dir, f"{data_key}.csv")
                with open(filepath, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=records[0].keys())
                    writer.writeheader()
                    writer.writerows(records)
                print(f"  Exported: {filepath}")

    @staticmethod
    def to_json(data: dict, output_dir: str):
        """Export data to JSON files"""
        import os

        os.makedirs(output_dir, exist_ok=True)

        def serialize(obj):
            if isinstance(obj, (date, datetime)):
                return obj.isoformat()
            return obj

        for data_key, records in data.items():
            if records:
                filepath = os.path.join(output_dir, f"{data_key}.json")
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(records, f, ensure_ascii=False, indent=2, default=serialize)
                print(f"  Exported: {filepath}")

    @staticmethod
    def to_sql_inserts(data: dict, output_dir: str, table_mapping: dict):
        """Export data as SQL INSERT statements"""
        import os

        os.makedirs(output_dir, exist_ok=True)

        def escape_value(val):
            if val is None:
                return 'NULL'
            elif isinstance(val, bool):
                return 'TRUE' if val else 'FALSE'
            elif isinstance(val, (int, float)):
                return str(val)
            elif isinstance(val, dict):
                return f"'{json.dumps(val, ensure_ascii=False)}'"
            elif isinstance(val, (date, datetime)):
                return f"'{val.isoformat() if isinstance(val, datetime) else val}'"
            else:
                return f"'{str(val).replace(chr(39), chr(39)+chr(39))}'"

        for data_key, table_name in table_mapping.items():
            records = data.get(data_key, [])
            if records:
                filepath = os.path.join(output_dir, f"{table_name}.sql")
                with open(filepath, 'w', encoding='utf-8') as f:
                    for record in records:
                        columns = ', '.join(record.keys())
                        values = ', '.join([escape_value(v) for v in record.values()])
                        f.write(f"INSERT INTO {table_name} ({columns}) VALUES ({values});\n")
                print(f"  Exported: {filepath}")


if __name__ == "__main__":
    # Test database connection
    writer = DatabaseWriter()
    if writer.test_connection():
        print("✓ Database connection successful")
    else:
        print("✗ Database connection failed")
    writer.close()
