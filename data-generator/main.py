#!/usr/bin/env python3
"""
ERP-MES 시나리오 기반 데이터 생성기

모듈별 시나리오(YAML)를 읽어 연결된 데이터를 생성합니다.
- 과거 1년 히스토리 데이터
- 현재 진행중인 트랜잭션

Usage:
    python main.py              # 전체 생성
    python main.py --module sales   # 특정 모듈만
    python main.py --clean          # 기존 데이터 삭제 후 생성
"""

import argparse
import sys
from datetime import datetime

from generators import (
    MasterDataGenerator,
    SalesDataGenerator,
    PurchaseDataGenerator,
    ProductionDataGenerator,
    HRDataGenerator,
)
from db_connection import truncate_tables
from config import DATA_PERIOD

# 초기화 대상 테이블 (순서 중요: FK 의존성)
TABLES_TO_TRUNCATE = [
    # 트랜잭션 (자식 먼저)
    'erp_payroll',
    'erp_attendance',
    'mes_defect_detail',
    'mes_production_result',
    'mes_equipment_oee',
    'mes_production_order',
    'erp_work_order',
    'erp_shipment',
    'erp_sales_order_item',
    'erp_sales_order',
    'erp_goods_receipt_item',
    'erp_goods_receipt',
    'erp_purchase_order_item',
    'erp_purchase_order',
    'erp_inventory_stock',
    # 마스터 (부모)
    'erp_employee',
    'erp_position',
    'erp_department',
    'mes_equipment',
    'mes_production_line',
    'erp_warehouse',
    'erp_product_master',
    'erp_vendor_master',
    'erp_customer_master',
]

def run_all():
    """전체 모듈 생성"""
    print("=" * 60)
    print("ERP-MES 시나리오 기반 데이터 생성기")
    print(f"생성 기간: {DATA_PERIOD['start']} ~ {DATA_PERIOD['end']}")
    print("=" * 60)
    print()

    start_time = datetime.now()

    # 1. 기준정보 (다른 모듈의 기반)
    MasterDataGenerator().generate()

    # 2. HR (직원 정보 필요)
    HRDataGenerator().generate()

    # 3. 영업 (수주 → 출하)
    SalesDataGenerator().generate()

    # 4. 구매 (발주 → 입고 → 재고)
    PurchaseDataGenerator().generate()

    # 5. 생산 (제조오더 → MES → 실적)
    ProductionDataGenerator().generate()

    elapsed = datetime.now() - start_time
    print("=" * 60)
    print(f"전체 데이터 생성 완료! (소요시간: {elapsed})")
    print("=" * 60)

def run_module(module_name):
    """특정 모듈만 생성"""
    generators = {
        'master': MasterDataGenerator,
        'hr': HRDataGenerator,
        'sales': SalesDataGenerator,
        'purchase': PurchaseDataGenerator,
        'production': ProductionDataGenerator,
    }

    if module_name not in generators:
        print(f"알 수 없는 모듈: {module_name}")
        print(f"사용 가능: {', '.join(generators.keys())}")
        sys.exit(1)

    print(f"=== {module_name.upper()} 모듈 생성 ===")
    generators[module_name]().generate()

def main():
    parser = argparse.ArgumentParser(description='ERP-MES 데이터 생성기')
    parser.add_argument('--module', '-m', help='특정 모듈만 생성 (master, hr, sales, purchase, production)')
    parser.add_argument('--clean', '-c', action='store_true', help='기존 데이터 삭제 후 생성')

    args = parser.parse_args()

    # 데이터 초기화
    if args.clean:
        print("기존 데이터 삭제 중...")
        truncate_tables(TABLES_TO_TRUNCATE)
        print()

    # 생성 실행
    if args.module:
        run_module(args.module)
    else:
        run_all()

if __name__ == '__main__':
    main()
