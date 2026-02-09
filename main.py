"""
ERP/MES Simulator Main Entry Point
GreenBoard Electronics 가상 기업 데이터 시뮬레이터
"""

import os
import sys
import argparse
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from generators.master.master_generator import MasterDataGenerator
from generators.master.db_writer import DatabaseWriter, DataExporter


def get_config_path() -> str:
    """Get configuration file path"""
    return os.path.join(PROJECT_ROOT, 'config', 'company.yaml')


def get_schema_files() -> list[str]:
    """Get all schema files in order"""
    schema_dir = os.path.join(PROJECT_ROOT, 'schema')

    # Execution order matters due to foreign key constraints
    schema_order = [
        # ERP schemas
        'erp/01_master_tables.sql',
        'erp/02_bom_routing.sql',
        'erp/03_sales_order.sql',
        'erp/04_purchase_order.sql',
        'erp/05_inventory.sql',
        'erp/06_production.sql',
        'erp/07_quality.sql',
        'erp/08_cost.sql',
        # MES schemas
        'mes/01_production.sql',
        'mes/02_equipment.sql',
        'mes/03_quality.sql',
        'mes/04_material.sql',
        # Interface schemas
        'interface/01_erp_mes_interface.sql',
    ]

    return [os.path.join(schema_dir, f) for f in schema_order]


def init_database(db_writer: DatabaseWriter, drop_existing: bool = False) -> bool:
    """Initialize database schema"""
    print("\n" + "=" * 60)
    print("Initializing Database Schema")
    print("=" * 60)

    if drop_existing:
        print("⚠️  Dropping existing tables...")
        # Drop tables in reverse order
        drop_sql = """
        DROP SCHEMA IF EXISTS public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
        """
        try:
            from sqlalchemy import text
            with db_writer.engine.connect() as conn:
                conn.execute(text(drop_sql))
                conn.commit()
            print("  ✓ Existing schema dropped")
        except Exception as e:
            print(f"  ✗ Failed to drop schema: {e}")
            return False

    schema_files = get_schema_files()

    for schema_file in schema_files:
        if os.path.exists(schema_file):
            filename = os.path.basename(schema_file)
            print(f"  Executing: {filename}...", end=" ")
            if db_writer.execute_schema_file(schema_file):
                print("✓")
            else:
                print("✗")
                return False
        else:
            print(f"  ⚠️  Schema file not found: {schema_file}")

    print("\n✓ Database schema initialized successfully")
    return True


def generate_master_data(config_path: str, seed: int = 42) -> dict:
    """Generate all master data"""
    generator = MasterDataGenerator(config_path, seed=seed)
    return generator.generate_all()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='ERP/MES Simulator for GreenBoard Electronics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --init-db                    # Initialize database schema only
  python main.py --generate-master            # Generate master data only
  python main.py --generate-all               # Generate all data
  python main.py --export-csv ./output        # Export to CSV files
  python main.py --init-db --generate-master  # Init DB and generate master data
        """
    )

    # Database options
    parser.add_argument(
        '--db-url',
        type=str,
        default=os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/erp_mes_simulator'),
        help='Database connection URL'
    )
    parser.add_argument(
        '--init-db',
        action='store_true',
        help='Initialize database schema'
    )
    parser.add_argument(
        '--drop-existing',
        action='store_true',
        help='Drop existing tables before initialization (USE WITH CAUTION)'
    )

    # Generation options
    parser.add_argument(
        '--generate-master',
        action='store_true',
        help='Generate master data'
    )
    parser.add_argument(
        '--generate-transactions',
        action='store_true',
        help='Generate transaction data'
    )
    parser.add_argument(
        '--generate-all',
        action='store_true',
        help='Generate all data (master + transactions)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )

    # Export options
    parser.add_argument(
        '--export-csv',
        type=str,
        metavar='DIR',
        help='Export generated data to CSV files'
    )
    parser.add_argument(
        '--export-json',
        type=str,
        metavar='DIR',
        help='Export generated data to JSON files'
    )
    parser.add_argument(
        '--export-sql',
        type=str,
        metavar='DIR',
        help='Export generated data as SQL INSERT statements'
    )

    # Other options
    parser.add_argument(
        '--no-db',
        action='store_true',
        help='Do not write to database (export only)'
    )
    parser.add_argument(
        '--config',
        type=str,
        default=get_config_path(),
        help='Path to company configuration YAML file'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Print banner
    print("\n" + "=" * 60)
    print("  ERP/MES Simulator")
    print("  GreenBoard Electronics Co., Ltd.")
    print("=" * 60)
    print(f"  Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Config file: {args.config}")
    print("=" * 60)

    # Validate config file
    if not os.path.exists(args.config):
        print(f"Error: Configuration file not found: {args.config}")
        sys.exit(1)

    # Initialize database writer (if needed)
    db_writer = None
    if not args.no_db:
        db_writer = DatabaseWriter(args.db_url)
        if not db_writer.test_connection():
            print("\nError: Cannot connect to database")
            print("Please check your database configuration:")
            print(f"  URL: {args.db_url}")
            print("\nYou can use --no-db flag to skip database operations")
            sys.exit(1)
        print(f"\n✓ Database connected: {args.db_url.split('@')[-1]}")

    # Initialize database schema
    if args.init_db:
        if db_writer:
            if not init_database(db_writer, args.drop_existing):
                sys.exit(1)
        else:
            print("Warning: --init-db requires database connection (remove --no-db)")

    # Generate data
    generated_data = {}

    if args.generate_master or args.generate_all:
        print("\n" + "=" * 60)
        print("Generating Master Data")
        print("=" * 60)

        generated_data = generate_master_data(args.config, args.seed)

        # Write to database
        if db_writer and not args.no_db:
            results = db_writer.write_master_data(generated_data)
            print("\nDatabase write results:")
            for key, count in results.items():
                print(f"  {key}: {count} records")

    if args.generate_transactions or args.generate_all:
        print("\n" + "=" * 60)
        print("Generating Transaction Data")
        print("=" * 60)
        print("⚠️  Transaction data generation not yet implemented")
        # TODO: Implement transaction data generation
        # from generators.transaction.transaction_generator import TransactionDataGenerator
        # tx_generator = TransactionDataGenerator(args.config, generated_data)
        # tx_data = tx_generator.generate_all()

    # Export data
    if generated_data:
        if args.export_csv:
            print(f"\nExporting to CSV: {args.export_csv}")
            DataExporter.to_csv(generated_data, args.export_csv)

        if args.export_json:
            print(f"\nExporting to JSON: {args.export_json}")
            DataExporter.to_json(generated_data, args.export_json)

        if args.export_sql:
            print(f"\nExporting to SQL: {args.export_sql}")
            table_mapping = {
                'tenants': 'tenants',
                'departments': 'erp_department_master',
                'warehouses': 'erp_warehouse_master',
                'cost_centers': 'erp_cost_center',
                'customers': 'erp_customer_master',
                'vendors': 'erp_vendor_master',
                'materials': 'erp_material_master',
                'products': 'erp_material_master',
                'bom_headers': 'erp_bom_header',
                'bom_components': 'erp_bom_component',
                'lines': 'mes_production_line',
                'equipment': 'mes_equipment_master',
                'routing_headers': 'erp_routing_header',
                'routing_operations': 'erp_routing_operation',
                'operators': 'mes_operator',
            }
            DataExporter.to_sql_inserts(generated_data, args.export_sql, table_mapping)

    # Cleanup
    if db_writer:
        db_writer.close()

    print("\n" + "=" * 60)
    print("  Simulation Complete")
    print(f"  End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
