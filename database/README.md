# ERP-MES 통합 시스템 데이터베이스

## 개요

PostgreSQL 기반의 ERP-MES 통합 시스템 데이터베이스 스키마입니다.

## 구조

```
database/
├── schema/
│   ├── 001_create_tables.sql    # 테이블 생성 (75개 테이블)
│   └── 002_seed_data.sql        # 초기 데이터
└── README.md
```

## 빠른 시작

### 1. PostgreSQL 설치

```bash
# Windows (Chocolatey)
choco install postgresql

# macOS (Homebrew)
brew install postgresql
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE erp_mes_db;
CREATE USER erp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE erp_mes_db TO erp_user;
\q
```

### 3. 스키마 실행

```bash
# 테이블 생성
psql -U erp_user -d erp_mes_db -f database/schema/001_create_tables.sql

# 초기 데이터 로드
psql -U erp_user -d erp_mes_db -f database/schema/002_seed_data.sql
```

## 테이블 구조

### ERP 모듈 (47개 테이블)

| 모듈 | 테이블 수 | 주요 테이블 |
|------|----------|------------|
| **기준정보** | 8 | erp_product_master, erp_customer_master, erp_vendor_master, erp_bom_*, erp_routing_* |
| **영업관리** | 5 | erp_sales_order, erp_shipment, erp_sales_revenue |
| **구매관리** | 5 | erp_purchase_order, erp_goods_receipt, erp_purchase_invoice |
| **재고관리** | 4 | erp_inventory_stock, erp_inventory_transaction, erp_inventory_adjustment |
| **생산관리** | 4 | erp_mps, erp_mrp, erp_work_order, erp_production_result |
| **원가관리** | 5 | erp_account_code, erp_cost_center, erp_standard_cost, erp_actual_cost, erp_cost_variance |
| **자산관리** | 4 | erp_fixed_asset, erp_depreciation_schedule, erp_asset_transaction, erp_asset_maintenance |
| **재무회계** | 8 | erp_fiscal_period, erp_voucher, erp_general_ledger, erp_accounts_payable, erp_accounts_receivable, erp_cash_flow |
| **관리회계** | 4 | erp_profit_loss, erp_profitability_product, erp_profitability_customer, erp_budget |
| **인사관리** | 5 | erp_department, erp_position, erp_employee, erp_attendance, erp_payroll |

### MES 모듈 (21개 테이블)

| 모듈 | 테이블 수 | 주요 테이블 |
|------|----------|------------|
| **생산관리** | 5 | mes_production_line, mes_equipment, mes_production_order, mes_production_result, mes_realtime_production |
| **품질관리** | 5 | mes_defect_type, mes_defect_detail, mes_inspection_result, mes_spc_data, mes_traceability |
| **설비관리** | 4 | mes_equipment_status, mes_equipment_oee, mes_downtime_event, mes_equipment_maintenance |
| **자재관리** | 4 | mes_feeder_setup, mes_material_consumption, mes_material_request, mes_material_inventory |

### 시스템 (7개 테이블)

| 테이블 | 설명 |
|--------|------|
| sys_role | 역할 |
| sys_user | 사용자 |
| sys_menu | 메뉴 |
| sys_permission | 권한 |
| sys_audit_log | 감사로그 |
| sys_config | 시스템설정 |
| if_interface_log | 인터페이스 로그 |

## 데이터 흐름 (ERD)

### 영업 → 생산 → 출하 → 회계

```
erp_sales_order (수주)
    │
    ├──→ erp_sales_order_item
    │
    ├──→ erp_work_order (제조오더)
    │       │
    │       └──→ mes_production_order (MES 작업지시)
    │               │
    │               ├──→ mes_production_result (생산실적)
    │               │
    │               └──→ mes_defect_detail (불량)
    │
    ├──→ erp_inventory_transaction (재고 입고)
    │       │
    │       └──→ erp_inventory_stock (재고 현황)
    │
    ├──→ erp_shipment (출하)
    │       │
    │       ├──→ erp_shipment_item
    │       │
    │       └──→ erp_inventory_transaction (재고 출고)
    │
    └──→ erp_sales_revenue (매출)
            │
            ├──→ erp_accounts_receivable (미수금)
            │
            └──→ erp_voucher (전표)
                    │
                    └──→ erp_general_ledger (총계정원장)
```

### 구매 → 입고 → 재고

```
erp_purchase_order (발주)
    │
    ├──→ erp_purchase_order_item
    │
    └──→ erp_goods_receipt (입고)
            │
            ├──→ erp_goods_receipt_item
            │
            ├──→ erp_inventory_transaction (재고 입고)
            │
            └──→ erp_purchase_invoice (매입)
                    │
                    ├──→ erp_accounts_payable (미지급금)
                    │
                    └──→ erp_voucher (전표)
```

### 자산관리 흐름

```
erp_fixed_asset (고정자산)
    │
    ├──→ erp_depreciation_schedule (감가상각 스케줄)
    │       │
    │       └──→ erp_voucher (감가상각 전표)
    │
    ├──→ erp_asset_transaction (자산 이동/처분)
    │
    └──→ erp_asset_maintenance (유지보수 이력)
```

## 주요 기능

### 1. 다중 테넌트 지원

모든 테이블에 `tenant_id` (UUID) 컬럼이 포함되어 다중 테넌트 환경을 지원합니다.

```sql
-- 테넌트 필터링 예시
SELECT * FROM erp_sales_order
WHERE tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

### 2. 자동 타임스탬프

`updated_at` 컬럼은 트리거를 통해 자동으로 갱신됩니다.

### 3. 계산 컬럼 (Generated Columns)

```sql
-- 잔량 자동 계산
remaining_qty NUMERIC(12,3) GENERATED ALWAYS AS (order_qty - shipped_qty) STORED

-- 가용재고 자동 계산
available_qty NUMERIC(12,3) GENERATED ALWAYS AS (quantity - reserved_qty) STORED

-- 원가 합계 자동 계산
total_cost NUMERIC(15,2) GENERATED ALWAYS AS (material_cost + labor_cost + overhead_cost) STORED
```

### 4. 참조 무결성

모든 FK 관계가 설정되어 있으며, 삭제 시 CASCADE 또는 제약이 적용됩니다.

### 5. 인덱스 최적화

자주 조회되는 컬럼에 인덱스가 생성되어 있습니다:
- tenant_id
- 상태(status) 컬럼
- 날짜 컬럼
- 코드 컬럼

## 초기 데이터

| 데이터 | 건수 | 설명 |
|--------|------|------|
| 계정과목 | 55개 | 자산/부채/자본/수익/비용 계정 |
| 원가센터 | 9개 | 생산/관리/영업/R&D |
| 창고 | 6개 | 원자재/재공품/완제품/MRO |
| 부서 | 12개 | 조직 구조 |
| 직급 | 8개 | 직급 체계 |
| 회계기간 | 15개 | 2024-2025년 |
| 품목 | 21개 | 완제품/반제품/원자재/포장재 |
| 고객 | 7개 | 국내/해외 고객 |
| 거래처 | 6개 | 제조사/유통사 |
| 생산라인 | 8개 | SMT/DIP/조립/검사/포장 |
| 불량유형 | 11개 | 솔더/부품/PCB/기능/외관 |
| 시스템설정 | 10개 | 기본 설정값 |

## 백업 및 복구

```bash
# 백업
pg_dump -U erp_user -d erp_mes_db -F c -f backup.dump

# 복구
pg_restore -U erp_user -d erp_mes_db -c backup.dump
```

## 연결 설정 예시

### Python (SQLAlchemy)

```python
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://erp_user:password@localhost:5432/erp_mes_db"
engine = create_engine(DATABASE_URL)
```

### Node.js (pg)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_mes_db',
  password: 'password',
  port: 5432,
});
```

## 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-01 | 초기 스키마 생성 |
