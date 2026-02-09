# AI 사례 분석 및 데이터 생성기 설계

## 1. AI 사례 종합 분석

### 1.1 V7 Intent 기반 14가지 핵심 사례

솔루션의 V7 Intent 체계를 기반으로 데이터 생성기가 지원해야 할 AI 사례들입니다.

| V7 Intent | 설명 | 필요 데이터 패턴 |
|-----------|------|-----------------|
| CHECK | 현재 상태/수치 조회 | 정상 범위 데이터 + 간헐적 이상 |
| TREND | 시간별 변화/추이 | 시계열 데이터 (증가/감소/계절성) |
| COMPARE | 대상 비교 | 라인별/제품별 차이가 있는 데이터 |
| RANK | 순위/최대/최소 | 순위 변동이 있는 데이터 |
| FIND_CAUSE | 원인 분석 | 상관관계 있는 다변량 데이터 |
| DETECT_ANOMALY | 이상/문제 탐지 | 이상치가 포함된 데이터 |
| PREDICT | 미래 예측 | 트렌드와 패턴이 있는 시계열 |
| WHAT_IF | 가정/시뮬레이션 | 파라미터 변경 가능한 데이터 |
| REPORT | 보고서/차트 생성 | BI용 집계 데이터 |
| NOTIFY | 알림/워크플로우 설정 | 임계값 초과 이벤트 |

---

### 1.2 Judgment Engine 사례 (Rule + LLM Hybrid)

#### 1.2.1 품질 상태 판단 (Quality Status Judgment)
```yaml
시나리오: "오늘 SMT-L01 라인의 품질 상태를 판단해줘"
입력_데이터:
  - defect_rate: 0.025 (2.5%)
  - defect_types: [{type: "BRIDGE", count: 15}, {type: "MISSING", count: 8}]
  - production_count: 1000
  - lot_change_count: 3
필요_패턴:
  - 정상: defect_rate < 2%
  - 경고: 2% <= defect_rate < 5%
  - 위험: defect_rate >= 5%
  - LOT 변경 후 불량률 상승 패턴
```

#### 1.2.2 설비 이상 탐지 (Equipment Anomaly Detection)
```yaml
시나리오: "SMT-L01-MOUNTER-01 설비의 이상 여부를 탐지해줘"
입력_데이터:
  - temperature: [260, 262, 265, 280, 295, 310]  # 급상승
  - vibration: [0.5, 0.5, 0.6, 0.8, 1.2, 2.0]   # 급상승
  - mtbf_hours: 480  # 평균고장간격
  - current_run_hours: 420  # 현재 가동시간
필요_패턴:
  - 센서값 급상승/급하락
  - MTBF 기반 고장 예측
  - 진동/온도 상관관계
```

#### 1.2.3 근본 원인 분석 (Root Cause Analysis)
```yaml
시나리오: "오늘 SMT-L01 라인 불량률이 왜 높은지 분석해줘"
입력_데이터:
  - defect_rate: 0.05 (5%)
  - top_defects: [{"BRIDGE": 45}, {"MISSING": 20}]
  - material_lot: "LOT-2024-001"
  - equipment_oee: 0.72
  - ambient_temperature: 28.5
  - humidity: 75%
필요_패턴:
  - 자재 LOT 변경과 불량률 상관
  - 설비 OEE 하락과 불량률 상관
  - 환경 조건(온습도)과 불량률 상관
```

#### 1.2.4 예지보전 (Predictive Maintenance)
```yaml
시나리오: "SMT-L01-MOUNTER-01 설비의 고장 가능성을 예측해줘"
입력_데이터:
  - run_hours_since_maintenance: 720
  - mtbf: 800
  - temperature_trend: "increasing"
  - vibration_level: 1.5 (threshold: 2.0)
  - error_count_7days: 12
필요_패턴:
  - 가동시간/MTBF 비율
  - 센서값 트렌드 (안정/상승/하락)
  - 과거 에러 빈도 증가
```

#### 1.2.5 최적화 권고 (Optimization Recommendation)
```yaml
시나리오: "SMT-L01 라인의 생산성을 어떻게 개선할 수 있을까?"
입력_데이터:
  - current_oee: 0.75
  - availability: 0.88
  - performance: 0.90
  - quality: 0.95
  - bottleneck_equipment: "SMT-L01-REFLOW-01"
  - downtime_top_reasons: ["changeover", "material_wait"]
필요_패턴:
  - OEE 구성요소별 분석
  - 병목 설비 식별
  - 다운타임 원인 분석
```

---

### 1.3 BI Service 분석 사례

#### 1.3.1 트렌드 분석 (Trend Analysis)
```yaml
시나리오: "지난 7일간 SMT 라인들의 불량률 추이를 보여줘"
필요_데이터:
  - 일별 라인별 불량률
  - 7일 이상의 연속 데이터
  - 상승/하락 트렌드 패턴
```

#### 1.3.2 비교 분석 (Comparison Analysis)
```yaml
시나리오: "이번 주 SMT-L01과 SMT-L02의 생산성을 비교해줘"
필요_데이터:
  - 라인별 일별 생산량
  - 라인별 OEE
  - 라인별 가동시간
```

#### 1.3.3 순위 분석 (Ranking Analysis)
```yaml
시나리오: "이번 달 불량률이 가장 높은 설비 Top 5를 알려줘"
필요_데이터:
  - 설비별 월간 불량률 집계
  - 설비별 생산량
```

#### 1.3.4 이상 탐지 분석 (Anomaly Detection)
```yaml
시나리오: "오늘 비정상적으로 높은 불량률을 보인 라인이 있어?"
필요_데이터:
  - 과거 30일 평균 불량률
  - 표준편차 기반 임계값
  - 당일 불량률
```

#### 1.3.5 요약 분석 (Summary Analysis)
```yaml
시나리오: "이번 주 생산 현황을 요약해줘"
필요_데이터:
  - 주간 총 생산량
  - 주간 평균 불량률
  - 주간 OEE
  - 전주 대비 증감
```

---

### 1.4 Workflow Service 시나리오

#### 1.4.1 품질 이상 대응 Workflow
```yaml
트리거: defect_rate > 0.03 (3%)
Step1: DATA - 최근 1시간 불량 데이터 조회
Step2: JUDGMENT - 불량 원인 분석
Step3: SWITCH - severity 기준 분기
Step4_critical: ACTION - 라인 정지 + 담당자 호출
Step4_warning: ACTION - 담당자 알림
Step5: WAIT - 피드백 대기
```

#### 1.4.2 설비 예지보전 Workflow
```yaml
트리거: scheduled (daily 06:00)
Step1: DATA - 전일 설비 상태 조회
Step2: JUDGMENT - 고장 예측 점수 계산
Step3: SWITCH - risk_score 기준 분기
Step4_high: ACTION - 유지보수 작업 생성
Step4_medium: ACTION - 모니터링 강화 알림
```

#### 1.4.3 자재 부족 예측 Workflow
```yaml
트리거: inventory_level < safety_stock
Step1: DATA - 현재 재고 및 소비 추이 조회
Step2: JUDGMENT - 부족 시점 예측
Step3: ACTION - 구매요청 자동 생성
Step4: ACTION - 담당자 알림
```

---

### 1.5 PCB/SMT 제조 특화 사례

#### 1.5.1 솔더 불량 분석
```yaml
불량_유형:
  - BRIDGE (솔더 브릿지): 땜납 과다
  - MISSING (부품 누락): 부품 미삽입
  - TOMBSTONE (부품 들림): 열 불균형
  - COLD_SOLDER (냉납): 온도 부족
  - SOLDER_BALL (솔더볼): 플럭스 잔류
  - INSUFFICIENT (미납): 땜납 부족

원인_연관:
  - BRIDGE → 스텐실 마모, 스퀴지 압력
  - MISSING → 피더 에러, 진공 노즐
  - TOMBSTONE → 리플로우 온도 프로파일
```

#### 1.5.2 SPI/AOI 검사 데이터
```yaml
SPI (Solder Paste Inspection):
  - volume_percent: 솔더 체적 비율 (정상: 80-120%)
  - height_um: 솔더 높이 (정상: 100-150um)
  - area_percent: 면적 비율 (정상: 90-110%)
  - offset_x_um, offset_y_um: 위치 편차

AOI (Automated Optical Inspection):
  - defect_type: 불량 유형
  - component_id: 부품 위치
  - confidence: 검출 신뢰도
```

#### 1.5.3 리플로우 프로파일
```yaml
zone_temperatures:
  - preheat: [150, 160, 170, 180]  # 예열 구간
  - soak: [180, 185, 190, 195]     # 활성화 구간
  - reflow: [220, 245, 260, 245]   # 리플로우 구간
  - cooling: [200, 150, 100, 50]   # 냉각 구간

이상_패턴:
  - peak_temp > 260: 부품 손상 위험
  - soak_time < 60s: 냉납 위험
  - cooling_rate > 4°C/s: 열충격 위험
```

---

## 2. 데이터 생성기 아키텍처 설계

### 2.1 설계 원칙

```
1. 기본 데이터 연속 생성 (Base Data Generation)
   - 정상 운영 데이터를 기본으로 생성
   - 실제 제조 환경과 유사한 분포

2. 시나리오 기반 이상 주입 (Scenario-Based Anomaly Injection)
   - AI 사례별로 필요한 이상 패턴 정의
   - 시나리오를 선택적으로 활성화/비활성화

3. 상관관계 유지 (Correlation Maintenance)
   - 자재 LOT → 불량률 상관
   - 설비 상태 → 품질 상관
   - 환경 조건 → 불량률 상관

4. 시간 연속성 (Time Continuity)
   - 과거 데이터와 현재 데이터의 연속성
   - 트렌드와 계절성 반영
```

### 2.2 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Generator Engine                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Configuration Layer                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Company      │  │ Scenario     │  │ Time         │   │   │
│  │  │ Profile      │  │ Config       │  │ Config       │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Scenario Manager                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │ Quality    │  │ Equipment  │  │ Material   │        │   │
│  │  │ Scenarios  │  │ Scenarios  │  │ Scenarios  │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │ Production │  │ Environment│  │ Supply     │        │   │
│  │  │ Scenarios  │  │ Scenarios  │  │ Chain      │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Data Generator Layer                         │   │
│  │  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ MES Generators │  │ ERP Generators │                 │   │
│  │  ├────────────────┤  ├────────────────┤                 │   │
│  │  │ - Production   │  │ - Sales Order  │                 │   │
│  │  │ - Equipment    │  │ - Purchase     │                 │   │
│  │  │ - Quality      │  │ - Inventory    │                 │   │
│  │  │ - Material     │  │ - Accounting   │                 │   │
│  │  │ - Sensor       │  │ - HR           │                 │   │
│  │  └────────────────┘  └────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Correlation Engine                           │   │
│  │  - Material LOT ↔ Defect Rate                            │   │
│  │  - Equipment Status ↔ Quality                            │   │
│  │  - Environment ↔ Defect Pattern                          │   │
│  │  - Production Load ↔ Downtime                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Output Layer                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ PostgreSQL   │  │ Real-time    │  │ API          │   │   │
│  │  │ Writer       │  │ Stream       │  │ Endpoint     │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 디렉토리 구조

```
erp-mes-simulator/
├── generators/
│   ├── __init__.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── company_profile.yaml     # 회사 프로필
│   │   ├── scenarios.yaml           # 시나리오 설정
│   │   └── time_config.yaml         # 시간 설정
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── engine.py                # 메인 생성 엔진
│   │   ├── scenario_manager.py      # 시나리오 관리
│   │   ├── correlation_engine.py    # 상관관계 엔진
│   │   └── time_manager.py          # 시간 관리
│   │
│   ├── scenarios/
│   │   ├── __init__.py
│   │   ├── base_scenario.py         # 시나리오 베이스 클래스
│   │   ├── quality_scenarios.py     # 품질 시나리오들
│   │   ├── equipment_scenarios.py   # 설비 시나리오들
│   │   ├── material_scenarios.py    # 자재 시나리오들
│   │   ├── production_scenarios.py  # 생산 시나리오들
│   │   └── environment_scenarios.py # 환경 시나리오들
│   │
│   ├── mes/
│   │   ├── __init__.py
│   │   ├── production_generator.py  # 생산실적 생성
│   │   ├── equipment_generator.py   # 설비 데이터 생성
│   │   ├── quality_generator.py     # 품질 데이터 생성
│   │   ├── material_generator.py    # 자재 데이터 생성
│   │   └── sensor_generator.py      # 센서 데이터 생성
│   │
│   ├── erp/
│   │   ├── __init__.py
│   │   ├── sales_generator.py       # 영업 데이터 생성
│   │   ├── purchase_generator.py    # 구매 데이터 생성
│   │   ├── inventory_generator.py   # 재고 데이터 생성
│   │   └── accounting_generator.py  # 회계 데이터 생성
│   │
│   ├── writers/
│   │   ├── __init__.py
│   │   ├── db_writer.py             # PostgreSQL 저장
│   │   ├── stream_writer.py         # 실시간 스트림
│   │   └── file_writer.py           # 파일 저장
│   │
│   └── cli.py                       # CLI 인터페이스
```

---

## 3. 시나리오 설계

### 3.1 시나리오 설정 파일 (scenarios.yaml)

```yaml
scenarios:
  # ============================================================
  # 품질 시나리오
  # ============================================================
  quality_scenarios:
    # 시나리오 1: 불량률 급증
    defect_rate_spike:
      enabled: true
      trigger:
        type: scheduled
        start_date: "2024-08-15"
        duration_days: 3
      target:
        lines: ["SMT-L01"]
      parameters:
        base_defect_rate: 0.015
        spike_defect_rate: 0.06
        dominant_defect: "BRIDGE"
      correlation:
        cause: "material_lot"
        lot_id: "LOT-2024-0815"

    # 시나리오 2: 특정 불량 유형 증가
    specific_defect_increase:
      enabled: true
      trigger:
        type: condition
        condition: "humidity > 70"
      target:
        lines: ["SMT-L01", "SMT-L02"]
      parameters:
        affected_defect: "TOMBSTONE"
        increase_factor: 2.5

    # 시나리오 3: 점진적 품질 저하
    gradual_quality_degradation:
      enabled: true
      trigger:
        type: scheduled
        start_date: "2024-09-01"
        duration_days: 14
      target:
        equipment: ["SMT-L01-PRINTER-01"]
      parameters:
        degradation_rate_per_day: 0.002
        related_defect: "INSUFFICIENT"

  # ============================================================
  # 설비 시나리오
  # ============================================================
  equipment_scenarios:
    # 시나리오 1: 설비 고장 임박
    equipment_failure_imminent:
      enabled: true
      trigger:
        type: condition
        condition: "run_hours / mtbf > 0.9"
      target:
        equipment: ["SMT-L01-MOUNTER-01"]
      parameters:
        sensor_pattern: "increasing"
        temperature_increase_rate: 2.0  # °C per day
        vibration_increase_rate: 0.1    # mm/s per day

    # 시나리오 2: 돌발 고장
    sudden_breakdown:
      enabled: true
      trigger:
        type: random
        probability: 0.02  # 2% 확률로 발생
      target:
        equipment_types: ["MOUNTER", "REFLOW"]
      parameters:
        downtime_hours: [1, 4]  # 1~4시간 다운타임
        failure_codes: ["MOTOR_FAULT", "SENSOR_ERROR", "BOARD_FAULT"]

    # 시나리오 3: OEE 저하
    oee_degradation:
      enabled: true
      trigger:
        type: scheduled
        start_date: "2024-10-01"
        duration_days: 7
      target:
        lines: ["SMT-L02"]
      parameters:
        availability_drop: 0.10
        performance_drop: 0.08
        primary_downtime_reason: "changeover"

  # ============================================================
  # 자재 시나리오
  # ============================================================
  material_scenarios:
    # 시나리오 1: 공급업체 품질 문제
    vendor_quality_issue:
      enabled: true
      trigger:
        type: scheduled
        start_date: "2024-08-20"
        duration_days: 5
      target:
        vendor: "VENDOR-003"
        materials: ["IC-ARM-CORTEX-M4", "IC-MEMORY-DDR4"]
      parameters:
        lot_prefix: "LOT-V003"
        defect_rate_multiplier: 3.0

    # 시나리오 2: 재고 부족 위기
    inventory_shortage:
      enabled: true
      trigger:
        type: condition
        condition: "inventory_level < safety_stock"
      target:
        materials: ["CAPACITOR-0402", "RESISTOR-0603"]
      parameters:
        consumption_spike: 1.5  # 평소 대비 1.5배 소비
        lead_time_delay: 3      # 입고 지연 3일

  # ============================================================
  # 생산 시나리오
  # ============================================================
  production_scenarios:
    # 시나리오 1: 급한 주문 대응
    urgent_order_rush:
      enabled: true
      trigger:
        type: scheduled
        start_date: "2024-09-10"
        duration_days: 5
      parameters:
        production_increase: 1.4
        overtime_shifts: true
        quality_impact: 0.005  # 불량률 0.5% 상승

    # 시나리오 2: 야간 근무 품질 차이
    night_shift_quality_gap:
      enabled: true
      trigger:
        type: always
      parameters:
        day_shift_defect_base: 0.015
        night_shift_defect_multiplier: 1.3

  # ============================================================
  # 환경 시나리오
  # ============================================================
  environment_scenarios:
    # 시나리오 1: 계절적 영향
    seasonal_effect:
      enabled: true
      trigger:
        type: always
      parameters:
        summer_humidity_range: [60, 80]
        winter_humidity_range: [30, 50]
        humidity_defect_correlation:
          tombstone: 0.8   # 습도 영향 계수
          cold_solder: -0.5

    # 시나리오 2: 온도 급변
    temperature_fluctuation:
      enabled: true
      trigger:
        type: condition
        condition: "temp_delta > 5"  # 5도 이상 변화
      parameters:
        affected_equipment: ["REFLOW"]
        profile_deviation: 0.1
```

### 3.2 시나리오 클래스 설계

```python
# generators/scenarios/base_scenario.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List

@dataclass
class ScenarioTrigger:
    type: str  # 'scheduled', 'condition', 'random', 'always'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    condition: Optional[str] = None
    probability: Optional[float] = None

@dataclass
class ScenarioEffect:
    """시나리오가 데이터에 미치는 영향"""
    affected_metrics: Dict[str, float]  # 영향받는 지표와 변경 계수
    affected_entities: List[str]        # 영향받는 엔티티 (라인, 설비 등)
    correlation_data: Dict[str, Any]    # 상관관계 데이터

class BaseScenario(ABC):
    """시나리오 베이스 클래스"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.enabled = config.get('enabled', True)
        self.trigger = self._parse_trigger(config.get('trigger', {}))
        self.parameters = config.get('parameters', {})

    def _parse_trigger(self, trigger_config: Dict) -> ScenarioTrigger:
        return ScenarioTrigger(
            type=trigger_config.get('type', 'always'),
            start_date=self._parse_date(trigger_config.get('start_date')),
            condition=trigger_config.get('condition'),
            probability=trigger_config.get('probability')
        )

    @abstractmethod
    def is_active(self, current_time: datetime, context: Dict[str, Any]) -> bool:
        """시나리오 활성화 여부 확인"""
        pass

    @abstractmethod
    def get_effect(self, current_time: datetime, context: Dict[str, Any]) -> ScenarioEffect:
        """시나리오 효과 계산"""
        pass

    @abstractmethod
    def apply(self, base_data: Dict[str, Any], effect: ScenarioEffect) -> Dict[str, Any]:
        """기본 데이터에 시나리오 효과 적용"""
        pass
```

---

## 4. 상관관계 엔진 설계

### 4.1 상관관계 정의

```yaml
# 상관관계 매트릭스
correlations:
  # 자재 LOT → 품질
  material_to_quality:
    - source: material_lot.vendor
      target: defect_rate
      type: multiplicative
      factor_range: [0.8, 2.0]

  # 설비 상태 → 품질
  equipment_to_quality:
    - source: equipment.temperature
      target: defect_rate
      type: threshold
      threshold: 270
      above_threshold_factor: 1.5

    - source: equipment.vibration
      target: defect_rate
      type: linear
      coefficient: 0.02

  # 환경 → 품질
  environment_to_quality:
    - source: environment.humidity
      target: defect_types.tombstone
      type: exponential
      base: 1.05
      reference: 50  # 기준 습도 50%

  # 생산량 → 설비 상태
  production_to_equipment:
    - source: production.daily_output
      target: equipment.mttr
      type: multiplicative
      factor: 0.001
```

### 4.2 상관관계 엔진 구현

```python
# generators/core/correlation_engine.py
from dataclasses import dataclass
from typing import Dict, Any, List, Callable
import math

@dataclass
class Correlation:
    source_metric: str
    target_metric: str
    correlation_type: str  # 'linear', 'multiplicative', 'threshold', 'exponential'
    parameters: Dict[str, float]

class CorrelationEngine:
    """데이터 간 상관관계를 유지하는 엔진"""

    def __init__(self, config: Dict[str, Any]):
        self.correlations: List[Correlation] = []
        self._load_correlations(config)

    def _load_correlations(self, config: Dict):
        for category, corr_list in config.get('correlations', {}).items():
            for corr_def in corr_list:
                self.correlations.append(Correlation(
                    source_metric=corr_def['source'],
                    target_metric=corr_def['target'],
                    correlation_type=corr_def['type'],
                    parameters=corr_def
                ))

    def apply_correlations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """모든 상관관계 적용"""
        result = data.copy()

        for corr in self.correlations:
            source_value = self._get_nested_value(data, corr.source_metric)
            if source_value is not None:
                effect = self._calculate_effect(source_value, corr)
                result = self._apply_effect(result, corr.target_metric, effect)

        return result

    def _calculate_effect(self, source_value: float, corr: Correlation) -> float:
        """상관관계 효과 계산"""
        params = corr.parameters

        if corr.correlation_type == 'linear':
            return source_value * params.get('coefficient', 1.0)

        elif corr.correlation_type == 'multiplicative':
            return params.get('factor', 1.0)

        elif corr.correlation_type == 'threshold':
            threshold = params.get('threshold', 0)
            if source_value > threshold:
                return params.get('above_threshold_factor', 1.0)
            return 1.0

        elif corr.correlation_type == 'exponential':
            base = params.get('base', 1.0)
            reference = params.get('reference', 0)
            delta = source_value - reference
            return base ** delta

        return 1.0
```

---

## 5. AI 사례별 필요 데이터 패턴

### 5.1 CHECK (현재 상태 조회)
```yaml
필요_패턴:
  - 정상 범위 데이터 (90%): base_defect_rate ± 0.5%
  - 경고 수준 (8%): base_defect_rate * 1.5
  - 위험 수준 (2%): base_defect_rate * 3.0

데이터_요구사항:
  - 최신 데이터 (1시간 이내)
  - 실시간 업데이트
```

### 5.2 TREND (추이 분석)
```yaml
필요_패턴:
  - 상승 트렌드: daily_increase = 0.001
  - 하락 트렌드: daily_decrease = -0.001
  - 계절성: monthly_cycle
  - 주간 패턴: weekly_cycle (월~금 생산, 주말 감소)

데이터_요구사항:
  - 최소 7일 연속 데이터
  - 일별 집계 데이터
```

### 5.3 COMPARE (비교 분석)
```yaml
필요_패턴:
  - 라인간 차이: SMT-L01 defect=1.5%, SMT-L02 defect=2.5%
  - 제품간 차이: PRODUCT-A oee=85%, PRODUCT-B oee=78%
  - 시프트간 차이: day_shift defect=1.5%, night_shift defect=2.0%

데이터_요구사항:
  - 동일 기간 데이터
  - 비교 가능한 메트릭
```

### 5.4 FIND_CAUSE (원인 분석)
```yaml
필요_패턴:
  - 명확한 상관관계: material_lot → defect_rate (r=0.85)
  - 시간 선후관계: equipment_temp_spike → defect_spike (30분 후)
  - 다변량 상관: humidity + temp → tombstone_rate

데이터_요구사항:
  - 세분화된 시계열 (5분 단위)
  - 다양한 변수 동시 기록
  - 이벤트 로그 (LOT 변경, 설비 상태 변경)
```

### 5.5 DETECT_ANOMALY (이상 탐지)
```yaml
필요_패턴:
  - 포인트 이상치: 평균 ± 3σ 초과
  - 컨텍스트 이상치: 특정 조건에서만 비정상
  - 집단 이상치: 여러 지표 동시 이상

데이터_요구사항:
  - 충분한 정상 데이터 (학습용)
  - 간헐적 이상 패턴 (5-10%)
  - 이상 원인 라벨링
```

### 5.6 PREDICT (예측)
```yaml
필요_패턴:
  - 트렌드 지속: 과거 트렌드가 미래에 지속
  - 주기적 패턴: 계절성, 주간/일간 패턴
  - 이벤트 기반: 특정 이벤트 후 예측 가능한 변화

데이터_요구사항:
  - 장기 시계열 (최소 30일)
  - 일관된 패턴
  - 외부 변수 (주문량, 날씨 등)
```

---

## 6. 구현 로드맵

### Phase 1: 기본 인프라 (Week 1)
- [ ] 설정 파일 파서 구현
- [ ] 시간 관리자 구현
- [ ] 베이스 시나리오 클래스
- [ ] PostgreSQL Writer

### Phase 2: MES 생성기 (Week 2)
- [ ] 생산실적 생성기
- [ ] 설비 데이터 생성기
- [ ] 품질 데이터 생성기
- [ ] 센서 데이터 생성기

### Phase 3: 시나리오 엔진 (Week 3)
- [ ] 품질 시나리오 구현
- [ ] 설비 시나리오 구현
- [ ] 자재 시나리오 구현
- [ ] 상관관계 엔진

### Phase 4: ERP 생성기 (Week 4)
- [ ] 영업 데이터 생성기
- [ ] 구매 데이터 생성기
- [ ] 재고 데이터 생성기

### Phase 5: 통합 및 API (Week 5)
- [ ] CLI 인터페이스
- [ ] 실시간 스트림
- [ ] 시나리오 API 엔드포인트
