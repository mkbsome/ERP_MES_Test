"""
ERP Accounting Data Generator
Generates financial transactions, cost analysis, and budget data
Supports AI use case scenarios for accounting management
"""
import uuid
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np

from generators.core.time_manager import TimeManager, TimeSlot
from generators.core.scenario_manager import ScenarioManager


class JournalType(Enum):
    SALES = "sales"
    PURCHASE = "purchase"
    PAYROLL = "payroll"
    PRODUCTION = "production"
    ADJUSTMENT = "adjustment"
    DEPRECIATION = "depreciation"


class CostType(Enum):
    MATERIAL = "material"
    LABOR = "labor"
    OVERHEAD = "overhead"
    DEPRECIATION = "depreciation"


class AccountingDataGenerator:
    """
    ERP Accounting Data Generator

    Generates:
    - Journal entries (분개)
    - Cost records (원가 기록)
    - Budget vs actual (예산 대 실적)
    - Financial alerts (재무 알림)

    AI Use Cases:
    - CHECK: 매출/비용 현황
    - TREND: 재무 트렌드
    - COMPARE: 예산 대 실적
    - DETECT_ANOMALY: 비용 이상 감지
    - PREDICT: 재무 예측
    """

    # Chart of Accounts (simplified)
    ACCOUNTS = {
        '1100': {'name': '현금및현금성자산', 'type': 'asset'},
        '1200': {'name': '매출채권', 'type': 'asset'},
        '1300': {'name': '재고자산', 'type': 'asset'},
        '1400': {'name': '선급비용', 'type': 'asset'},
        '2100': {'name': '매입채무', 'type': 'liability'},
        '2200': {'name': '미지급금', 'type': 'liability'},
        '2300': {'name': '예수금', 'type': 'liability'},
        '4100': {'name': '제품매출', 'type': 'revenue'},
        '4200': {'name': '상품매출', 'type': 'revenue'},
        '5100': {'name': '재료비', 'type': 'expense'},
        '5200': {'name': '노무비', 'type': 'expense'},
        '5300': {'name': '제조경비', 'type': 'expense'},
        '5400': {'name': '감가상각비', 'type': 'expense'},
        '6100': {'name': '판매비', 'type': 'expense'},
        '6200': {'name': '관리비', 'type': 'expense'}
    }

    def __init__(
        self,
        time_manager: TimeManager,
        scenario_manager: ScenarioManager,
        company_profile: Dict[str, Any],
        tenant_id: str,
        random_seed: int = 42
    ):
        self.time_manager = time_manager
        self.scenario_manager = scenario_manager
        self.company_profile = company_profile
        self.tenant_id = tenant_id

        random.seed(random_seed)
        np.random.seed(random_seed)

        # Generated data
        self.data = {
            'journal_entries': [],
            'journal_lines': [],
            'cost_records': [],
            'budget_records': [],
            'financial_alerts': []
        }

        self.sequence_counter = 10000

    def _get_next_sequence(self) -> str:
        self.sequence_counter += 1
        return str(self.sequence_counter).zfill(6)

    def generate_sales_journal(
        self,
        time_slot: TimeSlot,
        invoice_data: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate journal entry for sales"""
        context = context or {}
        scenario_data = self._apply_accounting_scenarios(time_slot, context)

        entry_id = str(uuid.uuid4())
        entry_no = f"JE-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        amount = invoice_data.get('total_amount', 0)
        tax_amount = invoice_data.get('tax_amount', 0)
        net_amount = amount - tax_amount

        entry = {
            'id': entry_id,
            'tenant_id': self.tenant_id,
            'entry_no': entry_no,
            'entry_date': time_slot.date,
            'journal_type': JournalType.SALES.value,
            'description': f"매출 - {invoice_data.get('invoice_no', '')}",
            'reference_doc': invoice_data.get('invoice_no', ''),
            'total_debit': amount,
            'total_credit': amount,
            'currency': invoice_data.get('currency', 'KRW'),
            'status': 'posted',
            'posted_by': f"AC{random.randint(1, 10):03d}",
            'posted_at': time_slot.timestamp,
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        # Generate lines (debit: AR, credit: revenue + tax)
        lines = [
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 10,
                'account_code': '1200',  # AR
                'account_name': self.ACCOUNTS['1200']['name'],
                'debit_amount': amount,
                'credit_amount': 0,
                'description': '매출채권 증가',
                'cost_center': f"CC{random.randint(100, 199)}"
            },
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 20,
                'account_code': '4100',  # Revenue
                'account_name': self.ACCOUNTS['4100']['name'],
                'debit_amount': 0,
                'credit_amount': net_amount,
                'description': '제품매출',
                'cost_center': f"CC{random.randint(100, 199)}"
            },
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 30,
                'account_code': '2300',  # Tax payable
                'account_name': self.ACCOUNTS['2300']['name'],
                'debit_amount': 0,
                'credit_amount': tax_amount,
                'description': '부가세 예수금',
                'cost_center': ''
            }
        ]

        self.data['journal_entries'].append(entry)
        self.data['journal_lines'].extend(lines)

        return entry

    def generate_purchase_journal(
        self,
        time_slot: TimeSlot,
        receipt_data: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate journal entry for purchases"""
        context = context or {}
        scenario_data = self._apply_accounting_scenarios(time_slot, context)

        entry_id = str(uuid.uuid4())
        entry_no = f"JE-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}"

        # Estimate amount from receipt
        amount = receipt_data.get('total_qty', 0) * random.uniform(10, 100)
        tax_amount = amount * 0.1
        total_amount = amount + tax_amount

        entry = {
            'id': entry_id,
            'tenant_id': self.tenant_id,
            'entry_no': entry_no,
            'entry_date': time_slot.date,
            'journal_type': JournalType.PURCHASE.value,
            'description': f"구매입고 - {receipt_data.get('gr_no', '')}",
            'reference_doc': receipt_data.get('gr_no', ''),
            'total_debit': total_amount,
            'total_credit': total_amount,
            'currency': 'KRW',
            'status': 'posted',
            'posted_by': f"AC{random.randint(1, 10):03d}",
            'posted_at': time_slot.timestamp,
            'created_at': datetime.now()
        }

        lines = [
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 10,
                'account_code': '1300',  # Inventory
                'account_name': self.ACCOUNTS['1300']['name'],
                'debit_amount': amount,
                'credit_amount': 0,
                'description': '재고자산 증가',
                'cost_center': ''
            },
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 20,
                'account_code': '1400',  # VAT receivable
                'account_name': '부가세대급금',
                'debit_amount': tax_amount,
                'credit_amount': 0,
                'description': '부가세 대급금',
                'cost_center': ''
            },
            {
                'id': str(uuid.uuid4()),
                'tenant_id': self.tenant_id,
                'entry_id': entry_id,
                'line_no': 30,
                'account_code': '2100',  # AP
                'account_name': self.ACCOUNTS['2100']['name'],
                'debit_amount': 0,
                'credit_amount': total_amount,
                'description': '매입채무 증가',
                'cost_center': ''
            }
        ]

        self.data['journal_entries'].append(entry)
        self.data['journal_lines'].extend(lines)

        return entry

    def generate_production_cost(
        self,
        time_slot: TimeSlot,
        production_data: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate production cost record"""
        context = context or {}
        scenario_data = self._apply_accounting_scenarios(time_slot, context)

        # Calculate costs
        good_qty = production_data.get('good_qty', 0)
        defect_qty = production_data.get('defect_qty', 0)
        total_qty = good_qty + defect_qty

        # Apply cost scenarios
        cost_increase = scenario_data.get('cost_increase', 0)

        material_cost = total_qty * random.uniform(50, 200) * (1 + cost_increase)
        labor_cost = total_qty * random.uniform(10, 30) * (1 + cost_increase)
        overhead_cost = total_qty * random.uniform(20, 50) * (1 + cost_increase)
        total_cost = material_cost + labor_cost + overhead_cost

        unit_cost = total_cost / good_qty if good_qty > 0 else 0

        cost_record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'cost_no': f"PC-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'cost_date': time_slot.date,
            'production_order_id': production_data.get('production_order_id'),
            'lot_no': production_data.get('lot_no'),
            'product_code': production_data.get('product_code'),
            'line_code': production_data.get('line_code'),
            'good_qty': good_qty,
            'defect_qty': defect_qty,
            'total_qty': total_qty,
            'material_cost': round(material_cost, 2),
            'labor_cost': round(labor_cost, 2),
            'overhead_cost': round(overhead_cost, 2),
            'total_cost': round(total_cost, 2),
            'unit_cost': round(unit_cost, 2),
            'defect_cost': round(total_cost * defect_qty / total_qty if total_qty > 0 else 0, 2),
            'cost_variance': round((unit_cost - 200) / 200 * 100, 2),  # vs standard
            'active_scenarios': scenario_data.get('active_scenarios', []),
            'created_at': datetime.now()
        }

        self.data['cost_records'].append(cost_record)

        # Check for cost variance alert
        if abs(cost_record['cost_variance']) > 10:
            self._generate_financial_alert(
                time_slot, 'COST_VARIANCE',
                f"원가 편차 {cost_record['cost_variance']:.1f}% 발생 - {production_data.get('product_code')}"
            )

        return cost_record

    def generate_budget_record(
        self,
        time_slot: TimeSlot,
        account_code: str,
        budget_amount: float,
        actual_amount: float,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate budget vs actual record"""
        variance = actual_amount - budget_amount
        variance_pct = (variance / budget_amount * 100) if budget_amount > 0 else 0

        record = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'period': time_slot.date.strftime('%Y-%m'),
            'account_code': account_code,
            'account_name': self.ACCOUNTS.get(account_code, {}).get('name', account_code),
            'cost_center': f"CC{random.randint(100, 999)}",
            'budget_amount': round(budget_amount, 2),
            'actual_amount': round(actual_amount, 2),
            'variance_amount': round(variance, 2),
            'variance_pct': round(variance_pct, 2),
            'status': 'favorable' if variance < 0 else 'unfavorable' if variance > 0 else 'on_target',
            'created_at': datetime.now()
        }

        self.data['budget_records'].append(record)

        # Alert for significant variance
        if abs(variance_pct) > 15:
            self._generate_financial_alert(
                time_slot, 'BUDGET_VARIANCE',
                f"예산 편차 {variance_pct:.1f}% - {record['account_name']}"
            )

        return record

    def _generate_financial_alert(
        self,
        time_slot: TimeSlot,
        alert_type: str,
        message: str
    ) -> Dict[str, Any]:
        """Generate financial alert"""
        severity_map = {
            'COST_VARIANCE': 'medium',
            'BUDGET_VARIANCE': 'high',
            'CASH_FLOW': 'critical',
            'PROFITABILITY': 'high'
        }

        alert = {
            'id': str(uuid.uuid4()),
            'tenant_id': self.tenant_id,
            'alert_no': f"FAL-{time_slot.date.strftime('%Y%m%d')}-{self._get_next_sequence()}",
            'alert_type': alert_type,
            'severity': severity_map.get(alert_type, 'medium'),
            'alert_datetime': time_slot.timestamp,
            'message': message,
            'status': 'active',
            'created_at': datetime.now()
        }

        self.data['financial_alerts'].append(alert)
        return alert

    def _apply_accounting_scenarios(
        self,
        time_slot: TimeSlot,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply active scenarios to accounting parameters"""
        result = {
            'cost_increase': 0,
            'active_scenarios': []
        }

        active_scenarios = self.scenario_manager.get_active_scenarios(
            time_slot.timestamp,
            context
        )

        for scenario in active_scenarios:
            effect = scenario.get_effect(time_slot.timestamp, context)

            if 'cost_increase' in effect.affected_metrics:
                result['cost_increase'] += effect.affected_metrics['cost_increase']

            result['active_scenarios'].append({
                'id': scenario.id,
                'name': scenario.name
            })

        return result

    def generate_monthly_budget(
        self,
        year_month: str
    ) -> List[Dict[str, Any]]:
        """Generate monthly budget records for all accounts"""
        records = []

        for account_code, account_info in self.ACCOUNTS.items():
            if account_info['type'] in ['expense', 'revenue']:
                budget = random.uniform(10000000, 100000000)
                actual = budget * random.uniform(0.85, 1.15)

                record = {
                    'id': str(uuid.uuid4()),
                    'tenant_id': self.tenant_id,
                    'period': year_month,
                    'account_code': account_code,
                    'account_name': account_info['name'],
                    'cost_center': f"CC{random.randint(100, 999)}",
                    'budget_amount': round(budget, 2),
                    'actual_amount': round(actual, 2),
                    'variance_amount': round(actual - budget, 2),
                    'variance_pct': round((actual - budget) / budget * 100, 2) if budget > 0 else 0,
                    'status': 'favorable' if actual < budget else 'unfavorable',
                    'created_at': datetime.now()
                }

                records.append(record)

        self.data['budget_records'].extend(records)
        return records

    def get_data(self) -> Dict[str, List]:
        """Get all generated data"""
        return self.data

    def get_summary(self) -> Dict[str, Any]:
        """Get generation summary"""
        total_revenue = sum(
            e['total_debit'] for e in self.data['journal_entries']
            if e['journal_type'] == JournalType.SALES.value
        )

        total_cost = sum(c['total_cost'] for c in self.data['cost_records'])

        return {
            'total_journal_entries': len(self.data['journal_entries']),
            'total_journal_lines': len(self.data['journal_lines']),
            'total_cost_records': len(self.data['cost_records']),
            'total_budget_records': len(self.data['budget_records']),
            'total_revenue': round(total_revenue, 2),
            'total_production_cost': round(total_cost, 2),
            'total_alerts': len(self.data['financial_alerts'])
        }
