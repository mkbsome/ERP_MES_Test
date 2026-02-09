# ERP-MES 시나리오 기반 데이터 생성기

## 개요

모듈별 시나리오(YAML)를 정의하고, 비즈니스 흐름에 맞게 연결된 데이터를 생성합니다.

## 생성 데이터

- **기간**: 2024년 1월 ~ 현재
- **기준정보**: 고객 50, 공급업체 30, 제품 100, 창고 5, 라인 5, 설비 25
- **HR**: 부서 15, 직급 8, 직원 150, 근태/급여 3개월
- **영업**: 월 50건 수주 → 출하
- **구매**: 월 40건 발주 → 입고 → 재고
- **생산**: 월 80건 제조오더 → MES작업 → 실적/불량

## 설치

```bash
cd data-generator
pip install -r requirements.txt
```

## 사용법

```bash
# 전체 모듈 생성
python main.py

# 기존 데이터 삭제 후 생성
python main.py --clean

# 특정 모듈만 생성
python main.py --module master
python main.py --module hr
python main.py --module sales
python main.py --module purchase
python main.py --module production
```

## 시나리오 파일

```
scenarios/
├── master.yaml      # 기준정보 (고객, 공급업체, 제품, 창고, 라인, 설비)
├── sales.yaml       # 영업 (수주 → 출하)
├── purchase.yaml    # 구매 (발주 → 입고 → 재고)
├── production.yaml  # 생산 (제조오더 → MES → 실적)
└── hr.yaml          # HR (부서, 직급, 직원, 근태, 급여)
```

## 시나리오 수정 예시

### 월별 수주 건수 변경
```yaml
# scenarios/sales.yaml
sales_scenario:
  sales_orders:
    monthly_count: 100  # 50 → 100으로 증가
```

### 양품율 조정
```yaml
# scenarios/production.yaml
production_scenario:
  production_results:
    yield_rate:
      avg: 95%   # 97% → 95%로 낮춤
```

### 직원 수 조정
```yaml
# scenarios/hr.yaml
hr_scenario:
  employees:
    total_count: 200  # 150 → 200으로 증가
```

## 데이터 흐름

```
[기준정보]
고객/공급업체/제품/창고/라인/설비

    ↓

[HR]
부서 → 직급 → 직원 → 근태 → 급여

    ↓

[영업]
고객 → 수주(SO) → 수주품목 → 출하(SH)

    ↓

[생산]
수주 → 제조오더(WO) → MES작업(MO) → 생산실적 → 불량상세

    ↓

[구매]
공급업체 → 발주(PO) → 발주품목 → 입고(GR) → 재고
```

## 설정 (config.py)

```python
# DB 연결
DB_CONFIG = {
    'host': 'localhost',
    'database': 'erp_mes_db',
    ...
}

# 생성 기간
DATA_PERIOD = {
    'start': date(2024, 1, 1),
    'end': date.today()
}
```
