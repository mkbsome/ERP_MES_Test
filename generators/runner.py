"""
ERP/MES Data Generator Runner
Main orchestrator for generating simulation data with AI use case scenarios
"""
import os
import sys
import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from generators.core.time_manager import TimeManager
from generators.core.scenario_manager import ScenarioManager
from generators.core.correlation_engine import ManufacturingCorrelations

from generators.mes.production_generator import ProductionDataGenerator
from generators.mes.equipment_generator import EquipmentDataGenerator
from generators.mes.quality_generator import QualityDataGenerator
from generators.mes.material_generator import MaterialDataGenerator

from generators.erp.sales_generator import SalesDataGenerator
from generators.erp.purchase_generator import PurchaseDataGenerator
from generators.erp.inventory_generator import InventoryDataGenerator
from generators.erp.accounting_generator import AccountingDataGenerator
from generators.erp.hr_generator import HRDataGenerator


class DataGeneratorRunner:
    """
    Main runner for ERP/MES data generation

    Features:
    - Generates realistic transaction data for 180 days
    - Applies AI use case scenarios at configured times
    - Maintains correlations between data points
    - Outputs to JSON files or database

    Usage:
        runner = DataGeneratorRunner(config_dir='generators/config')
        runner.generate_all()
        runner.save_to_json('output/')
    """

    def __init__(
        self,
        config_dir: str = 'generators/config',
        output_dir: str = 'output',
        random_seed: int = 42,
        tenant_id: str = 'T001'
    ):
        self.config_dir = Path(config_dir)
        self.output_dir = Path(output_dir)
        self.random_seed = random_seed
        self.tenant_id = tenant_id

        # Load configurations
        self.company_profile = self._load_yaml('company_profile.yaml')
        self.time_config = self._load_yaml('time_config.yaml')

        # Initialize core components
        self.time_manager = TimeManager(str(self.config_dir / 'time_config.yaml'))
        self.scenario_manager = ScenarioManager(str(self.config_dir / 'scenarios.yaml'))
        self.correlation_engine = ManufacturingCorrelations.create_engine()

        # Master data (would normally be loaded from existing data)
        self.master_data = self._load_or_generate_master_data()

        # Initialize generators
        self._init_generators()

        # Collected data
        self.all_data = {
            'mes': {},
            'erp': {},
            'metadata': {}
        }

    def _load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load YAML configuration file"""
        filepath = self.config_dir / filename
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        return {}

    def _load_or_generate_master_data(self) -> Dict[str, Any]:
        """Load master data or generate minimal set"""
        # Check if master data exists
        master_path = self.config_dir.parent / 'data' / 'master_data.json'
        if master_path.exists():
            with open(master_path, 'r', encoding='utf-8') as f:
                return json.load(f)

        # Generate minimal master data
        return self._generate_minimal_master_data()

    def _generate_minimal_master_data(self) -> Dict[str, Any]:
        """Generate minimal master data for testing"""
        return {
            'tenants': [{'id': self.tenant_id, 'name': '(주)그린보드 일렉트로닉스'}],
            'customers': [
                {'id': f'C{i:03d}', 'customer_code': f'CUST{i:03d}',
                 'name': f'고객사{i}', 'currency': 'KRW', 'payment_terms': 'NET30'}
                for i in range(1, 51)
            ],
            'vendors': [
                {'id': f'V{i:03d}', 'vendor_code': f'VEND{i:03d}',
                 'name': f'공급업체{i}', 'vendor_type': 'material',
                 'currency': 'KRW', 'lead_time_days': 7}
                for i in range(1, 31)
            ],
            'materials': [
                {'id': f'M{i:03d}', 'material_code': f'MAT{i:04d}',
                 'name': f'자재{i}', 'material_type': 'component',
                 'unit': 'EA', 'standard_cost': 10 + i * 5,
                 'min_order_qty': 1000, 'safety_stock': 5000}
                for i in range(1, 101)
            ],
            'bom_headers': [],
            'bom_components': []
        }

    def _init_generators(self):
        """Initialize all data generators"""
        common_args = {
            'time_manager': self.time_manager,
            'scenario_manager': self.scenario_manager,
            'company_profile': self.company_profile,
            'tenant_id': self.tenant_id,
            'random_seed': self.random_seed
        }

        # MES Generators
        self.production_gen = ProductionDataGenerator(**common_args)
        self.equipment_gen = EquipmentDataGenerator(**common_args)
        self.quality_gen = QualityDataGenerator(**common_args)
        self.material_gen = MaterialDataGenerator(**common_args)

        # ERP Generators
        erp_args = {**common_args, 'master_data': self.master_data}
        self.sales_gen = SalesDataGenerator(**erp_args)
        self.purchase_gen = PurchaseDataGenerator(**erp_args)
        self.inventory_gen = InventoryDataGenerator(**erp_args)
        self.accounting_gen = AccountingDataGenerator(**common_args)
        self.hr_gen = HRDataGenerator(**common_args)

    def generate_all(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        progress_callback: callable = None
    ) -> Dict[str, Any]:
        """
        Generate all ERP/MES data for the simulation period

        Args:
            start_date: Override start date
            end_date: Override end date
            progress_callback: Function to call with progress updates

        Returns:
            Summary of generated data
        """
        start = start_date or self.time_manager.start_date
        end = end_date or self.time_manager.end_date

        print("=" * 60)
        print("ERP/MES Data Generator")
        print(f"Period: {start.date()} to {end.date()}")
        print(f"Tenant: {self.tenant_id}")
        print("=" * 60)

        total_days = (end - start).days + 1
        current_day = 0
        current_date = None

        # Generate data for each time slot
        for time_slot in self.time_manager.iterate_time_slots(start, end):
            # Track day progress
            if time_slot.date != current_date:
                current_date = time_slot.date
                current_day += 1

                if progress_callback:
                    progress_callback(current_day, total_days, time_slot.date)
                else:
                    print(f"\rProcessing day {current_day}/{total_days}: {time_slot.date}", end='')

                # Daily operations at start of day
                if time_slot.hour == 8:  # Start of day shift
                    self._generate_daily_data(time_slot)

            # Skip non-working time
            if not time_slot.is_working_day:
                continue

            # Hourly data generation
            self._generate_hourly_data(time_slot)

        print("\n")

        # Generate monthly summaries
        self._generate_monthly_summaries()

        # Collect all data
        self._collect_data()

        # Print summary
        self._print_summary()

        return self.get_summary()

    def _generate_daily_data(self, time_slot):
        """Generate daily data (orders, attendance, etc.)"""
        context = self._build_context(time_slot)

        # ERP: Sales orders
        self.sales_gen.generate_daily_orders(time_slot, num_orders=30)

        # ERP: Purchase orders
        self.purchase_gen.generate_daily_orders(time_slot, num_orders=20)

        # ERP: Process shipments and receipts
        self.sales_gen.process_pending_shipments(time_slot)
        self.purchase_gen.process_pending_receipts(time_slot)

        # HR: Attendance
        self.hr_gen.generate_daily_attendance(time_slot, context)

        # Inventory: Daily snapshot
        self.inventory_gen.generate_stock_snapshot(time_slot)

    def _generate_hourly_data(self, time_slot):
        """Generate hourly production data"""
        context = self._build_context(time_slot)

        # MES: Production results
        prod_results = []
        for prod_data in self.production_gen.generate_time_range(
            time_slot.timestamp,
            time_slot.timestamp + timedelta(hours=1),
            orders_per_day=0  # Don't generate new orders
        ):
            prod_results.extend(prod_data.get('production_results', []))

        # MES: Equipment data
        for equip_data in self.equipment_gen.generate_time_range(
            time_slot.timestamp,
            time_slot.timestamp + timedelta(hours=1)
        ):
            pass  # Data is collected internally

        # MES: Quality data
        if prod_results:
            self.quality_gen.generate_for_production(time_slot, prod_results, context)

        # ERP: Accounting (cost records)
        for result in prod_results:
            self.accounting_gen.generate_production_cost(time_slot, result, context)

    def _build_context(self, time_slot) -> Dict[str, Any]:
        """Build context for scenario evaluation"""
        return {
            'environment': {
                'temperature': 25 + (time_slot.month - 7) * 2,  # Seasonal variation
                'humidity': 50 + (time_slot.month - 7) * 3,
                'temp_delta': 0
            },
            'equipment': {},
            'material': {}
        }

    def _generate_monthly_summaries(self):
        """Generate monthly summary data"""
        # Get unique months in simulation
        months = set()
        for time_slot in self.time_manager.iterate_time_slots():
            months.add(time_slot.date.strftime('%Y-%m'))

        for year_month in sorted(months):
            # HR: Payroll
            self.hr_gen.generate_monthly_payroll(year_month)

            # Accounting: Budget records
            self.accounting_gen.generate_monthly_budget(year_month)

    def _collect_data(self):
        """Collect all generated data"""
        # MES Data
        self.all_data['mes'] = {
            'production': self.production_gen.get_data(),
            'equipment': self.equipment_gen.get_data(),
            'quality': self.quality_gen.get_data(),
            'material': self.material_gen.get_data()
        }

        # ERP Data
        self.all_data['erp'] = {
            'sales': self.sales_gen.get_data(),
            'purchase': self.purchase_gen.get_data(),
            'inventory': self.inventory_gen.get_data(),
            'accounting': self.accounting_gen.get_data(),
            'hr': self.hr_gen.get_data()
        }

        # Metadata
        self.all_data['metadata'] = {
            'generated_at': datetime.now().isoformat(),
            'tenant_id': self.tenant_id,
            'random_seed': self.random_seed,
            'simulation_period': {
                'start': self.time_manager.start_date.isoformat(),
                'end': self.time_manager.end_date.isoformat()
            },
            'scenarios': self.scenario_manager.get_scenario_summary()
        }

    def _print_summary(self):
        """Print generation summary"""
        print("=" * 60)
        print("Generation Summary")
        print("=" * 60)

        print("\nMES Data:")
        print(f"  Production: {json.dumps(self.production_gen.get_summary(), indent=4, default=str)}")
        print(f"  Equipment: {json.dumps(self.equipment_gen.get_summary(), indent=4, default=str)}")
        print(f"  Quality: {json.dumps(self.quality_gen.get_summary(), indent=4, default=str)}")
        print(f"  Material: {json.dumps(self.material_gen.get_summary(), indent=4, default=str)}")

        print("\nERP Data:")
        print(f"  Sales: {json.dumps(self.sales_gen.get_summary(), indent=4, default=str)}")
        print(f"  Purchase: {json.dumps(self.purchase_gen.get_summary(), indent=4, default=str)}")
        print(f"  Inventory: {json.dumps(self.inventory_gen.get_summary(), indent=4, default=str)}")
        print(f"  Accounting: {json.dumps(self.accounting_gen.get_summary(), indent=4, default=str)}")
        print(f"  HR: {json.dumps(self.hr_gen.get_summary(), indent=4, default=str)}")

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        return {
            'mes': {
                'production': self.production_gen.get_summary(),
                'equipment': self.equipment_gen.get_summary(),
                'quality': self.quality_gen.get_summary(),
                'material': self.material_gen.get_summary()
            },
            'erp': {
                'sales': self.sales_gen.get_summary(),
                'purchase': self.purchase_gen.get_summary(),
                'inventory': self.inventory_gen.get_summary(),
                'accounting': self.accounting_gen.get_summary(),
                'hr': self.hr_gen.get_summary()
            }
        }

    def save_to_json(self, output_dir: Optional[str] = None):
        """Save all generated data to JSON files"""
        output_path = Path(output_dir) if output_dir else self.output_dir
        output_path.mkdir(parents=True, exist_ok=True)

        # Save MES data
        mes_path = output_path / 'mes'
        mes_path.mkdir(exist_ok=True)
        for module, data in self.all_data['mes'].items():
            for table, records in data.items():
                filepath = mes_path / f'{module}_{table}.json'
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(records, f, ensure_ascii=False, indent=2, default=str)
                print(f"Saved: {filepath} ({len(records)} records)")

        # Save ERP data
        erp_path = output_path / 'erp'
        erp_path.mkdir(exist_ok=True)
        for module, data in self.all_data['erp'].items():
            for table, records in data.items():
                filepath = erp_path / f'{module}_{table}.json'
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(records, f, ensure_ascii=False, indent=2, default=str)
                print(f"Saved: {filepath} ({len(records)} records)")

        # Save metadata
        metadata_path = output_path / 'metadata.json'
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.all_data['metadata'], f, ensure_ascii=False, indent=2, default=str)
        print(f"Saved: {metadata_path}")

        print(f"\nAll data saved to: {output_path.absolute()}")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='ERP/MES Data Generator for AI Platform Testing'
    )

    parser.add_argument(
        '--config-dir',
        type=str,
        default='generators/config',
        help='Path to configuration directory'
    )

    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Path to output directory'
    )

    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility'
    )

    parser.add_argument(
        '--tenant',
        type=str,
        default='T001',
        help='Tenant ID'
    )

    parser.add_argument(
        '--days',
        type=int,
        default=None,
        help='Number of days to generate (overrides config)'
    )

    parser.add_argument(
        '--save-json',
        action='store_true',
        help='Save output to JSON files'
    )

    args = parser.parse_args()

    # Create runner
    runner = DataGeneratorRunner(
        config_dir=args.config_dir,
        output_dir=args.output_dir,
        random_seed=args.seed,
        tenant_id=args.tenant
    )

    # Calculate date range
    start_date = runner.time_manager.start_date
    if args.days:
        end_date = start_date + timedelta(days=args.days - 1)
    else:
        end_date = runner.time_manager.end_date

    # Generate data
    runner.generate_all(start_date=start_date, end_date=end_date)

    # Save to JSON if requested
    if args.save_json:
        runner.save_to_json()


if __name__ == '__main__':
    main()
