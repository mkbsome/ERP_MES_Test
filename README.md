# ERP/MES Simulator

GreenBoard Electronics 가상 기업을 위한 ERP/MES 데이터 시뮬레이터

## 개요

이 시뮬레이터는 PCB 제조 중견기업 (주)그린보드 일렉트로닉스를 가상으로 구현하여:

1. **AI 플랫폼 테스트 데이터** - Judgment Engine, Workflow, BI Service 검증용
2. **데모/영업용 시나리오** - 현실적인 제조 데이터로 고객 시연
3. **통합 테스트 환경** - End-to-End 시스템 검증

## 빠른 시작

### 필수 요구사항
- Python 3.9+
- Node.js 18+
- PostgreSQL 15+

### 실행 방법

```bash
# 전체 서비스 일괄 실행 (권장)
Start-all.bat
```

실행 후 자동으로 브라우저가 열립니다:
- **MES UI**: http://localhost:5173
- **Scenario Modifier**: http://localhost:5174
- **API Docs**: http://localhost:8000/docs

### 개별 실행

| 배치 파일 | 설명 | 포트 |
|-----------|------|------|
| `Start-all.bat` | 전체 서비스 (API + UI 2개) | 8000, 5173, 5174 |
| `start-api.bat` | API 서버만 | 8000 |
| `start-mes-ui.bat` | MES UI만 | 5173 |
| `start-scenario-ui.bat` | Scenario Modifier UI만 | 5174 |

## UI 구성

### 1. MES UI (포트 5173)
실제 MES 시스템 스타일의 화면
- 생산 현황 모니터링
- 불량 관리
- 설비 모니터링
- 품질 관리
- 재고/자재 관리

### 2. Scenario Modifier UI (포트 5174)
AI 이상탐지 테스트를 위한 데이터 조작 도구
- 데이터 현황 대시보드
- 시나리오 적용 (불량률 증가, 설비 문제 등)
- 수정 이력 관리

## 가상 기업 프로필

| 항목 | 내용 |
|------|------|
| 회사명 | (주)그린보드 일렉트로닉스 |
| 업종 | 전자부품/PCB 제조 |
| 규모 | 직원 350명, 연매출 1,800억원 |
| 생산시설 | 2개 공장, 15개 라인 |
| 제품군 | 메인보드, 전원보드, LED 드라이버, IoT 모듈, 자동차용 보드 |

## 데이터 규모

### 마스터 데이터
- 고객: 150개 (국내 70%, 수출 30%)
- 공급업체: 200개
- 완제품: 50종 (5개 제품군 × 10개 변형)
- 자재/부품: 3,000종
- 설비: 150대
- 작업자: 180명 (3교대)

### 거래 데이터 (일별)
- 판매주문: 30-50건
- 구매발주: 20-40건
- 생산지시: 80-120건
- 생산실적: 2,000-3,000건
- 품질검사: 500-800건
- 불량기록: 50-150건
- 설비이벤트: 500-1,000건

### 시뮬레이션 기간
- 기본: 180일 (2024-07-01 ~ 2024-12-31)

## 설치

### 1. 저장소 클론
```bash
git clone https://github.com/mkbsome/ERP_MES_Test.git
cd ERP_MES_Test
```

### 2. Python 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. Node.js 의존성 설치
```bash
# MES UI
cd ui
npm install

# Scenario Modifier UI
cd ../scenario-modifier-ui
npm install
```

### 4. PostgreSQL 데이터베이스 설정
```bash
# 데이터베이스 생성
createdb erp_mes_db

# 또는 Docker 사용
docker-compose up -d
```

### 5. 환경 변수 설정
```bash
# .env 파일 생성 (필요시)
DATABASE_URL=postgresql://postgres:solutiontree8789@localhost:5432/erp_mes_db
```

## 사용법

### 1. 데이터베이스 초기화

```bash
# 스키마 생성만
python main.py --init-db

# 기존 데이터 삭제 후 초기화 (주의!)
python main.py --init-db --drop-existing
```

### 2. 마스터 데이터 생성

```bash
# 마스터 데이터만 생성
python main.py --generate-master

# DB 초기화 + 마스터 데이터 생성
python main.py --init-db --generate-master
```

### 3. 전체 데이터 생성

```bash
# 마스터 + 거래 데이터 생성
python main.py --generate-all
```

### 4. 데이터 내보내기

```bash
# CSV로 내보내기
python main.py --generate-master --export-csv ./output/csv

# JSON으로 내보내기
python main.py --generate-master --export-json ./output/json

# SQL INSERT 문으로 내보내기
python main.py --generate-master --export-sql ./output/sql

# DB 없이 내보내기만
python main.py --generate-master --no-db --export-csv ./output
```

### 5. ETL 실행 (AI 플랫폼 연계)

```bash
# AI 플랫폼 테이블 생성
python etl/raw_to_fact.py --create-tables

# ETL 파이프라인 실행
python etl/raw_to_fact.py --run-etl

# 특정 날짜만 ETL
python etl/raw_to_fact.py --run-etl --date 2024-07-01
```

## 프로젝트 구조

```
erp-mes-simulator/
├── Start-all.bat              # 전체 서비스 실행
├── start-api.bat              # API 서버 실행
├── start-mes-ui.bat           # MES UI 실행
├── start-scenario-ui.bat      # Scenario Modifier 실행
├── main.py                    # 메인 실행 스크립트
├── requirements.txt           # Python 의존성
├── api/                       # FastAPI 백엔드
│   ├── main.py
│   └── routers/
├── ui/                        # MES UI (React + Vite)
│   ├── src/
│   └── package.json
├── scenario-modifier-ui/      # Scenario Modifier UI (React + Vite)
│   ├── src/
│   └── package.json
├── config/
│   └── company.yaml           # 가상 기업 설정
├── schema/
│   ├── erp/                   # ERP DDL
│   ├── mes/                   # MES DDL
│   └── interface/             # 연동 DDL
├── generators/
│   ├── master/                # 마스터 데이터 생성
│   └── transaction/           # 거래 데이터 생성
└── etl/
    └── raw_to_fact.py         # AI 플랫폼 연계 ETL
```

## ERP 모듈

| 모듈 | 설명 | 주요 테이블 |
|------|------|------------|
| SD (판매) | 수주, 출하, 매출 | erp_sales_order, erp_shipment |
| MM (구매) | 발주, 입고, 매입 | erp_purchase_order, erp_goods_receipt |
| IM (재고) | 자재/재공/완제품 | erp_inventory_stock, erp_inventory_transaction |
| PP (생산) | BOM, MRP, 작업지시 | erp_bom_*, erp_work_order |
| QM (품질) | 수입/공정/출하검사 | erp_inspection_lot, erp_defect_record |
| CO (원가) | 표준/실제원가 | erp_standard_cost, erp_actual_cost |

## MES 모듈

| 모듈 | 설명 | 주요 테이블 |
|------|------|------------|
| 생산실적 | 실시간 생산량 | mes_production_result, mes_realtime_production |
| 설비관리 | OEE, 다운타임 | mes_equipment_oee, mes_downtime_event |
| 품질관리 | SPC, 불량분석 | mes_spc_data, mes_defect_detail |
| 자재관리 | 피더/릴 관리 | mes_feeder_setup, mes_reel_inventory |
| 추적성 | LOT/Serial 추적 | mes_traceability |

## 시나리오

### 1. 정상 운영 (Normal)
- 불량률: 1.5% (표준편차 0.5%)
- OEE: 85%

### 2. 품질 이상 (Quality Issue)
- 특정 라인에서 불량률 3배 증가
- 트리거: 2024-09-15, 2024-11-20 (5일간)

### 3. 설비 문제 (Equipment Issue)
- 다운타임 5배 증가
- 트리거: 2024-08-20, 2024-10-10 (3일간)

### 4. 자재 문제 (Material Issue)
- 특정 공급업체 부품 불량
- 트리거: 2024-10-01 (7일간)

## AI 플랫폼 연계

### Judgment Engine 입력 예시

```json
{
  "workflow_id": "WF-DEFECT-DETECTION",
  "judgment_context": "quality_anomaly_detection",
  "input_data": {
    "date": "2024-07-15",
    "line_code": "SMT-L01",
    "defect_rate": 0.035,
    "top_defect_types": [{"type": "BRIDGE", "count": 15}],
    "equipment_oee": 0.72
  }
}
```

### ETL 데이터 흐름

```
ERP/MES Tables → raw_* (Staging) → dim_* (Dimension) → fact_* (Fact)
```

## 환경 변수

```bash
# 데이터베이스 연결
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_mes_simulator
```

## 라이선스

내부 프로젝트용
